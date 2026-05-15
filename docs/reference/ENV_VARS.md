# Environment Variables Reference

> Every environment variable and secret across all services.
> ⚠ **Secrets** must never be committed to git. Use `wrangler secret put` (Worker), Cloudflare Pages dashboard (frontend), or `.env.local` (dev API).

---

## Service Map

| Service | Where set | How |
|---|---|---|
| `@workspace/cf-worker` | Worker | `wrangler.toml` vars + `wrangler secret put` |
| `@workspace/twilio-platform` (Pages) | Pages | Project settings → Environment Variables |
| `@workspace/twilio-omni-agent` (Pages) | Pages | Project settings → Environment Variables |
| Dev API (Express) | Replit / local | `.env` / `.env.local` |

---

## 1. Cloudflare Worker (`@workspace/cf-worker`)

### Bindings — declared in `wrangler.toml`

| Binding | Type | Notes |
|---|---|---|
| `DB` | D1 Database | `database_name = "rj-agent-db"` |
| `ASSETS` (optional) | R2 Bucket | for media uploads |
| `RATE_LIMITER` (optional) | Durable Object | per-IP / per-tenant limits |

### Secrets — set with `wrangler secret put NAME`

| Name | Required | Description |
|---|---|---|
| `CLERK_SECRET_KEY` | ✅ | Clerk Backend API key (`sk_live_...`). Used to look up emails on master admin gating. |
| `CLERK_PUBLISHABLE_KEY` | ✅ | `pk_live_...`. Not strictly secret but stored together. |
| `CLERK_ISSUER` | ✅ | `https://<tenant>.clerk.accounts.dev` — used for JWKS URL. |
| `ENCRYPTION_KEY` | ✅ | Base64-encoded 32-byte key for AES-256-GCM credential vault. **Rotating this requires re-encrypting all `tenant_credentials` rows.** |
| `STRIPE_SECRET_KEY` | ✅ | `sk_live_...`. |
| `STRIPE_WEBHOOK_SECRET` | ✅ | `whsec_...`. |
| `STRIPE_PRICE_STARTER` | ✅ | `price_...` for $79 tier. |
| `STRIPE_PRICE_GROWTH` | ✅ | `price_...` for $199 tier. |
| `STRIPE_PRICE_BUSINESS` | ✅ | `price_...` for $499 tier. |
| `ANTHROPIC_API_KEY` | ✅ | `sk-ant-...`. |
| `OPENAI_API_KEY` | ⬜ | optional fallback / for embeddings. |
| `OPENROUTER_API_KEY` | ⬜ | optional. |
| `GROQ_API_KEY` | ⬜ | optional. |
| `TOGETHER_API_KEY` | ⬜ | optional. |
| `DEEPSEEK_API_KEY` | ⬜ | optional. |
| `PERPLEXITY_API_KEY` | ⬜ | optional. |
| `NVIDIA_API_KEY` | ⬜ | optional. |
| `MOONSHOT_API_KEY` | ⬜ | optional. |
| `MINIMAX_API_KEY` | ⬜ | optional. |
| `INFERMATIC_API_KEY` | ⬜ | optional. |
| `ZAI_API_KEY` | ⬜ | optional. |
| `CHUTES_API_KEY` | ⬜ | optional. |
| `CLOD_API_KEY` | ⬜ | optional. |
| `RESEND_API_KEY` | ⬜ | `re_...` for transactional email. |
| `RESEND_FROM` | ⬜ | default `from:` for outbound email. |
| `BRAVE_SEARCH_API_KEY` | ⬜ | optional. |
| `RAPIDAPI_KEY` | ⬜ | optional aggregator. |
| `GOOGLE_MAPS_API_KEY` | ⬜ | optional. |
| `COURTLISTENER_API_KEY` | ⬜ | legal niche. |
| `DATAGOV_API_KEY` | ⬜ | nonprofit / public data niche. |
| `GITHUB_TOKEN` | ⬜ | technology niche. |
| `DISPUTEFOX_API_KEY` | ⬜ | credit-repair niche. |
| `MFSN_API_KEY` | ⬜ | credit-repair niche. |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | ⬜ | alt payments. |
| `COINBASE_API_KEY` | ⬜ | crypto payments. |
| `COMPOSIO_API_KEY` | ⬜ | automation. |
| `MEMORI_API_KEY` | ⬜ | long-term memory. |

### Plain vars — declared in `wrangler.toml` `[vars]`

| Name | Example | Description |
|---|---|---|
| `ENV` | `production` | `production` \| `staging` \| `dev`. |
| `APP_URL` | `https://app.rickjeffersonsolutions.com` | Frontend origin for CORS + redirects. |
| `ALLOWED_ORIGINS` | comma-list | CORS allow list. |
| `MASTER_ADMIN_EMAILS` | `rickjefferson@rickjeffersonsolutions.com` | comma-list mirrored in `src/lib/admin.ts`. |
| `LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error`. |

---

