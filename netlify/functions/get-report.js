/**
 * Netlify Function: get-report
 * ─────────────────────────────
 * Proxies the fetch of pending_report.json from GitHub.
 * Keeps GITHUB_TOKEN server-side so the repo can stay private.
 *
 * Deploy path: netlify/functions/get-report.js
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
  const PENDING_PATH     = "pending_report.json";

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO_NAME}/contents/${PENDING_PATH}`;

  try {
    const headers = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "DoverDash-Approve/1.0",
    };
    if (GITHUB_TOKEN) headers["Authorization"] = `token ${GITHUB_TOKEN}`;

    const res = await fetch(apiUrl, { headers });

    if (res.status === 404) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ found: false, reason: "no_file" }),
      };
    }

    if (!res.ok) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ found: false, reason: `github_error_${res.status}` }),
      };
    }

    const file    = await res.json();
    const content = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf-8");
    const parsed  = JSON.parse(content);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ found: true, report: parsed }),
    };

  } catch (err) {
    console.error("get-report error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ found: false, reason: "server_error", error: err.message }),
    };
  }
};
