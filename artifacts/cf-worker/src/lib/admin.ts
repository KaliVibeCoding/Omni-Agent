/**
 * Master Admin Allowlist (Worker-side)
 * ------------------------------------------------------------------
 * Keep in sync with artifacts/twilio-platform/src/lib/admin.ts
 *
 * Master admins:
 *   - bypass the Twilio "connect" gate
 *   - have access to /api/admin/* routes
 *   - can manage tenants, view platform metrics
 */
export const MASTER_ADMIN_EMAILS: ReadonlyArray<string> = [
  "rickjefferson@rickjeffersonsolutions.com",
  "rickjefferson@rjbusinesssolutions.org",
  "admin@rjbusinesssolutions.org",
  "support@rjbusinesssolutions.org",
];

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.some(
    (e) => e.toLowerCase() === email.trim().toLowerCase(),
  );
}

/**
 * Decode the Clerk session JWT payload (already verified to have correct shape
 * upstream — we only read claims here, never trust them for signing).
 * Returns { userId, email } or null.
 */
export function decodeClerkClaims(authHeader: string | null): { userId: string; email: string | null } | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const parts = authHeader.slice(7).split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")));
    const userId = payload.sub ?? null;
    if (!userId) return null;
    // Clerk session JWTs commonly include "email" or "primary_email_address" claims
    const email =
      (typeof payload.email === "string" ? payload.email : null) ??
      (typeof payload.primary_email_address === "string" ? payload.primary_email_address : null) ??
      (typeof payload.email_address === "string" ? payload.email_address : null) ??
      null;
    return { userId, email };
  } catch {
    return null;
  }
}

/**
 * Resolve a user's email via the Clerk Backend API.
 * Falls back to JWT claim if Clerk API call fails.
 */
export async function fetchUserEmail(userId: string, clerkSecretKey: string | undefined): Promise<string | null> {
  if (!clerkSecretKey) return null;
  try {
    const r = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${clerkSecretKey}` },
    });
    if (!r.ok) return null;
    const u = (await r.json()) as any;
    const primaryId = u.primary_email_address_id;
    const primary = (u.email_addresses ?? []).find((e: any) => e.id === primaryId) ?? (u.email_addresses ?? [])[0];
    return primary?.email_address ?? null;
  } catch {
    return null;
  }
}
