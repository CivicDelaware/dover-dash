-- ════════════════════════════════════════════════════════════════════
-- Dover Dash — update-profile-emojis.sql
-- Refreshes emoji values in Supabase to match the new icon set.
-- Run AFTER reorder-profiles.sql if you haven't already.
-- July 2026
-- ════════════════════════════════════════════════════════════════════

UPDATE profiles SET emoji = '🏠'  WHERE key = 'homeowner';
UPDATE profiles SET emoji = '🔑'  WHERE key = 'renter';
UPDATE profiles SET emoji = '🏘️'  WHERE key = 'landlord';
UPDATE profiles SET emoji = '🪑'  WHERE key = 'senior';
UPDATE profiles SET emoji = '🪖'  WHERE key = 'veteran';
UPDATE profiles SET emoji = '🛠️'  WHERE key = 'lowwage';
UPDATE profiles SET emoji = '💼'  WHERE key = 'workpro';
UPDATE profiles SET emoji = '🏪'  WHERE key = 'smallbiz';
UPDATE profiles SET emoji = '🏛️'  WHERE key = 'pubsec';

-- VERIFY
SELECT key, emoji, label, sort_order FROM profiles ORDER BY sort_order;
