-- Dover Dash — Config table
-- Run once in Supabase SQL Editor to create the config table
-- After running, update the ticker_message value anytime from the Table Editor

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert the ticker message (edit this value anytime in the Table Editor)
INSERT INTO config (key, value)
VALUES (
  'ticker_message',
  '213 bills became law in 2026 · Dover Dash identified 53 that hit your wallet · Select your profile to see how · 213 bills became law in 2026 · Dover Dash identified 53 that hit your wallet · Select your profile to see how'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
