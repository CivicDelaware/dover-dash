/**
 * Netlify Function: get-sponsors
 * ────────────────────────────────
 * Returns active sponsors for the current session from Supabase.
 * Called on tracker.html load. Cached 5 minutes — sponsors rarely change.
 * Degrades gracefully: if no sponsors, tracker still works fine.
 *
 * Env vars required:
 *   SUPABASE_URL          — https://xxxxxxxxxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key
 *   CURRENT_SESSION       — e.g. "153"
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  const SUPABASE_URL         = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const CURRENT_SESSION      = parseInt(process.env.CURRENT_SESSION || "153", 10);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ sponsors: [] }) };
  }

  try {
    // Query: active sponsors for current session (or session-agnostic sponsors)
    const params = new URLSearchParams({
      select: "sponsor_name,sponsor_url,profile_key",
      active: "eq.true",
      or:     `(session_number.eq.${CURRENT_SESSION},session_number.is.null)`,
    });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/sponsors?${params}`, {
      headers: {
        apikey:        SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!res.ok) {
      console.error("Supabase get-sponsors error:", res.status, await res.text());
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ sponsors: [] }) };
    }

    const rows = await res.json();

    const sponsors = rows
      .filter((r) => r.sponsor_name)
      .map((r) => ({
        profile: r.profile_key || "all",
        name:    r.sponsor_name,
        url:     r.sponsor_url || "",
      }));

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ sponsors }) };

  } catch (err) {
    console.error("get-sponsors error:", err);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ sponsors: [] }) };
  }
};
