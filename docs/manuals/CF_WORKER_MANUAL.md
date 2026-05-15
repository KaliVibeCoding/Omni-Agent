# Cloudflare Worker Manual (`artifacts/cf-worker/`)

**Production API for the platform.**
**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Stack

- **Framework:** [Hono](https://hono.dev) (v4)
- **Runtime:** Cloudflare Workers (V8 isolates)
- **DB:** Cloudflare D1 (SQLite)
- **Build:** `wrangler` bundler (esbuild)
- **Entry:** `src/index.ts`
- **Config:** `wrangler.toml`

---

## 2. File Layout

```
artifacts/cf-worker/
├── src/
│   ├── index.ts             ← App composition + route mounts
│   ├── lib/
│   │   ├── auth.ts          ← Clerk JWT verification → userId
│   │   ├── d1.ts            ← query, queryOne, run helpers
│   │   ├── encrypt.ts       ← AES-256-GCM encrypt/decrypt
│   │   ├── admin.ts         ← Master admin allowlist
│   │   └── tenant-twilio.ts ← Per-tenant Twilio client
│   └── routes/
│       ├── health.ts
│       ├── me.ts
│       ├── admin.ts
│       ├── tenant.ts
│       ├── twilio.ts
│       ├── video.ts
│       ├── twilio-conversations.ts
│       ├── telehealth.ts
│       ├── anthropic.ts
│       ├── openrouter.ts
│       ├── ai-models.ts
│       ├── search.ts
│       ├── payments.ts
│       ├── stripe.ts
│       ├── niche.ts
│       ├── data-apis.ts
│       ├── credit.ts
│       └── webhook-tester.ts
├── db/
│   ├── schema.sql           ← Initial DDL
│   └── migrations/          ← Numbered incremental
├── package.json
├── tsconfig.json
└── wrangler.toml            ← Bindings, secrets, routes
```

---

## 3. Env Bindings (`wrangler.toml`)

```toml
name = "twilio-platform-api"
main = "src/index.ts"
compatibility_date = "2025-10-01"
node_compat = true

[[d1_databases]]
binding = "DB"
database_name = "twilio-platform"
database_id = "YOUR_D1_DATABASE_ID"

# Secrets set via: wrangler secret put <NAME>
#   CLERK_SECRET_KEY
#   CLERK_PUBLISHABLE_KEY
#   ENCRYPTION_KEY            (32-byte hex)
#   STRIPE_SECRET_KEY
#   STRIPE_PUBLISHABLE_KEY
#   STRIPE_WEBHOOK_SECRET
#   TWILIO_ACCOUNT_SID        (master admin fallback)
#   TWILIO_AUTH_TOKEN
#   TWILIO_API_KEY_SID
#   TWILIO_API_KEY_SECRET
#   TWILIO_PHONE_NUMBER
#   ANTHROPIC_API_KEY
#   OPENROUTER_API_KEY
#   OPENAI_API_KEY
#   RESEND_API_KEY
#   …all integration keys from architecture/INTEGRATIONS_MATRIX.md
```

The `Env` interface in `src/index.ts` declares all bindings as TypeScript types — keep it in sync.

---

## 4. Route Group Reference

| Mount | File | Master admin? | Plan gated? |
|---|---|---|---|
| `/api/healthz` | health.ts | — | No |
| `/api/me` | me.ts | — | No |
| `/api/admin/*` | admin.ts | ✅ required | — |
| `/api/tenant/*` | tenant.ts | — | No |
| `/api/twilio/*` | twilio.ts | — | No |
| `/api/twilio/video/*` | video.ts | — | Growth+ |
| `/api/twilio/conv/*` | twilio-conversations.ts | — | Growth+ |
| `/api/twilio/telehealth/*` | telehealth.ts | — | Growth+ |
| `/api/anthropic/*` | anthropic.ts | — | Growth+ |
| `/api/openrouter/*` | openrouter.ts | — | Growth+ |
| `/api/ai-models/*` | ai-models.ts | — | — |
| `/api/search/*` | search.ts | — | — |
| `/api/payments/*` | payments.ts | — | — |
| `/api/stripe/*` | stripe.ts | — | No |
| `/api/niche/:slug/*` | niche.ts | — | Starter+ |
| `/api/data-apis/*` | data-apis.ts | — | Business+ |
| `/api/credit/*` | credit.ts | — | Business+ |
| `/api/webhook-tester/*` | webhook-tester.ts | — | — |
| `/api/integrations` | (inline in index.ts) | — | No |

Full endpoint inventory: [`reference/API_ENDPOINTS.md`](../reference/API_ENDPOINTS.md).

---

## 5. Lib Helpers

### `auth.ts`
```ts
extractUserId(authHeader: string | null): string | null
requireUserId(authHeader: string | null): string        // throws AuthError on 401
class AuthError extends Error { status: 401 | 403 }
```

### `d1.ts`
```ts
query<T>(db: D1Database, sql: string, params?: any[]): Promise<T[]>
queryOne<T>(db, sql, params?): Promise<T | null>
run(db, sql, params?): Promise<D1Result>
```

### `encrypt.ts`
```ts
encrypt(plaintext: string, keyHex: string): Promise<string>  // base64 of iv||ct||tag
decrypt(ciphertext: string, keyHex: string): Promise<string>
generateKey(): string  // returns 32-byte hex
```

### `admin.ts`
```ts
MASTER_ADMIN_EMAILS: ReadonlyArray<string>
isMasterAdminEmail(email): boolean
fetchClerkUserEmail(userId, clerkSecret): Promise<string | null>
isMasterAdminUser(userId, clerkSecret): Promise<{ isMasterAdmin: boolean; email: string | null }>
```

### `tenant-twilio.ts` (pattern)
```ts
getTenantClient(env: Env, userId: string): Promise<TwilioClient>
```
Decrypts the auth token, instantiates `twilio(sid, decrypted)`. Throws HTTP 412 if not connected.

---

## 6. Adding a New Route Group

1. Create `src/routes/<feature>.ts` exporting a `Hono<{ Bindings: Env }>`.
2. Import + mount in `src/index.ts`:
   ```ts
   import featureRoutes from "./routes/feature";
   app.route("/api/feature", featureRoutes);
   ```
3. Add Env bindings if you need new secrets.
4. Document in `reference/API_ENDPOINTS.md`.
5. Update OpenAPI spec.

---

## 7. Local Dev

```bash
cd artifacts/cf-worker
wrangler dev                 # binds to localhost:8787
```
- Hot reload on file save.
- Uses local D1 by default — pass `--remote` to hit production D1.

```bash
# Hit local worker
curl http://localhost:8787/api/healthz
```

---

## 8. Deploy

```bash
cd artifacts/cf-worker
wrangler deploy
# → Output: https://twilio-platform-api.<subdomain>.workers.dev
```

To deploy to a custom worker name:
```bash
wrangler deploy --name twilio-platform-api-staging
```

---

## 9. Migrations

```bash
# Create
echo "ALTER TABLE tenant_credentials ADD COLUMN region TEXT;" > db/migrations/0002_add_region.sql

# Apply remotely
wrangler d1 execute twilio-platform --file=db/migrations/0002_add_region.sql --remote

# Apply locally
wrangler d1 execute twilio-platform --file=db/migrations/0002_add_region.sql --local
```

---

## 10. Common Patterns

### Tenant-scoped read
```ts
route.get("/things", async (c) => {
  const userId = requireUserId(c.req.header("Authorization") ?? null);
  const rows = await query(c.env.DB, "SELECT * FROM things WHERE user_id=?", [userId]);
  return c.json({ data: rows });
});
```

### Master-admin-only
```ts
async function requireAdmin(c) {
  const userId = requireUserId(c.req.header("Authorization") ?? null);
  const { isMasterAdmin } = await isMasterAdminUser(userId, c.env.CLERK_SECRET_KEY);
  if (!isMasterAdmin) throw new AuthError("Forbidden: master admin required", 403);
  return userId;
}
```

### Plan-gated
```ts
route.post("/agi/run", async (c) => {
  const userId = requireUserId(c.req.header("Authorization") ?? null);
  const tenant = await queryOne(c.env.DB, "SELECT plan FROM tenant_credentials WHERE user_id=?", [userId]);
  if (!["business", "enterprise"].includes(tenant?.plan ?? "")) {
    return c.json({ error: "Upgrade to Business plan to use AGI" }, 402);
  }
  // …
});
```

### Webhook (no auth, signature-verified)
```ts
route.post("/stripe/webhook", async (c) => {
  const sig = c.req.header("Stripe-Signature");
  const raw = await c.req.text();
  // Stripe HMAC verification…
});
```

---

## 11. Testing

```bash
# Smoke test
curl https://twilio-platform-api.rickjefferson.workers.dev/api/healthz

# With auth
TOKEN=$(... your Clerk JWT ...)
curl -H "Authorization: Bearer $TOKEN" \
  https://twilio-platform-api.rickjefferson.workers.dev/api/me
```

Unit tests live in `artifacts/cf-worker/test/` (TODO — Miniflare-based).
