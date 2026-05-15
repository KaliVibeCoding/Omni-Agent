# RJ Business Solutions Omni-Agent Platform — Documentation Index

> The complete, authoritative documentation suite for the **RJ Business Solutions Omni-Agent Platform** — a multi-tenant, enterprise-grade communications, AI, and automation platform built on Cloudflare, Twilio, Clerk, Stripe, and Anthropic.

**Version:** 7.0.0
**Author:** Rick Jefferson, CTO — RJ Business Solutions
**Live Production:** https://rj-agent-frontend.pages.dev
**API:** https://twilio-platform-api.rickjefferson.workers.dev

---

## How To Use This Documentation

| If you are a... | Start here |
|---|---|
| **First-time user** signing up | [`user-guides/QUICKSTART.md`](user-guides/QUICKSTART.md) |
| **Master admin** (Rick) | [`user-guides/ADMIN_MANUAL.md`](user-guides/ADMIN_MANUAL.md) |
| **Tenant / customer** | [`user-guides/USER_MANUAL.md`](user-guides/USER_MANUAL.md) |
| **Developer** building features | [`manuals/DEVELOPER_MANUAL.md`](manuals/DEVELOPER_MANUAL.md) |
| **DevOps / SRE** deploying or operating | [`operations/RUNBOOK.md`](operations/RUNBOOK.md) |
| **Architect** evaluating | [`architecture/BLUEPRINT.md`](architecture/BLUEPRINT.md) |
| **Sales / pre-sales** | [`SALES_PITCH.md`](SALES_PITCH.md) |

---

## Documentation Map

### 🚀 User Guides (`/user-guides`)
Step-by-step manuals for end-users.

| File | Contents |
|---|---|
| [`QUICKSTART.md`](user-guides/QUICKSTART.md) | 10-minute onboarding from signup → first SMS sent |
| [`USER_MANUAL.md`](user-guides/USER_MANUAL.md) | Complete reference for every page (Dashboard, SMS, Calls, etc.) |
| [`ADMIN_MANUAL.md`](user-guides/ADMIN_MANUAL.md) | Master admin operations — tenant management, plan overrides, system health |
| [`NICHE_PLAYBOOKS.md`](user-guides/NICHE_PLAYBOOKS.md) | Industry-specific workflows for all 19 niches |
| [`TROUBLESHOOTING.md`](user-guides/TROUBLESHOOTING.md) | Common issues + fixes for end-users |

### 🏗️ Architecture (`/architecture`)
Deep technical design, blueprints, decision records.

| File | Contents |
|---|---|
| [`BLUEPRINT.md`](architecture/BLUEPRINT.md) | Full system blueprint — every component, every data flow |
| [`DATA_MODEL.md`](architecture/DATA_MODEL.md) | D1 schema, PostgreSQL schema, relationships, indexes |
| [`SECURITY_MODEL.md`](architecture/SECURITY_MODEL.md) | Auth, encryption, RBAC, threat model, compliance |
| [`MULTITENANCY.md`](architecture/MULTITENANCY.md) | Per-tenant isolation, credential vault, plan gating |
| [`AGI_FRAMEWORK.md`](architecture/AGI_FRAMEWORK.md) | Multi-agent orchestration design + pipeline spec |
| [`INTEGRATIONS_MATRIX.md`](architecture/INTEGRATIONS_MATRIX.md) | Every external API, what it does, fallback chains |
| [`ADRs.md`](architecture/ADRs.md) | Architecture Decision Records (why we chose what) |

### 📘 Developer & Component Manuals (`/manuals`)
For engineers extending or maintaining the platform.

| File | Contents |
|---|---|
| [`DEVELOPER_MANUAL.md`](manuals/DEVELOPER_MANUAL.md) | Development workflow, local setup, conventions |
| [`CF_WORKER_MANUAL.md`](manuals/CF_WORKER_MANUAL.md) | Hono Worker — every route, every helper |
| [`FRONTEND_MANUAL.md`](manuals/FRONTEND_MANUAL.md) | React app — routing, state, components |
| [`API_SERVER_MANUAL.md`](manuals/API_SERVER_MANUAL.md) | Express dev API — Drizzle, PostgreSQL |
| [`OMNI_AGENT_MANUAL.md`](manuals/OMNI_AGENT_MANUAL.md) | AI chat frontend — model switching, streaming |
| [`TESTING_MANUAL.md`](manuals/TESTING_MANUAL.md) | Test strategy, fixtures, mocks |
| [`STYLE_GUIDE.md`](manuals/STYLE_GUIDE.md) | Code conventions, branding, UX patterns |

