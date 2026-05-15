# Multi-Tenancy Design

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Tenancy Model: Shared Infrastructure, Isolated Data

The platform runs a **single Worker instance**, a **single D1 database**, and a **single Pages deployment** that serves every tenant. Isolation is enforced at the application layer through:

1. **Identity binding** — every authenticated request carries a verified Clerk `userId`
2. **Row-level filtering** — every persisted record has a `user_id` column
3. **Credential vault** — each tenant's Twilio credentials live in `tenant_credentials`, encrypted, never shared
4. **Per-request client** — Twilio (and any other tenant-scoped SDK) is instantiated per-request, never cached across tenants

This pattern is the same one used by Notion, Linear, Vercel, and Stripe at scale.

---

## 2. Tenant Lifecycle

```
1. Sign-up           Clerk creates user, emits userId
2. Connect           POST /api/tenant/credentials → row in tenant_credentials
3. Use               Every API call filters by userId
4. Upgrade           Stripe webhook → UPDATE tenant_credentials SET plan=…
5. Disconnect        DELETE /api/tenant/credentials → cascade wipe
6. Delete            Clerk deletes user → orphaned rows pruned weekly
```

---

## 3. Credential Vault Pattern

`getTenantClient(userId)` in `cf-worker/src/lib/tenant-twilio.ts`:

```ts
export async function getTenantClient(env: Env, userId: string) {
  const row = await queryOne(env.DB,
    "SELECT account_sid, auth_token, api_key_sid, api_key_secret FROM tenant_credentials WHERE user_id=?",
    [userId],
  );
  if (!row) throw new HTTPException(412, { message: "Twilio not connected" });
  const authToken = await decrypt(row.auth_token, env.ENCRYPTION_KEY);
  if (row.api_key_sid && row.api_key_secret) {
    const keySecret = await decrypt(row.api_key_secret, env.ENCRYPTION_KEY);
    return twilio(row.api_key_sid, keySecret, { accountSid: row.account_sid });
  }
  return twilio(row.account_sid, authToken);
}
```

**Never** instantiate Twilio with global env-var credentials in production routes. Master admin testing accounts are the only exception.

---

## 4. Plan Enforcement Pattern

```ts
// Inside any premium-feature route:
const { plan, isMasterAdmin } = await getUserCapabilities(env, userId);
if (!isMasterAdmin && !["business", "enterprise"].includes(plan)) {
  return c.json({ error: "Upgrade to Business to use AGI framework" }, 402);
}
```

HTTP `402 Payment Required` is the canonical response for plan-gated denial.

---

## 5. Master Admin Override

Master admins (allowlist match) skip:
- Twilio-connect gate (frontend `ProtectedRoute`)
- Plan checks (`isMasterAdmin` short-circuits gate)
- Single-tenant query filter on `/api/admin/*` routes only

Master admins **do not** get magic access to other tenants' Twilio accounts — those credentials remain encrypted and tenant-scoped. The admin panel shows account SIDs and plans for management purposes only.

---

## 6. Cross-Tenant Aggregations

Only `/api/admin/*` may query without `user_id` filter. These routes:
- Require master-admin allowlist match in middleware
- Return summary data (counts, plan distribution, lifetime totals)
- Never expose another tenant's message bodies, recordings, or credentials

---

## 7. White-Label Path

Each tenant can theoretically be served on a custom domain via **Cloudflare for SaaS** (roadmap). The pattern:
- Tenant adds CNAME → `customers.rjbusinesssolutions.com`
- Custom Hostname API issues SSL cert
- Worker reads `Host` header → resolves tenant → serves branded HTML

See `architecture/BLUEPRINT.md` §8 for roadmap status.
