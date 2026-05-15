# System Blueprint — RJ Business Solutions Omni-Agent Platform

> The authoritative, exhaustive technical blueprint. Every component, every flow, every decision boundary.

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Executive Architecture Statement

The platform is a **serverless, multi-tenant SaaS** that bundles enterprise communications (SMS, Voice, Video, Email), AI orchestration (Anthropic + 14 model providers), industry-specific dashboards (19 verticals), payment infrastructure (Stripe), and an admin console — into a single, brand-able white-label product.

It runs primarily on **Cloudflare** (Workers + Pages + D1) with **Clerk** for identity, **Twilio** for telecom, **Stripe** for billing, and **Resend** for transactional email.

A complementary **Express + PostgreSQL** dev stack runs in Replit for local iteration with Drizzle ORM and the same OpenAPI contract.

---

## 2. System Context Diagram (C4 Level 1)

```
                            ┌────────────────────────┐
                            │   End User Browser     │
                            │  (rj-agent-frontend)   │
                            └───────────┬────────────┘
                                        │ HTTPS
                                        ▼
        ┌──────────────────────────────────────────────────────────────┐
        │              Cloudflare Edge (Pages + Worker)                │
        │                                                              │
        │  ┌───────────────────┐         ┌─────────────────────────┐  │
        │  │  CF Pages         │ /api/*  │  CF Worker (Hono)       │  │
        │  │  React + Vite SPA ├────────►│  Multi-tenant API       │  │
        │  │  Static + Func    │ proxy   │  60+ routes             │  │
        │  └───────────────────┘         └────────┬────────────────┘  │
        │           ▲                             │                   │
        │           │ Clerk JWT                   │                   │
        │           │                             ▼                   │
        │           │                  ┌──────────────────────┐       │
        │           │                  │  Cloudflare D1       │       │
        │           │                  │  (SQLite, edge)      │       │
        │           │                  │  tenants, msgs,      │       │
        │           │                  │  niches, AI history  │       │
        │           │                  └──────────────────────┘       │
        └───────────┼──────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
        ┌─────────────────────┐    ┌──────────────────────────────┐
        │  Clerk (Auth)       │    │  External Service Providers  │
        │  - JWKS verify      │    │                              │
        │  - User mgmt        │    │  • Twilio (SMS/Voice/Video)  │
        │  - Master allowlist │    │  • Anthropic (Claude)        │
        └─────────────────────┘    │  • OpenRouter (200+ models)  │
                                   │  • OpenAI, Groq, Together,…  │
                                   │  • Stripe (billing)          │
                                   │  • Resend (email)            │
                                   │  • Google Maps, Brave,        │
                                   │    CourtListener, GitHub,…   │
                                   └──────────────────────────────┘
```

---

## 3. Logical Components (C4 Level 2)

### 3.1 Frontends (Cloudflare Pages)

| Project | Path | Description |
|---|---|---|
| **`twilio-platform`** | `artifacts/twilio-platform/` | Main SaaS dashboard — 30+ pages, billing, admin, niches |
| **`twilio-omni-agent`** | `artifacts/twilio-omni-agent/` | Standalone AI chat (Anthropic + OpenRouter streaming) |
| **`mockup-sandbox`** | `artifacts/mockup-sandbox/` | Design playground (not deployed) |

Each Pages project ships a **`functions/api/[[path]].ts`** reverse proxy that forwards `/api/*` → Worker, preserving `Authorization: Bearer <Clerk JWT>` and handling CORS preflight.

### 3.2 API (Cloudflare Worker)

`artifacts/cf-worker/` — single Hono application bundled via Wrangler.

**Route groups:**
- `/api/healthz` — health check
- `/api/me` — current-user profile + capability flags
- `/api/admin/*` — master-admin-only (tenant CRUD, metrics)
- `/api/tenant/*` — per-user Twilio credential vault
- `/api/twilio/*` — Twilio passthrough (account, SMS, calls, numbers, voicemails, alerts, verify, messaging-services, studio, queues, conferences, contacts, lookup, recordings)
- `/api/twilio/video/*` — Programmable Video
- `/api/twilio/conv/*` — Conversations API
- `/api/twilio/telehealth/*` — appointments + SMS reminders
- `/api/anthropic/*` — Claude conversations with D1 history
- `/api/openrouter/*` — OpenRouter conversations
- `/api/ai-models/*` — model registry / passthrough
- `/api/search/*` — Brave + RapidAPI search
- `/api/payments/*` — generic payment intents
- `/api/stripe/*` — subscriptions, checkout, portal, webhook
- `/api/niche/:slug/*` — all 19 industry hubs
- `/api/data-apis/*` — CourtListener, Data.gov, GitHub, Maps
- `/api/credit/*` — DisputeFox, MyFreeScoreNow
- `/api/webhook-tester/send` — webhook proxy/tester

