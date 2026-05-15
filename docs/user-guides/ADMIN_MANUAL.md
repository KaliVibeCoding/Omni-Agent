# Master Admin Manual

**Audience:** Master admins of the platform (Rick Jefferson + delegates).
**Version:** 7.0.0

---

## Who Is a Master Admin?

Master admins are emails on the hardcoded allowlist in:
- `artifacts/cf-worker/src/lib/admin.ts` (source of truth — worker)
- `artifacts/twilio-platform/src/lib/admin.ts` (frontend mirror)

Current admins (v7.0.0):

- **`rickjefferson@rickjeffersonsolutions.com`** ← primary
- `rickjefferson@rjbusinesssolutions.com`
- `admin@rjbusinesssolutions.org`

---

## Admin-Only Capabilities

- **Bypass** the Twilio-connect gate — `/admin` and all pages accessible without connecting your own Twilio
- **Plan** always reports as `enterprise` regardless of Stripe state
- **Visibility** of the `/admin` sidebar item
- **Read** all tenants' metadata (no Twilio credential plaintext access — encrypted at rest)
- **Write** any tenant's plan
- **Delete** any tenant's credential row
- **Read** aggregate platform metrics

---

## Activating Your Master Admin Account

1. Sign up at `https://rj-agent-frontend.pages.dev/sign-up` with the **exact allowlisted email**.
2. Verify the email via the Clerk email.
3. Sign in. You'll be redirected to `/dashboard` and `/admin` will appear in the sidebar.
4. **Recommended:** enable Clerk MFA (TOTP or WebAuthn) immediately at your Clerk user settings.

---

## Admin Panel Walkthrough (`/admin`)

The panel has 3 tabs:

### Tab 1 — Tenants
- **Search** by name, user ID, or Account SID.
- **Filter** by plan (Starter, Growth, Business, Enterprise, All).
- **Plan dropdown per row** — instantly upgrade or downgrade a tenant. Writes to `tenant_credentials.plan`.
- **Trash icon** — confirmation dialog, then `DELETE /api/admin/tenants/:userId`. Wipes their credentials only; the Clerk user remains (use Clerk Dashboard to fully delete).

### Tab 2 — Metrics
- **Plan Distribution** — bar chart of tenants per plan.
- **Revenue by Plan** — count × monthly rate. Calculates total MRR.
- **Platform Usage (Lifetime)** — total SMS, calls, appointments across all tenants.

### Tab 3 — System
- **Integration Health** — green/red per service (Twilio, Clerk, Stripe, Anthropic, OpenRouter, Resend).
- **Platform Configuration** — worker URL, DB, encryption, multi-tenancy, your admin email.

---

## Admin API Endpoints

All require `Authorization: Bearer <Clerk JWT>` from a master admin user.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/me` | Returns `{ isMasterAdmin: true, plan: "enterprise", … }` |
| `GET` | `/api/admin/tenants` | List of all tenants + per-tenant counts |
| `PATCH` | `/api/admin/tenants/:userId/plan` | Body `{ plan: "growth" }` |
| `DELETE` | `/api/admin/tenants/:userId` | Wipes that tenant's credentials |
| `GET` | `/api/admin/metrics` | Plan counts + lifetime totals |

Example with `curl`:
```bash
TOKEN=<your-clerk-jwt>
curl -H "Authorization: Bearer $TOKEN" \
  https://twilio-platform-api.rickjefferson.workers.dev/api/admin/tenants
```

---

## Adding or Removing an Admin

1. Edit `artifacts/cf-worker/src/lib/admin.ts`:
   ```ts
   export const MASTER_ADMIN_EMAILS = [
     "rickjefferson@rickjeffersonsolutions.com",
     "new-admin@example.com",   // ← add
   ];
   ```
2. Edit `artifacts/twilio-platform/src/lib/admin.ts` with the same list.
3. Commit + PR + merge + deploy:
   ```bash
   git add artifacts/cf-worker/src/lib/admin.ts artifacts/twilio-platform/src/lib/admin.ts
   git commit -m "chore(admin): add new admin"
   git push
   # Open PR, merge, then:
   cd artifacts/cf-worker && wrangler deploy
   cd ../twilio-platform && pnpm run build && wrangler pages deploy dist/public --project-name rj-agent-frontend
   ```
4. The new admin signs up with that exact email — they're elevated automatically.

---

## Common Admin Tasks

### Bumping a tenant to a higher plan (comped)
1. Open `/admin` → Tenants tab → search.
2. Use the plan dropdown to upgrade.
3. The tenant's effective plan changes on their next `/api/me` poll (≈ 30s) without needing Stripe.

### Disconnecting a problem tenant
1. `/admin` → Tenants tab → trash icon → confirm.
2. Their Twilio credentials are wiped from D1. They land on `/connect` next sign-in.

### Reviewing platform health
1. `/admin` → System tab — read the integration dots.
2. Any red dot? See `reference/ENV_VARS.md` for which secret to set.
3. Run `wrangler tail` from `artifacts/cf-worker/` for live worker logs.

### Investigating a billing issue
1. Stripe Dashboard → search the customer (search by tenant userId in metadata).
2. Cross-reference with `tenant_credentials.stripe_subscription_id`.
3. If subscription state and `plan` column diverge, re-fire the Stripe webhook from the Dashboard.

### Mass-emailing all tenants
Currently no UI — use the API:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://twilio-platform-api.rickjefferson.workers.dev/api/admin/tenants \
  | jq -r '.tenants[].id' \
  > /tmp/tenant-ids.txt
# Then iterate and call a Resend send-broadcast endpoint (TODO: build it)
```

---

## Operational Cadence (Recommended)

| Cadence | Task |
|---|---|
| Daily | Glance at `/admin` → System tab |
| Weekly | Review tenant growth + revenue (Metrics tab) |
| Weekly | Check Cloudflare Workers Analytics — error rate, P99 |
| Monthly | Audit master admin allowlist |
| Quarterly | Rotate `ENCRYPTION_KEY` (requires migration script — TODO) |
| Quarterly | Run `pnpm audit` + apply dependency updates |
| Annually | Penetration test |

---

## Emergency: Lock Out a Tenant

If a tenant is abusing the system (spam, fraud):

```bash
# Wipe their Twilio creds
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  https://twilio-platform-api.rickjefferson.workers.dev/api/admin/tenants/<userId>

# Delete the Clerk user (use Clerk Dashboard or Backend API)
curl -X DELETE -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  https://api.clerk.com/v1/users/<userId>
```

Both endpoints are idempotent — safe to retry.
