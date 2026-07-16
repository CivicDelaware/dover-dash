"""
Dover Dash — Delaware Bill Status Monitor v7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Runs once daily at 6AM Eastern.

Data sources: Delaware General Assembly live endpoints (no LegiScan).

What it tracks:
  Stage 1 — Newly introduced bills with synopsis keyword matches
  Stage 2 — Committee assignment (parsed from activity feed)
  Stage 3 — Ready List appearances (floor vote imminent — highest priority)

Pipeline:
  1. Pull recently introduced bills → keyword match → add to bill_states.json
  2. Parse activity feed for committee assignments → update bill state
  3. Check House + Senate Ready Lists → flag any tracked bills as high-priority
  4. Write pending_report.json → you approve at approve.html → Mailchimp sends
"""

import urllib.request
import urllib.parse
import json
import re
import os
import sys
import smtplib
from datetime import datetime
from zoneinfo import ZoneInfo
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ─── AIRTABLE CONFIG ─────────────────────────────────────────────────────────
AIRTABLE_API_KEY  = os.environ.get("AIRTABLE_API_KEY", "")
AIRTABLE_BASE_ID  = os.environ.get("AIRTABLE_BASE_ID", "app0BjytshiU6sQ3g")
AIRTABLE_TABLE_ID = os.environ.get("AIRTABLE_TABLE_ID", "tblqoDpzOKl6Gq8WA")

# Map monitor stage → Airtable Status field value (matches existing singleSelect options)
# Note: "in_committee" is handled separately — we write the actual committee name
STAGE_TO_AIRTABLE_STATUS = {
    "introduced":     "In progress",
    "ready_list":     "Out of Committee",
    "passed_chamber": "Passed",
    "governor":       "Executive",
}

# Map persona IDs → Airtable Profile Tags option names (must match exactly)
PERSONA_TO_AIRTABLE_TAG = {
    "homeowner": "Home Owner (own outright or mortgage)",
    "renter":    "Renter (no asset cushion)",
    "senior":    "Retiree / Fixed Income (Social Security, pensions, investment income)",
    "smallbiz":  "Small Business Owner / Self-Employed (construction, professional services, sole proprietors)",
    "pubsec":    "Public Sector Employee (state, local, federal)",
    "workpro":   "Private Sector Worker, Full-Time (manufacturing, finance, professional services-stable higher-wage jobs)",
    "lowwage":   "Private Sector Worker, Low-Wage / Vulnerable (hospitality, retail, personal services)",
}