**Shared helpers (`src/lib/`):**
- `d1.ts` — typed D1 query/run/queryOne
- `auth.ts` — Clerk JWKS verification → userId extraction
- `encrypt.ts` — AES-256-GCM Web Crypto API
- `admin.ts` — master-admin allowlist + Clerk Backend API email lookup

### 3.3 Dev API (Express)

`artifacts/api-server/` — local-only dev API; mirrors a subset of the Worker for fast iteration with PostgreSQL + Drizzle. Not deployed to production.

### 3.4 Shared Workspace Libraries

| Package | Purpose |
|---|---|
| `@workspace/api-spec` | OpenAPI 3.0 specification — single source of truth |
| `@workspace/api-client-react` | Auto-generated React Query hooks (via Orval) |
| `@workspace/api-zod` | Generated Zod schemas for validation |
| `@workspace/db` | Drizzle schema for dev PostgreSQL |
| `@workspace/integrations-anthropic-ai` | Claude streaming client |
| `@workspace/integrations-openrouter-ai` | OpenRouter streaming client |
| `@workspace/integrations` | Aggregate integration catalog |

### 3.5 Persistence

- **Production:** Cloudflare D1 (SQLite at the edge), schema at `artifacts/cf-worker/db/schema.sql`. Tables: `tenant_credentials`, `conversations`, `messages`, `call_logs`, `sms_logs`, `contacts`, `appointments`, `video_rooms`, `niche_records`.
- **Dev:** PostgreSQL (Replit-managed), schema via Drizzle in `lib/db/`.

---

## 4. Critical Flows

### 4.1 Sign-up & Master Admin Bypass

```
User → /sign-up (Clerk)
     → Clerk verifies email
     → SPA redirects to /dashboard
     → useMe() hits GET /api/me with Bearer <Clerk JWT>
     → Worker extracts userId via JWKS
     → Worker calls Clerk Backend API for primary email
     → If email ∈ MASTER_ADMIN_EMAILS:
         { isMasterAdmin: true, plan: "enterprise" }
         → ProtectedRoute bypasses /connect, shows /admin
       Else:
         { hasTwilioCreds: false } → redirect to /connect
```

### 4.2 Twilio Credential Save (Tenant Onboarding)

```
User on /connect submits accountSid + authToken
     → POST /api/tenant/credentials  (Authorization: Bearer)
     → Worker validates by calling Twilio /Accounts/{sid}.json
     → AES-256-GCM encrypts authToken with ENCRYPTION_KEY
     → INSERT into tenant_credentials (user_id, account_sid, …)
     → Returns { accountName }
     → Frontend invalidates ["tenant-credentials"], navigates to /dashboard
     → Every subsequent Twilio call uses getTenantClient(userId)
```

### 4.3 Outbound SMS (per-tenant)

```
User on /sms hits "Send"
     → POST /api/twilio/send-sms  (Authorization: Bearer)
     → Worker resolves userId
     → SELECT * FROM tenant_credentials WHERE user_id = ?
     → Decrypt authToken
     → twilio(accountSid, authToken).messages.create({...})
     → INSERT into sms_logs
     → Returns { sid, status }
```

### 4.4 Stripe Subscription Lifecycle

```
User clicks "Upgrade to Growth"
     → POST /api/stripe/checkout { priceId }
     → Worker creates/looks up Stripe customer (metadata.userId)
     → Creates Checkout Session → returns url
     → Browser redirects to Stripe
     → On success → Stripe → POST /api/stripe/webhook
     → Worker verifies signature, updates tenant_credentials.plan
     → Triggers Resend welcome/upgrade email
     → User returns → useMe() refetches → plan = "growth"
```

### 4.5 AGI Multi-Agent Pipeline

