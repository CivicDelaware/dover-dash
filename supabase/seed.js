/**
 * Dover Dash — Supabase Seed Script
 * ────────────────────────────────────
 * Pulls all 217 bills from Airtable "153rd G.A. Passed Bills" base,
 * cross-references bill_profiles.json for the 53 classified bills
 * (synopsis, plain_english, profile classifications),
 * and inserts everything into Supabase.
 *
 * Run once after setting up the Supabase schema.
 *
 * Usage:
 *   cd ~/Desktop/Dover-dash/Updated\ at\ Midnight\ Github
 *
 *   AIRTABLE_API_KEY=pat_xxx \
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   node supabase/seed.js
 */

const fs   = require("fs");
const path = require("path");

// ── Config ───────────────────────────────────────────────────────────────────
const AIRTABLE_API_KEY    = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID    = process.env.AIRTABLE_BASE_ID || "app0BjytshiU6sQ3g";
const AIRTABLE_TABLE      = "Bills";
const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SESSION_NUMBER      = 153;

if (!AIRTABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌  Required: AIRTABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

// ── Supabase helper ──────────────────────────────────────────────────────────
async function supabase(endpoint, method = "GET", body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    method,
    headers: {
      apikey:         SUPABASE_SERVICE_KEY,
      Authorization:  `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer:         "resolution=merge-duplicates,return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${endpoint} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

// ── Airtable paginated fetch ──────────────────────────────────────────────────
async function fetchAllAirtableRecords() {
  const records = [];
  let offset = null;

  console.log("📥  Fetching bills from Airtable...");

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      filterByFormula: 'OR({Status}="Passed",{Status}="Approved",{Status}="Veto Overridden",{Status}="")',
    });
    [
      "Bill Number", "Bill Text", "Origin Chamber", "Status",
      "Category", "Intro Date", "Amendments", "Legislation ID",
      "Synopsis", "Profile Tags", "Direction",
    ].forEach(f => params.append("fields[]", f));
    if (offset) params.append("offset", offset);

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable fetch failed: ${res.status} — ${err}`);
    }

    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset || null;

    console.log(`  ↓  Fetched ${records.length} records so far...`);
  } while (offset);

  console.log(`✅  Total from Airtable: ${records.length} records\n`);
  return records;
}

