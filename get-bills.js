/**
 * Netlify Function: get-bills
 * ─────────────────────────────
 * Proxies the fetch of bill_states.json from GitHub.
 * Keeps GITHUB_TOKEN server-side so the repo can stay private.
 *
 * Required Netlify env vars:
 *   GITHUB_TOKEN       — personal access token with repo read access
 *   GITHUB_OWNER       — e.g. "CivicDelaware"
 *   GITHUB_REPO_NAME   — e.g. "dover-dash-monitor"
 */

exports.handler = async function(event) {
  const GITHUB_TOKEN     = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER     = process.env.GITHUB_OWNER     || "CivicDelaware";
  const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || "dover-dash-monitor";
  const BILLS_PATH       = "bill_states.json";

  const CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO_NAME}/contents/${BILLS_PATH}`;

  try {
    const headers = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "DoverDash-Tracker/1.0",
    };
    if (GITHUB_TOKEN) headers["Authorization"] = `token ${GITHUB_TOKEN}`;

    const res = await fetch(apiUrl, { headers });

    if (res.status === 404) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ found: false, reason: "no_file", bills: {} }),
      };
    }

    if (!res.ok) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ found: false, reason: `github_error_${res.status}`, bills: {} }),
      };
    }

    const file    = await res.json();
    const content = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf-8");
    const parsed  = JSON.parse(content);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ found: true, bills: parsed }),
    };

  } catch (err) {
    console.error("get-bills error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ found: false, reason: "server_error", error: err.message, bills: {} }),
    };
  }
};
