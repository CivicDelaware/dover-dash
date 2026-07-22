/**
 * Dover Dash — Impact Dashboard Scoring Script
 * ────────────────────────────────────────────
 * Ports the scoring engine (fiscal risk score, Dover Dash Risk Grade,
 * alert level, sector projections, household impact heuristics) to
 * JavaScript and re-scores every bill in `bills` for the current session,
 * upserting the results into `bill_risk_scores`.
 *
 * This is the manual-refresh entry point for the Impact Dashboard.
 * Run it after new committee actions, votes, or amendments land in the
 * `bills` / `classifications` tables (e.g. after re-running supabase/seed.js).
 *
 * IMPORTANT — Dover Dash Risk Grade is a Dover Dash-defined scale modeled on
 * general fixed-income credit-rating conventions (Aaa…Caa lettering). It is
 * NOT produced, endorsed, or affiliated with Moody's Investors Service, and
 * should not be confused with an official credit rating.
 *
 * Usage:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   node supabase/score-bills.js
 */

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SESSION_NUMBER        = parseInt(process.env.CURRENT_SESSION || "153", 10);

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌  Required: SUPABASE_URL, SUPABASE_SERVICE_KEY");
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

// ── Scoring config (mirrors scoring_engine.py 1:1) ───────────────────────────
const CATEGORY_RISK = {
  "State Budget & Appropriations": 90,
  "Bond & Capital Budget": 88,
  "State Taxes": 85,
  "Public Utilities": 75,
  "Welfare / Human Services": 62,
  "Insurance": 62,
  "Banking": 60,
  "Labor": 58,
  "Education": 55,
  "Property": 50,
  "Commerce & Trade / Consumer Protection": 48,
  "Health & Safety": 45,
  "State Government": 42,
  "Conservation & Environment": 40,
  "Crimes & Criminal Procedure": 36,
  "Courts & Judicial Procedure": 32,
  "Motor Vehicles": 30,
  "Agriculture": 30,
  "Elections": 28,
  "Professions & Occupations": 28,
  "Municipal Charters": 25,
  "Counties": 25,
  "Estates & Fiduciary Relations": 24,
  "Military & Civil Defense": 24,
  "Alcoholic Liquors": 22,
  "Constitutional Amendments": 18,
  "General Provisions": 18,
  "Domestic Relations": 15,
  "Navigation": 14,
  "Ceremonial / Naming": 2,
};
const DEFAULT_CATEGORY_RISK = 30;

const KEYWORD_SIGNALS = [
  [/general fund/i, 12],
  [/appropriat/i, 12],
  [/biennial budget/i, 10],
  [/grant program/i, 7],
  [/impose(?:s|d)? a tax|new tax/i, 14],
  [/tax credit/i, 8],
  [/tax exemption/i, 8],
  [/tax rate/i, 9],
  [/rate cap|rate increase/i, 10],
  [/minimum wage/i, 11],
  [/pension/i, 8],
  [/\bbond(s)?\b/i, 7],
  [/civil penalty|fine of/i, 5],
  [/\bfee\b|\bfees\b/i, 4],
  [/mandate|shall provide|shall require/i, 5],
  [/surcharge/i, 8],
  [/subsidy|subsidize/i, 7],
  [/reimburse/i, 5],
];

const SECTOR_MAP = {
  "State Budget & Appropriations": ["Government & Public Sector"],
  "Bond & Capital Budget": ["Government & Public Sector", "Construction & Real Estate"],
  "State Taxes": ["Government & Public Sector", "Household Finances"],
  "Public Utilities": ["Energy & Utilities"],
  "Welfare / Human Services": ["Healthcare & Social Services"],
  "Insurance": ["Insurance & Financial Services"],
  "Banking": ["Insurance & Financial Services"],
  "Labor": ["Labor & Employment"],
  "Education": ["Education"],
  "Property": ["Construction & Real Estate"],
  "Commerce & Trade / Consumer Protection": ["Retail & Consumer"],
  "Health & Safety": ["Healthcare & Social Services"],
  "State Government": ["Government & Public Sector"],
  "Conservation & Environment": ["Energy & Utilities", "Agriculture"],
  "Crimes & Criminal Procedure": ["Public Safety & Justice"],
  "Courts & Judicial Procedure": ["Public Safety & Justice"],
  "Motor Vehicles": ["Transportation"],
  "Agriculture": ["Agriculture"],
  "Elections": ["Government & Public Sector"],
  "Professions & Occupations": ["Labor & Employment"],
  "Municipal Charters": ["Government & Public Sector"],
  "Counties": ["Government & Public Sector"],
  "Estates & Fiduciary Relations": ["Household Finances"],
  "Military & Civil Defense": ["Government & Public Sector"],
  "Alcoholic Liquors": ["Retail & Consumer"],
  "Constitutional Amendments": ["Government & Public Sector"],
  "General Provisions": ["Government & Public Sector"],
  "Domestic Relations": ["Household Finances"],
  "Navigation": ["Transportation"],
  "Ceremonial / Naming": [],
};

