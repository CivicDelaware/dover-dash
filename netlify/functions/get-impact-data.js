/**
 * Netlify Function: get-impact-data
 * ────────────────────────────────────
 * Powers the Impact Dashboard. Returns bills joined with their risk scores
 * (bill_risk_scores) and, for bills with manual classifications, the
 * reviewed profile rationale (classifications table). Falls back to the
 * heuristic household_impact stored on bill_risk_scores when no manual
 * classification exists for a profile.
 *
 * Env vars required:
 *   SUPABASE_URL          — https://xxxxxxxxxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key
 *   CURRENT_SESSION       — e.g. "153"
 *
 * Query params:
 *   ?session=153        — override current session (optional)
 *   ?alert=high          — filter to a single alert_level (low/medium/high) (optional)
 *   ?profile=homeowner    — filter to bills with a household_impact entry for this profile (optional)
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
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Not configured" }) };
  }

  const q       = event.queryStringParameters || {};
  const session = parseInt(q.session || CURRENT_SESSION, 10);
  const alert   = q.alert   || null;
  const profile = q.profile || null;

  const SB_HEADERS = { apikey: SUPABASE_SERVICE_KEY };

  try {
    // 1. Fetch bills for this session
    const billsParams = new URLSearchParams({
      select:         "id,bill_number,full_code,nickname,category,status,passed_date,amendments,legislation_id,synopsis,plain_english,legislation_url,primary_sponsor",
      session_number: `eq.${session}`,
    });
    const billsRes = await fetch(`${SUPABASE_URL}/rest/v1/bills?${billsParams}`, { headers: SB_HEADERS });
    if (!billsRes.ok) {
      console.error("Bills fetch error:", await billsRes.text());
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Upstream error (bills)" }) };
    }
    const billsData = await billsRes.json();

    // 2. Fetch risk scores for this session
    const riskParams = new URLSearchParams({
      select:         "bill_id,fiscal_risk_score,risk_grade,risk_grade_label,alert_level,keyword_hits,sectors,household_impact,reviewed_profile_count,methodology_version,scored_at",
      session_number: `eq.${session}`,
    });
    const riskRes = await fetch(`${SUPABASE_URL}/rest/v1/bill_risk_scores?${riskParams}`, { headers: SB_HEADERS });
    if (!riskRes.ok) {
      console.error("Risk scores fetch error:", await riskRes.text());
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Upstream error (bill_risk_scores)" }) };
    }
    const riskData = await riskRes.json();
    const riskByBill = {};
    riskData.forEach((r) => { riskByBill[r.bill_id] = r; });

    // 3. Fetch classifications (manual, reviewed) for this session
    const classParams = new URLSearchParams({
      select:         "bill_id,profile_key,direction,rationale",
      session_number: `eq.${session}`,
    });
    const classRes = await fetch(`${SUPABASE_URL}/rest/v1/classifications?${classParams}`, { headers: SB_HEADERS });
    const classData = classRes.ok ? await classRes.json() : [];
    const classByBill = {};
    classData.forEach((c) => {
      if (!classByBill[c.bill_id]) classByBill[c.bill_id] = {};
      classByBill[c.bill_id][c.profile_key] = { direction: c.direction, rationale: c.rationale, confidence: "reviewed" };
    });

    // 4. Merge bills + risk + classifications
    let bills = billsData.map((b) => {
      const risk = riskByBill[b.id] || null;

      // Merge household impact: manual classifications win over heuristic entries
      const heuristicImpact = (risk && risk.household_impact) || [];
      const impactMap = {};
      heuristicImpact.forEach((h) => { impactMap[h.profile_key] = h; });
      const manual = classByBill[b.id] || {};
      Object.keys(manual).forEach((pk) => {
        impactMap[pk] = { profile_key: pk, direction: manual[pk].direction, confidence: "reviewed", note: manual[pk].rationale };
      });

      return {
        id:                    b.id,
        bill_number:           b.bill_number,
        full_code:             b.full_code || b.bill_number,
        nickname:              b.nickname || "",
        category:              b.category || "",
        status:                b.status || "",
        passed_date:           b.passed_date || "",
        amendments:            b.amendments || 0,
        synopsis:              b.synopsis || "",
        plain_english:         b.plain_english || "",
        url:                   b.legislation_url || (b.legislation_id ? `https://legis.delaware.gov/BillDetail?LegislationId=${b.legislation_id}` : ""),
        primary_sponsor:       b.primary_sponsor || "",
        fiscal_risk_score:     risk ? risk.fiscal_risk_score : null,
        risk_grade:            risk ? risk.risk_grade : null,
        risk_grade_label:      risk ? risk.risk_grade_label : null,
        alert_level:           risk ? risk.alert_level : "low",
        keyword_hits:          risk ? risk.keyword_hits : [],
        sectors:               risk ? risk.sectors : [],
        household_impact:      Object.values(impactMap),
        reviewed_profile_count: Object.keys(manual).length,
        methodology_version:  risk ? risk.methodology_version : null,
        scored_at:             risk ? risk.scored_at : null,
      };
    });

    // 5. Filters
    if (alert) bills = bills.filter((b) => b.alert_level === alert);
    if (profile) bills = bills.filter((b) => b.household_impact.some((h) => h.profile_key === profile));

    // 6. Sort by fiscal_risk_score desc (nulls last)
    bills.sort((a, b) => (b.fiscal_risk_score || 0) - (a.fiscal_risk_score || 0));

    // 7. Sector aggregation (sum of y1/y2/y3 magnitude across all bills, by sector)
    const sectorAgg = {};
    bills.forEach((b) => {
      (b.sectors || []).forEach((s) => {
        if (!sectorAgg[s.sector]) sectorAgg[s.sector] = { sector: s.sector, y1: 0, y2: 0, y3: 0, bill_count: 0 };
        sectorAgg[s.sector].y1 += s.y1 || 0;
        sectorAgg[s.sector].y2 += s.y2 || 0;
        sectorAgg[s.sector].y3 += s.y3 || 0;
        sectorAgg[s.sector].bill_count += 1;
      });
    });
    const sectorProjections = Object.values(sectorAgg).sort((a, b) => b.y3 - a.y3);

    // 8. Alert distribution
    const alertCounts = { low: 0, medium: 0, high: 0 };
    billsData.forEach((b) => {
      const r = riskByBill[b.id];
      const lvl = r ? r.alert_level : "low";
      if (alertCounts[lvl] !== undefined) alertCounts[lvl]++;
    });

    // 9. Grade distribution
    const gradeCounts = {};
    riskData.forEach((r) => { gradeCounts[r.risk_grade] = (gradeCounts[r.risk_grade] || 0) + 1; });

    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({
        bills,
        count: bills.length,
        session,
        sector_projections: sectorProjections,
        alert_distribution: alertCounts,
        grade_distribution: gradeCounts,
        total_scored: riskData.length,
      }),
    };
  } catch (err) {
    console.error("get-impact-data error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
