import { Hono } from "hono";
import type { Env } from "../index";
import { extractUserId } from "../lib/auth";
import { query } from "../lib/d1";
import { decodeClerkClaims, fetchUserEmail, isMasterAdminEmail } from "../lib/admin";

const admin = new Hono<{ Bindings: Env }>();

/**
 * Middleware: require the caller's email to be on the master admin allowlist.
 */
async function requireMasterAdmin(c: any): Promise<Response | null> {
  const authHeader = c.req.header("Authorization") ?? null;
  const userId = extractUserId(authHeader);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const claims = decodeClerkClaims(authHeader);
  let email = claims?.email ?? null;
  if (!email) email = await fetchUserEmail(userId, c.env.CLERK_SECRET_KEY);

  if (!isMasterAdminEmail(email)) {
    return c.json({ error: "Forbidden — master admin access required" }, 403);
  }
  return null;
}

/**
 * GET /api/admin/tenants
 * Returns a list of all tenant accounts with usage + plan summary.
 */
admin.get("/tenants", async (c) => {
  const denied = await requireMasterAdmin(c);
  if (denied) return denied;

  const rows = (await query(
    c.env.DB,
    `SELECT
       user_id, account_sid, account_name, plan, phone_number,
       (api_key_sid IS NOT NULL) AS has_api_key,
       created_at, updated_at
     FROM tenant_credentials
     ORDER BY created_at DESC
     LIMIT 500`,
    [],
  )) as any[];

  const tenants = rows.map((r) => ({
    userId: r.user_id,
    accountSid: r.account_sid,
    accountName: r.account_name ?? "—",
    plan: r.plan ?? "starter",
    phoneNumber: r.phone_number ?? null,
    hasApiKey: !!r.has_api_key,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return c.json({ tenants, total: tenants.length });
});

/**
 * GET /api/admin/metrics
 * Platform-wide aggregate metrics.
 */
admin.get("/metrics", async (c) => {
  const denied = await requireMasterAdmin(c);
  if (denied) return denied;

  const [tenantCount, smsCount, callCount, planRows] = await Promise.all([
    query(c.env.DB, "SELECT COUNT(*) AS n FROM tenant_credentials", []) as Promise<any[]>,
    query(c.env.DB, "SELECT COUNT(*) AS n FROM sms_logs", []) as Promise<any[]>,
    query(c.env.DB, "SELECT COUNT(*) AS n FROM call_logs", []) as Promise<any[]>,
    query(c.env.DB, "SELECT plan, COUNT(*) AS n FROM tenant_credentials GROUP BY plan", []) as Promise<any[]>,
  ]);

  const planDistribution: Record<string, number> = {};
  for (const row of planRows) planDistribution[row.plan ?? "starter"] = row.n;

  // MRR estimation based on plan tiers
  const PLAN_RATES: Record<string, number> = { starter: 79, growth: 199, business: 499, enterprise: 0 };
  const mrr = Object.entries(planDistribution).reduce(
    (sum, [plan, n]) => sum + (PLAN_RATES[plan] ?? 0) * (n as number),
    0,
  );

  return c.json({
    totalTenants: tenantCount[0]?.n ?? 0,
    totalSms: smsCount[0]?.n ?? 0,
    totalCalls: callCount[0]?.n ?? 0,
    planDistribution,
    mrr,
  });
});

/**
 * DELETE /api/admin/tenants/:userId
 * Force-disconnect a tenant (removes credentials only).
 */
admin.delete("/tenants/:userId", async (c) => {
  const denied = await requireMasterAdmin(c);
  if (denied) return denied;

  const targetUserId = c.req.param("userId");
  await c.env.DB.prepare("DELETE FROM tenant_credentials WHERE user_id=?")
    .bind(targetUserId)
    .run();
  return c.json({ ok: true, userId: targetUserId });
});

export default admin;
