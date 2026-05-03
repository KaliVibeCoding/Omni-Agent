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
      dateCreated: n.dateCreated,
      capabilities: {
        voice: n.capabilities.voice ?? false,
        sms: n.capabilities.sms ?? false,
        mms: n.capabilities.mms ?? false,
        fax: (n.capabilities as any).fax ?? false,
      },
      voiceUrl: (n as any).voiceUrl ?? null,
      voiceMethod: (n as any).voiceMethod ?? null,
      voiceFallbackUrl: (n as any).voiceFallbackUrl ?? null,
      smsUrl: (n as any).smsUrl ?? null,
      smsMethod: (n as any).smsMethod ?? null,
      statusCallback: (n as any).statusCallback ?? null,
      addressRequirements: (n as any).addressRequirements ?? null,
      beta: (n as any).beta ?? false,
      origin: (n as any).origin ?? null,
    })));
  } catch (err) {
    next(err);
  }
});

router.put("/phone-numbers/:sid", async (req, res, next) => {
  try {
    const { sid } = req.params;
    const {
      friendlyName, voiceUrl, voiceMethod, voiceFallbackUrl,
      smsUrl, smsMethod, statusCallback,
    } = req.body as Record<string, string | undefined>;
    const client = getTwilioClient();
    const updateParams: Record<string, string> = {};
    if (friendlyName !== undefined) updateParams["friendlyName"] = friendlyName;
    if (voiceUrl !== undefined) updateParams["voiceUrl"] = voiceUrl;
    if (voiceMethod !== undefined) updateParams["voiceMethod"] = voiceMethod;
    if (voiceFallbackUrl !== undefined) updateParams["voiceFallbackUrl"] = voiceFallbackUrl;
    if (smsUrl !== undefined) updateParams["smsUrl"] = smsUrl;
    if (smsMethod !== undefined) updateParams["smsMethod"] = smsMethod;
    if (statusCallback !== undefined) updateParams["statusCallback"] = statusCallback;
    const updated = await client.incomingPhoneNumbers(sid).update(updateParams as any);
    res.json({
      sid: updated.sid,
      phoneNumber: updated.phoneNumber,
      friendlyName: updated.friendlyName,
      voiceUrl: (updated as any).voiceUrl ?? null,
      smsUrl: (updated as any).smsUrl ?? null,
      statusCallback: (updated as any).statusCallback ?? null,
    });
  } catch (err) { next(err); }
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

// ─── SMS Routes ───────────────────────────────────────────────────────────────

router.get("/sms/messages", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const limit = Math.min(parseInt((req.query["limit"] as string) ?? "50", 10), 200);
    const to = req.query["to"] as string | undefined;
    const from = req.query["from"] as string | undefined;
    const opts: Record<string, unknown> = { limit };
    if (to) opts["to"] = to;
    if (from) opts["from"] = from;
    const messages = await client.messages.list(opts as any);
    res.json(messages.map(m => ({
      sid: m.sid, body: m.body, from: m.from, to: m.to,
      status: m.status, direction: m.direction,
      dateSent: m.dateSent, price: m.price, priceUnit: m.priceUnit,
      numSegments: m.numSegments, errorCode: m.errorCode,
    })));
  } catch (err) { next(err); }
});

router.post("/sms/status-callback", async (req, res, next) => {
  try {
    const { MessageSid, MessageStatus, From, To, Body, NumSegments, Price, ErrorCode } =
      req.body as Record<string, string | undefined>;
    if (!MessageSid) { res.status(400).send("Missing MessageSid"); return; }
    const now = new Date().toISOString();
    req.log.info({ sid: MessageSid, status: MessageStatus }, "SMS status callback");
    await queryD1(
      `INSERT INTO sms_logs (sid, from_number, to_number, body, status, direction, num_segments, price, error_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(sid) DO UPDATE SET status = excluded.status, price = excluded.price, error_code = excluded.error_code`,
      [MessageSid, From ?? null, To ?? null, Body ?? null, MessageStatus ?? null,
       null, NumSegments ? parseInt(NumSegments, 10) : 1, Price ?? null, ErrorCode ?? null, now]
    );
    res.status(200).set("Content-Type", "text/xml").send("<Response/>");
  } catch (err) { next(err); }
});

