/**
 * Netlify Function: get-my-rep
 * ─────────────────────────────
 * GET ?address=123 Main St Wilmington DE&profile=homeowner&session=153
 *
 * 1. Geocodes address via Census Bureau (free, no key)
 * 2. Looks up House + Senate legislators for those districts
 * 3. Fetches their votes on bills that affect the given profile
 * 4. Returns a scorecard for each legislator
 */

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  const SUPABASE_URL         = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const CURRENT_SESSION      = parseInt(process.env.CURRENT_SESSION || '153', 10);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Not configured' }) };
  }

  const SB = {
    apikey:        SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  };

  const q       = event.queryStringParameters || {};
  const address = (q.address || '').trim();
  const profile = (q.profile || '').trim();
  const session = parseInt(q.session || CURRENT_SESSION, 10);

  if (!address) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'address required' }) };

  // ── 1. Geocode address ────────────────────────────────────────────────────
  const addrStr = /\bDE\b|\bDelaware\b/i.test(address) ? address : address + ' DE';
  const geoUrl  = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?` +
    `address=${encodeURIComponent(addrStr)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

  let geoData;
  try {
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(10000) });
    geoData = await geoRes.json();
  } catch (e) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Address lookup unavailable. Try again.' }) };
  }

  const matches = geoData?.result?.addressMatches;
  if (!matches || matches.length === 0) {
    return { statusCode: 404, headers: CORS, body: JSON.stringify({
      error: 'Address not found. Try including your city and zip — e.g. "123 Main St, Wilmington, DE 19801".'
    })};
  }

  const geos = matches[0].geographies || {};
  let houseDistrict = null, senateDistrict = null;

  function districtNum(geo) {
    const base = geo.BASENAME || '';
    if (/^\d+$/.test(base)) return parseInt(base, 10);
    const n = (geo.NAME || '').match(/(\d+)/);
    return n ? parseInt(n[1], 10) : null;
  }

  for (const [key, val] of Object.entries(geos)) {
    if (!Array.isArray(val) || !val.length) continue;
    const k = key.toLowerCase();
    if (k.includes('upper') && !senateDistrict) senateDistrict = districtNum(val[0]);
    else if (k.includes('lower') && !houseDistrict) houseDistrict = districtNum(val[0]);
  }

  if (!houseDistrict || !senateDistrict) {
    return { statusCode: 404, headers: CORS, body: JSON.stringify({
      error: 'Could not determine legislative district. Make sure the address is in Delaware.'
    })};
  }

  // ── 2. Look up legislators from Supabase ──────────────────────────────────
  // Fetch all legislators for this session and filter in JS (avoids complex PostgREST OR syntax)
  let legislators = [];
  try {
    const legRes = await fetch(
      `${SUPABASE_URL}/rest/v1/legislators?select=assembly_member_id,name,party,chamber,district,url&session_number=eq.${session}`,
      { headers: SB }
    );
    if (legRes.ok) {
      const all = await legRes.json();
      legislators = all.filter(l =>
        (l.chamber === 'House'  && l.district === houseDistrict) ||
        (l.chamber === 'Senate' && l.district === senateDistrict)
      );
    }
  } catch (e) {}

  const rep     = legislators.find(l => l.chamber === 'House');
  const senator = legislators.find(l => l.chamber === 'Senate');

  if (!rep && !senator) {
    return { statusCode: 404, headers: CORS, body: JSON.stringify({
      error: `No legislators found for House district ${houseDistrict}, Senate district ${senateDistrict}.`
    })};
  }

  // ── 3 & 4. Bill/vote lookup — only when a profile is requested ───────────
  let repOut     = rep     || null;
  let senatorOut = senator || null;
  let totalProfileBills = 0;

  if (profile) {
    // Step 3: Get bills for this profile
    let profileBillIds = [];
    try {
      const clParams = new URLSearchParams({
        select: 'bill_id',
        profile_key: `eq.${profile}`,
        session_number: `eq.${session}`,
      });
      const clRes = await fetch(`${SUPABASE_URL}/rest/v1/classifications?${clParams}`, { headers: SB });
      if (clRes.ok) {
        const clData = await clRes.json();
        profileBillIds = clData.map(c => c.bill_id);
      }
    } catch (e) {}

    let profileLegIds = [];
    let billMeta = {};
    if (profileBillIds.length) {
      try {
        const bParams = new URLSearchParams({
          select: 'id,legislation_id,full_code,nickname',
          id: `in.(${profileBillIds.join(',')})`,
        });
        const bRes = await fetch(`${SUPABASE_URL}/rest/v1/bills?${bParams}`, { headers: SB });
        if (bRes.ok) {
          const bData = await bRes.json();
          profileLegIds = bData.map(b => b.legislation_id).filter(Boolean);
          bData.forEach(b => { if (b.legislation_id) billMeta[b.legislation_id] = { code: b.full_code, nickname: b.nickname }; });
        }
      } catch (e) {}
    }

    totalProfileBills = profileLegIds.length;

    // Step 4: Get votes
    async function getVotes(assemblyMemberId) {
      if (!assemblyMemberId || !profileLegIds.length) return [];
      try {
        const vParams = new URLSearchParams({
          select: 'legislation_id,vote,chamber',
          assembly_member_id: `eq.${assemblyMemberId}`,
          legislation_id: `in.(${profileLegIds.join(',')})`,
        });
        const vRes = await fetch(`${SUPABASE_URL}/rest/v1/votes?${vParams}`, { headers: SB });
        if (vRes.ok) return await vRes.json();
      } catch (e) {}
      return [];
    }

    function buildScorecard(legInfo, voteRows) {
      if (!legInfo) return null;
      let yes = 0, no = 0, absent = 0, notVoting = 0;
      const votedBills = [];
      voteRows.forEach(v => {
        const meta = billMeta[v.legislation_id] || {};
        if (v.vote === 'Y')  { yes++;       votedBills.push({ ...meta, legislation_id: v.legislation_id, vote: 'Y' }); }
        if (v.vote === 'N')  { no++;        votedBills.push({ ...meta, legislation_id: v.legislation_id, vote: 'N' }); }
        if (v.vote === 'A')  { absent++;    votedBills.push({ ...meta, legislation_id: v.legislation_id, vote: 'A' }); }
        if (v.vote === 'NV') { notVoting++; votedBills.push({ ...meta, legislation_id: v.legislation_id, vote: 'NV' }); }
      });
      return {
        ...legInfo,
        total_bills:  totalProfileBills,
        yes_votes:    yes,
        no_votes:     no,
        absent_votes: absent + notVoting,
        voted_bills:  votedBills,
      };
    }

    const [repVotes, senVotes] = await Promise.all([
      getVotes(rep?.assembly_member_id),
      getVotes(senator?.assembly_member_id),
    ]);

    repOut     = buildScorecard(rep,     repVotes);
    senatorOut = buildScorecard(senator, senVotes);
  }

  return {
    statusCode: 200,
    headers:    CORS,
    body:       JSON.stringify({
      house_district:  houseDistrict,
      senate_district: senateDistrict,
      rep:     repOut,
      senator: senatorOut,
      total_profile_bills: totalProfileBills,
    }),
  };
};
