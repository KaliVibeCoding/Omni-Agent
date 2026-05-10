# RJ Business Solutions Omni-Agent Platform

## Executive Summary

The **RJ Business Solutions Omni-Agent Platform** is a premium, enterprise-grade multi-agent communications framework engineered by **Rick Jefferson**, CTO of RJ Business Solutions. This platform securely handles automated voice, SMS, and email operations across numerous verticals with scalable architecture and complete data privacy.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework (dev)**: Express 5 + Replit PostgreSQL + Drizzle ORM
- **API framework (production/CF)**: Hono + Cloudflare D1 (SQLite)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/cf-worker typecheck` — typecheck the Cloudflare Worker

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### twilio-platform (previewPath: `/`)
Full-featured Twilio Communications Platform dashboard. React + Vite frontend with dark theme.
**Auth:** Clerk (Replit-managed). Provisioned app ID: `app_3DHlr8en5li8fpnCEHdTwT4sK0a`. Secrets: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`.

**Public routes:**
- `/` — Landing page: RJ Business Solutions marketing page with hero, features, pricing, sign-up/sign-in CTAs
- `/sign-in` — Clerk sign-in (branded dark theme, JetBrains Mono, Twilio red)
- `/sign-up` — Clerk sign-up (same branding)

**Onboarding route:**
- `/connect` — Connect Twilio Account: AES-256 encrypted credential storage, optional API Key, validates against Twilio API before saving

**Protected routes (require Clerk auth — redirect to `/` if signed out):**
- `/dashboard` — Dashboard: live account status, balance, active calls, recent calls/messages, phone numbers
- `/sms` — SMS Center: compose SMS, message history with filtering
- `/calls` — Call Manager: make calls, active calls, recent calls, recordings playback
- `/phone-numbers` — Phone Numbers: list numbers, edit friendly name/webhook URLs
- `/lookup` — Number Lookup: carrier, line type intelligence, caller name
- `/voicemails` — Voicemails: transcriptions, recordings, SMS reply
- `/usage` — Usage & Billing: today/month usage records and costs
- `/alerts` — Alerts: Twilio Monitor error/warning log
- `/verify` — Verify (2FA): manage services, send/check verification codes
- `/messaging-services` — Messaging Services: list services, view assigned numbers
- `/studio` — Studio Flows: list flows, view executions, trigger flows
- `/queues` — Call Queues: create/delete queues, view live members
- `/conferences` — Active Conferences: live participant management, mute/end
- `/contacts` — Contacts: full CRUD, search, quick-dial/SMS links
- `/video` — Video Rooms: Twilio Programmable Video — create/end rooms, participants, access token generator
- `/conversations` — Conversations: Twilio Conversations API — threads, messages, participants (SMS + chat)
- `/telehealth` — Telehealth: appointments CRUD, SMS reminders, video invites, HIPAA checklist, upcoming tab
- `/niche/:slug` — Industry Hub dashboards (19 niches): config-driven template with records CRUD, status tracking, SMS quick-send, compliance checklist, industry-specific SMS templates. Backed by `niche_records` PostgreSQL table. Slugs: `credit-repair`, `real-estate`, `insurance`, `dental`, `legal`, `auto`, `home-services`, `fitness`, `restaurant`, `mortgage`, `chiropractic`, `veterinary`, `education`, `nonprofit`, `staffing`, `med-spa`, `property-management`, `ecommerce`, `financial-advisor`.
- `/settings` — Settings: connected Twilio account (update/disconnect), account info, phone numbers, webhook URL references
- `/billing` — Stripe subscription page: live plan cards from Stripe, one-click checkout, customer portal, upgrade/downgrade
- `/email-campaigns` — Email campaigns: compose, templates, recipient list, campaign history, open/click stats
- `/agi-framework` — Multi-agent AGI framework: build/run orchestrated agent pipelines across SMS/voice/email/data channels
- `/admin` — Admin panel: tenant table, KPI cards, plan distribution, revenue metrics, system health

**Version:** 7.0.0 (full SaaS — Stripe billing, transactional emails, email campaigns, AGI framework, admin panel, 19 industry hub dashboards)
**Tech:** wouter router, React Query (@tanstack/react-query), shadcn/ui, Clerk (`@clerk/react` + `@clerk/themes`), lucide icons, date-fns, dark theme CSS variables, Stripe (`stripe-replit-sync`).
**Layout sidebar:** shows signed-in user name/email + sign-out dropdown. New sections: CAMPAIGNS, updated PLATFORM and ACCOUNT.

