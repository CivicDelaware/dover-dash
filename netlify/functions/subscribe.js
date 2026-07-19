/**
 * Netlify Function: subscribe
 * ────────────────────────────
 * Captures email signups → upserts into Supabase subscribers table.
 * Upsert-safe: if email already exists, updates profile and keeps them active.
 *
 * Env vars required (Netlify dashboard → Environment variables):
 *   SUPABASE_URL          — https://xxxxxxxxxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key (bypasses RLS, server-side only)
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { email = "", firstName = "", lastName = "", profile = "general" } = body;

  if (!email || !email.includes("@")) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const SUPABASE_URL         = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase env vars");
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
      method: "POST",
      headers: {
        apikey:          SUPABASE_SERVICE_KEY,
        Authorization:   `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type":  "application/json",
        Prefer:          "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        email:         email.toLowerCase().trim(),
        first_name:    firstName.trim(),
        last_name:     lastName.trim(),
        profile_key:   profile,
        subscribed_at: new Date().toISOString(),
        active:        true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase subscribe error:", err);
    }

    // Always return success — never expose DB errors to the user
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error("subscribe handler error:", err);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
  }
};
