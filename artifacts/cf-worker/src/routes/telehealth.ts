import { Hono } from "hono";
import twilio from "twilio";
import type { Env } from "../index";
import { query, queryOne, run } from "../lib/d1";

const telehealth = new Hono<{ Bindings: Env }>();

function getTwilioClient(env: Env) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET } = env;
  if (!TWILIO_ACCOUNT_SID) throw new Error("TWILIO_ACCOUNT_SID not configured");
  if (TWILIO_AUTH_TOKEN) return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  if (TWILIO_API_KEY_SID && TWILIO_API_KEY_SECRET) {
    return twilio(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, { accountSid: TWILIO_ACCOUNT_SID });
  }
  throw new Error("Set TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET");
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

telehealth.get("/stats", async (c) => {
  const [total, byStatus, upcoming, thisWeek] = await Promise.all([
    queryOne(c.env.DB, "SELECT COUNT(*) AS total FROM appointments"),
    query(c.env.DB, "SELECT status, COUNT(*) AS count FROM appointments GROUP BY status"),
    query(c.env.DB, "SELECT * FROM appointments WHERE appointment_time >= datetime('now') AND status IN ('scheduled','confirmed') ORDER BY appointment_time ASC LIMIT 10"),
    queryOne(c.env.DB, "SELECT COUNT(*) AS count FROM appointments WHERE appointment_time >= datetime('now') AND appointment_time <= datetime('now','+7 days') AND status IN ('scheduled','confirmed')"),
  ]);
  return c.json({ total, byStatus, upcoming, thisWeek });
});

// ─── List Appointments ────────────────────────────────────────────────────────

telehealth.get("/appointments", async (c) => {
  const status = c.req.query("status");
  const date = c.req.query("date");
  let sql = "SELECT * FROM appointments";
  const params: unknown[] = [];
  const conditions: string[] = [];
  if (status) { conditions.push("status = ?"); params.push(status); }
  if (date) { conditions.push("date(appointment_time) = ?"); params.push(date); }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY appointment_time ASC LIMIT 200";
  const rows = await query(c.env.DB, sql, params);
  return c.json(rows);
});

// ─── Create Appointment ───────────────────────────────────────────────────────

telehealth.post("/appointments", async (c) => {
  const {
    patient_name, patient_phone, patient_email, provider_name,
    appointment_time, type = "telehealth", notes,
  } = await c.req.json<Record<string, string>>();
  if (!patient_name || !patient_phone || !appointment_time) {
    return c.json({ error: "patient_name, patient_phone, appointment_time are required" }, 400);
  }
  const now = new Date().toISOString();
  const row = await queryOne(c.env.DB,
    "INSERT INTO appointments (patient_name, patient_phone, patient_email, provider_name, appointment_time, type, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    [patient_name, patient_phone, patient_email ?? null, provider_name ?? null, appointment_time, type, notes ?? null, now, now]
  );
  return c.json(row, 201);
});

// ─── Update Appointment ───────────────────────────────────────────────────────

telehealth.put("/appointments/:id", async (c) => {
  const {
    patient_name, patient_phone, patient_email, provider_name,
    appointment_time, status, type, notes,
  } = await c.req.json<Record<string, string>>();
  const now = new Date().toISOString();
  await run(c.env.DB,
    "UPDATE appointments SET patient_name=?, patient_phone=?, patient_email=?, provider_name=?, appointment_time=?, status=?, type=?, notes=?, updated_at=? WHERE id=?",
    [patient_name, patient_phone, patient_email ?? null, provider_name ?? null, appointment_time, status ?? "scheduled", type ?? "telehealth", notes ?? null, now, c.req.param("id")]
  );
  return c.json({ success: true });
});

// ─── Update Status ────────────────────────────────────────────────────────────

telehealth.patch("/appointments/:id/status", async (c) => {
  const { status } = await c.req.json<{ status: string }>();
  await run(c.env.DB, "UPDATE appointments SET status=?, updated_at=datetime('now') WHERE id=?", [status, c.req.param("id")]);
  return c.json({ success: true });
});