**Pricing tiers (landing page + Stripe):** Starter $79/mo · Growth $199/mo · Business $499/mo · Enterprise custom
**Stripe products seeded:** prod_USVKKxU9rn50gz (Starter), prod_USVKQcJdY3U2bj (Growth), prod_USVK1Z7YKJNPPj (Business), prod_USVKoplKgcC3eM (Enterprise)

**Cloudflare Pages deployment:** `artifacts/twilio-platform/wrangler.toml`
**LIVE PRODUCTION URL:** https://rj-agent-frontend.pages.dev
**API Worker URL:** https://twilio-platform-api.rickjefferson.workers.dev
CF_WORKER_URL and VITE_CLERK_PUBLISHABLE_KEY set in Pages env vars via API.

### twilio-omni-agent (previewPath: `/twilio-omni-agent`)
AI-powered Twilio Omni-Agent chat. React + Vite frontend.
- Full conversation history with Anthropic and OpenRouter models
- Streaming AI responses
- Twilio expert system prompt (TWILIO OMNI-AGENT v3.0)

**Cloudflare Pages deployment:** `artifacts/twilio-omni-agent/wrangler.toml` — set `CF_WORKER_URL` env var in the Cloudflare Dashboard.

### cf-worker (Cloudflare Worker — production API)
Hono-based Cloudflare Worker replacing the Express API server for production.

**Location:** `artifacts/cf-worker/`
**Entry:** `artifacts/cf-worker/src/index.ts`

**Routes:**
- `GET /api/healthz` — health check
- `GET|POST|PUT|DELETE /api/twilio/*` — all Twilio routes
- `GET|POST|DELETE /api/twilio/video/*` — video rooms
- `GET|POST|DELETE /api/twilio/conv/*` — Conversations API
- `GET|POST|PUT|PATCH|DELETE /api/twilio/telehealth/*` — telehealth appointments + SMS remind + video invite
- `GET|POST|DELETE /api/anthropic/*` — Anthropic AI conversations with D1 storage
- `GET|POST|DELETE /api/openrouter/*` — OpenRouter AI conversations with D1 storage
- `POST /api/webhook-tester/send` — webhook proxy/tester
- `GET|POST|PATCH|DELETE /api/tenant/*` — multi-tenant Twilio credential management (AES-256-GCM encrypted in D1)
- `GET|POST /api/stripe/*` — Stripe billing (products, subscription, checkout, portal, webhook)
- `GET|POST|PATCH|DELETE /api/niche/:slug/*` — all 19 industry hub record CRUD + SMS send + bulk SMS

**Lib:**
- `src/lib/d1.ts` — D1 query/run helpers
- `src/lib/auth.ts` — Clerk JWT userId extraction
- `src/lib/encrypt.ts` — AES-256-GCM Web Crypto API encrypt/decrypt

**Database:** Cloudflare D1 (SQLite) via `artifacts/cf-worker/db/schema.sql`
Tables: conversations, messages, call_logs, sms_logs, contacts, appointments, video_rooms, tenant_credentials, niche_records

**Config:** `artifacts/cf-worker/wrangler.toml` (replace `YOUR_D1_DATABASE_ID`)

**Secrets required:** TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, ENCRYPTION_KEY (32-byte hex), STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, ANTHROPIC_API_KEY, OPENROUTER_API_KEY, RESEND_API_KEY

### api-server (port 8080 — Replit dev server)
Express API server for local development. Uses PostgreSQL + Drizzle.

**Key route groups:**
- `/api/twilio/account` — account info
- `/api/twilio/phone-numbers` — list/update numbers
- `/api/twilio/sms/messages`, `/api/twilio/send-sms` — SMS
- `/api/twilio/calls/active`, `/calls/recent`, `/calls/outbound`, `/calls/:sid/hangup` — calls
- `/api/twilio/recordings` — recordings
- `/api/twilio/voicemails` — transcriptions
- `/api/twilio/usage/today`, `/usage/thismonth` — usage
- `/api/twilio/alerts` — Monitor alerts
- `/api/twilio/verify/services`, `/verify/send`, `/verify/check` — Verify
- `/api/twilio/messaging-services` — Messaging Services
- `/api/twilio/studio/flows` — Studio
- `/api/twilio/queues` — queues
- `/api/twilio/conferences/active` — conferences
- `/api/twilio/contacts` — local contacts (PostgreSQL via Drizzle)
- `/api/twilio/lookup` — number lookup

**Multi-tenant credential system:** All Twilio route files use `getTenantClient(req)` — resolves credentials from `tenant_credentials` table via Clerk userId. No more global env-var Twilio credentials for the platform (env secrets remain for legacy compatibility).