const PROFILE_CATEGORY_HEURISTIC = {
  homeowner: { "Property": "Watch Out", "State Taxes": "Watch Out", "Public Utilities": "Watch Out" },
  renter:    { "Property": "Watch Out", "Public Utilities": "Watch Out" },
  landlord:  { "Property": "Watch Out", "Insurance": "Watch Out" },
  senior:    { "State Taxes": "Watch Out", "Health & Safety": "Neutral", "Welfare / Human Services": "Helps You" },
  veteran:   { "State Taxes": "Helps You" },
  lowwage:   { "Labor": "Helps You", "State Taxes": "Watch Out" },
  workpro:   { "State Taxes": "Watch Out", "Insurance": "Watch Out" },
  smallbiz:  { "Labor": "Watch Out", "State Taxes": "Watch Out", "Banking": "Watch Out", "Commerce & Trade / Consumer Protection": "Watch Out" },
  pubsec:    { "State Budget & Appropriations": "Watch Out", "Bond & Capital Budget": "Neutral" },
};

const ALL_PROFILE_KEYS = ["homeowner", "renter", "landlord", "senior", "veteran", "lowwage", "workpro", "smallbiz", "pubsec"];

function riskGrade(score) {
  if (score <= 10) return ["Aaa", "Minimal"];
  if (score <= 25) return ["Aa", "Low"];
  if (score <= 40) return ["A", "Low-Moderate"];
  if (score <= 55) return ["Baa", "Moderate"];
  if (score <= 70) return ["Ba", "Elevated"];
  if (score <= 85) return ["B", "High"];
  return ["Caa", "Severe"];
}

function alertLevel(score, amendments) {
  if (score >= 71) return "high";
  if (score >= 41) return "medium";
  if (score >= 1 && amendments >= 2) return "medium";
  return "low";
}

function scoreBill(bill) {
  const category = bill.category || "";
  const text = [bill.synopsis || "", bill.bill_text || ""].join(" ").toLowerCase();
  const base = CATEGORY_RISK[category] !== undefined ? CATEGORY_RISK[category] : DEFAULT_CATEGORY_RISK;

  let kwScore = 0;
  const hits = [];
  for (const [pattern, weight] of KEYWORD_SIGNALS) {
    if (pattern.test(text)) {
      kwScore += weight;
      hits.push(pattern.source);
    }
  }
  kwScore = Math.min(kwScore, 45);

  const amendments = bill.amendments || 0;
  const amendScore = Math.min(amendments * 3, 9);

  let total = base * 0.55 + kwScore + amendScore;
  total = Math.max(0, Math.min(100, Math.round(total)));

  const [grade, gradeLabel] = riskGrade(total);
  const alert = alertLevel(total, amendments);
  const sectors = SECTOR_MAP[category] || [];

  const sectorProj = sectors.map((s) => {
    const mag = Math.round((total / 100) * 1.8 * 100) / 100;
    return {
      sector: s,
      y1: Math.round(mag * 0.4 * 100) / 100,
      y2: Math.round(mag * 0.7 * 100) / 100,
      y3: Math.round(mag * 1.0 * 100) / 100,
    };
  });

  return {
    bill_id: bill.id,
    category,
    fiscal_risk_score: total,
    risk_grade: grade,
    risk_grade_label: gradeLabel,
    alert_level: alert,
    keyword_hits: hits,
    sectors: sectorProj,
  };
}

