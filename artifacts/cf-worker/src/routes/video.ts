import { Hono } from "hono";
import twilio from "twilio";
import type { Env } from "../index";

const video = new Hono<{ Bindings: Env }>();

function getTwilioClient(env: Env) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET } = env;
  if (!TWILIO_ACCOUNT_SID) throw new Error("TWILIO_ACCOUNT_SID not configured");
  if (TWILIO_AUTH_TOKEN) return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  if (TWILIO_API_KEY_SID && TWILIO_API_KEY_SECRET) {
    return twilio(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, { accountSid: TWILIO_ACCOUNT_SID });
  }
  throw new Error("Set TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET");
}

// ─── Create Room ──────────────────────────────────────────────────────────────

video.post("/rooms", async (c) => {
  const client = getTwilioClient(c.env);
  const {
    uniqueName, type = "go", maxParticipants,
    recordParticipantsOnConnect = false, statusCallback,
  } = await c.req.json<{
    uniqueName?: string; type?: string; maxParticipants?: number;
    recordParticipantsOnConnect?: boolean; statusCallback?: string;
  }>();
  const opts: Record<string, unknown> = { type };
  if (uniqueName) opts["uniqueName"] = uniqueName;
  if (maxParticipants) opts["maxParticipants"] = maxParticipants;
  if (recordParticipantsOnConnect) opts["recordParticipantsOnConnect"] = true;
  if (statusCallback) opts["statusCallback"] = statusCallback;
  const room = await (client.video.v1.rooms as any).create(opts);
  return c.json({
    sid: room.sid, uniqueName: room.uniqueName, status: room.status,
    type: room.type, maxParticipants: room.maxParticipants,
    dateCreated: room.dateCreated,
  });
});

// ─── List Rooms ───────────────────────────────────────────────────────────────

video.get("/rooms", async (c) => {
  const client = getTwilioClient(c.env);
  const status = c.req.query("status") ?? "in-progress";
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 50);
  const rooms = await (client.video.v1.rooms as any).list({ status, limit });
  return c.json(rooms.map((r: any) => ({
    sid: r.sid, uniqueName: r.uniqueName, status: r.status, type: r.type,
    maxParticipants: r.maxParticipants, dateCreated: r.dateCreated,
    endTime: r.endTime, duration: r.duration,
  })));
});

// ─── Get Room ─────────────────────────────────────────────────────────────────

video.get("/rooms/:sid", async (c) => {
  const client = getTwilioClient(c.env);
  const room = await (client.video.v1.rooms(c.req.param("sid")) as any).fetch();
  return c.json({
    sid: room.sid, uniqueName: room.uniqueName, status: room.status,
    type: room.type, maxParticipants: room.maxParticipants,
    dateCreated: room.dateCreated, endTime: room.endTime, duration: room.duration,
  });
});

// ─── End Room ─────────────────────────────────────────────────────────────────

video.post("/rooms/:sid/end", async (c) => {
  const client = getTwilioClient(c.env);
  const updated = await (client.video.v1.rooms(c.req.param("sid")) as any).update({ status: "completed" });
  return c.json({ sid: updated.sid, status: updated.status });
});

// ─── Participants ─────────────────────────────────────────────────────────────

video.get("/rooms/:sid/participants", async (c) => {
  const client = getTwilioClient(c.env);
  const participants = await (client.video.v1.rooms(c.req.param("sid")).participants as any).list({ limit: 20 });
  return c.json(participants.map((p: any) => ({
    sid: p.sid, identity: p.identity, status: p.status,
    startTime: p.startTime, endTime: p.endTime, duration: p.duration,
  })));
});

// ─── Room Recordings ─────────────────────────────────────────────────────────

video.get("/rooms/:sid/recordings", async (c) => {
  const client = getTwilioClient(c.env);
  const recs = await (client.video.v1.rooms(c.req.param("sid")).recordings as any).list({ limit: 20 });
  return c.json(recs.map((r: any) => ({
    sid: r.sid, status: r.status, type: r.type, codec: r.codec,
    duration: r.duration, containerFormat: r.containerFormat,
    groupingSids: r.groupingSids, dateCreated: r.dateCreated,
  })));
});

// ─── Generate Video Access Token ──────────────────────────────────────────────

video.post("/token", async (c) => {
  const { identity, roomName } = await c.req.json<{ identity: string; roomName?: string }>();
  if (!identity) return c.json({ error: "identity is required" }, 400);
  const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET } = c.env;
  if (!TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
    return c.json({ error: "TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET required for video tokens" }, 500);
  }
  const AccessToken = twilio.jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;
  const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
    identity, ttl: 3600,
  });
  token.addGrant(new VideoGrant({ room: roomName }));
  return c.json({ token: token.toJwt(), identity, room: roomName ?? null });
});

export default video;