## 2. Frontend Pages — `@workspace/twilio-platform`

Set in **Cloudflare Pages → Project → Settings → Environment Variables**.
All Vite vars **must be prefixed `VITE_`** to be inlined at build time.

| Name | Required | Example | Description |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | `pk_live_...` | Same as worker, public. |
| `VITE_API_BASE_URL` | ⬜ | empty | Leave empty to use same-origin Pages Function proxy. Override if pointing at a different Worker host. |
| `VITE_APP_NAME` | ⬜ | `RJ Agent` | Used in title bar. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ✅ | `pk_live_...` | Stripe Elements / Checkout client. |
| `VITE_MASTER_ADMIN_EMAILS` | ✅ | `rickjefferson@rickjeffersonsolutions.com` | Mirrored in `src/lib/admin.ts` for client-side gating fallback. |
| `VITE_SENTRY_DSN` | ⬜ | | Frontend error tracking. |
| `VITE_POSTHOG_KEY` | ⬜ | | Product analytics. |
| `VITE_FEATURE_AGI` | ⬜ | `true` | Toggle AGI Framework page visibility. |

---

## 3. Frontend Pages — `@workspace/twilio-omni-agent`

Same conventions.

| Name | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ⬜ | Override if not behind same-origin proxy. |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Auth. |
| `VITE_DEFAULT_MODEL` | ⬜ | e.g., `claude-3-5-sonnet`. |
| `VITE_ENABLE_VOICE` | ⬜ | `true`/`false` for voice input. |

---

## 4. Dev API (Express, Replit)

Set in Replit Secrets or `.env.local`.

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string. |
| `PORT` | ⬜ | default `5000`. |
| `CLERK_SECRET_KEY` | ✅ | Same as Worker. |
| `CLERK_PUBLISHABLE_KEY` | ✅ | Same as Worker. |
| `ENCRYPTION_KEY` | ✅ | **Use a DIFFERENT key than production.** |
| `STRIPE_SECRET_KEY` | ✅ | Use a `sk_test_...` key. |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Test-mode webhook secret. |
| `ANTHROPIC_API_KEY` | ✅ | Use a separate dev key if possible. |
| `MASTER_ADMIN_EMAILS` | ✅ | comma-list. |
| `RESEND_API_KEY` | ⬜ | |
| `NODE_ENV` | ⬜ | `development` \| `production`. |

---

## 5. Local Development

`.env.local` (gitignored) at repo root for the dev API, and at `artifacts/twilio-platform/` for the Vite dev server.

Sample workspace root `.env.local`:
```ini
DATABASE_URL=postgres://user:pass@host:5432/rj_agent_dev
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
ENCRYPTION_KEY=base64-encoded-32-bytes-for-DEV-only
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test
ANTHROPIC_API_KEY=sk-ant-xxx
MASTER_ADMIN_EMAILS=rickjefferson@rickjeffersonsolutions.com
```

Sample `artifacts/twilio-platform/.env.local`:
```ini
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_API_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_MASTER_ADMIN_EMAILS=rickjefferson@rickjeffersonsolutions.com
```

For local Worker dev, create `artifacts/cf-worker/.dev.vars`:
```ini
CLERK_SECRET_KEY=sk_test_xxx
CLERK_ISSUER=https://your-tenant.clerk.accounts.dev
ENCRYPTION_KEY=base64-32-bytes
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test
ANTHROPIC_API_KEY=sk-ant-xxx
MASTER_ADMIN_EMAILS=rickjefferson@rickjeffersonsolutions.com
```

Then:
```bash
cd artifacts/cf-worker && pnpm wrangler dev
```

---

## 6. Rotation Schedules

| Variable | Rotate every | Notes |
|---|---|---|
| `CLERK_SECRET_KEY` | 90 days | Use Clerk dashboard. |
| `STRIPE_SECRET_KEY` | 180 days | |
| `STRIPE_WEBHOOK_SECRET` | 180 days | After rotation, update Stripe dashboard endpoint. |
| `ENCRYPTION_KEY` | 365 days | **Requires data migration — see [SECRETS_MANAGEMENT.md](../operations/SECRETS_MANAGEMENT.md#encryption-key-rotation).** |
| AI provider keys | 90 days | |
| `MASTER_ADMIN_EMAILS` | n/a | On personnel change only. |

---

## 7. Validation Patterns

The Worker validates required env at boot in `src/index.ts`. Missing required values cause the Worker to log and 500 every request. Run:
```bash
cd artifacts/cf-worker && pnpm wrangler secret list
```
to confirm all required secrets are present in the deployed environment.

---

**See also:**
- [`../operations/SECRETS_MANAGEMENT.md`](../operations/SECRETS_MANAGEMENT.md) — rotation procedures
- [`../architecture/INTEGRATIONS_MATRIX.md`](../architecture/INTEGRATIONS_MATRIX.md) — which key powers which feature
- [`COMMANDS.md`](COMMANDS.md#worker--secrets) — `wrangler secret` command reference
