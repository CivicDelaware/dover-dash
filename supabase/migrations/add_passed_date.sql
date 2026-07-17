-- Add passed_date column to bills table
-- Run this in the Supabase SQL editor once

ALTER TABLE bills ADD COLUMN IF NOT EXISTS passed_date DATE;

-- Refresh the view so it includes passed_date
DROP VIEW IF EXISTS bills_with_profiles;

CREATE VIEW bills_with_profiles AS
SELECT
  b.session_number,
  b.bill_number,
  b.full_code,
  b.bill_text,
  b.nickname,
  b.origin_chamber,
  b.category,
  b.intro_date,
  b.passed_date,
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
  bp.profile_key,
  bp.direction,
  bp.rationale
FROM bills b
LEFT JOIN bill_profiles bp ON b.bill_number = bp.bill_number AND b.session_number = bp.session_number;
