import { Hono } from "hono";
import twilio from "twilio";
import type { Env } from "../index";
import { query, queryOne, run } from "../lib/d1";

const twilioRoutes = new Hono<{ Bindings: Env }>();

function getTwilioClient(env: Env) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET } = env;
  if (!TWILIO_ACCOUNT_SID) throw new Error("TWILIO_ACCOUNT_SID not configured");
  if (TWILIO_AUTH_TOKEN) return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  if (TWILIO_API_KEY_SID && TWILIO_API_KEY_SECRET) {
    return twilio(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, { accountSid: TWILIO_ACCOUNT_SID });
  }
  throw new Error("Set TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET");
}

// ─── Account ──────────────────────────────────────────────────────────────────

twilioRoutes.get("/account", async (c) => {
  const client = getTwilioClient(c.env);
  const accountSid = c.env.TWILIO_ACCOUNT_SID;
  const [account, balance] = await Promise.all([
    client.api.v2010.accounts(accountSid).fetch(),
    client.balance.fetch(),
  ]);
  return c.json({
    sid: account.sid,
    friendlyName: account.friendlyName,
    status: account.status,
    balance: balance.balance,
    currency: balance.currency,
  });
});

// ─── Phone Numbers ────────────────────────────────────────────────────────────

twilioRoutes.get("/phone-numbers", async (c) => {
  const client = getTwilioClient(c.env);
  const numbers = await client.incomingPhoneNumbers.list({ limit: 50 });
  return c.json(numbers.map((n) => ({
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
    smsUrl: (n as any).smsUrl ?? null,
    smsMethod: (n as any).smsMethod ?? null,
    statusCallback: (n as any).statusCallback ?? null,
  })));
});

twilioRoutes.put("/phone-numbers/:sid", async (c) => {
  const client = getTwilioClient(c.env);
  const updates = await c.req.json<Record<string, unknown>>();
  const updated = await client.incomingPhoneNumbers(c.req.param("sid")).update(updates as any);
  return c.json({ sid: updated.sid, friendlyName: updated.friendlyName, phoneNumber: updated.phoneNumber });
});

twilioRoutes.post("/phone-numbers/buy", async (c) => {
  const client = getTwilioClient(c.env);
  const { phoneNumber, voiceUrl, smsUrl } = await c.req.json<{ phoneNumber: string; voiceUrl?: string; smsUrl?: string }>();
  if (!phoneNumber) return c.json({ error: "phoneNumber required" }, 400);
  const number = await client.incomingPhoneNumbers.create({ phoneNumber, voiceUrl: voiceUrl ?? "", smsUrl: smsUrl ?? "" } as any);
  return c.json({ sid: number.sid, phoneNumber: number.phoneNumber, friendlyName: number.friendlyName });
});

twilioRoutes.delete("/phone-numbers/:sid", async (c) => {
  const client = getTwilioClient(c.env);
  await client.incomingPhoneNumbers(c.req.param("sid")).remove();
  return c.json({ success: true });
});

twilioRoutes.get("/phone-numbers/available", async (c) => {
  const client = getTwilioClient(c.env);
  const country = (c.req.query("country") ?? "US").toUpperCase();
  const areaCode = c.req.query("areaCode");
  const contains = c.req.query("contains");
  const type = (c.req.query("type") ?? "local") as "local" | "tollfree" | "mobile";
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 40);
  const opts: Record<string, unknown> = { limit };
  if (areaCode) opts["areaCode"] = areaCode;
  if (contains) opts["contains"] = contains;
  let numbers: any[];
  if (type === "tollfree") numbers = await (client.availablePhoneNumbers(country).tollFree as any).list(opts);
  else if (type === "mobile") numbers = await (client.availablePhoneNumbers(country).mobile as any).list(opts);
  else numbers = await (client.availablePhoneNumbers(country).local as any).list(opts);
  return c.json(numbers.map((n: any) => ({
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName,
    locality: n.locality,
    region: n.region,
    postalCode: n.postalCode,
    isoCountry: n.isoCountry,
    capabilities: n.capabilities,
  })));
});

// ─── Voice Token ──────────────────────────────────────────────────────────────

twilioRoutes.post("/voice-token", async (c) => {
  const { identity, twimlAppSid } = await c.req.json<{ identity?: string; twimlAppSid?: string }>();
  const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET } = c.env;
  if (!TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
    return c.json({ error: "TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET required for voice tokens" }, 500);
  }
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;
  const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
    identity: identity ?? `agent_${Date.now()}`,
    ttl: 3600,
  });
  const grant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });
  token.addGrant(grant);
  return c.json({ token: token.toJwt(), identity: identity ?? token.identity });
});

