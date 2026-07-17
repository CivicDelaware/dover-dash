/**
 * Dover Dash — Generate Bill Nicknames via Claude AI
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls Claude Haiku with a locked style prompt to generate short, memorable
 * nicknames for every 153rd GA bill in Supabase.
 *
 * Style rules (baked into the prompt — DO NOT change without re-running):
 *   • 2–4 words max
 *   • Passes the "hallway test": "Did you hear about the [nickname] bill?"
 *   • 5th grade vocabulary — no legal jargon
 *   • Noun-forward (center on subject, not action)
 *   • Natural rhythm or light alliteration when it fits
 *
 * Prerequisites:
 *   • Run supabase/add-nickname-column.sql in Supabase SQL Editor first
 *   • Node 18+ (uses native fetch)
 *
 * Usage:
 *   SUPABASE_URL=https://vqkloboidffggdwykakf.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   ANTHROPIC_API_KEY=sk-ant-... \
 *   node supabase/generate-nicknames.js
 *
 *   --dry-run   Preview nicknames without saving to Supabase
 *   --force     Overwrite nicknames that are already set
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY;
const FORCE                = process.argv.includes("--force");
const DRY_RUN              = process.argv.includes("--dry-run");
const DELAY_MS             = 300; // polite pacing between API calls

// ── Style prompt — locked for consistency across all sessions ─────────────────
// To change the naming style, update this prompt AND re-run with --force.

const NICKNAME_SYSTEM_PROMPT = `You name Delaware legislation for a civic voter guide called Dover Dash.

Your job: write a SHORT, MEMORABLE nickname for each bill.

STYLE RULES (follow every single one):
1. 2 to 4 words maximum. Never more.
2. It must pass the "hallway test" — someone should be able to say "Did you hear about the [nickname] bill?" and immediately know what it's about.
3. Use 5th grade vocabulary. No legal terms. No government jargon. Plain everyday words.
4. Be noun-forward — center on what the bill is ABOUT, not what it does.
5. Light alliteration or natural rhythm when it fits, but never forced.
6. Do NOT start with "The" or "A".
7. Do NOT end with "Act", "Bill", "Law", or "Legislation".
8. Do NOT use words like: amend, code, title, statute, provision, section, pursuant.

GOOD EXAMPLES:
- "Lien Release Fix"
- "Backflow Fee Waiver"
- "School Lunch Debt"
- "Rent Notice Rules"
- "Contractor Bond Boost"
- "Nurse Staffing Ratios"
- "Child Tax Rebate"
- "Gun Permit Expansion"

BAD EXAMPLES (too long, jargon, or vague):
- "An Act to Amend Title 25" ✗
- "Real Property Amendment" ✗
- "Municipal Water Backflow Prevention Requirements" ✗
- "Housing Legislation" ✗

Output ONLY the nickname — no quotes, no punctuation, no explanation.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateNickname(bill) {
  if (!ANTHROPIC_API_KEY) {
    // Fallback: extract from "RELATING TO [topic]" in bill_text
    return fallbackNickname(bill.bill_text, bill.bill_number);
  }

  const userContent = [
    `Bill number: ${bill.full_code || bill.bill_number}`,
    bill.bill_text  ? `Official title: ${bill.bill_text}` : null,
    bill.synopsis   ? `Synopsis: ${bill.synopsis}` : null,
    bill.plain_english ? `Plain English: ${bill.plain_english}` : null,
  ].filter(Boolean).join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 30,
      system:     NICKNAME_SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.content?.[0]?.text || "").trim().replace(/^["']|["']$/g, "");
}

function fallbackNickname(billText, billNumber) {
  if (!billText) return billNumber || "";
  const text = billText.toUpperCase();
  const relMatch = text.match(/RELATING TO\s+(.+?)(?:\s+AND\s+(?:MAKING|FOR|DECLARING)|;|\.$|$)/i);
  if (relMatch) {
    const raw = relMatch[1].trim().replace(/\s+/g, " ").slice(0, 60);
    return toTitleCase(raw);
  }
  return toTitleCase(billText.trim().split(/\s+/).slice(0, 5).join(" "));
}

function toTitleCase(str) {
  const minor = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up","as","is"]);
  return str.toLowerCase().split(/\s+/)
    .map((w, i) => (i === 0 || !minor.has(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(" ");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌  Required: SUPABASE_URL and SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  console.log("🏷️   Dover Dash — Generate Bill Nicknames");
  console.log("═══════════════════════════════════════════════");
  if (ANTHROPIC_API_KEY) {
    console.log("✅  Using Claude Haiku for AI-generated nicknames");
  } else {
    console.log("⚠️   No ANTHROPIC_API_KEY — using regex fallback");
  }
  if (DRY_RUN) console.log("🔍  DRY RUN — nothing will be saved");
  if (FORCE)   console.log("⚠️   --force — overwriting existing nicknames");
  console.log();

  const bills = await sbGet(
    "/bills?session_number=eq.153&select=id,bill_number,full_code,bill_text,synopsis,plain_english,nickname&order=bill_number"
  );
  console.log(`📋  ${bills.length} bills found\n`);

  const stats = { updated: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i];
    const tag  = `[${String(i + 1).padStart(3)}/${bills.length}] ${(bill.full_code || bill.bill_number).padEnd(18)}`;

    if (!FORCE && bill.nickname) {
      console.log(`${tag} ✓  "${bill.nickname}"`);
      stats.skipped++;
      continue;
    }

    process.stdout.write(`${tag} ...`);

    try {
      const nickname = await generateNickname(bill);
      process.stdout.write(` "${nickname}"\n`);

      if (!DRY_RUN) {
        await sbPatch(bill.id, { nickname });
      }
      stats.updated++;
    } catch (err) {
      process.stdout.write(` ❌ ${err.message}\n`);
      stats.failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log(`✅  ${DRY_RUN ? "Would update" : "Updated"} : ${stats.updated}`);
  console.log(`✓   Skipped  : ${stats.skipped} (already set)`);
  if (stats.failed) console.log(`❌  Failed   : ${stats.failed}`);
  console.log("\n💡  Tip: Review in Supabase Table Editor and hand-edit any that need polishing.");
  console.log("    To regenerate all: add --force to the command.\n");
}

main().catch(err => { console.error("\nFatal:", err); process.exit(1); });
