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

// ─── Create Room ──────────────────────────────────────────────────────────────

router.post("/rooms", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const {
      uniqueName, type = "go", maxParticipants,
      recordParticipantsOnConnect = false, statusCallback,
    } = req.body as {
      uniqueName?: string; type?: string; maxParticipants?: number;
      recordParticipantsOnConnect?: boolean; statusCallback?: string;
    };
    const opts: Record<string, unknown> = { type };
    if (uniqueName) opts["uniqueName"] = uniqueName;
    if (maxParticipants) opts["maxParticipants"] = maxParticipants;
    if (recordParticipantsOnConnect) opts["recordParticipantsOnConnect"] = true;
    if (statusCallback) opts["statusCallback"] = statusCallback;
    const room = await (client.video.v1.rooms as any).create(opts);
    res.status(201).json({
      sid: room.sid, uniqueName: room.uniqueName, status: room.status,
      type: room.type, maxParticipants: room.maxParticipants, dateCreated: room.dateCreated,
    });
  } catch (err) { next(err); }
});

// ─── List Rooms ───────────────────────────────────────────────────────────────

router.get("/rooms", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const status = (req.query["status"] as string) ?? "in-progress";
    const limit = Math.min(parseInt((req.query["limit"] as string) ?? "20", 10), 50);
    const rooms = await (client.video.v1.rooms as any).list({ status, limit });
    res.json(rooms.map((r: any) => ({
      sid: r.sid, uniqueName: r.uniqueName, status: r.status, type: r.type,
      maxParticipants: r.maxParticipants, dateCreated: r.dateCreated,
      endTime: r.endTime, duration: r.duration,
    })));
  } catch (err) { next(err); }
});

// ─── Get Room ─────────────────────────────────────────────────────────────────

router.get("/rooms/:sid", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const room = await (client.video.v1.rooms(req.params["sid"]!) as any).fetch();
    res.json({
      sid: room.sid, uniqueName: room.uniqueName, status: room.status, type: room.type,
      maxParticipants: room.maxParticipants, dateCreated: room.dateCreated,
      endTime: room.endTime, duration: room.duration,
    });
  } catch (err) { next(err); }
});

// ─── End Room ─────────────────────────────────────────────────────────────────

router.post("/rooms/:sid/end", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const updated = await (client.video.v1.rooms(req.params["sid"]!) as any).update({ status: "completed" });
    res.json({ sid: updated.sid, status: updated.status });
  } catch (err) { next(err); }
});

// ─── Participants ─────────────────────────────────────────────────────────────

router.get("/rooms/:sid/participants", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const participants = await (client.video.v1.rooms(req.params["sid"]!).participants as any).list({ limit: 20 });
    res.json(participants.map((p: any) => ({
      sid: p.sid, identity: p.identity, status: p.status,
      startTime: p.startTime, endTime: p.endTime, duration: p.duration,
    })));
  } catch (err) { next(err); }
});

// ─── Room Recordings ─────────────────────────────────────────────────────────

router.get("/rooms/:sid/recordings", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const recs = await (client.video.v1.rooms(req.params["sid"]!).recordings as any).list({ limit: 20 });
    res.json(recs.map((r: any) => ({
      sid: r.sid, status: r.status, type: r.type, codec: r.codec,
      duration: r.duration, containerFormat: r.containerFormat,
      groupingSids: r.groupingSids, dateCreated: r.dateCreated,
    })));
  } catch (err) { next(err); }
});

// ─── Generate Video Access Token ──────────────────────────────────────────────

router.post("/token", async (req, res, next) => {
  try {
    const { identity, roomName } = req.body as { identity: string; roomName?: string };
    if (!identity) { res.status(400).json({ error: "identity is required" }); return; }
    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    const apiKeySid = process.env["TWILIO_API_KEY_SID"];
    const apiKeySecret = process.env["TWILIO_API_KEY_SECRET"];
    if (!accountSid || !apiKeySid || !apiKeySecret) {
      res.status(500).json({ error: "TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET required for video tokens" });
      return;
    }
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, { identity, ttl: 3600 });
    token.addGrant(new VideoGrant({ room: roomName }));
    res.json({ token: token.toJwt(), identity, room: roomName ?? null });
  } catch (err) { next(err); }
});

export default router;