// ─── SMS ──────────────────────────────────────────────────────────────────────

twilioRoutes.post("/send-sms", async (c) => {
  const client = getTwilioClient(c.env);
  const { to, from, body, mediaUrl } = await c.req.json<{ to: string; from?: string; body: string; mediaUrl?: string }>();
  if (!to || !body) return c.json({ error: "to and body required" }, 400);
  const fromNumber = from ?? c.env.TWILIO_PHONE_NUMBER;
  const opts: Record<string, unknown> = { to, from: fromNumber, body };
  if (mediaUrl) opts["mediaUrl"] = [mediaUrl];
  const msg = await client.messages.create(opts as any);
  return c.json({ sid: msg.sid, status: msg.status, to: msg.to, from: msg.from });
});

twilioRoutes.get("/sms/messages", async (c) => {
  const client = getTwilioClient(c.env);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const to = c.req.query("to");
  const from = c.req.query("from");
  const opts: Record<string, unknown> = { limit };
  if (to) opts["to"] = to;
  if (from) opts["from"] = from;
  const messages = await client.messages.list(opts as any);
  return c.json(messages.map((m) => ({
    sid: m.sid, body: m.body, from: m.from, to: m.to,
    status: m.status, direction: m.direction,
    dateSent: m.dateSent, price: m.price, priceUnit: m.priceUnit,
    numSegments: m.numSegments, errorCode: m.errorCode,
  })));
});

twilioRoutes.post("/sms/status-callback", async (c) => {
  const body = await c.req.parseBody();
  const { MessageSid, MessageStatus, From, To, Body, NumSegments, Price, ErrorCode } =
    body as Record<string, string | undefined>;
  if (!MessageSid) return c.text("Missing MessageSid", 400);
  const now = new Date().toISOString();
  await run(c.env.DB,
    `INSERT INTO sms_logs (sid, from_number, to_number, body, status, direction, num_segments, price, error_code, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(sid) DO UPDATE SET status = excluded.status, price = excluded.price, error_code = excluded.error_code`,
    [MessageSid, From ?? null, To ?? null, Body ?? null, MessageStatus ?? null,
     null, NumSegments ? parseInt(NumSegments, 10) : 1, Price ?? null, ErrorCode ?? null, now]
  );
  return c.text("<Response/>", 200, { "Content-Type": "text/xml" });
});

twilioRoutes.get("/sms/logs", async (c) => {
  const rows = await query(c.env.DB, "SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 100");
  return c.json(rows);
});

twilioRoutes.get("/sms/analytics", async (c) => {
  const days = parseInt(c.req.query("days") ?? "7", 10);
  const [daily, statuses, summary, directions] = await Promise.all([
    query(c.env.DB, `SELECT date(created_at) AS day, COUNT(*) AS total, SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS delivered, ROUND(SUM(CAST(REPLACE(COALESCE(price,'0'),'-','') AS REAL)),4) AS day_cost FROM sms_logs WHERE created_at >= datetime('now','-${days} days') GROUP BY day ORDER BY day ASC`),
    query(c.env.DB, `SELECT status, COUNT(*) AS count FROM sms_logs WHERE created_at >= datetime('now','-${days} days') GROUP BY status ORDER BY count DESC`),
    queryOne(c.env.DB, `SELECT COUNT(*) AS total_messages, SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS delivered, ROUND(SUM(CAST(REPLACE(COALESCE(price,'0'),'-','') AS REAL)),4) AS total_cost FROM sms_logs WHERE created_at >= datetime('now','-${days} days')`),
    query(c.env.DB, `SELECT direction, COUNT(*) AS count FROM sms_logs WHERE created_at >= datetime('now','-${days} days') GROUP BY direction`),
  ]);
  return c.json({ days, daily, statuses, summary, directions });
});

twilioRoutes.get("/sms/export", async (c) => {
  const rows = await query(c.env.DB, "SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 5000") as Record<string, unknown>[];
  const header = "sid,from_number,to_number,body,status,direction,num_segments,price,error_code,created_at";
  const csv = [header, ...rows.map((r) =>
    [r["sid"], r["from_number"], r["to_number"], `"${String(r["body"] ?? "").replace(/"/g, '""')}"`, r["status"], r["direction"], r["num_segments"], r["price"], r["error_code"], r["created_at"]].join(",")
  )].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=sms_logs.csv" } });
});