```
User defines pipeline on /agi-framework
     [intent-detector] → [policy-router] → [sms-agent | voice-agent | email-agent]
                                                      │
                                                      └─→ [logger → D1]

Each agent node is a Claude/OpenRouter call with structured input/output schema.
Pipeline state persists in D1 via "conversations" table.
```

---

## 5. Cross-Cutting Concerns

### 5.1 Identity & Auth
- **Provider:** Clerk (managed)
- **Token format:** JWT, RS256, verified against Clerk JWKS
- **Worker side:** `extractUserId(authHeader)` → returns `sub` claim
- **Frontend side:** `setAuthTokenGetter(() => getToken())` so every generated hook attaches `Authorization: Bearer <jwt>` automatically
- **Sessions:** Clerk-managed; httpOnly cookies + short-lived JWT (60s default)

### 5.2 Authorization Model
- **Role types:** `master_admin` (allowlist), `tenant` (default), unauthenticated
- **Plan tiers:** `free`, `starter` ($79), `growth` ($199), `business` ($499), `enterprise` (custom)
- **Master admins:** bypass plan gates; can edit any tenant's plan; view aggregate metrics
- **Tenants:** see only their own data; gated by plan for premium features

### 5.3 Encryption
- **At rest:** Twilio `auth_token` and `api_key_secret` AES-256-GCM encrypted with `ENCRYPTION_KEY` (32-byte hex) before D1 INSERT
- **In transit:** TLS 1.3 enforced by Cloudflare
- **Secrets at rest:** Wrangler secrets (encrypted by Cloudflare)

### 5.4 Multi-Tenancy
- **Isolation key:** Clerk userId (every row carries `user_id`)
- **Query pattern:** Every tenant-scoped route includes `WHERE user_id = ?`
- **Twilio client:** `getTenantClient(userId)` returns a per-request Twilio instance with that tenant's decrypted credentials
- **No cross-tenant queries** allowed except in `/api/admin/*` (master-admin-gated)

### 5.5 Observability
- Cloudflare Workers Logs (real-time tail via `wrangler tail`)
- Cloudflare Analytics (request counts, P50/P99, error rate)
- Application errors: thrown as `{ error: string }` JSON with 4xx/5xx status
- Frontend: React Query error boundaries + `sonner` toasts

### 5.6 Rate Limiting
- Cloudflare WAF rules at the edge (per-IP)
- Stripe + Twilio + Anthropic — provider-side rate limits surface as 429 → propagated to user
- D1 read/write within free tier limits (100k reads/day on free, 5M on paid)

---

## 6. Deployment Topology

```
Production:
  Cloudflare Pages: rj-agent-frontend         ← twilio-platform build
  Cloudflare Pages: twilio-omni-agent         ← omni-agent build
  Cloudflare Worker: twilio-platform-api      ← cf-worker
  Cloudflare D1: twilio-platform              ← shared by all
  Cloudflare R2 (future): asset storage

Development:
  Replit workspace → pnpm run dev (Express API on :8080)
                  → vite dev (frontend on :5173)
                  → PostgreSQL (Replit-managed)
```

---

## 7. Non-Functional Requirements

| Category | Target |
|---|---|
| Availability | 99.9% (Cloudflare SLA) |
| Latency (API P50) | < 80 ms (edge) |
| Latency (API P99) | < 500 ms |
| Cold start | < 50 ms (Workers Isolates) |
| Throughput | 10k+ rps per Worker (Cloudflare default) |
| Data residency | Global edge — can be pinned per-region with Smart Placement |
| Backup RPO | 24h (D1 daily snapshot) |
| Backup RTO | 1h (D1 restore) |
| Encryption | AES-256-GCM at rest, TLS 1.3 in transit |
| Compliance | SOC 2-ready architecture; HIPAA path via BAA with Twilio + Cloudflare |

---

## 8. Future Enhancements (Roadmap)

- **R2 Object Storage** for call recordings + voicemail audio
- **Durable Objects** for real-time conference + video room state
- **Workers AI** as a Tier-0 model provider (latency + cost)
- **D1 read replicas** when global write contention emerges
- **Custom domain per tenant** (white-label SaaS) — Cloudflare for SaaS
- **Audit log table** with append-only writes for compliance
- **Webhook subscription system** for tenant-driven event delivery
