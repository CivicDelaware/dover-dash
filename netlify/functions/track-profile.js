/**
 * Netlify Function: track-profile
 * ────────────────────────────────
 * Atomically increments the click_count on the profiles table via Supabase RPC.
 * Powers real "Most Tracked" badge data. Fire-and-forget — never blocks UI.
 *
 * Env vars required:
 *   SUPABASE_URL          — https://xxxxxxxxxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key
 *
 * Supabase RPC function `increment_click_count` must exist (defined in schema.sql).
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const OK = { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return OK;

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return OK; }

  const { profile } = body;
  if (!profile) return OK;

  const SUPABASE_URL         = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return OK;

  try {
    // Call the Supabase RPC function for atomic increment (no race conditions)
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_click_count`, {
      method: "POST",
      headers: {
        apikey:         SUPABASE_SERVICE_KEY,
        Authorization:  `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile_key_param: profile }),
    });

    return OK;

  } catch (err) {
    console.error("track-profile error:", err);
    return OK; // Always OK to client
  }
};