// ─── Calls ────────────────────────────────────────────────────────────────────

twilioRoutes.post("/make-call", async (c) => {
  const client = getTwilioClient(c.env);
  const { to, from, twiml, url } = await c.req.json<{ to: string; from?: string; twiml?: string; url?: string }>();
  if (!to) return c.json({ error: "to is required" }, 400);
  const fromNumber = from ?? c.env.TWILIO_PHONE_NUMBER;
  const opts: Record<string, unknown> = { to, from: fromNumber };
  if (url) opts["url"] = url;
  else opts["twiml"] = twiml ?? `<Response><Say voice="Polly.Joanna-Neural">Hello from RJ Business Solutions.</Say></Response>`;
  const call = await client.calls.create(opts as any);
  return c.json({ sid: call.sid, status: call.status, to: call.to, from: call.from });
});

twilioRoutes.post("/calls/outbound", async (c) => {
  const client = getTwilioClient(c.env);
  const { to, from, twiml, url } = await c.req.json<{ to: string; from: string; twiml?: string; url?: string }>();
  if (!to || !from) return c.json({ error: "to and from are required" }, 400);
  const opts: Record<string, unknown> = { to, from };
  if (url) opts["url"] = url;
  else opts["twiml"] = twiml ?? `<Response><Say voice="Polly.Joanna-Neural">Hello from RJ Business Solutions. Please hold.</Say></Response>`;
  const call = await client.calls.create(opts as any);
  return c.json({ sid: call.sid, status: call.status, to: call.to, from: call.from });
});

twilioRoutes.post("/calls/status-callback", async (c) => {
  const body = await c.req.parseBody();
  const { CallSid, CallStatus, From, To, Direction, Duration, StartTime, EndTime, Price } =
    body as Record<string, string | undefined>;
  if (!CallSid) return c.text("Missing CallSid", 400);
  const now = new Date().toISOString();
  await run(c.env.DB,
    `INSERT INTO call_logs (sid, from_number, to_number, status, direction, duration, start_time, end_time, price, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(sid) DO UPDATE SET status = excluded.status, duration = excluded.duration, end_time = excluded.end_time, price = excluded.price`,
    [CallSid, From ?? null, To ?? null, CallStatus ?? "unknown", Direction ?? null,
     Duration ? parseInt(Duration, 10) : 0, StartTime ?? null, EndTime ?? null, Price ?? null, now]
  );
  return c.text("<Response/>", 200, { "Content-Type": "text/xml" });
});

twilioRoutes.get("/calls/analytics", async (c) => {
  const days = parseInt(c.req.query("days") ?? "7", 10);
  const [daily, statuses, summary, directions, topCallers] = await Promise.all([
    query(c.env.DB, `SELECT date(created_at) AS day, COUNT(*) AS total_calls, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed, SUM(CASE WHEN status IN ('failed','busy','no-answer') THEN 1 ELSE 0 END) AS failed, ROUND(AVG(CASE WHEN status='completed' THEN duration ELSE NULL END),1) AS avg_duration, ROUND(SUM(CAST(REPLACE(COALESCE(price,'0'),'-','') AS REAL)),4) AS day_cost FROM call_logs WHERE created_at >= datetime('now','-${days} days') GROUP BY day ORDER BY day ASC`),
    query(c.env.DB, `SELECT status, COUNT(*) AS count FROM call_logs WHERE created_at >= datetime('now','-${days} days') GROUP BY status ORDER BY count DESC`),
    queryOne(c.env.DB, `SELECT COUNT(*) AS total_calls, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed, ROUND(AVG(CASE WHEN status='completed' THEN duration ELSE NULL END),1) AS avg_duration, MAX(duration) AS max_duration, ROUND(SUM(CAST(REPLACE(COALESCE(price,'0'),'-','') AS REAL)),4) AS total_cost FROM call_logs WHERE created_at >= datetime('now','-${days} days')`),
    query(c.env.DB, `SELECT direction, COUNT(*) AS count FROM call_logs WHERE created_at >= datetime('now','-${days} days') GROUP BY direction`),
    query(c.env.DB, `SELECT from_number, COUNT(*) AS count, SUM(duration) AS total_duration FROM call_logs WHERE created_at >= datetime('now','-${days} days') AND from_number IS NOT NULL GROUP BY from_number ORDER BY count DESC LIMIT 5`),
  ]);
  return c.json({ days, daily, statuses, summary, directions, topCallers });
});