**API routes:**
- `GET /api/tenant/credentials` — get connected account info (masked, no raw token)
- `POST /api/tenant/credentials` — validate + save Twilio credentials (AES-256-GCM encrypted)
- `PATCH /api/tenant/plan` — update subscription plan
- `DELETE /api/tenant/credentials` — disconnect Twilio account
- `POST /api/stripe/webhook` — Stripe webhook (registered BEFORE express.json() for raw Buffer)
- `GET /api/stripe/products` — public: list all plans with prices
- `GET /api/stripe/subscription` — authenticated: current user's Stripe subscription
- `POST /api/stripe/checkout` — create Stripe checkout session for a given priceId
- `POST /api/stripe/portal` — create Stripe customer billing portal session
- `GET /api/stripe/publishable-key` — public: Stripe publishable key for frontend

**Backend files:**
- `artifacts/api-server/src/lib/encrypt.ts` — AES-256-GCM encrypt/decrypt
- `artifacts/api-server/src/lib/tenantTwilio.ts` — getTenantTwilioClient(userId)
- `artifacts/api-server/src/lib/stripeClient.ts` — getUncachableStripeClient(), getStripeSync(), getStripePublishableKey()
- `artifacts/api-server/src/lib/webhookHandlers.ts` — WebhookHandlers.processWebhook()
- `artifacts/api-server/src/lib/stripeStorage.ts` — queries stripe.* schema tables
- `artifacts/api-server/src/lib/emailService.ts` — sendWelcomeEmail, sendUpgradeEmail, sendCancellationEmail, sendPaymentFailedEmail, sendReceiptEmail (Resend API)
- `artifacts/api-server/src/routes/stripe/index.ts` — all Stripe routes + webhook-notify for email triggers
- `scripts/src/seed-products.ts` — idempotent seed script for all 4 plans

**Env vars:**
- `ENCRYPTION_KEY` (32-byte hex) — AES-256-GCM credential encryption
- `RESEND_API_KEY` (optional) — if set, emails are sent via Resend; otherwise logged to console
- Stripe integration: managed via Replit Stripe connector (no manual key needed in dev)

**Credentials** stored as Replit secrets: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_PHONE_NUMBER` (kept for legacy; platform uses per-tenant DB credentials).

---

## Cloudflare Deployment Guide

**Full step-by-step instructions in `docs/DEPLOYMENT.md`**

Quick reference:

```bash
# 1. Install tools
npm install -g wrangler pnpm
wrangler login

# 2. Create D1 database
cd artifacts/cf-worker
wrangler d1 create twilio-platform
# → paste database_id into wrangler.toml

# 3. Apply schema (incl. new tenant_credentials + niche_records tables)
wrangler d1 execute twilio-platform --file=db/schema.sql --remote

# 4. Set all secrets (see wrangler.toml comments for full list)
wrangler secret put CLERK_SECRET_KEY
wrangler secret put ENCRYPTION_KEY   # openssl rand -hex 32
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_PUBLISHABLE_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_PHONE_NUMBER
wrangler secret put ANTHROPIC_API_KEY    # optional
wrangler secret put RESEND_API_KEY       # optional

# 5. Deploy the Worker API
wrangler deploy
# → note URL: https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev

# 6. Build frontend
cd ../../
pnpm --filter @workspace/twilio-platform run build

# 7. Deploy to Cloudflare Pages
cd artifacts/twilio-platform
wrangler pages deploy dist/public --project-name twilio-platform
# → set CF_WORKER_URL and VITE_CLERK_PUBLISHABLE_KEY in Pages env vars
```

## Documentation Files

All sales, technical, and operational docs are in `docs/`:

| File | Contents |
|------|----------|
| `docs/DEPLOYMENT.md` | Full 14-step deployment guide with troubleshooting |
| `docs/ARCHITECTURE.md` | System architecture, data flows, security model |
| `docs/API_REFERENCE.md` | All API endpoints with request/response examples |
| `docs/FAQ.md` | 40+ Q&A covering technical, billing, compliance, white-label |
| `docs/SALES_PITCH.md` | Demo script, competitive comparison, objection handling |
| `docs/ENTERPRISE_DEPLOYMENT_GUIDE.md` | Step-by-step customization checklist (logo, colors, domain, pricing) |

### AI Clients — No Replit Proxy Required
Both Anthropic and OpenRouter clients fall back to direct API keys:
- `ANTHROPIC_API_KEY` — direct Anthropic access (no Replit proxy)
- `OPENROUTER_API_KEY` — direct OpenRouter access at `https://openrouter.ai/api/v1`
- Replit proxy env vars still work if present (`AI_INTEGRATIONS_*`)
