-- Dover Dash — Fix Bill Category Assignments
-- Six Sigma QC: 3 bills with incorrect GA category in the bills table.
-- Run in Supabase SQL Editor (Project → SQL Editor → New Query → Paste → Run).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. HB 89 w/ HA 1  |  Home Improvement Contractor Dispute Resolution
--    WRONG:  "Labor" → "Your Job & Wages"
--    WHY:    Creates a Division of Consumer Protection dispute process for
--            homeowners against bad contractors. Nothing to do with wages.
--    FIXED:  "Commerce & Trade / Consumer Protection" → "Consumer & Privacy Rights"
UPDATE bills
SET category = 'Commerce & Trade / Consumer Protection'
WHERE session_number = 153
  AND bill_number = 'HB 89';

-- 2. HB 458 w/ HA 1  |  Backflow Preventer Exemption for Low-Hazard Buildings
--    WRONG:  "Health & Safety" → "Your Health Care"
--    WHY:    Exempts single-family homes from mandatory backflow preventer
--            installation. Plumbing code ≠ medical care.
--    FIXED:  "Property" → "Property & Real Estate"
UPDATE bills
SET category = 'Property'
WHERE session_number = 153
  AND bill_number = 'HB 458';

-- 3. SB 325 w/ SA 1  |  State Fire Prevention Commission Background Checks
--    WRONG:  "Health & Safety" → "Your Health Care"
--    WHY:    Gives the Fire Prevention Commission authority to run background
--            checks on applicants/members. Fire safety ≠ medical care.
--    FIXED:  "State Government" → "State Government"
UPDATE bills
SET category = 'State Government'
WHERE session_number = 153
  AND bill_number = 'SB 325';

-- NOTE on cannabis bills (SB 75, HB 373):
--    These stay under "Alcoholic Liquors" because Delaware regulates cannabis
--    through the liquor licensing framework. The consumer label in tracker.html
--    has been updated from "Bars & Alcohol" → "Alcohol & Cannabis" to reflect this.

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify after running:
SELECT bill_number, full_code, category
FROM bills
WHERE session_number = 153
  AND bill_number IN ('HB 89', 'HB 458', 'SB 325')
ORDER BY bill_number;