twilioRoutes.post("/calls/log", async (c) => {
  const { sid, from, to, status, direction, duration, startTime, endTime, price } = await c.req.json<Record<string, unknown>>();
  await run(c.env.DB,
    "INSERT OR REPLACE INTO call_logs (sid, from_number, to_number, status, direction, duration, start_time, end_time, price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
    [sid, from, to, status, direction, duration ?? 0, startTime ?? null, endTime ?? null, price ?? null]
  );
  return c.json({ success: true });
});

twilioRoutes.get("/calls/logs", async (c) => {
  const rows = await query(c.env.DB, "SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 100");
  return c.json(rows);
});

twilioRoutes.get("/calls/export", async (c) => {
  const rows = await query(c.env.DB, "SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 5000") as Record<string, unknown>[];
  const header = "sid,from_number,to_number,status,direction,duration,start_time,end_time,price,created_at,notes";
  const csv = [header, ...rows.map((r) =>
    [r["sid"], r["from_number"], r["to_number"], r["status"], r["direction"], r["duration"], r["start_time"], r["end_time"], r["price"], r["created_at"], `"${String(r["notes"] ?? "").replace(/"/g, '""')}"`].join(",")
  )].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=call_logs.csv" } });
});

twilioRoutes.post("/calls/:sid/note", async (c) => {
  const { note } = await c.req.json<{ note: string }>();
  const sid = c.req.param("sid");
  await run(c.env.DB,
    "INSERT INTO call_logs (sid, notes, created_at) VALUES (?, ?, datetime('now')) ON CONFLICT(sid) DO UPDATE SET notes = excluded.notes",
    [sid, note]
  );
  return c.json({ success: true });
});

twilioRoutes.post("/calls/:sid/whisper", async (c) => {
  const client = getTwilioClient(c.env);
  const { message = "You have a whispered message from your supervisor." } = await c.req.json<{ message?: string }>();
  const twiml = `<Response><Say voice="Polly.Joanna-Neural">${message}</Say></Response>`;
  const updated = await client.calls(c.req.param("sid")).update({ twiml });
  return c.json({ sid: updated.sid, status: updated.status });
});

twilioRoutes.get("/calls/active", async (c) => {
  const client = getTwilioClient(c.env);
  const [inProgress, ringing] = await Promise.all([
    client.calls.list({ status: "in-progress" as any, limit: 50 }),
    client.calls.list({ status: "ringing" as any, limit: 20 }),
  ]);
  const all = [...inProgress, ...ringing];
  return c.json(all.map((call: any) => ({
    sid: call.sid, from: call.from, to: call.to, status: call.status,
    direction: call.direction, duration: call.duration, startTime: call.startTime,
    answeredBy: call.answeredBy ?? null, callerName: call.callerName ?? null,
    forwardedFrom: call.forwardedFrom ?? null, phoneNumberSid: call.phoneNumberSid ?? null,
  })));
});

twilioRoutes.get("/calls/recent", async (c) => {
  const client = getTwilioClient(c.env);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "30", 10), 100);
  const calls = await client.calls.list({ limit });
  return c.json(calls.map((call: any) => ({
    sid: call.sid, from: call.from, to: call.to, status: call.status,
    direction: call.direction, duration: call.duration,
    startTime: call.startTime, endTime: call.endTime ?? null,
    price: call.price ?? null, priceUnit: call.priceUnit ?? null,
  })));
});

twilioRoutes.post("/calls/:sid/transfer", async (c) => {
  const client = getTwilioClient(c.env);
  const { queueName, twimlUrl } = await c.req.json<{ queueName?: string; twimlUrl?: string }>();
  const twiml = `<Response><Enqueue>${queueName ?? "support"}</Enqueue></Response>`;
  const updated = await client.calls(c.req.param("sid")).update(
    twimlUrl ? { url: twimlUrl } : { twiml }
  );
  return c.json({ sid: updated.sid, status: updated.status });
});

twilioRoutes.post("/calls/:sid/hangup", async (c) => {
  const client = getTwilioClient(c.env);
  const updated = await client.calls(c.req.param("sid")).update({ status: "completed" });
  return c.json({ sid: updated.sid, status: updated.status });
});

// ─── Lookup ───────────────────────────────────────────────────────────────────

