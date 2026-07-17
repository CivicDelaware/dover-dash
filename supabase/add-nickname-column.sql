-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add nickname column to bills + update bills_with_profiles view
-- Run this in Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add the column (safe to run multiple times)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 2. Recreate view to include nickname
CREATE OR REPLACE VIEW bills_with_profiles AS
SELECT
  b.id,
  b.session_number,
  b.bill_number,
  b.full_code,
  b.bill_text,
  b.nickname,
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
