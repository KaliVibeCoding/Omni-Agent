import { Hono } from "hono";
import twilio from "twilio";
import type { Env } from "../index";

const conversations = new Hono<{ Bindings: Env }>();

function getTwilioClient(env: Env) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET } = env;
  if (!TWILIO_ACCOUNT_SID) throw new Error("TWILIO_ACCOUNT_SID not configured");
  if (TWILIO_AUTH_TOKEN) return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  if (TWILIO_API_KEY_SID && TWILIO_API_KEY_SECRET) {
    return twilio(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, { accountSid: TWILIO_ACCOUNT_SID });
  }
  throw new Error("Set TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET");
}

// ─── List Conversations ───────────────────────────────────────────────────────

conversations.get("/", async (c) => {
  const client = getTwilioClient(c.env);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 50);
  const cvs = await (client.conversations.v1.conversations as any).list({ limit });
  return c.json(cvs.map((cv: any) => ({
    sid: cv.sid, friendlyName: cv.friendlyName, state: cv.state,
    dateCreated: cv.dateCreated, dateUpdated: cv.dateUpdated,
    messagesCount: cv.messagesCount ?? 0,
  })));
});

// ─── Create Conversation ──────────────────────────────────────────────────────

conversations.post("/", async (c) => {
  const client = getTwilioClient(c.env);
  const { friendlyName } = await c.req.json<{ friendlyName?: string }>();
  const opts: Record<string, unknown> = {};
  if (friendlyName) opts["friendlyName"] = friendlyName;
  const cv = await (client.conversations.v1.conversations as any).create(opts);
  return c.json({ sid: cv.sid, friendlyName: cv.friendlyName, state: cv.state, dateCreated: cv.dateCreated }, 201);
});

// ─── Get Conversation ─────────────────────────────────────────────────────────

conversations.get("/:sid", async (c) => {
  const client = getTwilioClient(c.env);
  const cv = await (client.conversations.v1.conversations(c.req.param("sid")) as any).fetch();
  return c.json({ sid: cv.sid, friendlyName: cv.friendlyName, state: cv.state, dateCreated: cv.dateCreated, dateUpdated: cv.dateUpdated });
});

// ─── Update / Close Conversation ─────────────────────────────────────────────

conversations.put("/:sid", async (c) => {
  const client = getTwilioClient(c.env);
  const updates = await c.req.json<{ friendlyName?: string; state?: string }>();
  const cv = await (client.conversations.v1.conversations(c.req.param("sid")) as any).update(updates);
  return c.json({ sid: cv.sid, friendlyName: cv.friendlyName, state: cv.state });
});

// ─── Delete Conversation ──────────────────────────────────────────────────────

conversations.delete("/:sid", async (c) => {
  const client = getTwilioClient(c.env);
  await (client.conversations.v1.conversations(c.req.param("sid")) as any).remove();
  return c.body(null, 204);
});

// ─── List Messages ────────────────────────────────────────────────────────────

conversations.get("/:sid/messages", async (c) => {
  const client = getTwilioClient(c.env);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 100);
  const msgs = await (client.conversations.v1.conversations(c.req.param("sid")).messages as any).list({ limit });
  return c.json(msgs.map((m: any) => ({
    sid: m.sid, author: m.author, body: m.body,
    dateCreated: m.dateCreated, index: m.index,
  })));
});

// ─── Send Message ─────────────────────────────────────────────────────────────

conversations.post("/:sid/messages", async (c) => {
  const client = getTwilioClient(c.env);
  const { author, body } = await c.req.json<{ author: string; body: string }>();
  if (!author || !body) return c.json({ error: "author and body are required" }, 400);
  const msg = await (client.conversations.v1.conversations(c.req.param("sid")).messages as any).create({ author, body });
  return c.json({ sid: msg.sid, author: msg.author, body: msg.body, dateCreated: msg.dateCreated });
});

// ─── List Participants ────────────────────────────────────────────────────────

conversations.get("/:sid/participants", async (c) => {
  const client = getTwilioClient(c.env);
  const ps = await (client.conversations.v1.conversations(c.req.param("sid")).participants as any).list({ limit: 20 });
  return c.json(ps.map((p: any) => ({
    sid: p.sid, identity: p.identity ?? null,
    messagingBinding: p.messagingBinding ?? null, dateCreated: p.dateCreated,
  })));
});

// ─── Add Participant ──────────────────────────────────────────────────────────

conversations.post("/:sid/participants", async (c) => {
  const client = getTwilioClient(c.env);
  const { identity, phoneNumber, proxyAddress } = await c.req.json<{
    identity?: string; phoneNumber?: string; proxyAddress?: string;
  }>();
  const opts: Record<string, unknown> = {};
  if (identity) {
    opts["identity"] = identity;
  } else if (phoneNumber && proxyAddress) {
    opts["messagingBinding.address"] = phoneNumber;
    opts["messagingBinding.proxyAddress"] = proxyAddress;
  } else {
    return c.json({ error: "Either identity or (phoneNumber + proxyAddress) required" }, 400);
  }
  const p = await (client.conversations.v1.conversations(c.req.param("sid")).participants as any).create(opts);
  return c.json({ sid: p.sid, identity: p.identity, messagingBinding: p.messagingBinding });
});

// ─── Remove Participant ───────────────────────────────────────────────────────

conversations.delete("/:sid/participants/:participantSid", async (c) => {
  const client = getTwilioClient(c.env);
  await (client.conversations.v1.conversations(c.req.param("sid")).participants(c.req.param("participantSid")) as any).remove();
  return c.json({ success: true });
});

export default conversations;