twilioRoutes.post("/lookup", async (c) => {
  const client = getTwilioClient(c.env);
  const { phoneNumber, fields } = await c.req.json<{ phoneNumber: string; fields?: string[] }>();
  const fetchOptions: Record<string, unknown> = {};
  if (fields?.length) fetchOptions["fields"] = fields.join(",");
  const result = await (client.lookups.v2.phoneNumbers(phoneNumber) as any).fetch(fetchOptions);
  return c.json({
    phoneNumber: result.phoneNumber,
    nationalFormat: result.nationalFormat,
    countryCode: result.countryCode,
    valid: result.valid,
    lineTypeIntelligence: result.lineTypeIntelligence ?? null,
    callerName: result.callerName ?? null,
  });
});

// ─── Recordings ───────────────────────────────────────────────────────────────

twilioRoutes.get("/recordings", async (c) => {
  const client = getTwilioClient(c.env);
  const callSid = c.req.query("callSid");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "25", 10), 100);
  const opts: Record<string, unknown> = { limit };
  if (callSid) opts["callSid"] = callSid;
  const recordings = await client.recordings.list(opts as any);
  return c.json(recordings.map((r) => ({
    sid: r.sid, callSid: r.callSid, duration: r.duration,
    status: r.status, source: r.source, dateCreated: r.dateCreated,
    downloadUrl: `https://api.twilio.com/2010-04-01/Accounts/${c.env.TWILIO_ACCOUNT_SID}/Recordings/${r.sid}.mp3`,
  })));
});

twilioRoutes.get("/recordings/:sid/stream", async (c) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = c.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return c.json({ error: "Missing credentials" }, 500);
  const recUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Recordings/${c.req.param("sid")}.mp3`;
  const upstream = await fetch(recUrl, {
    headers: { "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`) }
  });
  if (!upstream.ok) return c.json({ error: "Recording not found" }, upstream.status as any);
  return new Response(upstream.body, { headers: { "Content-Type": "audio/mpeg" } });
});

// ─── Conferences ──────────────────────────────────────────────────────────────

twilioRoutes.get("/conferences/active", async (c) => {
  const client = getTwilioClient(c.env);
  const conferences = await client.conferences.list({ status: "in-progress" as any, limit: 20 });
  const withParticipants = await Promise.all(conferences.map(async (conf) => {
    const participants = await client.conferences(conf.sid).participants.list({ limit: 20 });
    return {
      sid: conf.sid, friendlyName: conf.friendlyName, status: conf.status,
      dateCreated: conf.dateCreated,
      participants: participants.map((p) => ({ callSid: p.callSid, muted: p.muted, hold: p.hold, coaching: p.coaching })),
    };
  }));
  return c.json(withParticipants);
});

twilioRoutes.post("/conferences/:sid/end", async (c) => {
  const client = getTwilioClient(c.env);
  const updated = await client.conferences(c.req.param("sid")).update({ status: "completed" as any });
  return c.json({ sid: updated.sid, status: updated.status });
});

twilioRoutes.post("/conferences/:confSid/participants/:callSid/mute", async (c) => {
  const client = getTwilioClient(c.env);
  const { muted = true } = await c.req.json<{ muted?: boolean }>();
  const updated = await client.conferences(c.req.param("confSid")).participants(c.req.param("callSid")).update({ muted } as any);
  return c.json({ callSid: updated.callSid, muted: updated.muted });
});

// ─── Contacts ─────────────────────────────────────────────────────────────────

twilioRoutes.get("/contacts", async (c) => {
  const search = c.req.query("search");
  if (search) {
    const q = `%${search}%`;
    const rows = await query(c.env.DB,
      "SELECT * FROM contacts WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ? ORDER BY name ASC LIMIT 100",
      [q, q, q, q]
    );
    return c.json(rows);
  }
  const rows = await query(c.env.DB, "SELECT * FROM contacts ORDER BY name ASC LIMIT 200");
  return c.json(rows);
});

twilioRoutes.post("/contacts", async (c) => {
  const { name, phone, email, company, notes, tags } = await c.req.json<Record<string, string>>();
  if (!name) return c.json({ error: "name is required" }, 400);
  const now = new Date().toISOString();
  const row = await queryOne(c.env.DB,
    "INSERT INTO contacts (name, phone, email, company, notes, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    [name, phone ?? null, email ?? null, company ?? null, notes ?? null, tags ?? null, now, now]
  );
  return c.json(row ?? { success: true });
});

twilioRoutes.put("/contacts/:id", async (c) => {
  const { name, phone, email, company, notes, tags } = await c.req.json<Record<string, string>>();
  const now = new Date().toISOString();
  await run(c.env.DB,
    "UPDATE contacts SET name=?, phone=?, email=?, company=?, notes=?, tags=?, updated_at=? WHERE id=?",
    [name, phone ?? null, email ?? null, company ?? null, notes ?? null, tags ?? null, now, c.req.param("id")]
  );
  return c.json({ success: true });
});

