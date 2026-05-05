import { Hono } from "hono";
import twilio from "twilio";
import type { Env } from "../index";
import { query, queryOne, run } from "../lib/d1";
import { requireUserId, AuthError } from "../lib/auth";
import { getTenantCredentials } from "./tenant";

const niche = new Hono<{ Bindings: Env }>();

function getTwilioClientFromCreds(creds: { accountSid: string; authToken: string; apiKeySid?: string; apiKeySecret?: string }) {
  if (creds.authToken) return twilio(creds.accountSid, creds.authToken);
  if (creds.apiKeySid && creds.apiKeySecret) return twilio(creds.apiKeySid, creds.apiKeySecret, { accountSid: creds.accountSid });
  throw new Error("No valid Twilio credentials");
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

niche.get("/:slug/stats", async (c) => {
  const slug = c.req.param("slug");
  const [total, active, today, week, byStatus] = await Promise.all([
    queryOne(c.env.DB, "SELECT COUNT(*) AS total FROM niche_records WHERE slug=?", [slug]),
    queryOne(c.env.DB, "SELECT COUNT(*) AS cnt FROM niche_records WHERE slug=? AND status NOT IN ('completed','cancelled','closed','resolved','rejected','sold','lapsed','declined')", [slug]),
    queryOne(c.env.DB, "SELECT COUNT(*) AS cnt FROM niche_records WHERE slug=? AND date(created_at)=date('now')", [slug]),
    queryOne(c.env.DB, "SELECT COUNT(*) AS cnt FROM niche_records WHERE slug=? AND created_at >= datetime('now','-7 days')", [slug]),
    query(c.env.DB, "SELECT status, COUNT(*) AS count FROM niche_records WHERE slug=? GROUP BY status ORDER BY count DESC", [slug]),
  ]);
  return c.json({
    total: (total as any)?.total ?? 0,
    active: (active as any)?.cnt ?? 0,
    today: (today as any)?.cnt ?? 0,
    thisWeek: (week as any)?.cnt ?? 0,
    byStatus,
  });
});

// ─── List Records ─────────────────────────────────────────────────────────────

niche.get("/:slug/records", async (c) => {
  const slug = c.req.param("slug");
  const status = c.req.query("status");
  let sql = "SELECT * FROM niche_records WHERE slug=?";
  const params: unknown[] = [slug];
  if (status && status !== "all") { sql += " AND status=?"; params.push(status); }
  sql += " ORDER BY created_at DESC LIMIT 200";
  const rows = await query(c.env.DB, sql, params);
  return c.json(rows);
});

// ─── Create Record ────────────────────────────────────────────────────────────

niche.post("/:slug/records", async (c) => {
  const slug = c.req.param("slug");
  const { entity_name, entity_phone, entity_email, record_type, notes, assigned_to, scheduled_at } =
    await c.req.json<Record<string, string>>();
  if (!entity_name || !entity_phone) return c.json({ error: "entity_name and entity_phone are required" }, 400);
  const now = new Date().toISOString();
  const row = await queryOne(c.env.DB,
    "INSERT INTO niche_records (slug,entity_name,entity_phone,entity_email,record_type,notes,assigned_to,scheduled_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING *",
    [slug, entity_name, entity_phone, entity_email ?? null, record_type ?? "general", notes ?? null, assigned_to ?? null, scheduled_at ?? null, now, now]
  );
  return c.json(row, 201);
});

// ─── Update Status ────────────────────────────────────────────────────────────

niche.patch("/:slug/records/:id/status", async (c) => {
  const { slug, id } = c.req.param() as { slug: string; id: string };
  const { status } = await c.req.json<{ status: string }>();
  await run(c.env.DB, "UPDATE niche_records SET status=?,updated_at=datetime('now') WHERE id=? AND slug=?", [status, id, slug]);
  return c.json({ success: true });
});

// ─── Delete Record ────────────────────────────────────────────────────────────

niche.delete("/:slug/records/:id", async (c) => {
  const { slug, id } = c.req.param() as { slug: string; id: string };
  await run(c.env.DB, "DELETE FROM niche_records WHERE id=? AND slug=?", [id, slug]);
  return c.json({ success: true });
});

// ─── Send SMS to Record ───────────────────────────────────────────────────────

niche.post("/:slug/records/:id/sms", async (c) => {
  try {
    const { slug, id } = c.req.param() as { slug: string; id: string };
    const userId = requireUserId(c.req.header("Authorization") ?? null);
    const { message } = await c.req.json<{ message: string }>();
    if (!message) return c.json({ error: "message is required" }, 400);

    const record = await queryOne(c.env.DB, "SELECT * FROM niche_records WHERE id=? AND slug=?", [id, slug]) as any;
    if (!record) return c.json({ error: "Record not found" }, 404);

    const encKey = c.env.ENCRYPTION_KEY;
    const creds = encKey ? await getTenantCredentials(c.env.DB, userId, encKey) : null;
    const accountSid = creds?.accountSid ?? c.env.TWILIO_ACCOUNT_SID;
    const authToken = creds?.authToken ?? c.env.TWILIO_AUTH_TOKEN;
    const fromNumber = c.env.TWILIO_PHONE_NUMBER;

    const client = twilio(accountSid, authToken);
    const body = message.endsWith("opt out.") ? message : message + " Reply STOP to opt out.";
    const msg = await client.messages.create({ to: record.entity_phone, from: fromNumber, body });
    await run(c.env.DB, "UPDATE niche_records SET reminder_sent=1,updated_at=datetime('now') WHERE id=?", [id]);
    return c.json({ sid: msg.sid, status: msg.status, to: msg.to, body });
  } catch (e: any) {
    if (e instanceof AuthError) return c.json({ error: e.message }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ─── Bulk SMS ─────────────────────────────────────────────────────────────────

niche.post("/:slug/bulk-sms", async (c) => {
  try {
    const slug = c.req.param("slug");
    const userId = requireUserId(c.req.header("Authorization") ?? null);
    const { message, status_filter } = await c.req.json<{ message: string; status_filter?: string }>();
    if (!message) return c.json({ error: "message is required" }, 400);

    let sql = "SELECT * FROM niche_records WHERE slug=?";
    const params: unknown[] = [slug];
    if (status_filter && status_filter !== "all") { sql += " AND status=?"; params.push(status_filter); }
    const records = await query(c.env.DB, sql, params) as any[];

    const encKey = c.env.ENCRYPTION_KEY;
    const creds = encKey ? await getTenantCredentials(c.env.DB, userId, encKey) : null;
    const accountSid = creds?.accountSid ?? c.env.TWILIO_ACCOUNT_SID;
    const authToken = creds?.authToken ?? c.env.TWILIO_AUTH_TOKEN;
    const fromNumber = c.env.TWILIO_PHONE_NUMBER;

    const client = twilio(accountSid, authToken);
    const body = message + " Reply STOP to opt out.";
    const results = await Promise.allSettled(records.map((r: any) =>
      client.messages.create({ to: r.entity_phone, from: fromNumber, body })
    ));
    return c.json({ sent: results.filter(r => r.status === "fulfilled").length, total: records.length });
  } catch (e: any) {
    if (e instanceof AuthError) return c.json({ error: e.message }, 401);
    return c.json({ error: e.message }, 500);
  }
});

export default niche;
