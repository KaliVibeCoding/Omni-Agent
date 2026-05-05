import { Hono } from "hono";
import twilio from "twilio";
import type { Env } from "../index";
import { query, queryOne, run } from "../lib/d1";
import { encrypt, decrypt } from "../lib/encrypt";
import { requireUserId, AuthError } from "../lib/auth";

const tenant = new Hono<{ Bindings: Env }>();

// ─── GET /api/tenant/credentials ─────────────────────────────────────────────

tenant.get("/credentials", async (c) => {
  try {
    const userId = requireUserId(c.req.header("Authorization") ?? null);
    const row = await queryOne(c.env.DB,
      "SELECT * FROM tenant_credentials WHERE user_id=?", [userId]
    ) as any;
    if (!row) return c.json({ connected: false });
    return c.json({
      connected: true,
      accountSid: row.account_sid,
      accountName: row.account_name,
      plan: row.plan,
      hasApiKey: !!row.api_key_sid,
      createdAt: row.created_at,
    });
  } catch (e: any) {
    if (e instanceof AuthError) return c.json({ error: e.message }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ─── POST /api/tenant/credentials ────────────────────────────────────────────

tenant.post("/credentials", async (c) => {
  try {
    const userId = requireUserId(c.req.header("Authorization") ?? null);
    const encKey = c.env.ENCRYPTION_KEY;
    if (!encKey) return c.json({ error: "ENCRYPTION_KEY not configured" }, 500);

    const { accountSid, authToken, apiKeySid, apiKeySecret } =
      await c.req.json<{ accountSid: string; authToken: string; apiKeySid?: string; apiKeySecret?: string }>();

    if (!accountSid || !authToken)
      return c.json({ error: "accountSid and authToken are required" }, 400);

    let accountName: string;
    try {
      const client = twilio(accountSid, authToken);
      const account = await client.api.v2010.accounts(accountSid).fetch();
      accountName = account.friendlyName;
    } catch {
      return c.json({ error: "Invalid Twilio credentials. Check your Account SID and Auth Token." }, 400);
    }

    const authTokenEncrypted = await encrypt(authToken, encKey);
    const apiKeySecretEncrypted = apiKeySecret ? await encrypt(apiKeySecret, encKey) : null;
    const now = new Date().toISOString();

    const existing = await queryOne(c.env.DB,
      "SELECT id FROM tenant_credentials WHERE user_id=?", [userId]
    );

    if (existing) {
      await run(c.env.DB,
        "UPDATE tenant_credentials SET account_sid=?,auth_token_encrypted=?,account_name=?,api_key_sid=?,api_key_secret_encrypted=?,updated_at=? WHERE user_id=?",
        [accountSid, authTokenEncrypted, accountName, apiKeySid ?? null, apiKeySecretEncrypted, now, userId]
      );
    } else {
      await run(c.env.DB,
        "INSERT INTO tenant_credentials (user_id,account_sid,auth_token_encrypted,account_name,api_key_sid,api_key_secret_encrypted,plan,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
        [userId, accountSid, authTokenEncrypted, accountName, apiKeySid ?? null, apiKeySecretEncrypted, "starter", now, now]
      );
    }

    return c.json({ connected: true, accountSid, accountName, plan: "starter" });
  } catch (e: any) {
    if (e instanceof AuthError) return c.json({ error: e.message }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ─── PATCH /api/tenant/plan ───────────────────────────────────────────────────

tenant.patch("/plan", async (c) => {
  try {
    const userId = requireUserId(c.req.header("Authorization") ?? null);
    const { plan } = await c.req.json<{ plan: string }>();
    const valid = ["starter", "growth", "business", "enterprise"];
    if (!valid.includes(plan)) return c.json({ error: `Plan must be one of: ${valid.join(", ")}` }, 400);
    await run(c.env.DB, "UPDATE tenant_credentials SET plan=?,updated_at=datetime('now') WHERE user_id=?", [plan, userId]);
    return c.json({ plan });
  } catch (e: any) {
    if (e instanceof AuthError) return c.json({ error: e.message }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ─── DELETE /api/tenant/credentials ──────────────────────────────────────────

tenant.delete("/credentials", async (c) => {
  try {
    const userId = requireUserId(c.req.header("Authorization") ?? null);
    await run(c.env.DB, "DELETE FROM tenant_credentials WHERE user_id=?", [userId]);
    return c.json({ connected: false });
  } catch (e: any) {
    if (e instanceof AuthError) return c.json({ error: e.message }, 401);
    return c.json({ error: e.message }, 500);
  }
});

// ─── GET /api/tenant/twilio-client-info (internal helper) ────────────────────
// Used by other routes to get decrypted tenant credentials

export async function getTenantCredentials(
  db: D1Database,
  userId: string,
  encKey: string
): Promise<{ accountSid: string; authToken: string; apiKeySid?: string; apiKeySecret?: string; phoneNumber?: string } | null> {
  const row = await queryOne(db, "SELECT * FROM tenant_credentials WHERE user_id=?", [userId]) as any;
  if (!row) return null;
  const authToken = await decrypt(row.auth_token_encrypted, encKey);
  const apiKeySecret = row.api_key_secret_encrypted ? await decrypt(row.api_key_secret_encrypted, encKey) : undefined;
  return {
    accountSid: row.account_sid,
    authToken,
    apiKeySid: row.api_key_sid ?? undefined,
    apiKeySecret,
    phoneNumber: row.phone_number ?? undefined,
  };
}

export default tenant;