twilioRoutes.delete("/contacts/:id", async (c) => {
  await run(c.env.DB, "DELETE FROM contacts WHERE id=?", [c.req.param("id")]);
  return c.json({ success: true });
});

// ─── Voicemails ───────────────────────────────────────────────────────────────

twilioRoutes.get("/voicemails", async (c) => {
  const client = getTwilioClient(c.env);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "30", 10), 100);
  const transcriptions = await client.transcriptions.list({ limit });
  const enriched = await Promise.all(transcriptions.map(async (t) => {
    let recording: Record<string, unknown> | null = null;
    try {
      if (t.recordingSid) {
        const rec = await client.recordings(t.recordingSid).fetch();
        recording = { sid: rec.sid, duration: rec.duration, dateCreated: rec.dateCreated, callSid: rec.callSid };
      }
    } catch {}
    return { sid: t.sid, status: t.status, duration: t.duration, transcriptionText: t.transcriptionText, recordingSid: t.recordingSid, dateCreated: t.dateCreated, price: t.price, priceUnit: t.priceUnit, recording };
  }));
  return c.json(enriched);
});

twilioRoutes.get("/voicemails/calls", async (c) => {
  const client = getTwilioClient(c.env);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 50);
  const recordings = await client.recordings.list({ limit });
  return c.json(recordings.map((r) => ({
    sid: r.sid, callSid: r.callSid, duration: r.duration, status: r.status, source: r.source, dateCreated: r.dateCreated,
    downloadUrl: `https://api.twilio.com/2010-04-01/Accounts/${c.env.TWILIO_ACCOUNT_SID}/Recordings/${r.sid}.mp3`,
  })));
});

twilioRoutes.delete("/voicemails/:sid", async (c) => {
  const client = getTwilioClient(c.env);
  const deleteRecording = c.req.query("deleteRecording") === "true";
  let recordingSid: string | null = null;
  try {
    const t = await client.transcriptions(c.req.param("sid")).fetch();
    recordingSid = t.recordingSid;
    await client.transcriptions(c.req.param("sid")).remove();
  } catch {}
  if (deleteRecording && recordingSid) {
    try { await client.recordings(recordingSid).remove(); } catch {}
  }
  return c.json({ success: true });
});

twilioRoutes.post("/voicemails/sms-reply", async (c) => {
  const client = getTwilioClient(c.env);
  const { to, from, body } = await c.req.json<{ to: string; from: string; body: string }>();
  if (!to || !from || !body) return c.json({ error: "to, from, body required" }, 400);
  const msg = await client.messages.create({ to, from, body });
  return c.json({ sid: msg.sid, status: msg.status });
});

// ─── Queues ───────────────────────────────────────────────────────────────────

twilioRoutes.get("/queues", async (c) => {
  const client = getTwilioClient(c.env);
  const queues = await client.queues.list({ limit: 50 });
  return c.json(queues.map((q) => ({ sid: q.sid, friendlyName: q.friendlyName, currentSize: q.currentSize, maxSize: q.maxSize, averageWaitTime: q.averageWaitTime, dateCreated: q.dateCreated })));
});

twilioRoutes.post("/queues", async (c) => {
  const client = getTwilioClient(c.env);
  const { friendlyName, maxSize } = await c.req.json<{ friendlyName: string; maxSize?: number }>();
  if (!friendlyName) return c.json({ error: "friendlyName required" }, 400);
  const q = await client.queues.create({ friendlyName, maxSize: maxSize ?? 100 });
  return c.json({ sid: q.sid, friendlyName: q.friendlyName });
});

twilioRoutes.delete("/queues/:sid", async (c) => {
  const client = getTwilioClient(c.env);
  await client.queues(c.req.param("sid")).remove();
  return c.json({ success: true });
});

twilioRoutes.get("/queues/:sid/members", async (c) => {
  const client = getTwilioClient(c.env);
  const members = await client.queues(c.req.param("sid")).members.list({ limit: 50 });
  return c.json(members.map((m) => ({ callSid: m.callSid, dateEnqueued: m.dateEnqueued, position: m.position, waitTime: m.waitTime })));
});

