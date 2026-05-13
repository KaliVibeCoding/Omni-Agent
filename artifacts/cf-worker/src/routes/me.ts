import { Hono } from "hono";
import type { Env } from "../index";
import { extractUserId } from "../lib/auth";
import { queryOne } from "../lib/d1";
import { decodeClerkClaims, fetchUserEmail, isMasterAdminEmail } from "../lib/admin";

const me = new Hono<{ Bindings: Env }>();

/**
 * GET /api/me
 * Returns the current user's identity, admin status, and onboarding state.
 * Frontend uses this for routing decisions (Twilio gate bypass, /admin gating).
 */
me.get("/", async (c) => {
  const authHeader = c.req.header("Authorization") ?? null;
  const userId = extractUserId(authHeader);

  if (!userId) {
    return c.json({
      signedIn: false,
      isMasterAdmin: false,
      hasTwilioCreds: false,
    });
  }

  // Try JWT claim first, then Clerk Backend API
  const claims = decodeClerkClaims(authHeader);
  let email: string | null = claims?.email ?? null;
  if (!email) {
    email = await fetchUserEmail(userId, c.env.CLERK_SECRET_KEY);
  }

  const row = (await queryOne(
    c.env.DB,
    "SELECT account_sid, account_name, plan FROM tenant_credentials WHERE user_id=?",
    [userId],
  )) as any;

  return c.json({
    signedIn: true,
    userId,
    email,
    isMasterAdmin: isMasterAdminEmail(email),
    hasTwilioCreds: !!row,
    accountSid: row?.account_sid ?? null,
    accountName: row?.account_name ?? null,
    plan: row?.plan ?? "free",
  });
});

export default me;
