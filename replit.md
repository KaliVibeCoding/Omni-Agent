# Workspace

## Overview

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
- `/settings` — Settings: connected Twilio account (update/disconnect), account info, phone numbers, webhook URL references

**Version:** 5.0.0 (multi-tenant SaaS — per-tenant Twilio credentials, onboarding flow, updated pricing)
**Tech:** wouter router, React Query (@tanstack/react-query), shadcn/ui, Clerk (`@clerk/react` + `@clerk/themes`), lucide icons, date-fns, dark theme CSS variables.
**Layout sidebar:** shows signed-in user name/email + sign-out dropdown. Dashboard nav link updated to `/dashboard`.

**Pricing tiers (landing page):** Starter $79/mo · Growth $199/mo · Business $499/mo · Enterprise custom

**Cloudflare Pages deployment:** `artifacts/twilio-platform/wrangler.toml` — set `CF_WORKER_URL` env var in the Cloudflare Dashboard.

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
- `GET|POST|PUT|DELETE /api/twilio/*` — all Twilio routes (identical to Express API)
- `GET|POST|DELETE /api/anthropic/*` — Anthropic AI conversations with D1 storage
- `GET|POST|DELETE /api/openrouter/*` — OpenRouter AI conversations with D1 storage
- `POST /api/webhook-tester/send` — webhook proxy/tester

**Database:** Cloudflare D1 (SQLite) via `artifacts/cf-worker/db/schema.sql`
**Config:** `artifacts/cf-worker/wrangler.toml` (replace `YOUR_D1_DATABASE_ID`)

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

**New API routes:**
- `GET /api/tenant/credentials` — get connected account info (masked, no raw token)
- `POST /api/tenant/credentials` — validate + save Twilio credentials (AES-256-GCM encrypted)
- `PATCH /api/tenant/plan` — update subscription plan
- `DELETE /api/tenant/credentials` — disconnect Twilio account

**New backend files:**
- `artifacts/api-server/src/lib/encrypt.ts` — AES-256-GCM encrypt/decrypt
- `artifacts/api-server/src/lib/tenantTwilio.ts` — getTenantTwilioClient(userId), getTenantCredentials(userId)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Clerk getAuth middleware
- `artifacts/api-server/src/routes/tenant/index.ts` — credential management API
- `lib/db/src/schema/tenantCredentials.ts` — tenant_credentials table (Drizzle)

**Env vars:** `ENCRYPTION_KEY` (32-byte hex, shared env) — used for AES-256-GCM credential encryption.

**Credentials** stored as Replit secrets: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_PHONE_NUMBER` (kept for legacy; platform uses per-tenant DB credentials).

---

## Cloudflare Deployment Guide

### Step 1 — Install Wrangler globally (or use npx)
```bash
npm install -g wrangler
wrangler login
```

### Step 2 — Create the D1 database
```bash
cd artifacts/cf-worker
wrangler d1 create twilio-platform
# Copy the database_id output, paste into wrangler.toml replacing YOUR_D1_DATABASE_ID
```

### Step 3 — Apply D1 schema
```bash
wrangler d1 execute twilio-platform --file=db/schema.sql --remote
```

### Step 4 — Set Worker secrets
```bash
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_API_KEY_SID
wrangler secret put TWILIO_API_KEY_SECRET
wrangler secret put TWILIO_PHONE_NUMBER
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENROUTER_API_KEY   # optional
```

### Step 5 — Deploy the Worker
```bash
wrangler deploy
# Note the Worker URL: https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev
```

### Step 6 — Build and deploy the frontends (Cloudflare Pages)
For each frontend, create a Pages project in the Cloudflare Dashboard:
- **Build command:** `pnpm --filter @workspace/twilio-platform run build` (or twilio-omni-agent)
- **Build output:** `artifacts/twilio-platform/dist/public` (or twilio-omni-agent)
- **Root directory:** `/` (monorepo root)
- **Environment variable:** `CF_WORKER_URL=https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev`

Or use Wrangler Pages:
```bash
cd artifacts/twilio-platform
wrangler pages deploy dist/public --project-name twilio-platform
```

### AI Clients — No Replit Proxy Required
Both Anthropic and OpenRouter clients fall back to direct API keys:
- `ANTHROPIC_API_KEY` — direct Anthropic access (no Replit proxy)
- `OPENROUTER_API_KEY` — direct OpenRouter access at `https://openrouter.ai/api/v1`
- Replit proxy env vars still work if present (`AI_INTEGRATIONS_*`)
