# Dover Dash — Platform Setup Guide
**Civic Delaware | Built to Scale**

---

## Overview

```
Supabase (PostgreSQL)   ← permanent database, all sessions, all data
      ↕ REST API
Netlify Functions       ← serverless API layer (subscribe, sponsors, tracking)
      ↕
tracker.html            ← frontend, bills embedded for speed, API for live data
      ↕ CI/CD
GitHub → Netlify        ← auto-deploy on every commit
```

---

## Step 1 — Create Supabase Project

1. Go to **supabase.com** → New Project
2. Name it: `dover-dash`
3. Choose a strong database password (save it somewhere safe)
4. Region: **US East (N. Virginia)** — closest to Delaware users
5. Wait ~2 minutes for it to spin up

---

## Step 2 — Run the Schema

1. In Supabase dashboard → **SQL Editor** → **New Query**
2. Open the file: `supabase/schema.sql` from this repo
3. Paste the entire contents → click **Run**
4. You should see: "Success. No rows returned"

This creates all 6 tables, indexes, RLS policies, the views, and the RPC function.

---

## Step 3 — Get Your Supabase Credentials

You need two things:

**Project URL:**
- Supabase dashboard → Settings → API
- Copy **Project URL** → looks like `https://abcdefghijkl.supabase.co`

**Service Role Key** (server-side only — never put this in the browser):
- Same page → under **Project API Keys**
- Copy **service_role** key (the long one labeled "secret")

---

## Step 4 — Seed the Database (Import 217 Bills from Airtable)

Run this once to pull all 217 passed bills from Airtable → Supabase.
The script paginates automatically (Airtable returns 100 per page) and
cross-references bill_profiles.json for the 53 classified bills.

You need your **Airtable Personal Access Token** — get it at:
airtable.com → Account → Developer Hub → Personal Access Tokens → Create New

Grant scope: `data.records:read` on the `app0BjytshiU6sQ3g` base.

```bash
cd ~/Desktop/Dover-dash/Updated\ at\ Midnight\ Github

AIRTABLE_API_KEY=pat_your_token_here \
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_KEY=your_service_role_key \
node supabase/seed.js
```

Watch the output — it confirms each bill as it's inserted.
Expected: ~217 bills, ~130 profile classifications (for the 53 classified bills).

To re-run safely: the script uses `ON CONFLICT DO UPDATE` (upsert) — no duplicates.

---

## Step 5 — Add Environment Variables to Netlify

Go to **Netlify dashboard** → your site → **Site configuration** → **Environment variables**

Add every variable below. One wrong character breaks everything — copy-paste, don't type.

| Variable | Value | Where to get it |
|---|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (long key) | Supabase → Settings → API → service_role |
| `AIRTABLE_API_KEY` | `pat_...` | airtable.com → Developer Hub → PAT (seed script only) |
| `CURRENT_SESSION` | `153` | Update to `154` next GA session |
| `MAILCHIMP_API_KEY` | `xxxx-usXX` | Mailchimp → Account → API Keys |
| `MAILCHIMP_LIST_ID` | `xxxxxxxx` | Mailchimp → Audience → Settings |
| `MAILCHIMP_SERVER` | `us14` | Prefix in your Mailchimp API URL |
| `GITHUB_TOKEN` | `ghp_xxxx` | GitHub → Settings → Developer settings → PAT |
| `GITHUB_OWNER` | `CivicDelaware` | Your GitHub org |
| `GITHUB_REPO_NAME` | repo name | Your repo name |
| `APPROVED_SECRET` | (random 32-char string) | Generate at random.org |

---

## Step 6 — Push to Preview Branch

```bash
cd ~/Desktop/Dover-dash/Updated\ at\ Midnight\ Github
git checkout -b tracker-preview
git add .
git commit -m "Platform: Supabase integration, Netlify functions, sponsor layer"
git push origin tracker-preview
```

Netlify auto-builds the preview URL in ~90 seconds.
Check Netlify dashboard → Deploys → find the preview URL.

---

## Step 7 — Enable Branch Deploys in Netlify

Netlify → Site configuration → Build & deploy → Branch deploys
→ Set to **"All branches"**

---

## How Updates Work Going Forward

```
1. Bill passes in Dover
2. monitor.py (GitHub Actions) detects it → updates pending_report.json
3. You approve in approve.html
4. GitHub Actions commits approved changes
5. Netlify deploys in 90 seconds
6. Subscriber emails go out via Mailchimp
```

---

## How to Add a Sponsor

1. Go to Supabase dashboard → Table Editor → **sponsors**
2. Click **Insert row**
3. Fill in: sponsor_name, sponsor_url, profile_key (e.g. "homeowner"), session_number (153), check **active**
4. Click Save

The sponsor appears on the tracker within 5 minutes (CDN cache). No code change. No deploy.

---

## How to Start a New Session (154th GA)

1. Supabase → sessions table → Insert row: `154, "154th General Assembly", "2026–2028", active`
2. Netlify → Environment variables → Change `CURRENT_SESSION` to `154`
3. Run `node supabase/seed.js` with new bills data when ready
4. Commit + push → auto-deploys

All 153rd data stays in the database forever. Filter by `session_number` to see any year.

---

## Querying Your Data (Investor Dashboard)

From Supabase SQL Editor, run queries like:

```sql
-- How many bills affected each profile in the 153rd?
SELECT profile_key, direction, COUNT(*) as bill_count
FROM classifications
WHERE session_number = 153
GROUP BY profile_key, direction
ORDER BY profile_key, direction;

-- Most tracked profiles (real click data)
SELECT key, label, click_count
FROM profiles
ORDER BY click_count DESC;

-- Subscriber growth by profile
SELECT profile_key, COUNT(*) as subscribers, DATE(subscribed_at) as date
FROM subscribers
WHERE active = true
GROUP BY profile_key, DATE(subscribed_at)
ORDER BY date DESC;
```

This is what you show investors and what you show WDEL.

---

## Rate Card (Sponsorship)

| Slot | Price/Session | Notes |
|---|---|---|
| Single profile | $1,500 | e.g. "Home Owner" sponsored by a bank |
| Two profiles | $2,500 | Bundle deal |
| All 7 profiles | $10,000 | Full session sponsor — one brand |
| Site-wide (no profile) | $3,000 | Brand appears on all screens |

Add sponsor to Airtable = 5 minutes. No engineer needed.
