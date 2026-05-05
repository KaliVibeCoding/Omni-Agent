import { Router } from "express";
import twilio from "twilio";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { tenantCredentials } from "@workspace/db";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "../../lib/encrypt";

const router = Router();

// Helper: get current user ID
function getUserId(req: any): string | null {
  return getAuth(req)?.userId ?? null;
}

// ─── GET /api/tenant/credentials ─────────────────────────────────────────────
// Returns masked credentials info (no raw auth token)
router.get("/credentials", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const rows = await db
      .select()
      .from(tenantCredentials)
      .where(eq(tenantCredentials.userId, userId))
      .limit(1);

    if (!rows[0]) {
      res.json({ connected: false });
      return;
    }

    const creds = rows[0];
    res.json({
      connected: true,
      accountSid: creds.accountSid,
      accountName: creds.accountName,
      plan: creds.plan,
      hasApiKey: !!creds.apiKeySid,
      createdAt: creds.createdAt,
    });
  } catch (err) { next(err); }
});

// ─── POST /api/tenant/credentials ────────────────────────────────────────────
// Validate and save Twilio credentials
router.post("/credentials", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { accountSid, authToken, apiKeySid, apiKeySecret } = req.body as {
      accountSid: string;
      authToken: string;
      apiKeySid?: string;
      apiKeySecret?: string;
    };

    if (!accountSid || !authToken) {
      res.status(400).json({ error: "accountSid and authToken are required" });
      return;
    }

    // Validate credentials against Twilio API
    let accountName: string;
    try {
      const client = twilio(accountSid, authToken);
      const account = await client.api.v2010.accounts(accountSid).fetch();
      accountName = account.friendlyName;
    } catch {
      res.status(400).json({ error: "Invalid Twilio credentials. Check your Account SID and Auth Token." });
      return;
    }

    const authTokenEncrypted = encrypt(authToken);
    const apiKeySecretEncrypted = apiKeySecret ? encrypt(apiKeySecret) : null;

    // Upsert credentials
    const existing = await db
      .select({ id: tenantCredentials.id })
      .from(tenantCredentials)
      .where(eq(tenantCredentials.userId, userId))
      .limit(1);

    if (existing[0]) {
      await db
        .update(tenantCredentials)
        .set({
          accountSid,
          authTokenEncrypted,
          accountName,
          apiKeySid: apiKeySid ?? null,
          apiKeySecretEncrypted: apiKeySecretEncrypted ?? null,
          updatedAt: new Date(),
        })
        .where(eq(tenantCredentials.userId, userId));
    } else {
      await db.insert(tenantCredentials).values({
        userId,
        accountSid,
        authTokenEncrypted,
        accountName,
        apiKeySid: apiKeySid ?? null,
        apiKeySecretEncrypted: apiKeySecretEncrypted ?? null,
        plan: "starter",
      });
    }

    res.json({ connected: true, accountSid, accountName, plan: "starter" });
  } catch (err) { next(err); }
});

// ─── PATCH /api/tenant/plan ───────────────────────────────────────────────────
router.patch("/plan", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { plan } = req.body as { plan: string };
    const valid = ["starter", "growth", "business", "enterprise"];
    if (!valid.includes(plan)) {
      res.status(400).json({ error: `Plan must be one of: ${valid.join(", ")}` });
      return;
    }

    await db
      .update(tenantCredentials)
      .set({ plan, updatedAt: new Date() })
      .where(eq(tenantCredentials.userId, userId));

    res.json({ plan });
  } catch (err) { next(err); }
});

// ─── DELETE /api/tenant/credentials ──────────────────────────────────────────
router.delete("/credentials", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    await db
      .delete(tenantCredentials)
      .where(eq(tenantCredentials.userId, userId));

    res.json({ connected: false });
  } catch (err) { next(err); }
});

export default router;
