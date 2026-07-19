/**
 * Dover Dash — Sync Passed Dates
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches the date each bill was signed into law from legis.delaware.gov
 * and writes it back to the `passed_date` column in Supabase.
 *
 * Prerequisites:
 *   1. Run this SQL in Supabase SQL Editor first:
 *      ALTER TABLE bills ADD COLUMN IF NOT EXISTS passed_date DATE;
 *
 * Usage:
 *   SUPABASE_URL=https://vqkloboidffggdwykakf.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   node supabase/sync-passed-dates.js
 *
 *   --force     Overwrite dates already set
 *   --dry-run   Preview without saving
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DE_GA_BASE           = "https://legis.delaware.gov";
const ASSEMBLY_ID          = 153;
const FORCE                = process.argv.includes("--force");
const DRY_RUN              = process.argv.includes("--dry-run");
const DELAY_MS             = 900;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌  Required: SUPABASE_URL and SUPABASE_SERVICE_KEY");
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
  if (!res.ok) throw new Error(`GET ${endpoint} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPatch(id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bills?id=eq.${id}`, {
    method:  "PATCH",
    headers: {
      apikey:         SUPABASE_SERVICE_KEY,
      Authorization:  `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer:         "return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH id=${id} → ${res.status}: ${await res.text()}`);
}

// ── DE GA API ─────────────────────────────────────────────────────────────────

async function fetchPassedDate(legislationId, billNumber) {
  // Try BillDetail page first using legislation_id
  if (legislationId) {
    try {
      const res = await fetch(
        `${DE_GA_BASE}/json/BillDetail/GetBillActions?legislationId=${legislationId}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Referer": `${DE_GA_BASE}/BillDetail?LegislationId=${legislationId}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const actions = data.Data || data.data || data || [];
        // Look for signed/enacted action
        const signed = actions.find(a => {
          const desc = (a.ActionDescription || a.Description || a.ActionType || "").toLowerCase();
          return desc.includes("signed") || desc.includes("enacted") || desc.includes("became law");
        });
        if (signed) {
          const dateStr = signed.ActionDate || signed.Date || signed.ActionDateTime;
          if (dateStr) return parseDate(dateStr);
        }
        // Fall back to last action date if all are passed
        const lastAction = actions[actions.length - 1];
        if (lastAction) {
          const dateStr = lastAction.ActionDate || lastAction.Date || lastAction.ActionDateTime;
          if (dateStr) return parseDate(dateStr);
        }
      }
    } catch (e) {
      // fall through to search
    }
  }

  // Fall back to search API
  const body = [
    `searchTerm=${encodeURIComponent(billNumber)}`,
    `assemblyId=${ASSEMBLY_ID}`,
    "sort=", "page=1", "pageSize=20", "group=", "filter=",
  ].join("&");

  const res = await fetch(`${DE_GA_BASE}/json/Search/GetLegislation`, {
    method: "POST",
    headers: {
      "Content-Type":    "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With":"XMLHttpRequest",
    },
    body,
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.Data || !data.Data.length) return null;

  const match = data.Data.find(
    d => d.AssemblyId === ASSEMBLY_ID && d.LegislationNumber === billNumber
  ) || data.Data.find(d => d.AssemblyId === ASSEMBLY_ID);

  if (!match) return null;

  // StatusDate is usually the last significant action date
  const dateStr = match.StatusDate || match.SignedDate || match.LastActionDate;
  return dateStr ? parseDate(dateStr) : null;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  // Handle "/Date(1234567890000)/" Microsoft JSON format
  const msMatch = String(dateStr).match(/\/Date\((\d+)\)\//);
  if (msMatch) {
    return new Date(parseInt(msMatch[1])).toISOString().split("T")[0];
  }
  // Handle ISO or MM/DD/YYYY
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📅  Dover Dash — Sync Passed Dates");
  console.log("═══════════════════════════════════════════════");
  if (DRY_RUN) console.log("🔍  DRY RUN — nothing will be saved\n");
  if (FORCE)   console.log("⚠️   --force — overwriting existing dates\n");

  const bills = await sbGet(
    "/bills?session_number=eq.153&status=eq.Passed&select=id,bill_number,full_code,legislation_id,passed_date&order=bill_number"
  );
  console.log(`📋  ${bills.length} passed bills found\n`);

  const stats = { updated: 0, skipped: 0, noDate: 0, failed: 0 };

  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i];
    const tag  = `[${String(i + 1).padStart(3)}/${bills.length}] ${(bill.full_code || bill.bill_number).padEnd(25)}`;

    if (!FORCE && bill.passed_date) {
      console.log(`${tag} ✓  ${bill.passed_date}`);
      stats.skipped++;
      continue;
    }

    process.stdout.write(`${tag} ...`);

    try {
      const passed_date = await fetchPassedDate(bill.legislation_id, bill.bill_number);

      if (!passed_date) {
        process.stdout.write(` ⚠️  no date found\n`);
        stats.noDate++;
      } else {
        process.stdout.write(` ${passed_date}\n`);
        if (!DRY_RUN) await sbPatch(bill.id, { passed_date });
        stats.updated++;
      }
    } catch (err) {
      process.stdout.write(` ❌ ${err.message}\n`);
      stats.failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log(`✅  ${DRY_RUN ? "Would update" : "Updated"} : ${stats.updated}`);
  console.log(`✓   Skipped  : ${stats.skipped} (already set)`);
  console.log(`⚠️   No date  : ${stats.noDate}`);
  if (stats.failed) console.log(`❌  Failed   : ${stats.failed}`);
  console.log("\n✨  Done!");
}

main().catch(err => { console.error("\nFatal:", err); process.exit(1); });
