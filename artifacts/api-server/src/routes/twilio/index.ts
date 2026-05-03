import { Router } from "express";
import twilio from "twilio";
import {
  SendTwilioSmsBody,
  MakeTwilioCallBody,
  GetTwilioVoiceTokenBody,
  TwilioLookupBody,
} from "@workspace/api-zod";

const router = Router();

function getTwilioClient() {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const apiKeySid = process.env["TWILIO_API_KEY_SID"];
  const apiKeySecret = process.env["TWILIO_API_KEY_SECRET"];

  if (!accountSid) {
    throw new Error("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID.");
  }

  // Use Auth Token (most reliable); fall back to API Key auth
  if (authToken) {
    return twilio(accountSid, authToken);
  }
  if (apiKeySid && apiKeySecret) {
    return twilio(apiKeySid, apiKeySecret, { accountSid });
  }
  throw new Error("Set TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET.");
}

router.get("/account", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const accountSid = process.env["TWILIO_ACCOUNT_SID"]!;
    const account = await client.api.v2010.accounts(accountSid).fetch();
    const balance = await client.balance.fetch();
    res.json({
      sid: account.sid,
      friendlyName: account.friendlyName,
      status: account.status,
      balance: balance.balance,
      currency: balance.currency,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/phone-numbers", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const numbers = await client.incomingPhoneNumbers.list({ limit: 50 });
    res.json(numbers.map((n) => ({
      sid: n.sid,
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
      capabilities: {
        voice: n.capabilities.voice ?? false,
        sms: n.capabilities.sms ?? false,
        mms: n.capabilities.mms ?? false,
      },
    })));
  } catch (err) {
    next(err);
  }
});

router.post("/send-sms", async (req, res, next) => {
  try {
    const { to, from, body } = SendTwilioSmsBody.parse(req.body);
    const client = getTwilioClient();
    const msg = await client.messages.create({ to, from, body });
    res.json({ sid: msg.sid, status: msg.status, to: msg.to, from: msg.from, body: msg.body });
  } catch (err) {
    next(err);
  }
});

router.post("/make-call", async (req, res, next) => {
  try {
    const { to, from, twiml } = MakeTwilioCallBody.parse(req.body);
    const client = getTwilioClient();
    const call = await client.calls.create({ to, from, twiml });
    res.json({ sid: call.sid, status: call.status, to: call.to, from: call.from });
  } catch (err) {
    next(err);
  }
});

router.post("/voice-token", async (req, res, next) => {
  try {
    const { identity } = GetTwilioVoiceTokenBody.parse(req.body);
    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    const apiKeySid = process.env["TWILIO_API_KEY_SID"];
    const apiKeySecret = process.env["TWILIO_API_KEY_SECRET"];

    if (!accountSid || !apiKeySid || !apiKeySecret) {
      res.status(500).json({ error: "Twilio credentials not configured" });
      return;
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({ incomingAllow: true });
    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
      identity,
      ttl: 3600,
    });
    token.addGrant(voiceGrant);

    res.json({ token: token.toJwt(), identity, ttl: 3600 });
  } catch (err) {
    next(err);
  }
});

// ─── Live Call Monitor ────────────────────────────────────────────────────────

router.get("/calls/active", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const calls = await client.calls.list({ status: "in-progress", limit: 50 });
    const ringing = await client.calls.list({ status: "ringing", limit: 20 });
    const all = [...calls, ...ringing];
    res.json(all.map(c => ({
      sid: c.sid,
      from: c.from,
      to: c.to,
      status: c.status,
      direction: c.direction,
      duration: c.duration,
      startTime: c.startTime,
      answeredBy: (c as any).answeredBy ?? null,
      forwardedFrom: (c as any).forwardedFrom ?? null,
      callerName: (c as any).callerName ?? null,
      phoneNumberSid: (c as any).phoneNumberSid ?? null,
    })));
  } catch (err) {
    next(err);
  }
});

