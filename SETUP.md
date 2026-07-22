# Dover Dash — Setup & Maintenance

Dover Dash is Civic Delaware's legislative bill tracker for the 153rd Delaware
General Assembly. It's a static-site + Netlify Functions app backed by
Supabase (Postgres), deployed on Netlify.

## Stack

- **Frontend**: static HTML/CSS/vanilla JS (`tracker.html`, `impact-dashboard.html`)
- **Backend**: Netlify Functions (`netlify/functions/*.js`), Node, esbuild bundler
- **Database**: Supabase (Postgres) — tables `bills`, `classifications`, `profiles`, `bill_risk_scores`
- **Deploy**: Netlify, configured via `netlify.toml`. Branch deploys give preview URLs; `main`/`tracker-preview` map to production/preview contexts.

## Environment variables (Netlify site settings)

| Var | Used by |
|---|---|
| `SUPABASE_URL` | all `netlify/functions/*.js`, `supabase/*.js` scripts |
| `SUPABASE_SERVICE_KEY` | all `netlify/functions/*.js`, `supabase/*.js` scripts |
| `CURRENT_SESSION` | defaults to `153` if unset |

---

## Impact Dashboard

`impact-dashboard.html` is a companion page to the main tracker. It scores
every bill in the current session for **fiscal risk**, projects **sector-level
economic shifts** over 1–3 years, and estimates **household-level impact**
for each of Dover Dash's 9 audience profiles (homeowner, renter, landlord,
senior/retiree, veteran, hourly worker, professional, small business owner,
government worker).

It reads from a dedicated Supabase table, `bill_risk_scores`, joined with
`bills` and `classifications` via `netlify/functions/get-impact-data.js`.

### Data model — `bill_risk_scores`

| Column | Type | Notes |
|---|---|---|
| `bill_id` | int, FK → `bills.id`, unique | one row per bill |
| `session_number` | int | e.g. `153` |
| `fiscal_risk_score` | int, 0–100 | computed score |
| `risk_grade` | text | `Aaa`…`Caa`, the **Dover Dash Risk Grade** |
| `risk_grade_label` | text | e.g. `Minimal`, `Moderate`, `Severe` |
| `alert_level` | text | `low` / `medium` / `high` |
| `keyword_hits` | jsonb | which keyword signals matched |
| `sectors` | jsonb | `[{sector, y1, y2, y3}]` projected magnitude by year |
| `household_impact` | jsonb | `[{profile_key, direction, confidence, note?}]` |
| `reviewed_profile_count` | int | how many of the 9 profiles have a manually-reviewed classification (vs. heuristic) |
| `methodology_version` | text | currently `v1` |
| `scored_at` | timestamptz | last scoring run |

A view, `bills_with_risk`, left-joins `bills` with `bill_risk_scores` for convenience.

### Scoring methodology (v1)

The **Dover Dash Risk Grade** is an independent, nonpartisan scale modeled
loosely on fixed-income credit-rating conventions (`Aaa` = minimal risk down
to `Caa` = severe risk). **It is not produced, endorsed, or affiliated with
Moody's Investors Service or any credit rating agency.**

For each bill:

1. **Category base risk** — every legal category (`State Budget & Appropriations`, `Bond & Capital Budget`, `State Taxes`, etc.) has a fixed base-risk weight from 2–90, reflecting how directly that category tends to touch the state budget, taxes, or broad economic activity.
2. **Keyword signals** — the bill's synopsis/text is scanned for ~18 regex signals (`general fund`, `appropriat*`, `new tax`, `minimum wage`, `bond`, `surcharge`, `mandate`, etc.), each adding a weighted point value, capped at +45.
3. **Amendment activity** — each amendment adds up to +3 points, capped at +9, since heavily-amended bills tend to be more contested/consequential.
4. **Fiscal Risk Score** = `round(category_base * 0.55 + keyword_score + amendment_score)`, clamped to 0–100.
5. **Risk Grade**: `Aaa` (0–10), `Aa` (11–25), `A` (26–40), `Baa` (41–55), `Ba` (56–70), `B` (71–85), `Caa` (86–100).
6. **Alert level**: `high` if score ≥ 71; `medium` if score ≥ 41, or score ≥ 1 with 2+ amendments; otherwise `low`.
7. **Sector projections** — each category maps to 1–2 economic sectors (e.g. `Public Utilities` → `Energy & Utilities`). Projected magnitude scales with the fiscal risk score, split across Year 1 (40%), Year 2 (70%), and Year 3 (100%) of a bill's full modeled effect. This is **illustrative, not an economic forecast**.
8. **Household impact** — for each of the 9 profiles, we first check for a manually-reviewed classification (from the `classifications` table, same data source that powers the main tracker's "Helps You" / "Watch Out" chips). If none exists, we fall back to a category-level heuristic (e.g. `Property` category → `Watch Out` for homeowners/renters/landlords) and mark it `"confidence": "preliminary"`. Only ~54 of 216 bills currently have manually-reviewed classifications — most household impact entries are preliminary heuristics and are labeled as such in the UI.

The full logic lives in two mirrored implementations:

- `scoring_engine.py` — reference/prototype implementation
- `supabase/score-bills.js` — the production Node script (ported 1:1) that actually re-scores and upserts

### Manual refresh

The Impact Dashboard is **manually refreshed** (no cron/automation yet). After
new committee actions, votes, or amendments land — typically after re-running
`supabase/seed.js` to pull the latest bill data — re-score everything with:

```bash
SUPABASE_URL=https://vqkloboidffggdwykakf.supabase.co \
SUPABASE_SERVICE_KEY=<service_role_key> \
node supabase/score-bills.js
```

This re-scores every bill in `bills` for `CURRENT_SESSION` (default `153`)
and upserts into `bill_risk_scores` (`on_conflict=bill_id`). Safe to re-run
any time — it's idempotent.

### "Newly Introduced — Awaiting Review"

`pending_report.json` (repo root) lists bills/amendments detected on
legis.delaware.gov that haven't been fully processed into `bills` yet, so
they can't be scored. The Impact Dashboard renders these in a dedicated
"Newly Introduced" section, badge-marked and excluded from the scored charts.
Regenerate this file manually whenever you spot newly introduced items that
haven't made it into the main pipeline yet — it's a simple JSON array, see
the file for the shape (`bill_number`, `type`, `parent_bill`, `status`, `summary`).

### Known limitations to flag to readers

- The dashboard uses Dover Dash's **live 9 audience profiles** (homeowner, renter, landlord, senior, veteran, hourly worker, professional, small business owner, government worker) — the production source of truth in Supabase — rather than a fixed set of 7.
- Only a minority of bills have manually-reviewed household-impact classifications; the rest are heuristic/preliminary and labeled as such in the UI.
- Sector projections are directional and illustrative, not a certified economic forecast.
- Risk grading is a Dover Dash-built heuristic model, not a real credit rating.

### Files

| File | Purpose |
|---|---|
| `impact-dashboard.html` | the dashboard page |
| `netlify/functions/get-impact-data.js` | REST endpoint the dashboard fetches from |
| `supabase/score-bills.js` | manual re-scoring script |
| `scoring_engine.py` | reference Python implementation of the same logic |
| `pending_report.json` | newly-introduced items not yet in `bills` |

---

## Main Bill Tracker (`tracker.html`)

See `netlify/functions/get-bills.js`, `supabase/seed.js`, and `supabase/schema.sql`
for the original tracker's data pipeline (Airtable → Supabase seed, profile
classifications, sponsor/legislator lookups, etc.) — unchanged by the Impact
Dashboard addition.
