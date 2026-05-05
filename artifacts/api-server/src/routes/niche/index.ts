import { Router } from "express";
import { getAuth } from "@clerk/express";
import { getTenantTwilioClient } from "../../lib/tenantTwilio";
import pg from "pg";

const { Pool } = pg;
const router = Router();

let pool: InstanceType<typeof Pool> | null = null;
function getPool(): InstanceType<typeof Pool> | null {
  if (!pool && process.env["DATABASE_URL"]) {
    pool = new Pool({
      connectionString: process.env["DATABASE_URL"],
      ssl: process.env["NODE_ENV"] === "production" ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

async function ensureTable() {
  const db = getPool();
  if (!db) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS niche_records (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      entity_phone TEXT NOT NULL,
      entity_email TEXT,
      record_type TEXT DEFAULT 'general',
      status TEXT DEFAULT 'new',
      notes TEXT,
      assigned_to TEXT,
      scheduled_at TIMESTAMPTZ,
      reminder_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS niche_records_slug_idx ON niche_records(slug)`);
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

router.get("/:slug/stats", async (req, res, next) => {
  try {
    const { slug } = req.params as { slug: string };
    const db = getPool();
    if (!db) return res.json({ total: 0, active: 0, today: 0, thisWeek: 0 });
    await ensureTable();
    const [total, active, today, week, byStatus] = await Promise.all([
      db.query("SELECT COUNT(*) FROM niche_records WHERE slug=$1", [slug]),
      db.query("SELECT COUNT(*) FROM niche_records WHERE slug=$1 AND status NOT IN ('completed','cancelled','closed','resolved','rejected','sold','lapsed','declined')", [slug]),
      db.query("SELECT COUNT(*) FROM niche_records WHERE slug=$1 AND DATE(created_at)=CURRENT_DATE", [slug]),
      db.query("SELECT COUNT(*) FROM niche_records WHERE slug=$1 AND created_at >= NOW() - INTERVAL '7 days'", [slug]),
      db.query("SELECT status, COUNT(*) as count FROM niche_records WHERE slug=$1 GROUP BY status ORDER BY count DESC", [slug]),
    ]);
    res.json({
      total: parseInt(total.rows[0].count),
      active: parseInt(active.rows[0].count),
      today: parseInt(today.rows[0].count),
      thisWeek: parseInt(week.rows[0].count),
      byStatus: byStatus.rows,
    });
  } catch (err) { next(err); }
});

// ─── List Records ──────────────────────────────────────────────────────────────

router.get("/:slug/records", async (req, res, next) => {
  try {
    const { slug } = req.params as { slug: string };
    const { status } = req.query as Record<string, string>;
    const db = getPool();
    if (!db) return res.json([]);
    await ensureTable();
    let sql = "SELECT * FROM niche_records WHERE slug=$1";
    const params: unknown[] = [slug];
    if (status && status !== "all") { sql += " AND status=$2"; params.push(status); }
    sql += " ORDER BY created_at DESC LIMIT 200";
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── Create Record ─────────────────────────────────────────────────────────────

router.post("/:slug/records", async (req, res, next) => {
  try {
    const { slug } = req.params as { slug: string };
    const { entity_name, entity_phone, entity_email, record_type, notes, assigned_to, scheduled_at } =
      req.body as Record<string, string>;
    if (!entity_name || !entity_phone) {
      res.status(400).json({ error: "entity_name and entity_phone are required" });
      return;
    }
    const db = getPool();
    if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }
    await ensureTable();
    const result = await db.query(
      `INSERT INTO niche_records (slug, entity_name, entity_phone, entity_email, record_type, notes, assigned_to, scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [slug, entity_name, entity_phone, entity_email || null, record_type || "general", notes || null, assigned_to || null, scheduled_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── Update Status ─────────────────────────────────────────────────────────────

router.patch("/:slug/records/:id/status", async (req, res, next) => {
  try {
    const { slug, id } = req.params as { slug: string; id: string };
    const { status } = req.body as { status: string };
    const db = getPool();
    if (!db) { res.json({ success: false }); return; }
    await db.query("UPDATE niche_records SET status=$1, updated_at=NOW() WHERE id=$2 AND slug=$3", [status, id, slug]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Delete Record ─────────────────────────────────────────────────────────────

router.delete("/:slug/records/:id", async (req, res, next) => {
  try {
    const { slug, id } = req.params as { slug: string; id: string };
    const db = getPool();
    if (!db) { res.json({ success: false }); return; }
    await db.query("DELETE FROM niche_records WHERE id=$1 AND slug=$2", [id, slug]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Send SMS ──────────────────────────────────────────────────────────────────

router.post("/:slug/records/:id/sms", async (req, res, next) => {
  try {
    const { slug, id } = req.params as { slug: string; id: string };
    const { userId } = getAuth(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { message } = req.body as { message: string };
    if (!message) { res.status(400).json({ error: "message is required" }); return; }
    const db = getPool();
    if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }
    const result = await db.query("SELECT * FROM niche_records WHERE id=$1 AND slug=$2", [id, slug]);
    const record = result.rows[0] as any;
    if (!record) { res.status(404).json({ error: "Record not found" }); return; }
    const { client } = await getTenantTwilioClient(userId);
    const fromNumber = process.env["TWILIO_PHONE_NUMBER"]!;
    const body = message.endsWith("opt out.") ? message : message + " Reply STOP to opt out.";
    const msg = await client.messages.create({ to: record.entity_phone, from: fromNumber, body });
    await db.query("UPDATE niche_records SET reminder_sent=TRUE, updated_at=NOW() WHERE id=$1", [id]);
    res.json({ sid: msg.sid, status: msg.status, to: msg.to, body });
  } catch (err) { next(err); }
});

// ─── Bulk SMS ──────────────────────────────────────────────────────────────────

router.post("/:slug/bulk-sms", async (req, res, next) => {
  try {
    const { slug } = req.params as { slug: string };
    const { userId } = getAuth(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { message, status_filter } = req.body as { message: string; status_filter?: string };
    if (!message) { res.status(400).json({ error: "message is required" }); return; }
    const db = getPool();
    if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }
    let sql = "SELECT * FROM niche_records WHERE slug=$1";
    const params: unknown[] = [slug];
    if (status_filter && status_filter !== "all") { sql += " AND status=$2"; params.push(status_filter); }
    const records = (await db.query(sql, params)).rows as any[];
    const { client } = await getTenantTwilioClient(userId);
    const fromNumber = process.env["TWILIO_PHONE_NUMBER"]!;
    const body = message + " Reply STOP to opt out.";
    const results = await Promise.allSettled(records.map((r: any) =>
      client.messages.create({ to: r.entity_phone, from: fromNumber, body })
    ));
    const sent = results.filter(r => r.status === "fulfilled").length;
    res.json({ sent, total: records.length });
  } catch (err) { next(err); }
});

export default router;
