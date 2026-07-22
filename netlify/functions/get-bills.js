/**
 * Netlify Function: get-bills
 * ────────────────────────────
 * Returns bills + classifications from Supabase.
 * Queries bills and classifications tables directly (not the view)
 * to ensure passed_date is always included.
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

function fixLegUrl(url) {
  if (!url) return "";
  const base = "https://legis.delaware.gov";
  if (url.startsWith(base + "http")) return url.slice(base.length);
  return url;
}

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
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Not configured" }) };
  }

  const q         = event.queryStringParameters || {};
  const session   = parseInt(q.session || CURRENT_SESSION, 10);
  const profile   = q.profile   || null;
  const direction = q.direction || null;
  const metaOnly  = q.meta === 'true';

  const SB_HEADERS = {
    apikey: SUPABASE_SERVICE_KEY,
  };

  // ── Meta-only endpoint: returns profiles + ticker, no bills ──────────────
  if (metaOnly) {
    let profiles = [];
    try {
      // Note: do NOT add "stat" to this select — that column does not exist in the profiles table.
      const profRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=key,label,emoji,sort_order&order=sort_order.asc`,
        { headers: SB_HEADERS }
      );
      if (profRes.ok) profiles = await profRes.json();
    } catch (e) { /* skip if table doesn't exist */ }

    // Fetch ticker_message the same targeted way the bills endpoint does — most reliable
    let tickerMessage = '';
    try {
      const tmRes = await fetch(
        `${SUPABASE_URL}/rest/v1/config?key=eq.ticker_message&select=value`,
        { headers: SB_HEADERS }
      );
      if (tmRes.ok) {
        const tmData = await tmRes.json();
        if (tmData.length > 0) tickerMessage = tmData[0].value;
      }
    } catch (e) { /* skip */ }

    // Fetch remaining config keys for UI text
    let config = { ticker_message: tickerMessage };
    try {
      const configRes = await fetch(
        `${SUPABASE_URL}/rest/v1/config?select=key,value`,
        { headers: SB_HEADERS }
      );
      if (configRes.ok) {
        const configData = await configRes.json();
        configData.forEach(row => { config[row.key] = row.value; });
      }
    } catch (e) { /* skip — ticker_message already set above */ }

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ profiles, config, tickerMessage }),
    };
  }

  try {
    // 1. Fetch all bills for this session directly from the bills table
    const billsParams = new URLSearchParams({
      select:         "id,session_number,bill_number,full_code,bill_text,nickname,origin_chamber,category,intro_date,passed_date,amendments,legislation_id,status,stage,synopsis,plain_english,legislation_url,primary_sponsor,sponsor_person_id,legislator_url",
      session_number: `eq.${session}`,
    });

    const billsRes = await fetch(`${SUPABASE_URL}/rest/v1/bills?${billsParams}`, { headers: SB_HEADERS });
    if (!billsRes.ok) {
      console.error("Bills fetch error:", await billsRes.text());
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Upstream error" }) };
    }
    const billsData = await billsRes.json();

    // 2. Fetch ticker message from config table
    let tickerMessage = '';
    try {
      const configRes = await fetch(`${SUPABASE_URL}/rest/v1/config?key=eq.ticker_message&select=value`, { headers: SB_HEADERS });
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.length > 0) tickerMessage = configData[0].value;
      }
    } catch (e) { /* silently skip if config table doesn't exist yet */ }

    // 3. Fetch all classifications for this session
    const classParams = new URLSearchParams({
      select:         "bill_id,profile_key,direction,rationale",
      session_number: `eq.${session}`,
    });

    const classRes = await fetch(`${SUPABASE_URL}/rest/v1/classifications?${classParams}`, { headers: SB_HEADERS });
    if (!classRes.ok) {
      console.error("Classifications fetch error:", await classRes.text());
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Upstream error" }) };
    }
    const classData = await classRes.json();

    // 3. Build classification map: bill_id → { profile_key: { direction, rationale } }
    const classMap = {};
    classData.forEach((c) => {
      if (!classMap[c.bill_id]) classMap[c.bill_id] = {};
      classMap[c.bill_id][c.profile_key] = { direction: c.direction, rationale: c.rationale };
    });

    // 4. Build bill objects with profile data
    let bills = billsData.map((b) => ({
      session:        b.session_number,
      bill_number:    b.bill_number,
      full_code:      b.full_code || b.bill_number,
      bill_text:      b.bill_text || "",
      nickname:       b.nickname  || "",
      origin_chamber: b.origin_chamber || "",
      category:       b.category  || "",
      intro_date:     b.intro_date || "",
      passed_date:    b.passed_date || "",
      amendments:     b.amendments || 0,
      legislation_id: b.legislation_id || "",
      status:         b.status || "",
      stage:          b.stage  || "",
      synopsis:       b.synopsis || "",
      plain_english:  b.plain_english || "",
      url:            b.legislation_url || (b.legislation_id ? `https://legis.delaware.gov/BillDetail?LegislationId=${b.legislation_id}` : ""),
      primary_sponsor: b.primary_sponsor || "",
      legislator_url:  fixLegUrl(b.legislator_url),
      profiles:        classMap[b.id] || {},
    }));

    // 5. Filter by profile and/or direction
    if (profile) {
      bills = bills.filter((b) => b.profiles[profile]);
    }
    if (direction && profile) {
      bills = bills.filter((b) => b.profiles[profile] && b.profiles[profile].direction === direction);
    }

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ bills, count: bills.length, session, tickerMessage }),
    };

  } catch (err) {
    console.error("get-bills error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