router.get("/calls/recent", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const calls = await client.calls.list({ limit: 30 });
    res.json(calls.map(c => ({
      sid: c.sid,
      from: c.from,
      to: c.to,
      status: c.status,
      direction: c.direction,
      duration: c.duration,
      startTime: c.startTime,
      endTime: (c as any).endTime ?? null,
      price: (c as any).price ?? null,
      priceUnit: (c as any).priceUnit ?? null,
    })));
  } catch (err) {
    next(err);
  }
});

router.post("/calls/:sid/whisper", async (req, res, next) => {
  try {
    const { sid } = req.params;
    const { message = "You have a whispered message from your supervisor." } = req.body as { message?: string };
    const client = getTwilioClient();
    // Update the call with new TwiML that whispers to the agent leg
    const twiml = `<Response><Say voice="Polly.Joanna-Neural">${message}</Say></Response>`;
    const updated = await client.calls(sid).update({ twiml });
    res.json({ sid: updated.sid, status: updated.status });
  } catch (err) {
    next(err);
  }
});

router.post("/calls/:sid/transfer", async (req, res, next) => {
  try {
    const { sid } = req.params;
    const { queueName = "support", twimlUrl } = req.body as { queueName?: string; twimlUrl?: string };
    const client = getTwilioClient();
    const twiml = twimlUrl
      ? undefined
      : `<Response><Enqueue>${queueName}</Enqueue></Response>`;
    const updated = await client.calls(sid).update(twimlUrl ? { url: twimlUrl } : { twiml: twiml! });
    res.json({ sid: updated.sid, status: updated.status });
  } catch (err) {
    next(err);
  }
});

router.post("/calls/:sid/hangup", async (req, res, next) => {
  try {
    const { sid } = req.params;
    const client = getTwilioClient();
    const updated = await client.calls(sid).update({ status: "completed" });
    res.json({ sid: updated.sid, status: updated.status });
  } catch (err) {
    next(err);
  }
});

// ─── D1 Call Logs ─────────────────────────────────────────────────────────────

async function queryD1(sql: string, params: unknown[] = []) {
  const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
  const apiToken = process.env["CLOUDFLARE_API_TOKEN"];
  const dbId = process.env["CLOUDFLARE_D1_DATABASE_ID"];
  if (!accountId || !apiToken || !dbId) return null;
  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    }
  );
  if (!resp.ok) return null;
  const data = await resp.json() as any;
  return data?.result?.[0] ?? null;
}

// ─── Twilio Status Callback Webhook ───────────────────────────────────────────
// Configure this URL in Twilio console → Phone Numbers → Status Callbacks
// Also works as the TwiML app status callback.
// Twilio sends application/x-www-form-urlencoded — Express urlencoded parser
// is mounted at the root, so req.body fields are strings.

router.post("/calls/status-callback", async (req, res, next) => {
  try {
    const {
      CallSid,
      CallStatus,
      From,
      To,
      Direction,
      Duration,
      StartTime,
      EndTime,
      Price,
      AccountSid,
      ParentCallSid,
    } = req.body as Record<string, string | undefined>;

    if (!CallSid) {
      res.status(400).send("Missing CallSid");
      return;
    }

    // Map Twilio field names → our D1 schema
    const sid       = CallSid;
    const status    = CallStatus ?? "unknown";
    const from      = From ?? null;
    const to        = To ?? null;
    const direction = Direction ?? null;
    const duration  = Duration ? parseInt(Duration, 10) : 0;
    const startTime = StartTime ?? null;
    const endTime   = EndTime ?? null;
    const price     = Price ?? null;
    const now       = new Date().toISOString();

    req.log.info({ sid, status, from, to, direction, duration }, "Twilio status callback received");

    await queryD1(
      `INSERT INTO call_logs
         (sid, from_number, to_number, status, direction, duration, start_time, end_time, price, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(sid) DO UPDATE SET
         status    = excluded.status,
         duration  = excluded.duration,
         end_time  = excluded.end_time,
         price     = excluded.price`,
      [sid, from, to, status, direction, duration, startTime, endTime, price, now]
    );

    // Twilio expects a 200 (TwiML or empty body)
    res.status(200).set("Content-Type", "text/xml").send("<Response/>");
  } catch (err) {
    next(err);
  }
});