def generate_plain_english(state, persona_labels):
    """
    Use Claude Haiku to draft a plain-English summary of how this bill affects
    the matched profile(s), and classify it as Watch Out or Helps You.
    Returns {"label": "Watch Out"|"Helps You", "text": "..."} or None on failure.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return None

    synopsis = state.get("synopsis") or state.get("long_title") or ""
    if not synopsis:
        return None

    profiles_str = " and ".join(persona_labels)

    prompt = (
        f"You write for Dover Dash, a Delaware civic platform that explains legislation "
        f"to everyday residents in plain, direct language.\n\n"
        f"Bill: {state['bill_code']}\n"
        f"Title: {state.get('long_title') or state.get('short_title') or ''}\n"
        f"Synopsis: {synopsis}\n"
        f"Reader profile: {profiles_str}\n\n"
        f"Do two things:\n\n"
        f"1. Decide if this bill, on balance, HELPS or HURTS someone in this profile. "
        f"Output exactly one of these two labels on the first line: Watch Out OR Helps You\n\n"
        f"2. Then write 2 to 3 sentences in plain English explaining how this bill affects "
        f"someone who is a {profiles_str}. Frame it around their day-to-day situation.\n\n"
        f"Rules for the explanation:\n"
        f"- Write like you are explaining this to a neighbor, not a lawyer.\n"
        f"- No jargon at all. Replace legal words with plain ones. "
        f"Say 'sue' not 'civil cause of action'. Say 'qualify' not 'be eligible'. "
        f"Say 'your landlord' not 'the lessor'. Say 'pay' not 'compensation'. "
        f"Say 'fired' not 'terminated'. Say 'take time off' not 'leave of absence'.\n"
        f"- Do NOT use em dashes (the long dash). Use a comma or period instead.\n"
        f"- Do not mention the bill number or the sponsor's name.\n"
        f"- Write in second person: you, your.\n"
        f"- Start with what changes for this reader, not what the bill does abstractly.\n"
        f"- Be concrete. What is different if this passes versus if it does not?\n"
        f"- Under 65 words for the explanation.\n\n"
        f"Format your response as exactly two parts:\n"
        f"Line 1: Watch Out  [or]  Helps You\n"
        f"Line 2+: The plain English explanation."
    )

    payload = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 250,
        "messages": [{"role": "user", "content": prompt}],
    }

    url = "https://api.anthropic.com/v1/messages"
    data = json.dumps(payload).encode()
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = json.loads(resp.read().decode())["content"][0]["text"].strip()
        lines = raw.split("\n", 1)
        first = lines[0].strip()
        label = "Watch Out" if "watch" in first.lower() else "Helps You"
        text = lines[1].strip() if len(lines) > 1 else raw
        return {"label": label, "text": text}
    except Exception as e:
        print(f"  [claude warn] Draft generation failed: {e}")
        return None


def airtable_request(method, path, payload=None):
    """Make an Airtable REST API call. Returns parsed JSON or None."""
    if not AIRTABLE_API_KEY:
        return None
    url = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{path}"
    data = json.dumps(payload).encode() if payload else None
    headers = {
        "Authorization": f"Bearer {AIRTABLE_API_KEY}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  [airtable warn] {method} {path}: {e}")
        return None


def airtable_find_bill(bill_code):
    """Return Airtable record ID if this bill number already exists, else None."""
    encoded = urllib.parse.quote(f'{{Bill Number}}="{bill_code}"')
    result = airtable_request("GET", f"{AIRTABLE_TABLE_ID}?filterByFormula={encoded}&maxRecords=1")
    records = (result or {}).get("records", [])
    return records[0]["id"] if records else None


def airtable_upsert_bill(state, stage):
    """
    Create or update a bill record in Airtable.
    Uses Bill Number to check for existing records first.
    """
    if not AIRTABLE_API_KEY:
        return

    bill_code = state["bill_code"]
    profile_tags = [PERSONA_TO_AIRTABLE_TAG[p] for p in state.get("personas", []) if p in PERSONA_TO_AIRTABLE_TAG]

    # For in_committee, use the actual committee name as Status (matches your existing Airtable values)
    if stage == "in_committee" and state.get("committee"):
        at_status = state["committee"]
    else:
        at_status = STAGE_TO_AIRTABLE_STATUS.get(stage, "In progress")

    # Generate plain-English draft for Airtable Bill Text (only on first write)
    draft = None
    if stage == "introduced" and profile_tags:
        draft = generate_plain_english(state, profile_tags)
        if draft:
            print(f"  [claude] {draft['label']} — draft written for {bill_code}")

    fields = {
        "Bill Number":    bill_code,
        "Synopsis":       state.get("synopsis") or "",
        "Origin Chamber": state.get("chamber") or "",
        "Status":         at_status,
        "Legislation ID": state.get("bill_url") or f"https://legis.delaware.gov/BillDetail?LegislationId={state['legislation_id']}",
    }
    if profile_tags:
        fields["Profile Tags"] = profile_tags
    if draft:
        label_tag = "🚨 Watch Out" if draft["label"] == "Watch Out" else "✅ Helps You"
        fields["Bill Text"] = f"[DRAFT — edit before sending]\n\n{label_tag}\n\n{draft['text']}"
        state["direction"] = draft["label"]  # save back so email and report can use it

    existing_id = airtable_find_bill(bill_code)
    if existing_id:
        result = airtable_request("PATCH", f"{AIRTABLE_TABLE_ID}/{existing_id}", {"fields": fields})
        if result:
            print(f"  [airtable] Updated {bill_code} → {at_status}")
    else:
        result = airtable_request("POST", AIRTABLE_TABLE_ID, {"fields": fields})
        if result:
            print(f"  [airtable] Created {bill_code} → {at_status}")

EASTERN = ZoneInfo("America/New_York")

def now_et():
    return datetime.now(EASTERN)

# ─── PERSONA KEYWORD TAXONOMY ─────────────────────────────────────────────────
# Keywords drawn from actual Delaware bill synopsis language.
# Title references match the Delaware Code organization.
# Update these as you observe more real synopsis text from legis.delaware.gov.

PERSONAS = {
    "homeowner": {
        "label": "Home Owner (own outright or mortgage)",
        "keywords": [
            # Property tax & assessment
            "property tax", "real property assessment", "tax assessment", "transfer tax",
            "property tax exemption", "realty transfer",
            # Ownership & transactions
            "deed", "property title", "title insurance", "foreclosure", "mortgage", "lien", "eminent domain",
            # Codes & zoning
            "zoning", "land subdivision", "land use", "building code",
            "accessory dwelling unit", "setback requirement", "variance request",
            # HOA
            "homeowners association", "HOA", "common interest community",
            # Delaware Code
            "TITLE 9", "TITLE 22", "TITLE 25",
        ],
        "committees": ["housing", "revenue & finance", "land use", "housing & land use"],
    },
    "renter": {
        "label": "Renter (no asset cushion)",
        "keywords": [
            "landlord", "tenant", "rental agreement", "lease", "eviction",
            "security deposit", "habitability", "residential landlord",
            "landlord-tenant", "residential tenancy", "just cause",
            "rent increase", "rental unit", "notice to quit",
            "manufactured home", "mobile home", "manufactured housing community",
            # Delaware Code
            "TITLE 25",
        ],
        "committees": ["housing", "housing & land use", "judiciary"],
    },
    "senior": {
        "label": "Retiree / Fixed Income (Social Security, pensions, investment income)",
        "keywords": [
            "senior", "elder", "older adult", "aging", "retiree", "retirement",
            "long-term care", "nursing home", "assisted living", "memory care",
            "Medicaid", "Medicare", "adult protective", "adult services",
            "pension", "fixed income", "cost of living", "COLA",
            "Social Security", "investment income", "annuity",
            "Senior Medicare Patrol", "Division of Services for Aging",
        ],
        "committees": ["health & social services", "aging", "revenue & finance"],
    },
    "smallbiz": {
        "label": "Small Business Owner / Self-Employed (construction, professional services, sole proprietors)",
        "keywords": [
            "business license", "LLC", "limited liability", "corporation",
            "sole proprietor", "small business", "franchise", "contractor",
            "professional license", "occupational license",
            "business registration", "commercial lease",
            "gross receipts", "business tax", "corporate income tax",
            "sales tax", "excise tax",
            "independent contractor", "gig worker", "self-employed",
            # Delaware Code
            "TITLE 6", "TITLE 30",
        ],
        "committees": ["economic development", "small business", "commerce", "revenue & finance",
                       "banking, business, insurance & technology"],
    },
    "pubsec": {
        "label": "Public Sector Employee (state, local, federal)",
        "keywords": [
            # Education (teachers are public employees)
            "teacher", "educator", "school", "public school", "school district",
            "charter school", "Department of Education", "certification",
            "special education", "school board", "school funding",
            "pupil", "classroom", "principal", "superintendent",
            # General public sector
            "state employee", "civil service", "government employee",
            "public employee", "public pension", "PERS",
            "collective bargaining", "public union",
            "county employee", "municipal employee",
            # Delaware Code
            "TITLE 14", "TITLE 29",
        ],
        "committees": ["education", "children, youth & their families",
                       "elections & government affairs", "administration"],
    },
    "workpro": {
        "label": "Private Sector Worker, Full-Time (manufacturing, finance, professional services-stable higher-wage jobs)",
        "keywords": [
            # Professional protections
            "non-compete", "non-disclosure", "non-solicitation",
            "professional license", "occupational license",
            "paid family leave", "Family and Medical Leave", "FMLA", "PFML",
            "paid leave", "parental leave",
            # Workplace rights (professional context)
            "workplace discrimination", "harassment", "retaliation",
            "wrongful termination", "whistleblower",
            "workers compensation", "unemployment insurance",
            "workplace safety", "OSHA",
            # Delaware Code
            "TITLE 19",
        ],
        "committees": ["labor", "commerce", "banking, business, insurance & technology"],
    },
    "lowwage": {
        "label": "Private Sector Worker, Low-Wage / Vulnerable (hospitality, retail, personal services)",
        "keywords": [
            # Wage-specific
            "minimum wage", "tipped employee", "tip credit", "tip pooling",
            "gratuity", "overtime", "wage theft", "wage payment",
            "sub-minimum wage",
            # Industries
            "restaurant", "hotel", "hospitality", "retail worker",
            "domestic worker", "home health aide", "personal care aide",
            "childcare worker", "seasonal worker", "day laborer",
            # Worker protections
            "predictive scheduling", "schedule posting", "rest period",
            "meal break", "sick leave", "paid sick",
            # Delaware Code
            "TITLE 19",
        ],
        "committees": ["labor", "health & social services"],
    },
}

# ─── STATE FILE PATH ──────────────────────────────────────────────────────────
# This file lives in the repo and gets committed after each run.
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bill_states.json")
REPORT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pending_report.json")

# ─── DE GA API CALLS ─────────────────────────────────────────────────────────

BASE_URL = "https://legis.delaware.gov"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; DoverDash/7.0)",
    "Accept": "application/json, text/html, */*",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": BASE_URL + "/",
}

def _post_json(path, payload=None):
    """POST JSON body, return parsed JSON dict or None."""
    url = BASE_URL + path
    data = json.dumps(payload or {}).encode()
    headers = dict(HEADERS)
    headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))
    except Exception as e:
        print(f"  [warn] POST {path} failed: {e}")
        return None


def _post_form(path, payload_str, referer=None):
    """POST URL-encoded body, return parsed JSON dict or None."""
    url = BASE_URL + path
    headers = dict(HEADERS)
    headers["Content-Type"] = "application/x-www-form-urlencoded"
    if referer:
        headers["Referer"] = BASE_URL + referer

    req = urllib.request.Request(url, data=payload_str.encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            try:
                return json.loads(body)
            except json.JSONDecodeError:
                return {"_raw": body}
    except Exception as e:
        print(f"  [warn] POST {path} failed: {e}")
        return None


def get_recently_introduced(take=50):
    """
    Returns bills introduced in the current GA session, most recent first.
    Each bill includes Synopsis, LongTitle, Sponsor, StatusName, LegislationId.
    """
    data = _post_json(
        "/json/Legislation/GetRecentlyIntroducedLegislation",
        {"take": take, "skip": 0, "page": 1, "pageSize": take}
    )
    return data.get("Data", []) if data else []


def get_activity_feed():
    """
    Returns the most recent legislative actions as a list of dicts:
      {legislation_id, bill_code, sponsor, description, date}
    This endpoint returns an HTML fragment, not JSON.
    """
    url = BASE_URL + "/json/Home/GetLastLegislativeActivityItems"
    headers = dict(HEADERS)
    headers["Content-Type"] = "application/json"
    try:
        req = urllib.request.Request(url, data=b"{}", headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  [warn] Activity feed fetch failed: {e}")
        return []

    actions = []
    pattern = re.compile(
        r'actinfo-leg[^>]*>.*?href="/BillDetail/(\d+)">(.*?)</a>.*?'
        r'actinfo-spon[^>]*>(.*?)</span>.*?'
        r'actinfo-desc[^>]*>(.*?)</span>.*?'
        r'actinfo-date[^>]*>(.*?)</span>',
        re.DOTALL
    )
    for m in pattern.finditer(html):
        actions.append({
            "legislation_id": int(m.group(1)),
            "bill_code": m.group(2).strip(),
            "sponsor": m.group(3).strip(),
            "description": m.group(4).strip(),
            "date": m.group(5).strip(),
        })
    return actions


def get_ready_list(chamber_id):
    """
    Returns bills on the House (chamber_id=2) or Senate (chamber_id=1) Ready List.
    Each entry has LegislationId, LegislationDisplayCode, ShortTitle, LongTitle, Sponsor.
    """
    referer = "/ReadyList/House" if chamber_id == 2 else "/ReadyList/Senate"
    data = _post_form(
        f"/json/ReadyList/GetReadyList?chamberId={chamber_id}",
        "take=200&skip=0&page=1&pageSize=200",
        referer=referer
    )
    return data.get("Data", []) if data else []


# ─── STATE MANAGEMENT ─────────────────────────────────────────────────────────

def load_states():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {}


def save_states(states):
    with open(STATE_FILE, "w") as f:
        json.dump(states, f, indent=2)


# ─── KEYWORD MATCHING ─────────────────────────────────────────────────────────

def match_personas(bill):
    """
    Returns list of persona IDs that match this bill's text.
    Checks Synopsis, LongTitle, ShortTitle (case-insensitive).
    """
    text = " ".join([
        bill.get("Synopsis") or "",
        bill.get("LongTitle") or "",
        bill.get("ShortTitle") or "",
    ]).lower()

    matched = []
    for persona_id, config in PERSONAS.items():
        for kw in config["keywords"]:
            if kw.lower() in text:
                matched.append(persona_id)
                break
    return matched


# ─── STAGE LABELS ─────────────────────────────────────────────────────────────

STAGE_EMOJI = {
    "introduced": "📋",
    "in_committee": "🏛️",
    "ready_list": "🚨",
    "passed_chamber": "✅",
    "governor": "📜",
}

STAGE_LABEL = {
    "introduced": "Introduced",
    "in_committee": "In Committee",
    "ready_list": "On Ready List — Floor Vote Imminent",
    "passed_chamber": "Passed Chamber",
    "governor": "Sent to Governor",
}


# ─── MAIN MONITORING LOGIC ────────────────────────────────────────────────────

def run():
    today = now_et().strftime("%Y-%m-%d")
    print(f"\nDover Dash Monitor v7 — {today}")
    print("=" * 50)

    states = load_states()
    alerts = []
    new_count = 0
    updated_count = 0

    # ── STEP 1: Recently introduced bills ────────────────────────────────────
    print("\n[1] Checking recently introduced bills...")
    introduced = get_recently_introduced(take=50)
    print(f"    Fetched {len(introduced)} recent bills")

    for bill in introduced:
        bill_id = str(bill.get("LegislationId"))
        if not bill_id:
            continue

        personas = match_personas(bill)
        if not personas:
            continue  # Not relevant to any persona

        code = bill.get("LegislationDisplayCode") or bill.get("LegislationNumber") or bill_id

        if bill_id not in states:
            states[bill_id] = {
                "legislation_id": bill_id,
                "bill_code": code,
                "short_title": bill.get("ShortTitle") or "",
                "long_title": bill.get("LongTitle") or "",
                "synopsis": bill.get("Synopsis") or "",
                "sponsor": bill.get("Sponsor") or "",
                "chamber": bill.get("ChamberName") or "",
                "stage": "introduced",
                "committee": None,
                "personas": personas,
                "direction": None,
                "first_seen": today,
                "last_updated": today,
                "alerted_stages": [],
            }
            new_count += 1
            print(f"    ✦ New: {code} — {(bill.get('ShortTitle') or '')[:60]} [{', '.join(personas)}]")

            if "introduced" not in states[bill_id]["alerted_stages"]:
                airtable_upsert_bill(states[bill_id], "introduced")
                alerts.append(build_alert(states[bill_id], "introduced"))
                states[bill_id]["alerted_stages"].append("introduced")
        else:
            # Update synopsis if it was missing
            if not states[bill_id].get("synopsis") and bill.get("Synopsis"):
                states[bill_id]["synopsis"] = bill["Synopsis"]
            # Merge in any newly matched personas
            existing = set(states[bill_id].get("personas", []))
            merged = existing | set(personas)
            if merged != existing:
                states[bill_id]["personas"] = list(merged)
                states[bill_id]["last_updated"] = today

    # ── STEP 2: Activity feed — committee assignments and status changes ───────
    print("\n[2] Checking activity feed for status changes...")
    activities = get_activity_feed()
    print(f"    Fetched {len(activities)} recent actions")

    for action in activities:
        bill_id = str(action["legislation_id"])
        desc = action["description"]

        if bill_id not in states:
            continue

        current_stage = states[bill_id]["stage"]

        # Committee assignment
        if "assigned to" in desc.lower() and current_stage == "introduced":
            committee = re.sub(r"(?i)^assigned to\s*(the\s*)?", "", desc).strip().rstrip(".")
            states[bill_id]["stage"] = "in_committee"
            states[bill_id]["committee"] = committee
            states[bill_id]["last_updated"] = today
            updated_count += 1
            code = states[bill_id]["bill_code"]
            print(f"    📋→🏛️  {code} assigned to {committee}")

            if "in_committee" not in states[bill_id]["alerted_stages"]:
                alerts.append(build_alert(states[bill_id], "in_committee"))
                states[bill_id]["alerted_stages"].append("in_committee")
                airtable_upsert_bill(states[bill_id], "in_committee")

        # Passed a chamber
        elif re.search(r"passed by the (house|senate)", desc, re.IGNORECASE):
            if current_stage not in ("passed_chamber", "governor"):
                states[bill_id]["stage"] = "passed_chamber"
                states[bill_id]["last_updated"] = today
                updated_count += 1
                code = states[bill_id]["bill_code"]
                print(f"    ✅ {code}: {desc}")
                if "passed_chamber" not in states[bill_id]["alerted_stages"]:
                    alerts.append(build_alert(states[bill_id], "passed_chamber"))
                    states[bill_id]["alerted_stages"].append("passed_chamber")
                    airtable_upsert_bill(states[bill_id], "passed_chamber")

        # Sent to or signed by Governor
        elif re.search(r"sent to.*governor|signed by.*governor", desc, re.IGNORECASE):
            if current_stage != "governor":
                states[bill_id]["stage"] = "governor"
                states[bill_id]["last_updated"] = today
                updated_count += 1
                code = states[bill_id]["bill_code"]
                print(f"    📜 {code}: {desc}")
                if "governor" not in states[bill_id]["alerted_stages"]:
                    alerts.append(build_alert(states[bill_id], "governor"))
                    states[bill_id]["alerted_stages"].append("governor")
                    airtable_upsert_bill(states[bill_id], "governor")

    # ── STEP 3: Ready List — highest priority ─────────────────────────────────
    print("\n[3] Checking House and Senate Ready Lists...")
    ready_ids = set()

    for chamber_id, chamber_name in [(2, "House"), (1, "Senate")]:
        ready_bills = get_ready_list(chamber_id)
        print(f"    {chamber_name} Ready List: {len(ready_bills)} bills")
        for rb in ready_bills:
            ready_ids.add(str(rb["LegislationId"]))

    for bill_id in ready_ids:
        if bill_id not in states:
            continue
        if states[bill_id]["stage"] != "ready_list":
            old_stage = states[bill_id]["stage"]
            states[bill_id]["stage"] = "ready_list"
            states[bill_id]["last_updated"] = today
            updated_count += 1
            code = states[bill_id]["bill_code"]
            print(f"    🚨 {code} is now on Ready List! (was: {old_stage})")

            if "ready_list" not in states[bill_id]["alerted_stages"]:
                alerts.append(build_alert(states[bill_id], "ready_list"))
                states[bill_id]["alerted_stages"].append("ready_list")
                airtable_upsert_bill(states[bill_id], "ready_list")

    # ── STEP 4: Save state and write report ───────────────────────────────────
    save_states(states)
    print(f"\n[4] State saved. New: {new_count} | Updated: {updated_count} | Alerts: {len(alerts)}")

    if alerts:
        write_pending_report(alerts, today)
        send_notification_email(alerts, today)
    else:
        print("    No new alerts — skipping report and email.")

    print("\nDone.\n")


# ─── REPORT GENERATION ────────────────────────────────────────────────────────

def build_alert(state, stage):
    """Build an alert dict for a bill stage change."""
    return {
        "legislation_id": state["legislation_id"],
        "bill_code": state["bill_code"],
        "short_title": state["short_title"],
        "long_title": state["long_title"],
        "synopsis": state["synopsis"],
        "sponsor": state["sponsor"],
        "chamber": state["chamber"],
        "stage": stage,
        "stage_label": STAGE_LABEL.get(stage, stage),
        "stage_emoji": STAGE_EMOJI.get(stage, ""),
        "committee": state.get("committee"),
        "personas": state.get("personas", []),
        "direction": state.get("direction"),
        "first_seen": state.get("first_seen"),
        "last_updated": state.get("last_updated"),
        "bill_url": f"https://legis.delaware.gov/BillDetail?LegislationId={state['legislation_id']}",
    }


def write_pending_report(alerts, today):
    """
    Write pending_report.json in the format read by approve.html / get-report.js.
    Sorted by urgency: ready_list first, then passed_chamber, in_committee, introduced.
    """
    stage_order = {"ready_list": 0, "passed_chamber": 1, "governor": 2, "in_committee": 3, "introduced": 4}
    sorted_alerts = sorted(alerts, key=lambda a: stage_order.get(a["stage"], 9))

    report = {
        "generated": today,
        "status": "pending",
        "alert_count": len(sorted_alerts),
        "alerts": sorted_alerts,
    }

    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2)

    print(f"    📄 pending_report.json written ({len(sorted_alerts)} alerts)")


def send_notification_email(alerts, today):
    """Send a brief Gmail notification so you know there's something to review."""
    gmail_addr = os.environ.get("GMAIL_ADDRESS")
    gmail_pass = os.environ.get("GMAIL_APP_PASSWORD")
    notify_email = os.environ.get("NOTIFY_EMAIL")

    if not all([gmail_addr, gmail_pass, notify_email]):
        print("    [skip] Email env vars not set — skipping notification.")
        return

    ready = [a for a in alerts if a["stage"] == "ready_list"]
    new_bills = [a for a in alerts if a["stage"] == "introduced"]
    committee = [a for a in alerts if a["stage"] == "in_committee"]

    subject_parts = []
    if ready:
        subject_parts.append(f"🚨 {len(ready)} on Ready List")
    if committee:
        subject_parts.append(f"{len(committee)} in committee")
    if new_bills:
        subject_parts.append(f"{len(new_bills)} new bills")
    if not subject_parts:
        subject_parts.append(f"{len(alerts)} updates")

    subject = f"Dover Dash — {', '.join(subject_parts)} [{today}]"

    lines = [f"<h2>Dover Dash Update — {today}</h2>"]

    if ready:
        lines.append("<h3>🚨 On Ready List (Floor Vote Imminent)</h3><ul>")
        for a in ready:
            personas_str = ", ".join(PERSONAS[p]["label"] for p in a["personas"] if p in PERSONAS)
            lines.append(
                f'<li><strong>{a["bill_code"]}</strong> — {a["short_title"]}<br>'
                f'Sponsor: {a["sponsor"]} | Affects: {personas_str}<br>'
                f'<a href="{a["bill_url"]}">View on DE GA</a></li>'
            )
        lines.append("</ul>")

    if committee:
        lines.append("<h3>🏛️ Assigned to Committee</h3><ul>")
        for a in committee:
            personas_str = ", ".join(PERSONAS[p]["label"] for p in a["personas"] if p in PERSONAS)
            lines.append(
                f'<li><strong>{a["bill_code"]}</strong> — {a["short_title"]}<br>'
                f'Committee: {a.get("committee") or "Unknown"} | Affects: {personas_str}</li>'
            )
        lines.append("</ul>")

    if new_bills:
        lines.append("<h3>📋 Newly Introduced — needs your write-up</h3><ul>")
        for a in new_bills[:10]:
            personas_str = ", ".join(PERSONAS[p]["label"] for p in a["personas"] if p in PERSONAS)
            at_link = f"https://airtable.com/{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_ID}"
            direction = a.get("direction")
            dir_badge = (
                '<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">🚨 Watch Out</span>'
                if direction == "Watch Out" else
                '<span style="background:#22c55e;color:#000;padding:2px 8px;border-radius:4px;font-size:12px;">✅ Helps You</span>'
                if direction == "Helps You" else ""
            )
            lines.append(
                f'<li>{dir_badge} <strong>{a["bill_code"]}</strong> — {a["short_title"] or a["long_title"] or ""}<br>'
                f'Sponsor: {a["sponsor"]} | Affects: {personas_str}<br>'
                f'<a href="{a["bill_url"]}">DE GA</a> &nbsp;·&nbsp; '
                f'<a href="{at_link}">Edit in Airtable</a> '
                f'<em>(Claude drafted Bill Text — review before sending)</em></li>'
            )
        if len(new_bills) > 10:
            lines.append(f'<li>...and {len(new_bills) - 10} more</li>')
        lines.append("</ul>")

    lines.append(
        '<p><a href="https://civicdelaware.com/approve.html" '
        'style="background:#22c55e;color:#000;padding:8px 16px;'
        'text-decoration:none;border-radius:4px;font-weight:bold;">'
        '→ Review &amp; Approve Report</a></p>'
    )

    body = "\n".join(lines)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = gmail_addr
    msg["To"] = notify_email
    msg.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_addr, gmail_pass)
            server.sendmail(gmail_addr, notify_email, msg.as_string())
        print(f"    ✉️  Notification sent to {notify_email}")
    except Exception as e:
        print(f"    [error] Email failed: {e}")


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    run()