router.get("/sms/logs", async (req, res, next) => {
  try {
    const result = await queryD1("SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 100");
    res.json(result?.results ?? []);
  } catch (err) { next(err); }
});

router.get("/sms/analytics", async (req, res, next) => {
  try {
    const days = parseInt((req.query["days"] as string) ?? "7", 10);
    const [dailyRes, statusRes, summaryRes, dirRes] = await Promise.all([
      queryD1(`SELECT date(created_at) AS day, COUNT(*) AS total,
                SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS delivered,
                ROUND(SUM(CAST(REPLACE(COALESCE(price,'0'),'-','') AS REAL)),4) AS day_cost
               FROM sms_logs WHERE created_at >= datetime('now','-${days} days')
               GROUP BY day ORDER BY day ASC`),
      queryD1(`SELECT status, COUNT(*) AS count FROM sms_logs
               WHERE created_at >= datetime('now','-${days} days') GROUP BY status ORDER BY count DESC`),
      queryD1(`SELECT COUNT(*) AS total_messages,
               SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS delivered,
               ROUND(SUM(CAST(REPLACE(COALESCE(price,'0'),'-','') AS REAL)),4) AS total_cost
               FROM sms_logs WHERE created_at >= datetime('now','-${days} days')`),
      queryD1(`SELECT direction, COUNT(*) AS count FROM sms_logs
               WHERE created_at >= datetime('now','-${days} days') GROUP BY direction`),
    ]);
    res.json({
      days,
      daily: dailyRes?.results ?? [],
      statuses: statusRes?.results ?? [],
      summary: summaryRes?.results?.[0] ?? {},
      directions: dirRes?.results ?? [],
    });
  } catch (err) { next(err); }
});

router.get("/sms/export", async (req, res, next) => {
  try {
    const result = await queryD1("SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 5000");
    const rows = (result?.results ?? []) as Record<string, unknown>[];
    const header = "sid,from_number,to_number,body,status,direction,num_segments,price,error_code,created_at";
    const csv = [header, ...rows.map(r =>
      [r["sid"],r["from_number"],r["to_number"],`"${String(r["body"]??'').replace(/"/g,'""')}"`,r["status"],r["direction"],r["num_segments"],r["price"],r["error_code"],r["created_at"]].join(",")
    )].join("\n");
    res.set("Content-Type","text/csv").set("Content-Disposition","attachment; filename=sms_logs.csv").send(csv);
  } catch (err) { next(err); }
});

// ─── Call Export + Notes ──────────────────────────────────────────────────────

router.get("/calls/export", async (req, res, next) => {
  try {
    const result = await queryD1("SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 5000");
    const rows = (result?.results ?? []) as Record<string, unknown>[];
    const header = "sid,from_number,to_number,status,direction,duration,start_time,end_time,price,created_at,notes";
    const csv = [header, ...rows.map(r =>
      [r["sid"],r["from_number"],r["to_number"],r["status"],r["direction"],r["duration"],r["start_time"],r["end_time"],r["price"],r["created_at"],`"${String(r["notes"]??'').replace(/"/g,'""')}"`].join(",")
    )].join("\n");
    res.set("Content-Type","text/csv").set("Content-Disposition","attachment; filename=call_logs.csv").send(csv);
  } catch (err) { next(err); }
});

