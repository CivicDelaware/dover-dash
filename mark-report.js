/**
 * Netlify Function: mark-report
 * ──────────────────────────────
 * Called by approve.html after a send or discard.
 * Updates pending_report.json in GitHub to status: "sent" or "discarded"
 * so the approve page shows the right state next time.
 *
 * Deploy path: netlify/functions/mark-report.js
 *
 * Required Netlify env vars:
 *   GITHUB_TOKEN       — a GitHub personal access token with repo write access
 *   GITHUB_OWNER       — e.g. "CivicDelaware"
 *   GITHUB_REPO_NAME   — e.g. "dover-dash-monitor"
 */

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { status } = body;
  if (!["sent", "discarded"].includes(status)) {
    return { statusCode: 400, body: JSON.stringify({ error: "status must be sent or discarded" }) };
  }

  const GITHUB_TOKEN     = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER     = process.env.GITHUB_OWNER     || "CivicDelaware";
  const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || "dover-dash-monitor";
  const PENDING_PATH     = "pending_report.json";

  if (!GITHUB_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: "GITHUB_TOKEN not set" }) };
  }

  const apiBase   = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO_NAME}/contents/${PENDING_PATH}`;
  const authHeader = `token ${GITHUB_TOKEN}`;

  try {
    // Get current file to read content + SHA
    const getRes = await fetch(apiBase, {
      headers: {
        "Authorization": authHeader,
        "Accept":        "application/vnd.github.v3+json",
      },
    });

    if (!getRes.ok) {
      throw new Error(`Could not fetch pending_report.json: ${getRes.status}`);
    }

    const fileData    = await getRes.json();
    const currentSha  = fileData.sha;
    const decoded     = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    // Update status
    decoded.status     = status;
    decoded.updated_at = new Date().toISOString();

    // Write back
    const newContent = Buffer.from(JSON.stringify(decoded, null, 2)).toString("base64");
    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Accept":        "application/vnd.github.v3+json",
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        message: `Mark report as ${status} [skip ci]`,
        content: newContent,
        sha:     currentSha,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      throw new Error(`GitHub update failed: ${err}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, status }),
    };

  } catch (err) {
    console.error("mark-report error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
