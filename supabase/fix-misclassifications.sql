-- Dover Dash — Fix 6 misclassified bills (153rd GA)
-- Run in Supabase SQL Editor
-- All 6 were marked Watch Out but actually benefit the profile

-- ─── 1. HB 283 — Realty Transfer Tax Exemption ───────────────────────────────
-- homeowner: Watch Out → Helps You
-- Bill ELIMINATES the state realty transfer tax on grandparent↔grandchild transfers

UPDATE classifications
SET
  direction = 'Helps You',
  rationale = 'If you transfer your home to a grandchild — or inherit one from a grandparent — you now skip Delaware''s realty transfer tax entirely, potentially saving thousands in closing costs on what would otherwise be a taxable property transfer.'
WHERE session_number = 153
  AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 283');


-- ─── 2. SB 308 — Electricity Demand Forecast Oversight ───────────────────────
-- homeowner: Watch Out → Helps You
-- Bill forces independent review of utility forecasts to PREVENT grid overbuilding at customer expense

UPDATE classifications
SET
  direction = 'Helps You',
  rationale = 'Delaware regulators must now independently verify the electricity demand forecasts utilities submit — a watchdog measure that prevents Delmarva from overbuilding the grid at your expense and then billing you for infrastructure you didn''t need.'
WHERE session_number = 153
  AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 308 w/ SA 1');

-- renter: Watch Out → Helps You

UPDATE classifications
SET
  direction = 'Helps You',
  rationale = 'Independent oversight of utility demand forecasts prevents Delmarva from padding infrastructure costs that get passed to customers — keeping downward pressure on utility bills that your landlord might otherwise pass through to your rent.'
WHERE session_number = 153
  AND profile_key = 'renter'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 308 w/ SA 1');


-- ─── 3. SB 316 — Attorney Lien Release ───────────────────────────────────────
-- homeowner: Watch Out → Helps You
-- Bill HELPS clear title — already Helps You for landlord, was inconsistently Watch Out for homeowner

UPDATE classifications
SET
  direction = 'Helps You',
  rationale = 'If you''ve paid off any lien on your property — not just a mortgage — your attorney can now legally file the release on your behalf if the creditor fails to do so, preventing a lingering cloud on your title from blocking or complicating a future home sale.'
WHERE session_number = 153
  AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 316');


-- ─── 4. SB 326 — Delmarva Rate Protection ────────────────────────────────────
-- homeowner: Watch Out → Helps You
-- Bill BARS Delmarva from passing non-essential infrastructure costs to customers

UPDATE classifications
SET
  direction = 'Helps You',
  rationale = 'Delmarva Power can no longer bill you for the cost of infrastructure projects that don''t benefit you — and the bill caps how much they can collect in interim rates while disputes are resolved, protecting you from speculative rate increases on your utility bill.'
WHERE session_number = 153
  AND profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 326 w/ SA 1');

-- renter: Watch Out → Helps You

UPDATE classifications
SET
  direction = 'Helps You',
  rationale = 'Utility cost protections that keep Delmarva from passing non-essential infrastructure costs to customers mean your landlord faces lower operating costs — reducing the pressure to pass those costs along through rent increases.'
WHERE session_number = 153
  AND profile_key = 'renter'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 326 w/ SA 1');


-- ─── 5. SB 141 — Auction House Spirits ───────────────────────────────────────
-- smallbiz: Watch Out → Helps You
-- Bill OPENS a new revenue channel for licensed auction houses

UPDATE classifications
SET
  direction = 'Helps You',
  rationale = 'If you run a licensed auction house in Delaware, you can now add spirits to your auction inventory — opening a new revenue channel for high-end or collectible liquor sales, as long as bottles stay off the auction floor and out of general circulation.'
WHERE session_number = 153
  AND profile_key = 'smallbiz'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 141 w/ SA 1');


-- ─── 6. SB 293 — Youth Camp ACA Accreditation ────────────────────────────────
-- smallbiz: Watch Out → Helps You
-- Bill REDUCES compliance burden for ACA-accredited camps

UPDATE classifications
SET
  direction = 'Helps You',
  rationale = 'If your youth camp holds American Camp Association accreditation, Delaware now automatically treats that as meeting state licensing requirements — cutting the red tape of a separate state review process and making your camp eligible for public school partnerships.'
WHERE session_number = 153
  AND profile_key = 'smallbiz'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 293 w/ SA 1 + HA 1');


-- ─── Verify ───────────────────────────────────────────────────────────────────
-- Run this after to confirm all 8 rows updated correctly:

SELECT
  b.bill_number,
  c.profile_key,
  c.direction,
  LEFT(c.rationale, 60) AS rationale_preview
FROM classifications c
JOIN bills b ON b.id = c.bill_id
WHERE b.session_number = 153
  AND b.bill_number IN ('HB 283', 'SB 308 w/ SA 1', 'SB 316', 'SB 326 w/ SA 1', 'SB 141 w/ SA 1', 'SB 293 w/ SA 1 + HA 1')
ORDER BY b.bill_number, c.profile_key;