router.post("/calls/:sid/note", async (req, res, next) => {
  try {
    const { note } = req.body as { note: string };
    const { sid } = req.params;
    await queryD1(
      `INSERT INTO call_logs (sid, notes, created_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(sid) DO UPDATE SET notes = excluded.notes`,
      [sid, note]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post("/calls/outbound", async (req, res, next) => {
  try {
    const { to, from, twiml, url } = req.body as { to: string; from: string; twiml?: string; url?: string };
    if (!to || !from) { res.status(400).json({ error: "to and from are required" }); return; }
    const client = getTwilioClient();
    const opts: Record<string, unknown> = { to, from };
    if (url) opts["url"] = url;
    else opts["twiml"] = twiml ?? `<Response><Say voice="Polly.Joanna-Neural">Hello from RJ Business Solutions. Please hold for the next available agent.</Say></Response>`;
    const call = await client.calls.create(opts as any);
    res.json({ sid: call.sid, status: call.status, to: call.to, from: call.from });
  } catch (err) { next(err); }
});

// ─── Recordings ───────────────────────────────────────────────────────────────

router.get("/recordings", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const callSid = req.query["callSid"] as string | undefined;
    const limit = Math.min(parseInt((req.query["limit"] as string) ?? "25", 10), 100);
    const opts: Record<string, unknown> = { limit };
    if (callSid) opts["callSid"] = callSid;
    const recordings = await client.recordings.list(opts as any);
    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    res.json(recordings.map(r => ({
      sid: r.sid, callSid: r.callSid, duration: r.duration,
      status: r.status, source: r.source, dateCreated: r.dateCreated,
      streamUrl: `/api/twilio/recordings/${r.sid}/stream`,
      downloadUrl: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${r.sid}.mp3`,
    })));
  } catch (err) { next(err); }
});

router.get("/recordings/:sid/stream", async (req, res, next) => {
  try {
    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    const authToken = process.env["TWILIO_AUTH_TOKEN"];
    if (!accountSid || !authToken) { res.status(500).json({ error: "Missing credentials" }); return; }
    const { sid } = req.params;
    const recUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${sid}.mp3`;
    const upstream = await fetch(recUrl, {
      headers: { "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64") }
    });
    if (!upstream.ok) { res.status(upstream.status).json({ error: "Recording not found" }); return; }
    res.set("Content-Type", "audio/mpeg");
    const reader = upstream.body!.getReader();
    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) { res.end(); return; }
      res.write(value);
      return pump();
    };
    await pump();
  } catch (err) { next(err); }
});

// ─── Conferences ──────────────────────────────────────────────────────────────

router.get("/conferences/active", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const conferences = await client.conferences.list({ status: "in-progress" as any, limit: 20 });
    const withParticipants = await Promise.all(conferences.map(async conf => {
      const participants = await client.conferences(conf.sid).participants.list({ limit: 20 });
      return {
        sid: conf.sid, friendlyName: conf.friendlyName, status: conf.status,
        dateCreated: conf.dateCreated,
        participants: participants.map(p => ({
          callSid: p.callSid, muted: p.muted, hold: p.hold, coaching: p.coaching,
        })),
      };
    }));
    res.json(withParticipants);
  } catch (err) { next(err); }
});

router.post("/conferences/:sid/end", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const updated = await client.conferences(req.params["sid"]).update({ status: "completed" as any });
    res.json({ sid: updated.sid, status: updated.status });
  } catch (err) { next(err); }
});

router.post("/conferences/:confSid/participants/:callSid/mute", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const { confSid, callSid } = req.params;
    const { muted = true } = req.body as { muted?: boolean };
    const updated = await client.conferences(confSid!).participants(callSid!).update({ muted } as any);
    res.json({ callSid: updated.callSid, muted: updated.muted });
  } catch (err) { next(err); }
});

// ─── Contacts (D1) ───────────────────────────────────────────────────────────

router.get("/contacts", async (req, res, next) => {
  try {
    const search = req.query["search"] as string | undefined;
    let result;
    if (search) {
      const q = `%${search}%`;
      result = await queryD1(
        "SELECT * FROM contacts WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ? ORDER BY name ASC LIMIT 100",
        [q, q, q, q]
      );
    } else {
      result = await queryD1("SELECT * FROM contacts ORDER BY name ASC LIMIT 200");
    }
    res.json(result?.results ?? []);
  } catch (err) { next(err); }
});

