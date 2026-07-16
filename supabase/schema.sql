-- ═══════════════════════════════════════════════════════════════════════════
-- Dover Dash — Supabase PostgreSQL Schema
-- Civic Delaware | Run this in Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════


-- ── SESSIONS ────────────────────────────────────────────────────────────────
-- One row per General Assembly session. Add a new row each new session.
CREATE TABLE IF NOT EXISTS sessions (
  id            SERIAL PRIMARY KEY,
  number        INTEGER NOT NULL UNIQUE,   -- 153, 154, 155...
  label         TEXT    NOT NULL,           -- "153rd General Assembly"
  years         TEXT    NOT NULL,           -- "2024–2026"
  start_date    DATE,
  end_date      DATE,
  status        TEXT    DEFAULT 'active'
                CHECK (status IN ('active', 'ended')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the 153rd session
INSERT INTO sessions (number, label, years, start_date, end_date, status)
VALUES (153, '153rd General Assembly', '2024–2026', '2024-01-01', '2026-06-30', 'ended')
ON CONFLICT (number) DO NOTHING;


-- ── PROFILES ────────────────────────────────────────────────────────────────
-- The 7 demographic personas. Static — update only when persona definitions change.
CREATE TABLE IF NOT EXISTS profiles (
  id          SERIAL PRIMARY KEY,
  key         TEXT    NOT NULL UNIQUE,  -- "homeowner", "renter", etc.
  label       TEXT    NOT NULL,          -- "Home Owner"
  emoji       TEXT    NOT NULL,          -- "🏠"
  description TEXT,                      -- "(own outright or mortgage)"
  sort_order  INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,         -- real "Most Tracked" data
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed all 7 profiles
INSERT INTO profiles (key, label, emoji, description, sort_order) VALUES
  ('homeowner', 'Home Owner',                            '🏠', '(own outright or mortgage)',                          1),
  ('renter',    'Renter',                                '🏢', '(no asset cushion)',                                  2),
  ('senior',    'Retiree / Fixed Income',                '🧓', '(Social Security, pensions, investment income)',      3),
  ('smallbiz',  'Small Business Owner / Self-Employed',  '💼', '(construction, professional services, sole proprietors)', 4),
  ('pubsec',    'Public Sector Employee',                '🏛️', '(state, local, federal)',                            5),
  ('workpro',   'Private Sector Worker, Full-Time',      '🏬', '(finance, professionals — stable higher-wage jobs)', 6),
  ('lowwage',   'Private Sector Worker, Low-Wage / Vulnerable', '🛒', '(hospitality, retail, personal services)',    7)
ON CONFLICT (key) DO NOTHING;


-- ── BILLS ───────────────────────────────────────────────────────────────────
-- Every tracked bill, every session. Grows forever. Filter by session_number.
CREATE TABLE IF NOT EXISTS bills (
  id               SERIAL PRIMARY KEY,
  session_number   INTEGER NOT NULL REFERENCES sessions(number),
  bill_number      TEXT    NOT NULL,   -- "HB 133" (base number, no amendments)
  full_code        TEXT,               -- "HB 133 w/ HA 1" (with amendments, from Airtable)
  bill_text        TEXT,               -- official long title: "AN ACT TO AMEND..."
  origin_chamber   TEXT CHECK (origin_chamber IN ('House', 'Senate')),
  status           TEXT DEFAULT 'Passed',
  stage            TEXT,               -- internal stage key: "passed", "comm", "intro"
  category         TEXT,               -- subject category from Airtable: "Banking", "Commerce & Trade", etc.
  intro_date       DATE,               -- introduction date from Airtable
  amendments       INTEGER DEFAULT 0,  -- amendment count from Airtable
  legislation_id   TEXT,               -- DE GA internal legislation ID
  synopsis         TEXT,               -- official synopsis from legis.delaware.gov
  plain_english    TEXT,               -- our plain-English wallet-impact explanation
  legislation_url  TEXT,
  last_updated     TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_number, full_code)   -- full_code is unique (includes amendments)
);

CREATE INDEX IF NOT EXISTS idx_bills_session ON bills(session_number);
CREATE INDEX IF NOT EXISTS idx_bills_status  ON bills(status);


-- ── CLASSIFICATIONS ──────────────────────────────────────────────────────────
-- Junction table: which bill affects which profile, in what direction.
-- This is the Moody's-lens classification layer — the core intellectual property.
CREATE TABLE IF NOT EXISTS classifications (
  id             SERIAL PRIMARY KEY,
  bill_id        INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  profile_key    TEXT    NOT NULL REFERENCES profiles(key),
  direction      TEXT    CHECK (direction IN ('Watch Out', 'Helps You', 'Neutral')),
  rationale      TEXT,   -- why this direction for this profile
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (bill_id, profile_key)
);

CREATE INDEX IF NOT EXISTS idx_class_profile ON classifications(profile_key);
CREATE INDEX IF NOT EXISTS idx_class_session ON classifications(session_number);
CREATE INDEX IF NOT EXISTS idx_class_direction ON classifications(direction);


-- ── SUBSCRIBERS ─────────────────────────────────────────────────────────────
-- Email list. One row per email. Upsert-safe.
CREATE TABLE IF NOT EXISTS subscribers (
  id             SERIAL PRIMARY KEY,
  email          TEXT    NOT NULL UNIQUE,
  first_name     TEXT    DEFAULT '',
  last_name      TEXT    DEFAULT '',
  profile_key    TEXT,                 -- which profile they signed up from
  subscribed_at  TIMESTAMPTZ DEFAULT NOW(),
  active         BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(active);
CREATE INDEX IF NOT EXISTS idx_subscribers_profile ON subscribers(profile_key);


-- ── SPONSORS ────────────────────────────────────────────────────────────────
-- One row per sponsorship deal. Multiple sessions, multiple profiles.
-- To swap a sponsor: set old row active=false, add new row active=true. Done.
CREATE TABLE IF NOT EXISTS sponsors (
  id             SERIAL PRIMARY KEY,
  sponsor_name   TEXT    NOT NULL,
  sponsor_url    TEXT,
  profile_key    TEXT    REFERENCES profiles(key),  -- NULL = site-wide sponsor
  session_number INTEGER,                            -- NULL = all sessions
  active         BOOLEAN DEFAULT FALSE,
  start_date     DATE,
  end_date       DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_active  ON sponsors(active);
CREATE INDEX IF NOT EXISTS idx_sponsors_profile ON sponsors(profile_key);


-- ── RPC: increment_click_count ───────────────────────────────────────────────
-- Atomic counter increment — no race conditions.
-- Called by track-profile.js Netlify function.
CREATE OR REPLACE FUNCTION increment_click_count(profile_key_param TEXT)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE profiles
  SET click_count = click_count + 1
  WHERE key = profile_key_param;
$$;


-- ── VIEWS ───────────────────────────────────────────────────────────────────
-- Pre-built queries for common reads. Use these in future dashboards.

-- bills_with_profiles: every bill with all its profile classifications joined
CREATE OR REPLACE VIEW bills_with_profiles AS
SELECT
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
  c.profile_key,
  c.direction,
  c.rationale
FROM bills b
JOIN classifications c ON c.bill_id = b.id;

-- profile_stats: Watch Out / Helps You counts per profile per session
CREATE OR REPLACE VIEW profile_stats AS
SELECT
  c.session_number,
  c.profile_key,
  p.label,
  p.emoji,
  p.click_count,
  COUNT(*) FILTER (WHERE c.direction = 'Watch Out')  AS watch_out_count,
  COUNT(*) FILTER (WHERE c.direction = 'Helps You')  AS helps_you_count,
  COUNT(*)                                             AS total_count
FROM classifications c
JOIN profiles p ON p.key = c.profile_key
GROUP BY c.session_number, c.profile_key, p.label, p.emoji, p.click_count;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Public can read bills, classifications, profiles, sessions, sponsors.
-- Only service role (server-side functions) can write.

ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors        ENABLE ROW LEVEL SECURITY;

-- Public read on non-sensitive tables
CREATE POLICY "public read sessions"        ON sessions        FOR SELECT USING (true);
CREATE POLICY "public read profiles"        ON profiles        FOR SELECT USING (true);
CREATE POLICY "public read bills"           ON bills           FOR SELECT USING (true);
CREATE POLICY "public read classifications" ON classifications FOR SELECT USING (true);
CREATE POLICY "public read active sponsors" ON sponsors        FOR SELECT USING (active = true);

-- Subscribers: no public read (PII)
-- All writes handled server-side via service role key (bypasses RLS)
