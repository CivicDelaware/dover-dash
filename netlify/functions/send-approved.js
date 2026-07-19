/**
 * Netlify Function: send-approved
 * ────────────────────────────────
 * Called by approve.html when you click "Approve & Send".
 * Receives { subject, html } from the browser.
 * Sends a Mailchimp campaign to your list.
 *
 * Deploy path: netlify/functions/send-approved.js
 *
 * Required Netlify env vars (set in Netlify dashboard → Site → Environment variables):
 *   MAILCHIMP_API_KEY    — your Mailchimp API key
 *   MAILCHIMP_LIST_ID    — your Mailchimp audience/list ID
 *   MAILCHIMP_SERVER     — your Mailchimp server prefix (e.g. "us14")
 *   APPROVED_SECRET      — a secret string to prevent unauthorized sends
 *                          (set this in Netlify AND in approve.html's fetch headers)
 */

exports.handler = async function(event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { subject, html } = body;

  if (!subject || !html) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "subject and html are required" })
    };
  }

  const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
  const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
  const MAILCHIMP_SERVER  = process.env.MAILCHIMP_SERVER;  // e.g. "us14"

  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_SERVER) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Mailchimp env vars not configured" })
    };
  }

  const baseUrl = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0`;
  const authHeader = "Basic " + Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64");

  try {
    // ── Step 1: Create campaign ──────────────────────────────────────────────
    const campaignRes = await fetch(`${baseUrl}/campaigns`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        type: "regular",
        recipients: { list_id: MAILCHIMP_LIST_ID },
        settings: {
          subject_line: subject,
          preview_text: subject,
          title:        `Dover Dash — ${new Date().toLocaleDateString("en-US")}`,
          from_name:    "Dover Dash",
          reply_to:     "info@civicdelaware.com",
        },
      }),
    });

    if (!campaignRes.ok) {
      const err = await campaignRes.text();
      throw new Error(`Mailchimp create campaign failed: ${err}`);
    }

    const campaign = await campaignRes.json();
    const campaignId = campaign.id;

    // ── Step 2: Set campaign content ─────────────────────────────────────────
    const contentRes = await fetch(`${baseUrl}/campaigns/${campaignId}/content`, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ html }),
    });

    if (!contentRes.ok) {
      const err = await contentRes.text();
      throw new Error(`Mailchimp set content failed: ${err}`);
    }

    // ── Step 3: Send campaign ─────────────────────────────────────────────────
    const sendRes = await fetch(`${baseUrl}/campaigns/${campaignId}/actions/send`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type":  "application/json",
      },
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      throw new Error(`Mailchimp send failed: ${err}`);
    }

    console.log(`Dover Dash email sent: campaign ${campaignId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, campaignId }),
    };

  } catch (err) {
    console.error("send-approved error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
