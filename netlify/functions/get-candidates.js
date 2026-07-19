// get-candidates.js
// Accepts: GET ?address=123+Main+St+Wilmington+DE
// Candidate data is embedded directly (esbuild bundler doesn't include external files).
// Uses Census Bureau geocoder (free, no API key) — no layers filter so all
// geographies return, including both legislative chambers and county.

const CANDIDATES = {"statewide":{"U.S. Senator":[{"name":"Jeff Appelhans","party":"Democratic"},{"name":"Chris Coons","party":"Democratic"},{"name":"E. No-Trump Hansen","party":"Democratic","website":"https://www.HansenDE.com"},{"name":"Mary Louve","party":"Democratic"},{"name":"Michael \"Dr. Mike\" Katz","party":"Republican","website":"https://www.drmikekatz.com"},{"name":"John Shulli","party":"Republican","website":"https://shulli.org"}],"Representative in Congress":[{"name":"Joseph \"Dr. Joe\" Arminio","party":"Republican"},{"name":"Earl L. Cooper","party":"Republican"},{"name":"Lee Murphy","party":"Republican","website":"https://www.leemurphy2026.com"},{"name":"John J. Whalen","party":"Republican"}],"Attorney General":[{"name":"Dwayne J. Bensing","party":"Democratic"},{"name":"Kathy Jennings","party":"Democratic"},{"name":"Patty Rickman","party":"Democratic"}],"State Treasurer":[{"name":"Ted Lauzen","party":"Democratic","website":"https://tedlauzen.com"},{"name":"Mike Miller","party":"Democratic"},{"name":"Michael Alexander Smith","party":"Democratic","website":"https://michaelsmithde.com"}]},"senate":{"1":[{"name":"Adriana Leela Bohm","party":"Democratic","website":"https://adrianafordelaware.com"},{"name":"Dan Cruce","party":"Democratic","website":"https://www.dancruce.com"}],"5":[{"name":"Shay Frisby","party":"Democratic","website":"https://TogetherwithShay.com"},{"name":"Ray Seigfried","party":"Democratic","website":"https://www.rayfordelaware.com"}],"7":[{"name":"Jose A. Lopez","party":"Democratic","website":"https://www.josealopez.com"},{"name":"Spiros Mantzavinos","party":"Democratic","website":"https://www.spiros4statesenate.com"}],"9":[{"name":"Dawn Briggs","party":"Democratic"},{"name":"Jack Walsh","party":"Democratic","website":"https://senatorjackwalsh.com"}],"12":[{"name":"Nicole Poore","party":"Democratic","website":"https://nicolepoore.com"},{"name":"Keonna Watson","party":"Democratic","website":"https://www.keonnawatson.com"}],"14":[{"name":"Chris Beardsley","party":"Democratic","website":"https://www.beardsleyfordelaware.com"},{"name":"Kyra L Hoffner","party":"Democratic","website":"https://KyraHoffner4Senate.com"}]},"house":{"1":[{"name":"Nnamdi O. Chukwuocha","party":"Democratic"},{"name":"Shane Nicole Darby","party":"Democratic","website":"https://www.darby4de.com/"}],"2":[{"name":"Stephanie T. Bolden","party":"Democratic"},{"name":"Michelle H. Booker","party":"Democratic","website":"https://www.michellebooker.com"}],"3":[{"name":"Branden Fletcher-Dominguez","party":"Democratic"},{"name":"LaDonna Graham","party":"Democratic"},{"name":"Yolanda M. McCoy","party":"Democratic","website":"https://www.yolandamccoy.com"},{"name":"Josue O. Ortega","party":"Democratic"}],"6":[{"name":"Rachel \"Rae\" Krantz","party":"Democratic","website":"https://www.raefordelaware.com"},{"name":"Ed Mulvihill","party":"Democratic","website":"https://www.edfordelaware.com"},{"name":"Ralf Santana","party":"Democratic"}],"8":[{"name":"Lissa Brutus","party":"Democratic"},{"name":"Sherae'a \"Rae\" Moore","party":"Democratic","website":"https://www.mooreforde.com"},{"name":"Matt Powell","party":"Democratic"},{"name":"Watara T.F. Heath","party":"Republican"},{"name":"Gary Taylor","party":"Republican","website":"https://www.Taylor4de.com"}],"9":[{"name":"Ayanna Khan-Flowers","party":"Democratic","website":"https://ElectAyanna.com"},{"name":"Gemma E. Lowery","party":"Democratic","website":"https://www.GemmaLowery4DE.com"},{"name":"Michelle Wall","party":"Democratic","website":"https://www.allforwall.org"}],"12":[{"name":"Robert F. Bahnsen Jr.","party":"Democratic","website":"https://www.RobBahnsen.org"},{"name":"Krista Griffith","party":"Democratic","website":"https://www.kristagriffith.com"}],"16":[{"name":"Franklin D. Cooke, Jr.","party":"Democratic","website":"https://www.frankcooke.com"},{"name":"Pamela Salaam","party":"Democratic"}],"19":[{"name":"Will Imbrie-Moore","party":"Democratic","website":"https://www.willfordelaware.com/"},{"name":"Kim Williams","party":"Democratic","website":"https://kimwilliamsforstaterep.weebly.com"}],"20":[{"name":"Alonna Berry","party":"Democratic","website":"http://alonnaberry.com"},{"name":"Ruby Keeler Schaeffer","party":"Democratic","website":"https://rubyschaefferfor20.com"}],"23":[{"name":"Luann D'Agostino","party":"Democratic","website":"https://www.luannfordelaware.com"},{"name":"Joe Jasper","party":"Democratic","website":"https://www.joejasperfor23.com"},{"name":"Dave Redlawsk","party":"Democratic","website":"https://www.davefor23.com"},{"name":"Dan Seador","party":"Democratic","website":"https://www.danfordelaware.com"}],"27":[{"name":"Eric Morrison","party":"Democratic"},{"name":"Christopher W. Muntz","party":"Democratic","website":"https://www.muntzforncc.com"}],"28":[{"name":"William Carson Jr","party":"Democratic"}],"32":[{"name":"Kerri Evelyn Harris","party":"Democratic","website":"https://www.kerrifordelaware.com/"},{"name":"LaChelle Paul","party":"Democratic","website":"https://www.lachellepaul.com"}],"33":[{"name":"Matt Bucher","party":"Republican","website":"https://votebucher.com"},{"name":"Morgan Hudson","party":"Republican"}],"36":[{"name":"Bryan William Shupe","party":"Republican","website":"http://BryanShupe.com"},{"name":"Patrick Smith","party":"Republican","website":"http://PatrickSmithForDelaware.com"}],"41":[{"name":"John Atkins","party":"Republican"},{"name":"Doug Conaway","party":"Republican"},{"name":"Jacki Slonin","party":"Republican","website":"http://derepdistrict41JackiSlonin.godaddysites.com"}]},"county":{"New Castle":{"New Castle County Recorder of Deeds":[{"name":"Michael E. Kozikowski, Sr.","party":"Democratic","website":"https://www.mekrecorder.com"},{"name":"David Tackett","party":"Democratic","website":"https://www.tackett4deeds.netlify.app"}],"New Castle County Council District 3":[{"name":"Kira Alejandro","party":"Democratic","website":"https://www.kiraforcouncil.com"},{"name":"Kyle R. Grantham","party":"Democratic","website":"https://www.kylegrantham.org"}],"New Castle County Council District 4":[{"name":"Helena M. Creamer","party":"Democratic"},{"name":"Jason Hoover","party":"Democratic","website":"https://gohoover.com"},{"name":"Curtis Dauntell Linton","party":"Democratic","website":"https://Curtis4council.com"}],"New Castle County Council District 5":[{"name":"Valerie George","party":"Democratic"},{"name":"Syam Kosigi","party":"Democratic","website":"https://www.syamkosigiforcouncil.com"}]}}};

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const address = (event.queryStringParameters || {}).address;
  if (!address) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'address required' }) };
  }

  // Call Census Bureau geocoder — no layers param returns ALL geographies
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

  // BASENAME gives a clean district number ("3" not "003" or "State Senate District 3")
  function districtNum(geo) {
    const base = geo.BASENAME || '';
    if (/^\d+$/.test(base)) return base;
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
    statewide: CANDIDATES.statewide || {},
    senate: senateDistrict && CANDIDATES.senate[senateDistrict]
      ? { [senateDistrict]: CANDIDATES.senate[senateDistrict] }
      : {},
    house: houseDistrict && CANDIDATES.house[houseDistrict]
      ? { [houseDistrict]: CANDIDATES.house[houseDistrict] }
      : {},
    county_races: (county && CANDIDATES.county[county]) ? CANDIDATES.county[county] : {}
  };

  return { statusCode: 200, headers, body: JSON.stringify(result) };
};