router.post("/contacts", async (req, res, next) => {
  try {
    const { name, phone, email, company, notes, tags } = req.body as Record<string, string>;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }
    const now = new Date().toISOString();
    const result = await queryD1(
      "INSERT INTO contacts (name, phone, email, company, notes, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
      [name, phone ?? null, email ?? null, company ?? null, notes ?? null, tags ?? null, now, now]
    );
    res.json(result?.results?.[0] ?? { success: true });
  } catch (err) { next(err); }
});

router.put("/contacts/:id", async (req, res, next) => {
  try {
    const { name, phone, email, company, notes, tags } = req.body as Record<string, string>;
    const now = new Date().toISOString();
    await queryD1(
      "UPDATE contacts SET name=?, phone=?, email=?, company=?, notes=?, tags=?, updated_at=? WHERE id=?",
      [name, phone ?? null, email ?? null, company ?? null, notes ?? null, tags ?? null, now, req.params["id"]]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete("/contacts/:id", async (req, res, next) => {
  try {
    await queryD1("DELETE FROM contacts WHERE id=?", [req.params["id"]]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Voicemails & Transcriptions ─────────────────────────────────────────────

router.get("/voicemails", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const limit = Math.min(parseInt((req.query["limit"] as string) ?? "30", 10), 100);

    // Fetch transcriptions (created from voicemail recordings)
    const transcriptions = await client.transcriptions.list({ limit });

    // For each transcription, get the recording metadata in parallel (batch of up to 10)
    const enriched = await Promise.all(
      transcriptions.map(async (t) => {
        let recording: Record<string, unknown> | null = null;
        try {
          if (t.recordingSid) {
            const rec = await client.recordings(t.recordingSid).fetch();
            recording = {
              sid: rec.sid,
              duration: rec.duration,
              dateCreated: rec.dateCreated,
              callSid: rec.callSid,
              streamUrl: `/api/twilio/recordings/${rec.sid}/stream`,
            };
          }
        } catch {
          // Recording may have been deleted; continue without it
        }
        return {
          sid: t.sid,
          status: t.status,
          duration: t.duration,
          transcriptionText: t.transcriptionText,
          recordingSid: t.recordingSid,
          dateCreated: t.dateCreated,
          price: t.price,
          priceUnit: t.priceUnit,
          recording,
        };
      })
    );
    res.json(enriched);
  } catch (err) { next(err); }
});

router.get("/voicemails/calls", async (req, res, next) => {
  // Returns recent calls that have recordings (potential voicemails), with call-from info
  try {
    const client = getTwilioClient();
    const limit = Math.min(parseInt((req.query["limit"] as string) ?? "20", 10), 50);
    const recordings = await client.recordings.list({ limit });
    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    res.json(recordings.map(r => ({
      sid: r.sid,
      callSid: r.callSid,
      duration: r.duration,
      status: r.status,
      source: r.source,
      dateCreated: r.dateCreated,
      streamUrl: `/api/twilio/recordings/${r.sid}/stream`,
      downloadUrl: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${r.sid}.mp3`,
    })));
  } catch (err) { next(err); }
});

router.delete("/voicemails/:sid", async (req, res, next) => {
  // Delete a transcription (and optionally its recording)
  try {
    const client = getTwilioClient();
    const { sid } = req.params;
    const deleteRecording = req.query["deleteRecording"] === "true";

    // Fetch transcription to get recordingSid
    let recordingSid: string | null = null;
    try {
      const t = await client.transcriptions(sid).fetch();
      recordingSid = t.recordingSid;
      await client.transcriptions(sid).remove();
    } catch {}

    if (deleteRecording && recordingSid) {
      try { await client.recordings(recordingSid).remove(); } catch {}
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post("/voicemails/sms-reply", async (req, res, next) => {
  try {
    const { to, from, body } = req.body as { to: string; from: string; body: string };
    if (!to || !from || !body) { res.status(400).json({ error: "to, from, body required" }); return; }
    const client = getTwilioClient();
    const msg = await client.messages.create({ to, from, body });
    res.json({ sid: msg.sid, status: msg.status });
  } catch (err) { next(err); }
});

export default router;