### ⚙️ Operations (`/operations`)
For running the platform in production.

| File | Contents |
|---|---|
| [`RUNBOOK.md`](operations/RUNBOOK.md) | Day-2 ops — restarts, rollbacks, common incidents |
| [`DEPLOY_WORKER.md`](operations/DEPLOY_WORKER.md) | Cloudflare Worker deployment — every command |
| [`DEPLOY_PAGES.md`](operations/DEPLOY_PAGES.md) | Cloudflare Pages deployment — every command |
| [`SECRETS_MANAGEMENT.md`](operations/SECRETS_MANAGEMENT.md) | Every secret, where it lives, how to rotate |
| [`MONITORING.md`](operations/MONITORING.md) | Logs, metrics, alerts, health checks |
| [`BACKUP_RESTORE.md`](operations/BACKUP_RESTORE.md) | D1/PG backup & disaster recovery |
| [`INCIDENT_RESPONSE.md`](operations/INCIDENT_RESPONSE.md) | On-call playbook, severity levels, comms |

### 📚 Reference (`/reference`)
Definitive lookups — no narrative, just facts.

| File | Contents |
|---|---|
| [`COMMANDS.md`](reference/COMMANDS.md) | Every CLI command (pnpm, wrangler, drizzle, git) |
| [`API_ENDPOINTS.md`](reference/API_ENDPOINTS.md) | Every HTTP route — verb, path, auth, payload |
| [`ENV_VARS.md`](reference/ENV_VARS.md) | Every env var + secret across all services |
| [`GLOSSARY.md`](reference/GLOSSARY.md) | Terms and acronyms |
| [`KEYBOARD_SHORTCUTS.md`](reference/KEYBOARD_SHORTCUTS.md) | Frontend shortcuts |
| [`ROUTES_MAP.md`](reference/ROUTES_MAP.md) | Every frontend route + what it does |
| [`ERROR_CODES.md`](reference/ERROR_CODES.md) | Every error code returned by the API |

### 📑 Legacy Top-Level Docs

The following remain at the docs root for backward compatibility and sales/legal use:

| File | Purpose |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | High-level architecture overview (legacy) |
| [`API_REFERENCE.md`](API_REFERENCE.md) | Original API reference (legacy) |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Original 14-step deployment guide |
| [`ENTERPRISE_DEPLOYMENT_GUIDE.md`](ENTERPRISE_DEPLOYMENT_GUIDE.md) | Enterprise customization checklist |
| [`FAQ.md`](FAQ.md) | 40+ technical, billing, compliance Q&A |
| [`SALES_PITCH.md`](SALES_PITCH.md) | Demo script + objection handling |

---

## Master Admin Credentials

The platform recognizes the following emails as **master admins** (allowlisted in both worker and frontend):

- `rickjefferson@rickjeffersonsolutions.com` ← **primary**
- `rickjefferson@rjbusinesssolutions.com`
- `admin@rjbusinesssolutions.org`

Master admins bypass the Twilio-connect gate, see the `/admin` panel, and report plan = `enterprise` regardless of Stripe state.

To add another master admin, edit BOTH:
- `artifacts/cf-worker/src/lib/admin.ts` (source of truth)
- `artifacts/twilio-platform/src/lib/admin.ts` (frontend mirror)

---

## Versioning

This documentation tracks platform version **7.0.0**. Each manual carries its own "Last reviewed" date. When changing behavior or adding features, update the relevant manual in the same PR.

## Maintainers

- **Rick Jefferson** — Architecture, product, all sign-off
- **AI Developer Agent** (GenSpark) — Generated implementations and docs against approved specs
