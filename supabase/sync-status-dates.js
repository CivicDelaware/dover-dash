/**
 * Dover Dash — Status & Date Sync Script
 * ─────────────────────────────────────────────────────────────────────────────
 * For every 153rd GA bill in Supabase that has a legislation_id, fetches the
 * bill detail page from legis.delaware.gov, parses the status text and date
 * (e.g. "Signed by Governor 6/15/25", "Passed 6/24/26"), then writes back
 * `status` and `passed_date` to Supabase.
 *
 * Prerequisites:
 *   Run supabase/migrations/add_passed_date.sql in Supabase SQL Editor first.
 *   Node 18+ (uses native fetch).
 *
 * Usage:
 *   node supabase/sync-status-dates.js [--dry-run]
 *
 * Env vars (or edit the defaults below):
 *   SUPABASE_URL         https://vqkloboidffggdwykakf.supabase.co
 *   SUPABASE_SERVICE_KEY eyJ...
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vqkloboidffggdwykakf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa2xvYm9pZGZmZ2dkd3lrYWtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk1NzM5NCwiZXhwIjoyMDk5NTMzMzk0fQ.mMkrrKqGyN32cMW7-XZFfqajBgrQoIIffPx7rK8fJUU';
const DRY_RUN    = process.argv.includes('--dry-run');
const DELAY_MS   = 1500; // polite crawl delay between requests

const SB_HEADERS = {
  apikey:        SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer:        'return=minimal',
};

// ── helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Parse "M/D/YY" or "M/D/YYYY" → "YYYY-MM-DD", returns null if no match */
function parseDate(str) {
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  const [, month, day, yr] = m;
  const year = yr.length === 2 ? '20' + yr : yr;
  return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
}

/** Strip the date and any parenthetical notes, decode HTML entities, return clean label */
function cleanStatus(raw) {
  return raw
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') // decode entities
    .replace(/\s*\(.*\)/, '')          // strip parenthetical notes like "(Line-Item Veto...)"
    .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/, '') // strip date
    .replace(/\s+/g, ' ').trim();
}

/** Fetch bill detail HTML and extract status text */
async function fetchStatus(legislationId) {
  const url = `https://legis.delaware.gov/BillDetail?LegislationId=${legislationId}`;
  const res  = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();

  // The status is in the first info-value div after the "Status:" label
  // Pattern: <label class="info-label">Status:</label>\n<div class="info-value">\n  TEXT
  const m = html.match(/info-label[^>]*>Status:<\/label>\s*<div[^>]*info-value[^>]*>\s*([^<]+)/);
  if (!m) return null;
  return m[1].trim();
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN — no writes' : '✍️  Writing to Supabase');

  // 1. Pull all bills with a legislation_id
  const listRes = await fetch(
    `${SUPABASE_URL}/rest/v1/bills?select=bill_number,legislation_id,status,passed_date&legislation_id=not.is.null&session_number=eq.153`,
    { headers: SB_HEADERS }
  );
  if (!listRes.ok) { console.error('Failed to fetch bills:', await listRes.text()); process.exit(1); }
  const bills = await listRes.json();
  console.log(`Found ${bills.length} bills with legislation_id\n`);

  let updated = 0, skipped = 0, errors = 0;

  for (const bill of bills) {
    await sleep(DELAY_MS);
    try {
      const rawStatus = await fetchStatus(bill.legislation_id);
      if (!rawStatus) {
        console.log(`  ⚠  ${bill.bill_number} — status not found in HTML`);
        skipped++;
        continue;
      }

      const parsedDate  = parseDate(rawStatus);
      const cleanLabel  = cleanStatus(rawStatus);

      // Skip if nothing changed
      if (bill.status === cleanLabel && bill.passed_date === parsedDate) {
        console.log(`  ✓  ${bill.bill_number} — already up to date (${cleanLabel} ${parsedDate || '—'})`);
        skipped++;
        continue;
      }

      console.log(`  →  ${bill.bill_number}: "${cleanLabel}" ${parsedDate || '(no date)'}`);

      if (!DRY_RUN) {
        const patch = { status: cleanLabel };
        if (parsedDate) patch.passed_date = parsedDate;

        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/bills?bill_number=eq.${encodeURIComponent(bill.bill_number)}&session_number=eq.153`,
          { method: 'PATCH', headers: SB_HEADERS, body: JSON.stringify(patch) }
        );
        if (!patchRes.ok) {
          console.error(`    ✗ PATCH failed:`, await patchRes.text());
          errors++;
          continue;
        }
      }
      updated++;
    } catch (err) {
      console.error(`  ✗  ${bill.bill_number}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone — Updated: ${updated} / Skipped: ${skipped} / Errors: ${errors}`);
}

main().catch(err => { console.error(err); process.exit(1); });
