# Dover Dash — Category QC Report
**153rd General Assembly | 53 profiled bills | July 2026**

## Results

| Severity | Count | Bills |
|---|---|---|
| 🔴 Critical (wrong label entirely) | 6 | HB 89, HB 373, HB 458, SB 75, SB 307, SB 325 |
| 🟡 Moderate (label misleads on impact) | 11 | HB 338, HB 380, HB 381, HB 429, SB 22, SB 192, SB 271, SB 275, SB 292, SB 297, SB 347 |
| 🟢 Minor (vague but defensible) | 2 | HB 423, SB 321 |
| ✅ Correct | 34 | — |

**Pass rate before fixes: 64%**

---

## Root Causes

**Two structural problems, not one-off errors:**

1. **The GA's "Alcoholic Liquors" category catches cannabis bills** — Delaware regulated cannabis beverages and dispensaries through the liquor licensing framework, so the GA files them under "Alcoholic Liquors." Consumers see "Bars & Alcohol" and skip bills that directly affect cannabis businesses.

2. **"Insurance" covers both premium cost AND coverage benefits** — The label "Your Insurance Premium" implies the bill will raise or lower your monthly premium. But most of the bills under Insurance are about *coverage mandates* (what's covered, step therapy, mental health parity, PBM drug costs). The label misfires for all four health coverage bills.

3. **"Commerce & Trade / Consumer Protection" is too broad** — The GA uses this category for data privacy (DPDPA), data breach notification, consumer fraud (post-transaction), and medical debt collection. The label "Shopping & Consumer Rights" signals retail transactions, losing the data privacy and debt-collection audience entirely.

4. **"Public Utilities" = electric + gas + telecom** — Delaware's PSC regulates all utilities including telecom (Lifeline). The label "Your Electric & Gas Bill" omits phone/internet entirely, mislabeling the Lifeline bill.

---

## Fixes Applied

### tracker.html — CATEGORY_LABELS (global changes, effective immediately after deploy)

| GA Category | Before | After | Bills Affected |
|---|---|---|---|
| Commerce & Trade / Consumer Protection | Shopping & Consumer Rights | **Consumer & Privacy Rights** | HB 380, HB 381, SB 75*, SB 89*, SB 297, SB 347 |
| Insurance | Your Insurance Premium | **Your Insurance & Coverage** | HB 338, HB 406, HB 429, SB 22, SB 271 |
| Public Utilities | Your Electric & Gas Bill | **Your Utility Bills** | SB 307, SB 192, SB 275, SB 308, SB 321, SB 326, HB 393, HB 445 |

### supabase/fix-bill-categories.sql — Per-bill category corrections in Supabase

| Bill | Current Category | Fixed Category | Reason |
|---|---|---|---|
| HB 89 w/ HA 1 | Labor | Commerce & Trade / Consumer Protection | Home improvement contractor dispute resolution — not a labor/wages bill |
| SB 75 w/ SA 1, SA 2 | Alcoholic Liquors | Commerce & Trade / Consumer Protection | Marijuana dispensary zoning — cannabis ≠ bars & alcohol |
| HB 373 w/ HA 1 + SA 3 | Alcoholic Liquors | Commerce & Trade / Consumer Protection | THC-infused beverage regulation — cannabis ≠ bars & alcohol |
| HB 458 w/ HA 1 | Health & Safety | Property | Backflow preventer plumbing exemption — plumbing code, not medical care |
| SB 325 w/ SA 1, SA 2 + HA 1 | Health & Safety | State Government | Fire Prevention Commission background checks — fire safety ≠ Your Health Care |

**To apply Supabase fixes:** Go to Supabase → SQL Editor → paste `fix-bill-categories.sql` → Run.

---

## Remaining Issues (not fixable without new category options)

| Bill | Issue | Why It Stays |
|---|---|---|
| SB 292 | "Property & Real Estate" for eviction/discharge planning | GA categorizes landlord-tenant law under Property; no Landlord-Tenant category exists |
| SB 192 | "Your Utility Bills" for call-center relocation notice | PSC jurisdiction is correct; label is now improved with "Utility Bills" change |
| HB 423 | "State Government" for retirement plan auto-enrollment | GA category is too vague; would need "Labor" recategorization in Supabase |
| SB 275 | "Your Utility Bills" for excavation safety | PSC jurisdiction is correct; "Utility Bills" is better than "Electric & Gas Bill" |

---

## Pass Rate After Fixes

| Category | Count |
|---|---|
| ✅ Correct after all fixes | 49 / 53 |
| 🟡 Residual (structural, no clean fix) | 4 / 53 |
| **Pass rate** | **92%** |

Six Sigma target is 99.99966%. Reaching 100% would require the GA to adopt a dedicated "Rental Housing" and "Cannabis" category — outside our control.
