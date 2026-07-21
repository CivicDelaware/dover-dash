-- ════════════════════════════════════════════════════════════════════
-- Dover Dash — reorder-profiles.sql
-- Updates sort_order so patchProfileGrid() renders profiles in the
-- new logical grouping: housing → life stage → work → public sector.
-- July 2026
-- ════════════════════════════════════════════════════════════════════

UPDATE profiles SET sort_order = 1 WHERE key = 'homeowner';
UPDATE profiles SET sort_order = 2 WHERE key = 'renter';
UPDATE profiles SET sort_order = 3 WHERE key = 'landlord';
UPDATE profiles SET sort_order = 4 WHERE key = 'senior';
UPDATE profiles SET sort_order = 5 WHERE key = 'veteran';
UPDATE profiles SET sort_order = 6 WHERE key = 'lowwage';
UPDATE profiles SET sort_order = 7 WHERE key = 'workpro';
UPDATE profiles SET sort_order = 8 WHERE key = 'smallbiz';
UPDATE profiles SET sort_order = 9 WHERE key = 'pubsec';

-- VERIFY
SELECT key, label, sort_order FROM profiles ORDER BY sort_order;
