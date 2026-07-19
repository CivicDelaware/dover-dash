-- Dover Dash — Profiles table
-- Run once in Supabase SQL Editor.
-- After running, edit labels, emojis, or stat lines anytime from the Table Editor.

CREATE TABLE IF NOT EXISTS profiles (
  key        TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  stat       TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 99
);

INSERT INTO profiles (key, label, emoji, stat, sort_order) VALUES
  ('homeowner', 'Homeowner',         '🏠', 'About 71% of Delaware households own their home · U.S. Census Bureau', 1),
  ('renter',    'Renter',            '🔑', 'About 29% of Delaware households rent · U.S. Census Bureau', 2),
  ('senior',    'Retiree',           '🌅', 'About 1 in 5 Delawareans is age 65 or older · U.S. Census Bureau', 3),
  ('smallbiz',  'Business Owner',    '💼', '99% of Delaware businesses have under 500 employees · U.S. SBA', 4),
  ('pubsec',    'Government',        '🏛️', 'State & local govt is one of Delaware''s largest employers · BLS', 5),
  ('workpro',   'Professional',      '👔', 'Delaware''s private sector spans finance, pharma & professional services', 6),
  ('lowwage',   'Hourly Worker',     '⏱️', 'Retail, hospitality & care employ tens of thousands across the state', 7),
  ('veteran',   'Veteran or Military','🎖️', 'Delaware is home to Dover Air Force Base, one of the largest in the country', 8),
  ('landlord',  'Landlord',          '🏢', 'About 29% of Delaware households are renters · U.S. Census Bureau', 9)
ON CONFLICT (key) DO UPDATE SET
  label      = EXCLUDED.label,
  emoji      = EXCLUDED.emoji,
  stat       = EXCLUDED.stat,
  sort_order = EXCLUDED.sort_order;

-- Verify
SELECT key, label, emoji, sort_order FROM profiles ORDER BY sort_order;
