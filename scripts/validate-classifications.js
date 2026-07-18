#!/usr/bin/env node
/**
 * Dover Dash — Classification Validator
 * ──────────────────────────────────────
 * Uses Claude AI to check every bill classification in Supabase and flag
 * any case where "Watch Out" or "Helps You" doesn't match what the bill
 * actually does. Run this before pushing to tracker-preview.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... ANTHROPIC_API_KEY=... node scripts/validate-classifications.js
 *
 * Output:
 *   ✅ VALID  — classification looks correct
 *   🚩 FLAG   — direction may be wrong (review before publishing)
 *   ⚠️  MISSING — rationale is NULL (required before going live)
 *
 * Exit code 0 = all clear. Exit code 1 = flags or missing rationale found.
 */

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY;
const SESSION              = parseInt(process.env.CURRENT_SESSION || '153', 10);
const BATCH_SIZE           = 8; // bills per Claude API call (keeps prompts manageable)

const PROFILE_LABELS = {
  homeowner: 'Homeowner 🏠',
  renter:    'Renter 🔑',
  senior:    'Senior 🌅',
  smallbiz:  'Small Business 💼',
  pubsec:    'Public Sector Worker 🏛️',
  workpro:   'Working Professional 👔',
  lowwage:   'Low-Wage Worker ⏱️',
  veteran:   'Veteran 🎖️',
  landlord:  'Landlord 🏢',
};

// ─── Supabase fetch helpers ───────────────────────────────────────────────────

async function supabaseFetch(path, params) {
  const url = `${SUPABASE_URL}/rest/v1/${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: {
      apikey:        SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase error on ${path}: ${await res.text()}`);
  return res.json();
}

// ─── Claude API call ──────────────────────────────────────────────────────────

async function askClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text;
}

// ─── Build validation prompt for a batch of classifications ──────────────────

function buildPrompt(batch) {
  const items = batch.map((item, i) => `
[${i + 1}]
Bill: ${item.bill_number}
Plain English: ${item.plain_english}
Profile: ${PROFILE_LABELS[item.profile_key] || item.profile_key}
Direction: ${item.direction}
Rationale: ${item.rationale || '(none provided)'}
`.trim()).join('\n\n');

  return `You are validating Delaware legislative bill classifications for a civic tracker.

For each item below, decide if the "Direction" label (Helps You or Watch Out) correctly reflects what the bill does FOR THAT SPECIFIC PROFILE.

Rules:
- "Helps You" = the bill provides a net benefit, saves money, adds a right, reduces burden, or protects that person
- "Watch Out" = the bill adds cost, compliance burden, new liability, removes a right, or negatively impacts that person
- Judge from the perspective of the named Profile, not in general
- If the Rationale contradicts the Direction, that's a strong flag

Reply with ONLY a JSON array, one object per item, in this exact format:
[
  { "index": 1, "verdict": "VALID", "reason": "brief reason" },
  { "index": 2, "verdict": "FLAG",  "reason": "direction says Watch Out but bill protects consumers from rate hikes" }
]

Items to review:
${items}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate env vars
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'ANTHROPIC_API_KEY'].filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`❌ Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🔍 Dover Dash — Classification Validator`);
  console.log(`   Session: ${SESSION}`);
  console.log(`   Fetching data from Supabase...\n`);

  // Fetch bills
  const bills = await supabaseFetch('bills', {
    select:         'id,bill_number,plain_english',
    session_number: `eq.${SESSION}`,
  });

  // Fetch classifications
  const classifications = await supabaseFetch('classifications', {
    select:         'bill_id,profile_key,direction,rationale',
    session_number: `eq.${SESSION}`,
  });

  // Build bill lookup
  const billById = {};
  bills.forEach(b => { billById[b.id] = b; });

  // Build work list — skip bills with no plain_english (can't validate)
  const workList = [];
  const missingRationale = [];

  classifications.forEach(c => {
    const bill = billById[c.bill_id];
    if (!bill) return;
    if (!bill.plain_english) return;

    if (!c.rationale) {
      missingRationale.push({ bill_number: bill.bill_number, profile_key: c.profile_key, direction: c.direction });
    }

    workList.push({
      bill_number:  bill.bill_number,
      plain_english: bill.plain_english,
      profile_key:  c.profile_key,
      direction:    c.direction,
      rationale:    c.rationale,
    });
  });

  console.log(`   Found ${workList.length} classifications across ${Object.keys(billById).length} bills\n`);

  // ── Phase 1: Flag missing rationale (no API needed) ──
  if (missingRationale.length > 0) {
    console.log(`⚠️  MISSING RATIONALE (${missingRationale.length} entries — required before going live)\n`);
    missingRationale.forEach(({ bill_number, profile_key, direction }) => {
      console.log(`   ⚠️  ${bill_number} → ${PROFILE_LABELS[profile_key] || profile_key} [${direction}]  — no rationale`);
    });
    console.log('');
  }

  // ── Phase 2: Send to Claude in batches ──
  const flagged = [];
  const valid   = [];
  let processed = 0;

  for (let i = 0; i < workList.length; i += BATCH_SIZE) {
    const batch = workList.slice(i, i + BATCH_SIZE);
    process.stdout.write(`   Checking ${Math.min(i + BATCH_SIZE, workList.length)}/${workList.length}...`);

    const prompt = buildPrompt(batch);
    let results;

    try {
      const raw = await askClaude(prompt);
      // Parse the JSON response — strip any markdown fences if present
      const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      results = JSON.parse(jsonStr);
    } catch (err) {
      console.error(`\n   ⚠️  Could not parse Claude response for batch starting at ${i}: ${err.message}`);
      continue;
    }

    results.forEach(r => {
      const item = batch[r.index - 1];
      if (!item) return;

      if (r.verdict === 'FLAG') {
        flagged.push({ ...item, reason: r.reason });
      } else {
        valid.push(item);
      }
      processed++;
    });

    process.stdout.write(` ✓\n`);

    // Small delay to be polite to the API
    if (i + BATCH_SIZE < workList.length) await new Promise(r => setTimeout(r, 300));
  }

  // ── Print results ──
  console.log('\n' + '─'.repeat(60));
  console.log(`\n✅ VALID: ${valid.length}  |  🚩 FLAGGED: ${flagged.length}  |  ⚠️  MISSING RATIONALE: ${missingRationale.length}\n`);

  if (flagged.length > 0) {
    console.log(`🚩 FLAGGED CLASSIFICATIONS — review before publishing:\n`);
    flagged.forEach(({ bill_number, profile_key, direction, reason }) => {
      console.log(`   🚩 ${bill_number} → ${PROFILE_LABELS[profile_key] || profile_key}`);
      console.log(`      Direction: ${direction}`);
      console.log(`      Issue:     ${reason}`);
      console.log('');
    });
  }

  if (flagged.length === 0 && missingRationale.length === 0) {
    console.log('🎉 All classifications look good — safe to publish.\n');
    process.exit(0);
  } else {
    console.log('🛑 Fix the flagged items above before pushing to main.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Validator crashed:', err.message);
  process.exit(1);
});