// ─── Delete Appointment ───────────────────────────────────────────────────────

telehealth.delete("/appointments/:id", async (c) => {
  await run(c.env.DB, "DELETE FROM appointments WHERE id=?", [c.req.param("id")]);
  return c.json({ success: true });
});

// ─── SMS Reminder ─────────────────────────────────────────────────────────────

telehealth.post("/appointments/:id/remind", async (c) => {
  const client = getTwilioClient(c.env);
  const appt = await queryOne(c.env.DB, "SELECT * FROM appointments WHERE id=?", [c.req.param("id")]) as any;
  if (!appt) return c.json({ error: "Appointment not found" }, 404);
  const { customMessage } = await c.req.json<{ customMessage?: string }>().catch(() => ({ customMessage: undefined }));
  const apptDate = new Date(appt.appointment_time).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const body = customMessage ??
    `Reminder: You have a ${appt.type} appointment on ${apptDate}${appt.provider_name ? ` with ${appt.provider_name}` : ""}. Reply STOP to opt out.`;
  const msg = await client.messages.create({ to: appt.patient_phone, from: c.env.TWILIO_PHONE_NUMBER, body });
  await run(c.env.DB, "UPDATE appointments SET reminder_sent=1, updated_at=datetime('now') WHERE id=?", [c.req.param("id")]);
  return c.json({ sid: msg.sid, status: msg.status, to: msg.to, body });
});

// ─── Video Invite ─────────────────────────────────────────────────────────────

telehealth.post("/appointments/:id/video-invite", async (c) => {
  const client = getTwilioClient(c.env);
  const appt = await queryOne(c.env.DB, "SELECT * FROM appointments WHERE id=?", [c.req.param("id")]) as any;
  if (!appt) return c.json({ error: "Appointment not found" }, 404);
  const { videoUrl } = await c.req.json<{ videoUrl: string }>();
  if (!videoUrl) return c.json({ error: "videoUrl is required" }, 400);
  const apptDate = new Date(appt.appointment_time).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const body = `Your telehealth appointment is on ${apptDate}. Join your video session: ${videoUrl} — Reply STOP to opt out.`;
  const msg = await client.messages.create({ to: appt.patient_phone, from: c.env.TWILIO_PHONE_NUMBER, body });
  await run(c.env.DB, "UPDATE appointments SET video_room_sid=?, updated_at=datetime('now') WHERE id=?", [videoUrl, c.req.param("id")]);
  return c.json({ sid: msg.sid, status: msg.status, to: msg.to });
});

// ─── Bulk Remind (today's appointments) ──────────────────────────────────────

telehealth.post("/appointments/bulk-remind", async (c) => {
  const client = getTwilioClient(c.env);
  const { date, customMessage } = await c.req.json<{ date?: string; customMessage?: string }>().catch(() => ({ date: undefined, customMessage: undefined }));
  const targetDate = date ?? new Date().toISOString().split("T")[0];
  const appts = await query(c.env.DB,
    "SELECT * FROM appointments WHERE date(appointment_time)=? AND status IN ('scheduled','confirmed') AND reminder_sent=0",
    [targetDate]
  ) as any[];
  const results = await Promise.allSettled(appts.map(async (appt) => {
    const apptDate = new Date(appt.appointment_time).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
    const body = customMessage ?? `Reminder: You have a telehealth appointment today at ${apptDate}. Reply STOP to opt out.`;
    const msg = await client.messages.create({ to: appt.patient_phone, from: c.env.TWILIO_PHONE_NUMBER, body });
    await run(c.env.DB, "UPDATE appointments SET reminder_sent=1, updated_at=datetime('now') WHERE id=?", [appt.id]);
    return { id: appt.id, sid: msg.sid, to: msg.to };
  }));
  return c.json({ sent: results.filter(r => r.status === "fulfilled").length, total: appts.length, results });
});

export default telehealth;
