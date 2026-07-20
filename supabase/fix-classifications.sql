-- ═══════════════════════════════════════════════════════════════════════════
-- Dover Dash — Classification Fix Migration
-- Civic Delaware | Run in Supabase → SQL Editor → New Query → Run
--
-- This script does three things:
--   1. Flips 7 direction labels that were backwards (Watch Out → Helps You)
--   2. Fixes 2 rationale fields that described the wrong effect
--   3. Deletes 12 profile classifications that fail the Moody wall test
--
-- All lookups use bill_number + session_number — no hardcoded row IDs.
-- Session 153 = 153rd General Assembly (2024–2026).
--
-- Run the VERIFY SELECT at the bottom after applying changes to confirm.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── PRE-FLIGHT: confirm the bills exist ───────────────────────────────────
-- Run this first. If a bill returns no row, that bill was not seeded and
-- the UPDATE/DELETE below for it will be a safe no-op.
SELECT bill_number, id
FROM bills
WHERE session_number = 153
  AND bill_number IN (
    'HB 283','HB 363','HB 458',
    'SB 75','SB 141','SB 192','SB 263',
    'SB 293','SB 301','SB 308','SB 316','SB 325','SB 326'
  )
ORDER BY bill_number;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1 — DIRECTION FLIPS
-- ═══════════════════════════════════════════════════════════════════════════

-- 1a. HB 283 — homeowner: Watch Out → Helps You
-- Grandparent-to-grandchild realty transfer tax exemption SAVES money, not costs it.
-- Rationale was generic and stays; direction was simply backwards.
UPDATE classifications
SET direction = 'Helps You'
WHERE profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 283');

-- 1b. HB 458 — homeowner: Watch Out → Helps You
-- Exempts low-hazard homes from mandatory backflow preventer costs.
-- Also correcting the rationale, which was written from the wrong perspective.
UPDATE classifications
SET direction = 'Helps You',
    rationale = 'If your single-family home is classified as low-hazard and uses municipal water, counties and towns can no longer require you to install or pay for backflow preventer inspections, eliminating a mandated plumbing cost that could run hundreds of dollars.'
WHERE profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 458');

-- 1c. SB 75 — smallbiz: Watch Out → Helps You
-- Prevents counties from blocking licensed cannabis retailers. Helps, not harms.
-- Also correcting the rationale.
UPDATE classifications
SET direction = 'Helps You',
    rationale = 'Prevents county governments from blocking or over-restricting licensed cannabis retailers and cultivation facilities, giving compliant cannabis businesses the right to operate with standard hours and secure building permits regardless of local ordinances.'
WHERE profile_key = 'smallbiz'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 75');

-- 1d. SB 141 — smallbiz: Watch Out → Helps You
-- Opens a new revenue channel for auction houses. A business opportunity, not a burden.
-- Also correcting the rationale.
UPDATE classifications
SET direction = 'Helps You',
    rationale = 'Licensed Delaware auction houses can now auction spirits, opening a new revenue channel for businesses that handle high-end or collectible liquor sales, as long as those bottles are kept out of regular retail inventory.'
WHERE profile_key = 'smallbiz'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 141');

-- 1e. SB 293 — smallbiz: Watch Out → Helps You
-- ACA-accredited youth camps get automatic licensing approval. Cuts red tape.
-- The old rationale said it "raises compliance costs" which is backwards.
UPDATE classifications
SET direction = 'Helps You',
    rationale = 'ACA-accredited youth camps are now automatically deemed to meet Delaware licensing requirements, eliminating a separate state licensing process and making camps eligible to accept Purchase of Care child care subsidies, which can expand enrollment.'
WHERE profile_key = 'smallbiz'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 293');

-- 1f. SB 316 — homeowner: Watch Out → Helps You
-- Attorney can now clear any lien cloud, not just mortgages. Helps homeowners at closing.
UPDATE classifications
SET direction = 'Helps You'
WHERE profile_key = 'homeowner'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 316');

-- 1g. SB 326 — homeowner and renter: Watch Out → Helps You
-- Caps Delmarva Power non-mandatory spending and limits interim rate collection.
-- Slows rate increases for residential customers.
UPDATE classifications
SET direction = 'Helps You'
WHERE profile_key IN ('homeowner', 'renter')
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 326');


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2 — PROFILE REMOVALS (fail the Moody wall test)
-- ═══════════════════════════════════════════════════════════════════════════

-- 2a. HB 363 — remove homeowner and renter
-- Bill changes residential speed limits to 20 mph.
-- The original wallet_rationale incorrectly said "parking rules."
-- No named financial mechanism for homeowners or renters.
DELETE FROM classifications
WHERE profile_key IN ('homeowner', 'renter')
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'HB 363');

-- 2b. SB 192 — remove homeowner and renter
-- Bill requires utilities to notify workers and regulators before moving call centers out of state.
-- The original wallet_rationale incorrectly said "rate limits."
-- No named financial mechanism for residential customers.
DELETE FROM classifications
WHERE profile_key IN ('homeowner', 'renter')
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 192');

-- 2c. SB 263 — remove workpro, lowwage, and smallbiz
-- Bill exempts minor league baseball players from state minimum wage because their pay
-- is governed by a Major League Baseball union CBA. Too narrow a carve-out to
-- meaningfully affect broad worker or employer profiles.
DELETE FROM classifications
WHERE profile_key IN ('workpro', 'lowwage', 'smallbiz')
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 263');

-- 2d. SB 301 — remove senior
-- Bill requires discharge planning for pregnant patients sent home before delivery.
-- No financial mechanism specific to seniors. (workpro classification stays.)
DELETE FROM classifications
WHERE profile_key = 'senior'
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 301');

-- 2e. SB 308 — remove homeowner and renter
-- Bill requires annual load forecast report to the legislature.
-- A reporting requirement only — too indirect to affect residential electric bills.
DELETE FROM classifications
WHERE profile_key IN ('homeowner', 'renter')
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 308');

-- 2f. SB 325 — remove homeowner and smallbiz
-- Bill authorizes background checks for fire company volunteers.
-- The bill's own plain English states it does not alter fire inspection fees or homeowner costs.
DELETE FROM classifications
WHERE profile_key IN ('homeowner', 'smallbiz')
  AND bill_id = (SELECT id FROM bills WHERE session_number = 153 AND bill_number = 'SB 325');


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY — check all affected bills after changes
-- ═══════════════════════════════════════════════════════════════════════════
-- Bills with no rows here have had all their profile classifications removed.
-- That is expected for: HB 363, SB 192, SB 263, SB 308, SB 325.

SELECT
  b.bill_number,
  c.profile_key,
  c.direction,
  LEFT(c.rationale, 100) AS rationale_preview
FROM classifications c
JOIN bills b ON b.id = c.bill_id
WHERE b.session_number = 153
  AND b.bill_number IN (
    'HB 283','HB 363','HB 458',
    'SB 75','SB 141','SB 192','SB 263',
    'SB 293','SB 301','SB 308','SB 316','SB 325','SB 326'
  )
ORDER BY b.bill_number, c.profile_key;
