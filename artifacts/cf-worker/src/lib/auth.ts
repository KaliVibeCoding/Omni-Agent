/**
 * Lightweight Clerk JWT helper for Cloudflare Workers.
 * Extracts the userId (sub claim) from a Clerk session token.
 * The token is passed as `Authorization: Bearer <token>`.
 *
 * For full JWKS-based signature verification add CLERK_JWKS_URL to env and
 * verify with crypto.subtle — sufficient for internal/demo use as-is.
 */

export function extractUserId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function requireUserId(authHeader: string | null): string {
  const userId = extractUserId(authHeader);
  if (!userId) throw new AuthError("Unauthorized");
  return userId;
}

export class AuthError extends Error {
  status = 401;
  constructor(msg = "Unauthorized") { super(msg); }
}
