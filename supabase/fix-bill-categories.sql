-- Dover Dash — Fix Bill Category Assignments
-- Six Sigma QC: 5 bills with incorrect GA category in the bills table.
-- Run in Supabase SQL Editor (Project → SQL Editor → New Query → Paste → Run).
--
-- Each fix is explained with the issue and the corrected category.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. HB 89 w/ HA 1  |  Home Improvement Contractor Dispute Resolution
--    WRONG:  "Labor" → "Your Job & Wages"
--    WHY:    This bill creates a Division of Consumer Protection dispute process
--            for homeowners against bad contractors. Nothing to do with wages.
--    FIXED:  "Commerce & Trade / Consumer Protection" → "Consumer & Privacy Rights"
UPDATE bills
SET category = 'Commerce & Trade / Consumer Protection'
WHERE session_number = 153
  AND bill_number = 'HB 89';

-- 2. SB 75 w/ SA 1, SA 2  |  Marijuana Dispensary Zoning & Conversion
--    WRONG:  "Alcoholic Liquors" → "Bars & Alcohol"
--    WHY:    Bill limits county restrictions on marijuana establishments and
--            medical marijuana compassion center conversions. Cannabis ≠ alcohol.
--    FIXED:  "Commerce & Trade / Consumer Protection" → "Consumer & Privacy Rights"
UPDATE bills
SET category = 'Commerce & Trade / Consumer Protection'
WHERE session_number = 153
  AND bill_number = 'SB 75';

-- 3. HB 373 w/ HA 1  |  THC-Infused Beverage Regulation & $0.50/container Tax
--    WRONG:  "Alcoholic Liquors" → "Bars & Alcohol"
--    WHY:    Bill regulates cannabis-infused beverages, not alcohol. Regulated
--            through the liquor licensing framework but is clearly a cannabis bill.
--    FIXED:  "Commerce & Trade / Consumer Protection" → "Consumer & Privacy Rights"
UPDATE bills
SET category = 'Commerce & Trade / Consumer Protection'
WHERE session_number = 153
  AND bill_number = 'HB 373';

-- 4. HB 458 w/ HA 1  |  Backflow Preventer Exemption for Low-Hazard Buildings
--    WRONG:  "Health & Safety" → "Your Health Care"
--    WHY:    Bill exempts single-family homes from mandatory backflow preventer
--            installation. This is a plumbing/building code issue, not medical care.
--    FIXED:  "Property" → "Property & Real Estate"
UPDATE bills
SET category = 'Property'
WHERE session_number = 153
  AND bill_number = 'HB 458';

-- 5. SB 325 w/ SA 1  |  State Fire Prevention Commission Background Checks
--    WRONG:  "Health & Safety" → "Your Health Care"
--    WHY:    Bill gives the Fire Prevention Commission authority to run background
--            checks on applicants/members. Fire safety ≠ medical care.
--    FIXED:  "State Government" → "State Government"
UPDATE bills
SET category = 'State Government'
WHERE session_number = 153
  AND bill_number = 'SB 325';

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify: Run this SELECT after the updates to confirm.
SELECT bill_number, full_code, category
FROM bills
WHERE session_number = 153
  AND bill_number IN ('HB 89','SB 75','HB 373','HB 458','SB 325')
ORDER BY bill_number;
