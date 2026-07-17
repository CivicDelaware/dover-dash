/**
 * Dover Dash — Sponsor Sync Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches primary sponsor data from legis.delaware.gov for every 153rd GA bill
 * in Supabase and writes back: primary_sponsor, sponsor_person_id,
 * legislator_url, legislation_id.
 *
 * Prerequisites:
 *   1. Run supabase/add-sponsor-columns.sql in Supabase SQL Editor first.
 *   2. Node 18+ (uses native fetch).
 *
 * Usage:
 *   SUPABASE_URL=https://vqkloboidffggdwykakf.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   node supabase/sync-sponsors.js
 *
 *   Optional: re-run at any time — already-populated bills are skipped
 *   unless you pass --force to overwrite everything.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DE_GA_BASE          = "https://legis.delaware.gov";
const ASSEMBLY_ID         = 153;
const DELAY_MS            = 900;   // ~1 req/sec — polite to DE GA servers
const FORCE               = process.argv.includes("--force");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌  Required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function sbGet(endpoint) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    headers: {
      apikey:        SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase GET ${endpoint} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPatch(id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bills?id=eq.${id}`, {
    method:  "PATCH",
    headers: {
      apikey:          SUPABASE_SERVICE_KEY,
      Authorization:   `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type":  "application/json",
      Prefer:          "return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase PATCH id=${id} → ${res.status}: ${await res.text()}`);
}

// ── DE GA search ──────────────────────────────────────────────────────────────

async function fetchBillFromDEGA(billNumber) {
  // DE GA search returns bills across all assemblies — we filter for 153rd
  const body = [
    `searchTerm=${encodeURIComponent(billNumber)}`,
    `assemblyId=${ASSEMBLY_ID}`,
    "sort=",
    "page=1",
    "pageSize=20",
    "group=",
    "filter=",
  ].join("&");

  const res = await fetch(`${DE_GA_BASE}/json/Search/GetLegislation`, {
    method:  "POST",
    headers: {
      "Content-Type":    "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With":"XMLHttpRequest",
      "Referer":         `${DE_GA_BASE}/Search?searchTerm=${encodeURIComponent(billNumber)}&assemblyId=${ASSEMBLY_ID}`,
    },
    body,
  });

  if (!res.ok) {
    console.warn(`  ⚠️  DE GA ${res.status} for "${billNumber}"`);
    return null;
  }

  const data = await res.json();
  if (!data.Data || !data.Data.length) return null;

  // Prefer exact bill number match in 153rd GA
  const exact = data.Data.find(
    d => d.AssemblyId === ASSEMBLY_ID && d.LegislationNumber === billNumber
  );
  if (exact) return exact;

  // Fall back to any 153rd GA result (catches substitutes: HS 1 for HB 50, etc.)
  return data.Data.find(d => d.AssemblyId === ASSEMBLY_ID) || null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log("🚀  Dover Dash — Sponsor Sync");
  console.log("═══════════════════════════════════════════════\n");
  if (FORCE) console.log("⚠️   --force mode: overwriting all existing values\n");

  // Fetch all 153rd GA bills
  const bills = await sbGet(
    "/bills?session_number=eq.153&select=id,bill_number,primary_sponsor&order=bill_number"
  );
  console.log(`📋  ${bills.length} bills in Supabase\n`);

  const stats = { updated: 0, skipped: 0, noMatch: 0, failed: 0 };

  for (let i = 0; i < bills.length; i++) {
    const bill    = bills[i];
    const tag     = `[${String(i + 1).padStart(3)}/${bills.length}]`;

    // Skip if already populated and not forcing
    if (!FORCE && bill.primary_sponsor) {
      console.log(`${tag} ✓  ${bill.bill_number.padEnd(10)} — ${bill.primary_sponsor}`);
      stats.skipped++;
      continue;
    }

    process.stdout.write(`${tag} 🔍 ${bill.bill_number.padEnd(10)} ...`);

    try {
      const match = await fetchBillFromDEGA(bill.bill_number);

      if (!match) {
        process.stdout.write(` ⚠️  no 153rd GA match\n`);
        stats.noMatch++;
      } else {
        const patch = {
          primary_sponsor:   match.Sponsor || null,
          sponsor_person_id: match.SponsorPersonId || null,
          legislator_url:    match.LegislatorDetailLink
                               ? `${DE_GA_BASE}${match.LegislatorDetailLink}`
                               : null,
          legislation_id:    match.LegislationId
                               ? String(match.LegislationId)
                               : undefined,
        };
        // Don't overwrite legislation_id with undefined
        if (!patch.legislation_id) delete patch.legislation_id;

        await sbPatch(bill.id, patch);
        process.stdout.write(` ✅ ${match.Sponsor}  (DE GA ID: ${match.LegislationId})\n`);
        stats.updated++;
      }
    } catch (err) {
      process.stdout.write(` ❌ ${err.message}\n`);
      stats.failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log(`✅  Updated  : ${stats.updated}`);
  console.log(`✓   Skipped  : ${stats.skipped} (already populated)`);
  console.log(`⚠️   No match : ${stats.noMatch}`);
  console.log(`❌  Failed   : ${stats.failed}`);
  console.log("\n✨  Done!");
}

main().catch(err => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
