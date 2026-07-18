/**
 * Dover Dash — Sync Veteran Profile to Supabase
 * ───────────────────────────────────────────────
 * Reads bill_profiles.json and upserts only the veteran
 * profile entries into the bill_profiles table in Supabase.
 *
 * Usage:
 *   cd ~/Desktop/Dover-dash/Updated\ at\ Midnight\ Github
 *
 *   SUPABASE_URL=https://vqkloboidffggdwykakf.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   node supabase/sync-veteran-profile.js
 */

const fs   = require("fs");
const path = require("path");

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌  Required: SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

async function supabase(endpoint, method = "GET", body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    method,
    headers: {
      apikey:        SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer:        "resolution=merge-duplicates,return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${endpoint} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  // Ensure veteran + landlord profiles exist in the profiles table
  await supabase("/profiles", "POST", [
    { key: "veteran",  label: "Veteran or Military", emoji: "🎖️", description: "(active duty, veterans, military families)", sort_order: 8 },
    { key: "landlord", label: "Landlord",            emoji: "🏢", description: "(residential rental property owners)",       sort_order: 9 },
  ]);
  console.log("✅  Profiles table: veteran + landlord upserted");

  const profilesPath = path.join(__dirname, "../bill_profiles.json");
  const profiles = JSON.parse(fs.readFileSync(profilesPath, "utf8"));

  // Find all bills with a veteran profile entry
  const veteranBills = profiles.filter(b => b.profiles && b.profiles.veteran);
  console.log(`Found ${veteranBills.length} bills with veteran profile`);

  // Look up each bill's id in Supabase by full_code (includes amendments)
  for (const bill of veteranBills) {
    const fullCode = bill.bill_number; // bill_profiles.json uses bill_number field for full_code
    const veteranEntry = bill.profiles.veteran;

    // Get the bill id — match on full_code which includes amendments
    const rows = await supabase(
      `/bills?full_code=eq.${encodeURIComponent(fullCode)}&select=id,full_code&session_number=eq.153`
    );

    if (!rows || rows.length === 0) {
      // Fallback: try base bill_number (strip " w/ ..." suffix)
      const baseNum = fullCode.replace(/\s+w\/.*$/, '').trim();
      const fallback = await supabase(
        `/bills?bill_number=eq.${encodeURIComponent(baseNum)}&select=id,bill_number&session_number=eq.153`
      );
      if (!fallback || fallback.length === 0) {
        console.warn(`⚠️  Bill not found in Supabase: ${fullCode}`);
        continue;
      }
      rows.push(...fallback);
    }

    const billId = rows[0].id;

    // Upsert into classifications table (correct table name)
    await supabase("/classifications", "POST", [{
      bill_id:        billId,
      session_number: 153,
      profile_key:    "veteran",
      direction:      veteranEntry.direction,
      rationale:      veteranEntry.rationale,
    }]);

    console.log(`✅  ${fullCode} → veteran (${veteranEntry.direction})`);
  }

  console.log("\n✓ Done — veteran profile synced to Supabase.");
}

main().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
