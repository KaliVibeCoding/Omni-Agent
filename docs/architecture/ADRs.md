# Architecture Decision Records

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

A chronological log of major architectural choices, the alternatives considered, and the rationale. New decisions are appended; old ones are never edited (only superseded).

---

## ADR-001: Use Cloudflare Workers (not Vercel/Lambda) for Production API

**Status:** Accepted
**Date:** 2025-02

**Context:** Need a serverless API that scales to global edge, sub-100ms P50, with native bindings to a SQL store.

**Decision:** Cloudflare Workers + D1.

**Alternatives:**
- Vercel Edge Functions + Neon — higher cold start, separate auth path
- AWS Lambda + DynamoDB — verbose IaC, regional only without effort
- Fly.io + Postgres — full VM cost, no edge

**Consequences:**
- ✅ Sub-50ms cold start, global by default
- ✅ Native D1 binding eliminates connection-pool issues
- ✅ Single Wrangler CLI for deploy + secrets + logs
- ⚠️ SQLite limits (D1) — no full PostgreSQL features; mitigated by Replit dev parity for migrations
- ⚠️ Wrangler vendor lock — mitigated by Hono being portable

---

## ADR-002: Hono as Worker Framework

**Status:** Accepted
**Date:** 2025-02

**Decision:** Hono (lightweight Express-like router for Workers).

**Alternatives:** itty-router (too minimal for middleware), Worktop (abandoned), raw fetch handler (too verbose at 60+ routes).

**Consequences:** Familiar route definition; native TypeScript; works on Workers, Bun, Deno, Node — future portability.

---

## ADR-003: Clerk over Auth0/Supabase/Custom

**Status:** Accepted
**Date:** 2025-02

**Decision:** Clerk for auth.

**Rationale:** Best DX for React; built-in MFA + WebAuthn + OAuth; Replit-managed integration eliminates infra burden.

**Trade-offs:** Vendor lock — mitigated by exporting users via Clerk Backend API on demand.

---

## ADR-004: AES-256-GCM via Web Crypto for Credentials

**Status:** Accepted
**Date:** 2025-03

**Decision:** Encrypt Twilio `auth_token` at rest using Web Crypto API's AES-GCM.

**Alternatives:** Cloudflare Secrets Store (preview, per-secret), libsodium (no Workers support), KMS (extra latency + cost).

**Consequences:** Zero-dependency, native to Workers, audit-ready. Single `ENCRYPTION_KEY` rotation requires data re-encryption migration — accepted trade-off.

---

## ADR-005: Master Admin Allowlist (not Roles in DB)

**Status:** Accepted
**Date:** 2026-05

**Decision:** Hardcode master admin emails in `cf-worker/src/lib/admin.ts` + frontend mirror.

**Rationale:**
- Master admin is a build-time concept, not a runtime configuration
- No risk of accidental SQL-driven privilege escalation
- Allowlist diff visible in git history (audit trail)
- Frontend mirror provides fallback if Clerk Backend API is unavailable

**Trade-off:** Adding/removing an admin requires a code change + deploy. Accepted because the role is rare (1-3 people).

---

## ADR-006: Single Worker for All Routes (not per-domain microservices)

**Status:** Accepted
**Date:** 2025-04

**Decision:** All API surface (Twilio, Stripe, AI, niche, admin) in one Worker.

**Rationale:** Workers boot fast; routing in-process is faster than cross-Worker calls; shared `Env` type; simpler deploy. Avoids the YAGNI trap of microservice premature decomposition.

**Reconsideration trigger:** When the Worker bundle exceeds 1 MB (Cloudflare limit) or one route group's deploy cadence diverges sharply, split.

---

## ADR-007: pnpm Workspaces over Nx/Turbo

**Status:** Accepted
**Date:** 2025-02

**Decision:** pnpm workspaces, no build orchestrator.

**Rationale:** Simpler; pnpm's content-addressable store handles caching; `pnpm -r --filter` is enough. Turbo's cache + remote-cache valuable later if CI gets slow.

---

## ADR-008: Cloudflare D1 (not Durable Objects or Workers KV) for Primary Store

**Status:** Accepted
**Date:** 2025-03

**Decision:** D1 (SQLite) as primary store; KV for caching only.

**Rationale:**
- Relational data (tenants, messages, niche records) needs joins
- D1 transactions + indexes
- KV is eventually consistent — wrong for credentials
- Durable Objects more appropriate for real-time state (video rooms — future)

---

## ADR-009: OpenAPI 3.0 as Single Source of Truth for API Contract

**Status:** Accepted
**Date:** 2025-03

**Decision:** Hand-write OpenAPI spec in `lib/api-spec/`, generate clients (`api-client-react`) + Zod (`api-zod`) via Orval.

**Consequences:** One contract; type-safe frontend; auto-attaches auth headers via `setAuthTokenGetter`; backend Zod validation matches frontend types. Drift impossible without regenerating.

---

## ADR-010: React + Vite (not Next.js) for Frontend

**Status:** Accepted
**Date:** 2025-02

**Decision:** Vite-based SPA, deployed as static to Cloudflare Pages.

**Rationale:** No SSR requirements; SaaS dashboard is post-login; SPA is simpler; faster builds; no Vercel lock-in. Pages Functions handle the API proxy without needing Next.js Edge runtime.