router.get("/calls/analytics", async (req, res, next) => {
  try {
    const days = parseInt((req.query["days"] as string) ?? "7", 10);

    const [dailyRes, statusRes, summaryRes, directionRes, topRes] = await Promise.all([
      // Daily call volume + total duration + cost for last N days
      queryD1(
        `SELECT
           date(created_at) AS day,
           COUNT(*) AS total_calls,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN status IN ('failed','busy','no-answer') THEN 1 ELSE 0 END) AS failed,
           ROUND(AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END), 1) AS avg_duration,
           ROUND(SUM(CAST(REPLACE(COALESCE(price,'0'), '-', '') AS REAL)), 4) AS day_cost
         FROM call_logs
         WHERE created_at >= datetime('now', '-${days} days')
         GROUP BY day
         ORDER BY day ASC`
      ),
      // Overall status breakdown
      queryD1(
        `SELECT status, COUNT(*) AS count
         FROM call_logs
         WHERE created_at >= datetime('now', '-${days} days')
         GROUP BY status
         ORDER BY count DESC`
      ),
      // Summary totals
      queryD1(
        `SELECT
           COUNT(*) AS total_calls,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
           ROUND(AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END), 1) AS avg_duration,
           MAX(duration) AS max_duration,
           ROUND(SUM(CAST(REPLACE(COALESCE(price,'0'), '-', '') AS REAL)), 4) AS total_cost
         FROM call_logs
         WHERE created_at >= datetime('now', '-${days} days')`
      ),
      // Direction split
      queryD1(
        `SELECT direction, COUNT(*) AS count
         FROM call_logs
         WHERE created_at >= datetime('now', '-${days} days')
         GROUP BY direction`
      ),
      // Top callers (from_number)
      queryD1(
        `SELECT from_number, COUNT(*) AS count, SUM(duration) AS total_duration
         FROM call_logs
         WHERE created_at >= datetime('now', '-${days} days') AND from_number IS NOT NULL
         GROUP BY from_number
         ORDER BY count DESC
         LIMIT 5`
      ),
    ]);

    res.json({
      days,
      daily:     dailyRes?.results     ?? [],
      statuses:  statusRes?.results    ?? [],
      summary:   summaryRes?.results?.[0] ?? {},
      directions: directionRes?.results ?? [],
      topCallers: topRes?.results      ?? [],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/calls/log", async (req, res, next) => {
  try {
    const { sid, from, to, status, direction, duration, startTime, endTime, price } = req.body;
    const result = await queryD1(
      `INSERT OR REPLACE INTO call_logs (sid, from_number, to_number, status, direction, duration, start_time, end_time, price, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [sid, from, to, status, direction, duration ?? 0, startTime ?? null, endTime ?? null, price ?? null]
    );
    res.json({ success: !!result });
  } catch (err) {
    next(err);
  }
});

router.get("/calls/logs", async (req, res, next) => {
  try {
    const result = await queryD1(
      "SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 100"
    );
    res.json(result?.results ?? []);
  } catch (err) {
    next(err);
  }
});

router.post("/lookup", async (req, res, next) => {
  try {
    const { phoneNumber, fields } = TwilioLookupBody.parse(req.body);
    const client = getTwilioClient();

    const fetchOptions: Record<string, unknown> = {};
    if (fields && fields.length > 0) {
      fetchOptions["fields"] = fields.join(",");
    }

    const result = await (client.lookups.v2.phoneNumbers(phoneNumber) as any).fetch(fetchOptions);

    res.json({
      phoneNumber: result.phoneNumber,
      nationalFormat: result.nationalFormat,
      countryCode: result.countryCode,
      valid: result.valid,
      lineTypeIntelligence: result.lineTypeIntelligence ?? null,
      callerName: result.callerName ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
