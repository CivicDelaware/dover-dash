/**
 * Dover Dash — Sync New Profiles to Supabase
 * ────────────────────────────────────────────
 * Reads bill_profiles.json and upserts all profile entries
 * that are stored as objects (with direction + rationale) into
 * the classifications table. Currently handles: veteran, landlord.
 *
 * Usage:
 *   cd ~/Desktop/Dover-dash/Updated\ at\ Midnight\ Github
 *
 *   SUPABASE_URL=https://vqkloboidffggdwykakf.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   node supabase/sync-new-profiles.js
 *
 *   # Dry run (no writes):
 *   node supabase/sync-new-profiles.js --dry-run
 */

const fs      = require("fs");
const path    = require("path");

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DRY_RUN              = process.argv.includes("--dry-run");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌  Required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

async function sbFetch(endpoint, method = "GET", body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    method,
    headers: {
      apikey:          SUPABASE_SERVICE_KEY,
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

// Known new profiles that use the object format {direction, rationale}
const NEW_PROFILES = [
  {
    key: "veteran",
    label: "Veteran or Military",
    emoji: "🎖️",
    description: "(active duty, veterans, military families)",
    sort_order: 8,
  },
  {
    key: "landlord",
    label: "Landlord",
    emoji: "🏢",
    description: "(residential rental property owners)",
    sort_order: 9,
  },
];

async function main() {
  console.log("🔄  Dover Dash — Sync New Profiles");
  console.log("═".repeat(48));
  if (DRY_RUN) console.log("🔍  DRY RUN — nothing will be written\n");

  // 1. Upsert profile rows so FK constraint is satisfied
  if (!DRY_RUN) {
    await sbFetch("/profiles?on_conflict=key", "POST", NEW_PROFILES);
    console.log(`✅  Profiles table: ${NEW_PROFILES.map(p => p.key).join(", ")} upserted\n`);
  } else {
    console.log(`   Would upsert profiles: ${NEW_PROFILES.map(p => p.key).join(", ")}\n`);
  }

  // 2. Load bill_profiles.json
  const profilesPath = path.join(__dirname, "../bill_profiles.json");
  const bills = JSON.parse(fs.readFileSync(profilesPath, "utf8"));

  // Collect all entries where the profile value is an object {direction, rationale}
  const toSync = [];
  for (const bill of bills) {
    if (!bill.profiles) continue;
    for (const [profileKey, value] of Object.entries(bill.profiles)) {
      if (typeof value === "object" && value !== null && value.direction) {
        toSync.push({ billCode: bill.bill_number, profileKey, ...value });
      }
    }
  }

  console.log(`📋  ${toSync.length} classification entries to sync\n`);

  let synced = 0, skipped = 0, errors = 0;

  for (const entry of toSync) {
    const { billCode, profileKey, direction, rationale } = entry;

    if (DRY_RUN) {
      console.log(`   [${profileKey}] ${billCode} → ${direction}`);
      continue;
    }

    // Look up bill by full_code first
    let rows = await sbFetch(
      `/bills?full_code=eq.${encodeURIComponent(billCode)}&select=id,full_code&session_number=eq.153`
    );

    // Fallback: strip " w/ ..." and match on bill_number
    if (!rows || rows.length === 0) {
      const baseNum = billCode.replace(/\s+w\/.*$/, "").trim();
      rows = await sbFetch(
        `/bills?bill_number=eq.${encodeURIComponent(baseNum)}&select=id,bill_number&session_number=eq.153`
      );
    }

    if (!rows || rows.length === 0) {
      console.warn(`⚠️   Not found in Supabase: ${billCode}`);
      skipped++;
      continue;
    }

    const billId = rows[0].id;

    try {
      await sbFetch("/classifications", "POST", [{
        bill_id:        billId,
        session_number: 153,
        profile_key:    profileKey,
        direction,
        rationale,
      }]);
      console.log(`✅  ${billCode} → ${profileKey} (${direction})`);
      synced++;
    } catch (err) {
      console.error(`❌  ${billCode} [${profileKey}]: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n${"═".repeat(48)}`);
  if (DRY_RUN) {
    console.log(`✓  Would sync: ${toSync.length}`);
  } else {
    console.log(`✅  Synced: ${synced} / Skipped: ${skipped} / Errors: ${errors}`);
  }
}

main().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
