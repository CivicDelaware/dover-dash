// get-candidates.js
// Accepts: GET ?address=123+Main+St+Wilmington+DE
// Uses Census Bureau geocoder (free, no API key) — no layers filter so all
// geographies return, including both legislative chambers and county.
// BASENAME field gives a clean un-padded district number.

const fs = require('fs');
const path = require('path');

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const address = (event.queryStringParameters || {}).address;
  if (!address) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'address required' }) };
  }

  // Load candidates data
  let candidates;
  try {
    const dataPath = path.join(__dirname, '../../data/candidates.json');
    candidates = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not load candidate data' }) };
  }

  // Call Census Bureau geocoder — no layers param returns ALL geographies
  // including "2024 State Legislative Districts - Upper/Lower" and "Counties"
  const addrStr = /\bDE\b|\bDelaware\b/i.test(address) ? address : address + ' DE';
  const geoUrl = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?` +
    `address=${encodeURIComponent(addrStr)}&` +
    `benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

  let geoData;
  try {
    const resp = await fetch(geoUrl, { signal: AbortSignal.timeout(10000) });
    geoData = await resp.json();
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Address lookup unavailable. Try again in a moment.' }) };
  }

  const matches = geoData?.result?.addressMatches;
  if (!matches || matches.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Address not found. Try adding your city and zip — e.g. "123 Main St, Wilmington, DE 19801".' })
    };
  }

  const match = matches[0];
  const geos = match.geographies || {};

  // BASENAME is the cleanest field — gives "3" not "003" or "State Senate District 3"
  function districtNum(geo) {
    const base = geo.BASENAME || '';
    const m = base.match(/^(\d+)$/);
    if (m) return m[1];
    // Fallback: extract number from NAME like "State Senate District 3"
    const n = (geo.NAME || '').match(/(\d+)/);
    return n ? n[1] : null;
  }

  let senateDistrict = null;
  let houseDistrict = null;
  let county = null;

  for (const [key, val] of Object.entries(geos)) {
    if (!Array.isArray(val) || !val.length) continue;
    const k = key.toLowerCase();
    if (k.includes('upper') && !senateDistrict) {
      senateDistrict = districtNum(val[0]);
    } else if (k.includes('lower') && !houseDistrict) {
      houseDistrict = districtNum(val[0]);
    } else if (k === 'counties' && !county) {
      county = (val[0].BASENAME || val[0].NAME || '').replace(/\s+County$/i, '').trim();
    }
  }

  const result = {
    matchedAddress: match.matchedAddress,
    senateDistrict,
    houseDistrict,
    county,
    statewide: candidates.statewide || {},
    senate: senateDistrict && candidates.senate[senateDistrict]
      ? { [senateDistrict]: candidates.senate[senateDistrict] }
      : {},
    house: houseDistrict && candidates.house[houseDistrict]
      ? { [houseDistrict]: candidates.house[houseDistrict] }
      : {},
    county_races: (county && candidates.county[county]) ? candidates.county[county] : {}
  };

  return { statusCode: 200, headers, body: JSON.stringify(result) };
};
