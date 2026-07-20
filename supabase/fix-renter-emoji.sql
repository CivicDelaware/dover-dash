-- ════════════════════════════════════════════════════════════════════
-- Dover Dash — fix-renter-emoji.sql
-- Renter and landlord share the 🏢 emoji in Supabase — likely a seed
-- error. Renter should be 🔑 to distinguish it from landlord (🏢).
-- July 2026
-- ════════════════════════════════════════════════════════════════════

-- VERIFY first (should show renter with 🏢)
SELECT key, emoji FROM profiles WHERE key = 'renter';

-- FIX
UPDATE profiles SET emoji = '🔑' WHERE key = 'renter';

-- VERIFY after (should show 🔑)
SELECT key, emoji FROM profiles WHERE key IN ('renter', 'landlord') ORDER BY key;