// ── Normalize bill number for matching ───────────────────────────────────────
// "HB 133 w/ HA 1" → "HB 133"   |   "SB 75 w/ SA 1, SA 2" → "SB 75"
function baseBillNumber(fullCode) {
  if (!fullCode) return "";
  return fullCode.split(/\s+w\//i)[0].trim();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀  Dover Dash — Seeding Supabase from Airtable\n");

  // 1. Load bill_profiles.json for classifications + plain_english
  const dataPath = path.join(__dirname, "..", "bill_profiles.json");
  let billProfiles = [];
  if (fs.existsSync(dataPath)) {
    billProfiles = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    console.log(`📋  Loaded ${billProfiles.length} classified bills from bill_profiles.json`);
  } else {
    console.warn("⚠️   bill_profiles.json not found — bills will be inserted without classifications");
  }

  // Build lookup map: normalized bill number → profile data
  // bill_profiles.json uses: bill_number, synopsis, plain_english, profiles{}, wallet_rationale, legislation_url
  const profileMap = {};
  for (const bp of billProfiles) {
    const code = bp.bill_number || "";
    const key  = baseBillNumber(code).toUpperCase();
    if (key) profileMap[key] = bp;
  }
  console.log(`🔗  Profile map built: ${Object.keys(profileMap).length} entries\n`);

  // 2. Fetch all 217 bills from Airtable
  const airtableRecords = await fetchAllAirtableRecords();

  // 3. Insert into Supabase
  let billsInserted        = 0;
  let billsSkipped         = 0;
  let classificationsAdded = 0;
  let errors               = 0;

  for (const record of airtableRecords) {
    const f = record.fields;

    const fullCode   = (f["Bill Number"] || "").trim();
    const baseCode   = baseBillNumber(fullCode).toUpperCase();

    if (!fullCode) {
      console.warn("  ⚠️   Skipping record with no Bill Number");
      billsSkipped++;
      continue;
    }

    // Look up classification data from bill_profiles.json
    const bp = profileMap[baseCode] || null;

    const billRow = {
      session_number:  SESSION_NUMBER,
      bill_number:     baseBillNumber(fullCode),   // "HB 133"
      full_code:       fullCode,                    // "HB 133 w/ HA 1"
      bill_text:       f["Bill Text"]        || null,
      origin_chamber:  f["Origin Chamber"]   || null,
      status:          f["Status"]           || "Passed",
      category:        f["Category"]         || null,
      intro_date:      f["Intro Date"]       || null,
      amendments:      f["Amendments"]       || 0,
      legislation_id:  f["Legislation ID"]   || null,
      // Prefer synopsis from Airtable if present, otherwise fall back to bill_profiles.json
      synopsis:        f["Synopsis"] || (bp ? bp.synopsis : "") || null,
      plain_english:   bp ? bp.plain_english || null : null,
      legislation_url: bp ? bp.legislation_url || null : null,
    };

    // Insert bill into Supabase
    let insertedBill;
    try {
      const result = await supabase("/bills", "POST", billRow);
      insertedBill = Array.isArray(result) ? result[0] : result;
      billsInserted++;
      process.stdout.write(`  ✅ ${fullCode}${bp ? " [classified]" : ""}\n`);
    } catch (err) {
      // Try to find existing bill
      try {
        const existing = await supabase(
          `/bills?session_number=eq.${SESSION_NUMBER}&full_code=eq.${encodeURIComponent(fullCode)}&select=id,full_code`
        );
        if (existing && existing.length) {
          insertedBill = existing[0];
          process.stdout.write(`  ↩️  ${fullCode} (already exists)\n`);
        } else {
          throw err;
        }
      } catch (findErr) {
        console.error(`  ❌ ${fullCode}:`, err.message);
        errors++;
        continue;
      }
    }

    if (!insertedBill || !insertedBill.id) continue;

    // 4. Insert classifications (only for bills in bill_profiles.json)
    // Structure: bp.profiles = { "homeowner": "Watch Out", "renter": "Helps You", ... }
    // bp.wallet_rationale = string (shared rationale for all profiles on this bill)
    if (bp && bp.profiles) {
      for (const [profileKey, direction] of Object.entries(bp.profiles)) {
        if (!direction) continue;

        // wallet_rationale is a single string — used as rationale for all classifications
        const rationale = bp.wallet_rationale || "";

        try {
          await supabase("/classifications", "POST", {
            bill_id:        insertedBill.id,
            session_number: SESSION_NUMBER,
            profile_key:    profileKey,
            direction:      direction,
            rationale:      rationale,
          });
          classificationsAdded++;
        } catch (err) {
          if (!err.message.includes("duplicate") && !err.message.includes("409")) {
            console.error(`    ❌ Classification ${fullCode}/${profileKey}:`, err.message);
            errors++;
          }
        }
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════");
  console.log(`✅  Bills inserted:            ${billsInserted}`);
  console.log(`↩️   Bills already existed:     ${billsSkipped}`);
  console.log(`✅  Classifications inserted:   ${classificationsAdded}`);
  if (errors > 0) console.log(`⚠️   Errors:                   ${errors}`);
  console.log("══════════════════════════════════════════");
  console.log(`\n🎉  Done. Open Supabase → Table Editor to verify.\n`);
  console.log(`    ${billsInserted} bills from Airtable → Supabase`);
  console.log(`    ${classificationsAdded} profile classifications from bill_profiles.json\n`);
}

main().catch((err) => {
  console.error("\n💥  Fatal error:", err.message);
  process.exit(1);
});
