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

// ─── Stats ────────────────────────────────────────────────────────────────────

router.get("/stats", async (req, res, next) => {
  try {
    const [total, byStatus, upcoming, thisWeek] = await Promise.all([
      queryD1("SELECT COUNT(*) AS total FROM appointments"),
      queryD1("SELECT status, COUNT(*) AS count FROM appointments GROUP BY status"),
      queryD1("SELECT * FROM appointments WHERE appointment_time >= datetime('now') AND status IN ('scheduled','confirmed') ORDER BY appointment_time ASC LIMIT 10"),
      queryD1("SELECT COUNT(*) AS count FROM appointments WHERE appointment_time >= datetime('now') AND appointment_time <= datetime('now','+7 days') AND status IN ('scheduled','confirmed')"),
    ]);
    res.json({
      total: total?.results?.[0] ?? { total: 0 },
      byStatus: byStatus?.results ?? [],
      upcoming: upcoming?.results ?? [],
      thisWeek: thisWeek?.results?.[0] ?? { count: 0 },
    });
  } catch (err) { next(err); }
});

// ─── List Appointments ────────────────────────────────────────────────────────

router.get("/appointments", async (req, res, next) => {
  try {
    const { status, date } = req.query as Record<string, string>;
    let sql = "SELECT * FROM appointments";
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (status) { conditions.push("status = ?"); params.push(status); }
    if (date) { conditions.push("date(appointment_time) = ?"); params.push(date); }
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY appointment_time ASC LIMIT 200";
    const result = await queryD1(sql, params);
    res.json(result?.results ?? []);
  } catch (err) { next(err); }
});

// ─── Create Appointment ───────────────────────────────────────────────────────

router.post("/appointments", async (req, res, next) => {
  try {
    const { patient_name, patient_phone, patient_email, provider_name, appointment_time, type = "telehealth", notes } =
      req.body as Record<string, string>;
    if (!patient_name || !patient_phone || !appointment_time) {
      res.status(400).json({ error: "patient_name, patient_phone, appointment_time are required" });
      return;
    }
    const now = new Date().toISOString();
    const result = await queryD1(
      "INSERT INTO appointments (patient_name, patient_phone, patient_email, provider_name, appointment_time, type, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
      [patient_name, patient_phone, patient_email ?? null, provider_name ?? null, appointment_time, type, notes ?? null, now, now]
    );
    res.status(201).json(result?.results?.[0] ?? { success: true });
  } catch (err) { next(err); }
});

// ─── Update Appointment ───────────────────────────────────────────────────────

router.put("/appointments/:id", async (req, res, next) => {
  try {
    const { patient_name, patient_phone, patient_email, provider_name, appointment_time, status, type, notes } =
      req.body as Record<string, string>;
    const now = new Date().toISOString();
    await queryD1(
      "UPDATE appointments SET patient_name=?, patient_phone=?, patient_email=?, provider_name=?, appointment_time=?, status=?, type=?, notes=?, updated_at=? WHERE id=?",
      [patient_name, patient_phone, patient_email ?? null, provider_name ?? null, appointment_time, status ?? "scheduled", type ?? "telehealth", notes ?? null, now, req.params["id"]]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Update Status ────────────────────────────────────────────────────────────

router.patch("/appointments/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body as { status: string };
    await queryD1("UPDATE appointments SET status=?, updated_at=datetime('now') WHERE id=?", [status, req.params["id"]]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Delete Appointment ───────────────────────────────────────────────────────

router.delete("/appointments/:id", async (req, res, next) => {
  try {
    await queryD1("DELETE FROM appointments WHERE id=?", [req.params["id"]]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── SMS Reminder ─────────────────────────────────────────────────────────────

router.post("/appointments/:id/remind", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const apptResult = await queryD1("SELECT * FROM appointments WHERE id=?", [req.params["id"]]);
    const appt = apptResult?.results?.[0] as any;
    if (!appt) { res.status(404).json({ error: "Appointment not found" }); return; }
    const { customMessage } = req.body as { customMessage?: string };
    const apptDate = new Date(appt.appointment_time).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const body = customMessage ??
      `Reminder: You have a ${appt.type} appointment on ${apptDate}${appt.provider_name ? ` with ${appt.provider_name}` : ""}. Reply STOP to opt out.`;
    const fromNumber = process.env["TWILIO_PHONE_NUMBER"]!;
    const msg = await client.messages.create({ to: appt.patient_phone, from: fromNumber, body });
    await queryD1("UPDATE appointments SET reminder_sent=1, updated_at=datetime('now') WHERE id=?", [req.params["id"]]);
    res.json({ sid: msg.sid, status: msg.status, to: msg.to, body });
  } catch (err) { next(err); }
});

// ─── Video Invite ─────────────────────────────────────────────────────────────

router.post("/appointments/:id/video-invite", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const apptResult = await queryD1("SELECT * FROM appointments WHERE id=?", [req.params["id"]]);
    const appt = apptResult?.results?.[0] as any;
    if (!appt) { res.status(404).json({ error: "Appointment not found" }); return; }
    const { videoUrl } = req.body as { videoUrl: string };
    if (!videoUrl) { res.status(400).json({ error: "videoUrl is required" }); return; }
    const apptDate = new Date(appt.appointment_time).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const body = `Your telehealth appointment is on ${apptDate}. Join your video session: ${videoUrl} — Reply STOP to opt out.`;
    const fromNumber = process.env["TWILIO_PHONE_NUMBER"]!;
    const msg = await client.messages.create({ to: appt.patient_phone, from: fromNumber, body });
    await queryD1("UPDATE appointments SET video_room_sid=?, updated_at=datetime('now') WHERE id=?", [videoUrl, req.params["id"]]);
    res.json({ sid: msg.sid, status: msg.status, to: msg.to });
  } catch (err) { next(err); }
});

// ─── Bulk Remind ──────────────────────────────────────────────────────────────

router.post("/appointments/bulk-remind", async (req, res, next) => {
  try {
    const client = getTwilioClient();
    const { date, customMessage } = req.body as { date?: string; customMessage?: string };
    const targetDate = date ?? new Date().toISOString().split("T")[0];
    const apptResult = await queryD1(
      "SELECT * FROM appointments WHERE date(appointment_time)=? AND status IN ('scheduled','confirmed') AND reminder_sent=0",
      [targetDate]
    );
    const appts = (apptResult?.results ?? []) as any[];
    const fromNumber = process.env["TWILIO_PHONE_NUMBER"]!;
    const results = await Promise.allSettled(appts.map(async (appt) => {
      const apptDate = new Date(appt.appointment_time).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
      const body = customMessage ?? `Reminder: You have a telehealth appointment today at ${apptDate}. Reply STOP to opt out.`;
      const msg = await client.messages.create({ to: appt.patient_phone, from: fromNumber, body });
      await queryD1("UPDATE appointments SET reminder_sent=1, updated_at=datetime('now') WHERE id=?", [appt.id]);
      return { id: appt.id, sid: msg.sid, to: msg.to };
    }));
    res.json({ sent: results.filter(r => r.status === "fulfilled").length, total: appts.length });
  } catch (err) { next(err); }
});

export default router;
