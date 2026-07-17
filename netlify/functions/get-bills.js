/**
 * Netlify Function: get-bills
 * ────────────────────────────
 * Returns bills + classifications from Supabase.
 * Used for future dynamic updates without redeploying tracker.html.
 * The tracker currently uses embedded data for speed — this powers future features.
 *
 * Env vars required:
 *   SUPABASE_URL          — https://xxxxxxxxxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key
 *   CURRENT_SESSION       — e.g. "153"
 *
 * Query params:
 *   ?profile=homeowner    — filter by profile key (optional)
 *   ?session=153          — override current session (optional)
 *   ?direction=Watch+Out  — filter by direction (optional)
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=60",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  const SUPABASE_URL         = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const CURRENT_SESSION      = parseInt(process.env.CURRENT_SESSION || "153", 10);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({
      error: "Not configured",
      debug: { has_url: !!SUPABASE_URL, has_key: !!SUPABASE_SERVICE_KEY }
    }) };
  }

  const q       = event.queryStringParameters || {};
  const session = parseInt(q.session || CURRENT_SESSION, 10);
  const profile = q.profile   || null;
  const direction = q.direction || null;

  try {
    // Use the bills_with_profiles view for a single joined query
    const params = new URLSearchParams({
      select:         "session_number,bill_number,full_code,bill_text,origin_chamber,category,intro_date,amendments,legislation_id,status,stage,synopsis,plain_english,legislation_url,profile_key,direction,rationale",
      session_number: `eq.${session}`,
    });

    if (profile)   params.set("profile_key", `eq.${profile}`);
    if (direction) params.set("direction", `eq.${direction}`);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/bills_with_profiles?${params}`, {
      headers: {
        apikey:        SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase get-bills error:", err);
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Upstream error" }) };
    }

    const rows = await res.json();

    // Group by bill_number so each bill has all its profile classifications
    const billMap = {};
    rows.forEach((r) => {
      if (!billMap[r.bill_number]) {
        billMap[r.bill_number] = {
          session:        r.session_number,
          bill_number:    r.bill_number,
          full_code:      r.full_code || r.bill_number,
          bill_text:      r.bill_text || "",
          origin_chamber: r.origin_chamber || "",
          category:       r.category || "",
          intro_date:     r.intro_date || "",
          amendments:     r.amendments || 0,
          legislation_id: r.legislation_id || "",
          status:         r.status || "",
          stage:          r.stage || "",
          synopsis:       r.synopsis || "",
          plain_english:  r.plain_english || "",
          url:            r.legislation_url || "",
          profiles:       {},
        };
      }
      if (r.profile_key) {
        billMap[r.bill_number].profiles[r.profile_key] = {
          direction: r.direction,
          rationale: r.rationale,
        };
      }
    });

    const bills = Object.values(billMap);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ bills, count: bills.length, session }),
    };

  } catch (err) {
    console.error("get-bills error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