twilioRoutes.delete("/queues/:queueSid/members/:callSid", async (c) => {
  const client = getTwilioClient(c.env);
  await client.queues(c.req.param("queueSid")).members(c.req.param("callSid")).update({
    url: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical", method: "GET",
  });
  return c.json({ success: true });
});

// ─── Usage ────────────────────────────────────────────────────────────────────

twilioRoutes.get("/usage", async (c) => {
  const client = getTwilioClient(c.env);
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const category = c.req.query("category");
  const params: Record<string, unknown> = { limit: 100 };
  if (startDate) params["startDate"] = new Date(startDate);
  if (endDate) params["endDate"] = new Date(endDate);
  if (category) params["category"] = category as never;
  const records = await client.usage.records.list(params as never);
  return c.json(records.map((r) => ({ category: r.category, description: r.description, startDate: r.startDate, endDate: r.endDate, count: r.count, countUnit: r.countUnit, usage: r.usage, usageUnit: r.usageUnit, price: r.price, priceUnit: r.priceUnit })));
});

twilioRoutes.get("/usage/today", async (c) => {
  const client = getTwilioClient(c.env);
  const records = await client.usage.records.today.list({ limit: 100 });
  return c.json(records.map((r) => ({ category: r.category, description: r.description, count: r.count, countUnit: r.countUnit, usage: r.usage, usageUnit: r.usageUnit, price: r.price, priceUnit: r.priceUnit })));
});

twilioRoutes.get("/usage/thismonth", async (c) => {
  const client = getTwilioClient(c.env);
  const records = await client.usage.records.thisMonth.list({ limit: 100 });
  return c.json(records.map((r) => ({ category: r.category, description: r.description, count: r.count, countUnit: r.countUnit, usage: r.usage, usageUnit: r.usageUnit, price: r.price, priceUnit: r.priceUnit })));
});

// ─── Alerts ───────────────────────────────────────────────────────────────────

twilioRoutes.get("/alerts", async (c) => {
  const client = getTwilioClient(c.env);
  const logLevel = c.req.query("logLevel");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const params: Record<string, unknown> = { pageSize: 50 };
  if (logLevel) params["logLevel"] = logLevel;
  if (startDate) params["startDate"] = new Date(startDate);
  if (endDate) params["endDate"] = new Date(endDate);
  const alerts = await client.monitor.alerts.list(params as never);
  return c.json(alerts.map((a: any) => ({ sid: a.sid, logLevel: a.logLevel, errorCode: a.errorCode, alertText: a.alertText, requestUrl: a.requestUrl, requestMethod: a.requestMethod, responseBody: a.responseBody, responseStatusCode: a.responseStatusCode, dateCreated: a.dateCreated, serviceSid: a.serviceSid, resourceSid: a.resourceSid })));
});

// ─── Verify ───────────────────────────────────────────────────────────────────

twilioRoutes.get("/verify/services", async (c) => {
  const client = getTwilioClient(c.env);
  const services = await client.verify.v2.services.list({ limit: 20 });
  return c.json(services.map((s) => ({ sid: s.sid, friendlyName: s.friendlyName, codeLength: s.codeLength, lookupEnabled: s.lookupEnabled, psd2Enabled: s.psd2Enabled, dateCreated: s.dateCreated })));
});

twilioRoutes.post("/verify/services", async (c) => {
  const client = getTwilioClient(c.env);
  const { friendlyName, codeLength } = await c.req.json<{ friendlyName: string; codeLength?: number }>();
  if (!friendlyName) return c.json({ error: "friendlyName required" }, 400);
  const svc = await client.verify.v2.services.create({ friendlyName, codeLength: codeLength ?? 6 });
  return c.json({ sid: svc.sid, friendlyName: svc.friendlyName });
});

twilioRoutes.post("/verify/send", async (c) => {
  const client = getTwilioClient(c.env);
  const { serviceSid, to, channel } = await c.req.json<{ serviceSid: string; to: string; channel: string }>();
  if (!serviceSid || !to || !channel) return c.json({ error: "serviceSid, to, channel required" }, 400);
  const v = await client.verify.v2.services(serviceSid).verifications.create({ to, channel });
  return c.json({ sid: v.sid, status: v.status, to: v.to, channel: v.channel });
});

twilioRoutes.post("/verify/check", async (c) => {
  const client = getTwilioClient(c.env);
  const { serviceSid, to, code } = await c.req.json<{ serviceSid: string; to: string; code: string }>();
  if (!serviceSid || !to || !code) return c.json({ error: "serviceSid, to, code required" }, 400);
  const check = await client.verify.v2.services(serviceSid).verificationChecks.create({ to, code });
  return c.json({ status: check.status, valid: check.valid, to: check.to });
});

