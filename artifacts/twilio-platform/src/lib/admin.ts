/**
 * Master Admin Allowlist
 * ------------------------------------------------------------------
 * Users whose primary email matches this list:
 *   - automatically bypass the Twilio "connect" gate
 *   - have access to the /admin route
 *   - are considered the platform "owner" for billing/system views
 *
 * Keep this list in sync with the worker copy at
 * artifacts/cf-worker/src/lib/admin.ts
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
