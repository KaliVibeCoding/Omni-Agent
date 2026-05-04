import { Router } from "express";
import twilio from "twilio";

const router = Router();

function getTwilioClient() {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const apiKeySid = process.env["TWILIO_API_KEY_SID"];
  const apiKeySecret = process.env["TWILIO_API_KEY_SECRET"];
  if (!accountSid) throw new Error("TWILIO_ACCOUNT_SID not configured");
  if (authToken) return twilio(accountSid, authToken);
  if (apiKeySid && apiKeySecret) return twilio(apiKeySid, apiKeySecret, { accountSid });
  throw new Error("Set TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET");
}

// ─── List Conversations ───────────────────────────────────────────────────────

router.get("/", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const limit = Math.min(parseInt((req.query["limit"] as string) ?? "20", 10), 50);
    const cvs = await (client.conversations.v1.conversations as any).list({ limit });
    res.json(cvs.map((cv: any) => ({
      sid: cv.sid, friendlyName: cv.friendlyName, state: cv.state,
      dateCreated: cv.dateCreated, dateUpdated: cv.dateUpdated,
      messagesCount: cv.messagesCount ?? 0,
    })));
  } catch (err) { next(err); }
});

// ─── Create Conversation ──────────────────────────────────────────────────────

router.post("/", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const { friendlyName } = req.body as { friendlyName?: string };
    const opts: Record<string, unknown> = {};
    if (friendlyName) opts["friendlyName"] = friendlyName;
    const cv = await (client.conversations.v1.conversations as any).create(opts);
    res.status(201).json({ sid: cv.sid, friendlyName: cv.friendlyName, state: cv.state, dateCreated: cv.dateCreated });
  } catch (err) { next(err); }
});

// ─── Get Conversation ─────────────────────────────────────────────────────────

router.get("/:sid", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const cv = await (client.conversations.v1.conversations(req.params["sid"]!) as any).fetch();
    res.json({ sid: cv.sid, friendlyName: cv.friendlyName, state: cv.state, dateCreated: cv.dateCreated, dateUpdated: cv.dateUpdated });
  } catch (err) { next(err); }
});

// ─── Update Conversation ──────────────────────────────────────────────────────

router.put("/:sid", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const cv = await (client.conversations.v1.conversations(req.params["sid"]!) as any).update(req.body);
    res.json({ sid: cv.sid, friendlyName: cv.friendlyName, state: cv.state });
  } catch (err) { next(err); }
});

// ─── Delete Conversation ──────────────────────────────────────────────────────

router.delete("/:sid", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    await (client.conversations.v1.conversations(req.params["sid"]!) as any).remove();
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── List Messages ────────────────────────────────────────────────────────────

router.get("/:sid/messages", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const limit = Math.min(parseInt((req.query["limit"] as string) ?? "50", 10), 100);
    const msgs = await (client.conversations.v1.conversations(req.params["sid"]!).messages as any).list({ limit });
    res.json(msgs.map((m: any) => ({
      sid: m.sid, author: m.author, body: m.body, dateCreated: m.dateCreated, index: m.index,
    })));
  } catch (err) { next(err); }
});

// ─── Send Message ─────────────────────────────────────────────────────────────

router.post("/:sid/messages", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const { author, body } = req.body as { author: string; body: string };
    if (!author || !body) { res.status(400).json({ error: "author and body are required" }); return; }
    const msg = await (client.conversations.v1.conversations(req.params["sid"]!).messages as any).create({ author, body });
    res.status(201).json({ sid: msg.sid, author: msg.author, body: msg.body, dateCreated: msg.dateCreated });
  } catch (err) { next(err); }
});

// ─── List Participants ────────────────────────────────────────────────────────

router.get("/:sid/participants", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const ps = await (client.conversations.v1.conversations(req.params["sid"]!).participants as any).list({ limit: 20 });
    res.json(ps.map((p: any) => ({
      sid: p.sid, identity: p.identity ?? null, messagingBinding: p.messagingBinding ?? null, dateCreated: p.dateCreated,
    })));
  } catch (err) { next(err); }
});

// ─── Add Participant ──────────────────────────────────────────────────────────

router.post("/:sid/participants", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const { identity, phoneNumber, proxyAddress } = req.body as {
      identity?: string; phoneNumber?: string; proxyAddress?: string;
    };
    const opts: Record<string, unknown> = {};
    if (identity) {
      opts["identity"] = identity;
    } else if (phoneNumber && proxyAddress) {
      opts["messagingBinding.address"] = phoneNumber;
      opts["messagingBinding.proxyAddress"] = proxyAddress;
    } else {
      res.status(400).json({ error: "Either identity or (phoneNumber + proxyAddress) required" });
      return;
    }
    const p = await (client.conversations.v1.conversations(req.params["sid"]!).participants as any).create(opts);
    res.status(201).json({ sid: p.sid, identity: p.identity, messagingBinding: p.messagingBinding });
  } catch (err) { next(err); }
});

// ─── Remove Participant ───────────────────────────────────────────────────────

router.delete("/:sid/participants/:participantSid", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    await (client.conversations.v1.conversations(req.params["sid"]!).participants(req.params["participantSid"]!) as any).remove();
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