// ─── Messaging Services ───────────────────────────────────────────────────────

twilioRoutes.get("/messaging-services", async (c) => {
  const client = getTwilioClient(c.env);
  const services = await client.messaging.v1.services.list({ limit: 20 });
  return c.json(services.map((s: any) => ({ sid: s.sid, friendlyName: s.friendlyName, inboundRequestUrl: s.inboundRequestUrl, inboundMethod: s.inboundMethod, fallbackUrl: s.fallbackUrl, statusCallback: s.statusCallback, stickySession: s.stickySession, smartEncoding: s.smartEncoding, dateCreated: s.dateCreated })));
});

twilioRoutes.put("/messaging-services/:sid", async (c) => {
  const client = getTwilioClient(c.env);
  const updates = await c.req.json<Record<string, unknown>>();
  const svc = await client.messaging.v1.services(c.req.param("sid")).update(updates as never);
  return c.json({ sid: svc.sid, friendlyName: svc.friendlyName });
});

twilioRoutes.get("/messaging-services/:sid/phone-numbers", async (c) => {
  const client = getTwilioClient(c.env);
  const numbers = await client.messaging.v1.services(c.req.param("sid")).phoneNumbers.list({ limit: 50 });
  return c.json(numbers.map((n) => ({ sid: n.sid, phoneNumber: n.phoneNumber, countryCode: n.countryCode })));
});

// ─── Studio Flows ─────────────────────────────────────────────────────────────

twilioRoutes.get("/studio/flows", async (c) => {
  const client = getTwilioClient(c.env);
  const flows = await client.studio.v2.flows.list({ limit: 20 });
  return c.json(flows.map((f) => ({ sid: f.sid, friendlyName: f.friendlyName, status: f.status, revision: f.revision, dateCreated: f.dateCreated, dateUpdated: f.dateUpdated, webhookUrl: f.webhookUrl })));
});

twilioRoutes.get("/studio/flows/:sid/executions", async (c) => {
  const client = getTwilioClient(c.env);
  const execs = await client.studio.v2.flows(c.req.param("sid")).executions.list({ limit: 20 });
  return c.json(execs.map((e) => ({ sid: e.sid, status: e.status, dateCreated: e.dateCreated, dateUpdated: e.dateUpdated, context: e.context })));
});

twilioRoutes.post("/studio/flows/:sid/executions", async (c) => {
  const client = getTwilioClient(c.env);
  const { to, from, parameters } = await c.req.json<{ to: string; from: string; parameters?: Record<string, unknown> }>();
  if (!to || !from) return c.json({ error: "to and from required" }, 400);
  const exec = await client.studio.v2.flows(c.req.param("sid")).executions.create({ to, from, parameters });
  return c.json({ sid: exec.sid, status: exec.status });
});

// ─── TaskRouter ───────────────────────────────────────────────────────────────

twilioRoutes.get("/taskrouter/workspaces", async (c) => {
  const client = getTwilioClient(c.env);
  const workspaces = await client.taskrouter.v1.workspaces.list({ limit: 10 });
  return c.json(workspaces.map((w) => ({ sid: w.sid, friendlyName: w.friendlyName, defaultActivityName: w.defaultActivityName, dateCreated: w.dateCreated })));
});

twilioRoutes.get("/taskrouter/workspaces/:sid/tasks", async (c) => {
  const client = getTwilioClient(c.env);
  const tasks = await client.taskrouter.v1.workspaces(c.req.param("sid")).tasks.list({ limit: 50 });
  return c.json(tasks.map((t: any) => ({ sid: t.sid, friendlyName: t.friendlyName, assignmentStatus: t.assignmentStatus, priority: t.priority, age: t.age, taskQueueFriendlyName: t.taskQueueFriendlyName, workerName: t.workerName, dateCreated: t.dateCreated, attributes: t.attributes })));
});

twilioRoutes.get("/taskrouter/workspaces/:sid/workers", async (c) => {
  const client = getTwilioClient(c.env);
  const workers = await client.taskrouter.v1.workspaces(c.req.param("sid")).workers.list({ limit: 50 });
  return c.json(workers.map((w) => ({ sid: w.sid, friendlyName: w.friendlyName, activityName: w.activityName, available: w.available, dateCreated: w.dateCreated, dateStatusChanged: w.dateStatusChanged, attributes: w.attributes })));
});

export default twilioRoutes;
