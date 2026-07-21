/**
 * Netlify Function: subscribe
 * ────────────────────────────
 * 1. Upserts subscriber into Supabase
 * 2. Upserts subscriber into Mailchimp audience
 *
 * Env vars required (Netlify dashboard → Site configuration → Environment variables):
 *   SUPABASE_URL          — https://xxxxxxxxxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key (server-side only)
 *   MAILCHIMP_API_KEY     — from Mailchimp → Account → Extras → API keys
 *   MAILCHIMP_LIST_ID     — from Mailchimp → Audience → Settings → Audience name & defaults
 */

const crypto = require("crypto");

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { email = "", firstName = "", lastName = "", profile = "general" } = body;

  if (!email || !email.includes("@")) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const emailNorm = email.toLowerCase().trim();

  // ── 1. Supabase ────────────────────────────────────────────────────────────
  const SUPABASE_URL         = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  let alreadySubscribed = false;

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    const SB = {
      apikey: SUPABASE_SERVICE_KEY,
      ...(SUPABASE_SERVICE_KEY && SUPABASE_SERVICE_KEY.startsWith('eyJ')
        ? { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
        : {}),
    };

    // Check if this email already exists before upserting
    try {
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(emailNorm)}&select=email`,
        { headers: SB }
      );
      if (checkRes.ok) {
        const existing = await checkRes.json();
        alreadySubscribed = existing.length > 0;
      }
    } catch (err) {
      console.error("Supabase check error:", err);
    }

    // Upsert regardless — keeps data current even for returning subscribers
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
        method: "POST",
        headers: {
          ...SB,
          "Content-Type": "application/json",
          Prefer:         "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          email:         emailNorm,
          first_name:    firstName.trim(),
          last_name:     lastName.trim(),
          profile_key:   profile,
          subscribed_at: new Date().toISOString(),
          active:        true,
        }),
      });
      if (!res.ok) console.error("Supabase subscribe error:", await res.text());
    } catch (err) {
      console.error("Supabase handler error:", err);
    }
  } else {
    console.warn("Supabase env vars missing — skipping Supabase write");
  }

  // ── 2. Mailchimp ───────────────────────────────────────────────────────────
  const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
  const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

  if (MAILCHIMP_API_KEY && MAILCHIMP_LIST_ID) {
    try {
      // Server prefix is the suffix of the API key after the dash (e.g. "us1")
      const server         = MAILCHIMP_API_KEY.split("-").pop();
      const subscriberHash = crypto.createHash("md5").update(emailNorm).digest("hex");

      const mcRes = await fetch(
        `https://${server}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
        {
          method: "PUT",   // PUT = create-or-update (upsert)
          headers: {
            Authorization:  "Basic " + Buffer.from("anystring:" + MAILCHIMP_API_KEY).toString("base64"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: emailNorm,
            status_if_new: "subscribed",   // only sets status on first add
            merge_fields: {
              FNAME: firstName.trim(),
              LNAME: lastName.trim(),
            },
          }),
        }
      );

      if (!mcRes.ok) {
        const mcErr = await mcRes.text();
        console.error("Mailchimp error:", mcErr);
      } else {
        console.log("Mailchimp: subscriber upserted →", emailNorm);
      }
    } catch (err) {
      console.error("Mailchimp handler error:", err);
    }
  } else {
    console.warn("Mailchimp env vars missing — skipping Mailchimp write");
  }

  // Always return success — never expose internal errors to the browser
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, alreadySubscribed }) };
};