function householdImpactForBill(category, classificationsForBill) {
  // Reviewed classifications win; unreviewed profiles fall back to the
  // category heuristic (marked "preliminary"). Profiles with no signal at
  // all are omitted — the frontend treats absence as Neutral/unassessed.
  const reviewed = {};
  (classificationsForBill || []).forEach((c) => { reviewed[c.profile_key] = c; });

  const impact = [];
  for (const pk of ALL_PROFILE_KEYS) {
    if (reviewed[pk]) {
      impact.push({
        profile_key: pk,
        direction: reviewed[pk].direction,
        confidence: "reviewed",
        note: reviewed[pk].rationale,
      });
    } else {
      const heuristic = (PROFILE_CATEGORY_HEURISTIC[pk] || {})[category];
      if (heuristic) {
        impact.push({ profile_key: pk, direction: heuristic, confidence: "preliminary" });
      }
    }
  }
  return impact;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀  Dover Dash — Scoring bills for Impact Dashboard\n");

  // 1. Fetch all bills for this session
  const billsParams = new URLSearchParams({
    select: "id,bill_number,category,synopsis,bill_text,amendments",
    session_number: `eq.${SESSION_NUMBER}`,
  });
  const bills = await supabase(`/bills?${billsParams}`);
  console.log(`📥  Loaded ${bills.length} bills for session ${SESSION_NUMBER}`);

  // 2. Fetch classifications for this session
  const classParams = new URLSearchParams({
    select: "bill_id,profile_key,direction,rationale",
    session_number: `eq.${SESSION_NUMBER}`,
  });
  const classifications = await supabase(`/classifications?${classParams}`);
  const classByBill = {};
  classifications.forEach((c) => {
    if (!classByBill[c.bill_id]) classByBill[c.bill_id] = [];
    classByBill[c.bill_id].push(c);
  });
  console.log(`📋  Loaded ${classifications.length} manual classifications\n`);

  // 3. Score every bill and upsert
  let upserted = 0;
  let errors = 0;
  const gradeCounts = {};
  const alertCounts = { low: 0, medium: 0, high: 0 };

  for (const bill of bills) {
    const scored = scoreBill(bill);
    const householdImpact = householdImpactForBill(scored.category, classByBill[bill.id]);
    const reviewedCount = householdImpact.filter((h) => h.confidence === "reviewed").length;

    const row = {
      bill_id: bill.id,
      session_number: SESSION_NUMBER,
      fiscal_risk_score: scored.fiscal_risk_score,
      risk_grade: scored.risk_grade,
      risk_grade_label: scored.risk_grade_label,
      alert_level: scored.alert_level,
      keyword_hits: scored.keyword_hits,
      sectors: scored.sectors,
      household_impact: householdImpact,
      reviewed_profile_count: reviewedCount,
      methodology_version: "v1",
      scored_at: new Date().toISOString(),
    };

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/bill_risk_scores?on_conflict=bill_id`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(row),
      });
      upserted++;
      gradeCounts[scored.risk_grade] = (gradeCounts[scored.risk_grade] || 0) + 1;
      alertCounts[scored.alert_level] = (alertCounts[scored.alert_level] || 0) + 1;
      process.stdout.write(`  ✅ ${bill.bill_number} → ${scored.risk_grade} (${scored.fiscal_risk_score}) [${scored.alert_level}]\n`);
    } catch (err) {
      console.error(`  ❌ ${bill.bill_number}:`, err.message);
      errors++;
    }
  }

  console.log("\n══════════════════════════════════════════");
  console.log(`✅  Bills scored & upserted:  ${upserted} / ${bills.length}`);
  if (errors > 0) console.log(`⚠️   Errors:                  ${errors}`);
  console.log("Grade distribution:", gradeCounts);
  console.log("Alert distribution:", alertCounts);
  console.log("══════════════════════════════════════════\n");
  console.log("Reminder: the Impact Dashboard's Dover Dash Risk Grade is a modeled");
  console.log("scale for illustrative purposes only — it is not affiliated with,");
  console.log("endorsed by, or produced by Moody's Investors Service.\n");
}

main().catch((err) => {
  console.error("\n💥  Fatal error:", err.message);
  process.exit(1);
});
