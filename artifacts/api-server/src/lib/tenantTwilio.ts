import twilio from "twilio";
import { db } from "@workspace/db";
import { tenantCredentials } from "@workspace/db";
import { eq } from "drizzle-orm";
import { decrypt } from "./encrypt";

export async function getTenantTwilioClient(userId: string) {
  const rows = await db
    .select()
    .from(tenantCredentials)
    .where(eq(tenantCredentials.userId, userId))
    .limit(1);

  const creds = rows[0];
  if (!creds) {
    const err = Object.assign(
      new Error("No Twilio account connected. Please connect your Twilio account in Settings."),
      { status: 402, code: "NO_CREDENTIALS" }
    );
    throw err;
  }

  const authToken = decrypt(creds.authTokenEncrypted);
  return {
    client: twilio(creds.accountSid, authToken),
    accountSid: creds.accountSid,
    accountName: creds.accountName ?? undefined,
    plan: creds.plan,
    apiKeySid: creds.apiKeySid ?? undefined,
    apiKeySecret: creds.apiKeySecretEncrypted
      ? decrypt(creds.apiKeySecretEncrypted)
      : undefined,
  };
}

export async function getTenantCredentials(userId: string) {
  const rows = await db
    .select()
    .from(tenantCredentials)
    .where(eq(tenantCredentials.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}
