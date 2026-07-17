-- ═══════════════════════════════════════════════════════════════════════════
-- Dover Dash — Sponsor Columns Migration
-- Run in Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Add sponsor columns to bills table
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS primary_sponsor    TEXT,
  ADD COLUMN IF NOT EXISTS sponsor_person_id  INTEGER,
  ADD COLUMN IF NOT EXISTS legislator_url     TEXT;

-- Step 2: Rebuild bills_with_profiles view to expose sponsor columns
CREATE OR REPLACE VIEW bills_with_profiles AS
SELECT
  b.id,
  b.session_number,
  b.bill_number,
  b.full_code,
  b.bill_text,
  b.origin_chamber,
  b.category,
  b.intro_date,
  b.amendments,
  b.legislation_id,
  b.status,
  b.stage,
  b.synopsis,
  b.plain_english,
  b.legislation_url,
  b.primary_sponsor,
  b.sponsor_person_id,
  b.legislator_url,
  c.profile_key,
  c.direction,
  c.rationale
FROM bills b
JOIN classifications c ON c.bill_id = b.id;
