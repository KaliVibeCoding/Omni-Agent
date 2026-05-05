# RJ Business Solutions — System Architecture

## Overview

RJ Business Solutions is a production-grade multi-tenant SaaS communications platform built on top of the Twilio API. It provides 20 industry-specific communication hubs, AI-powered automation, and Stripe subscription billing — all delivered through a white-label-ready web application.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│         React + Vite SPA — hosted on Cloudflare Pages               │
│         Auth: Clerk (JWT-based, social login, MFA)                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS / REST API
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│              PRODUCTION API — Cloudflare Workers                    │
│              Hono framework, edge-deployed globally                 │
│                                                                     │
│  Routes:                                                            │
│  /api/twilio/*    — All Twilio communications                       │
│  /api/tenant/*    — Multi-tenant credential management              │
│  /api/stripe/*    — Subscription billing                            │
│  /api/niche/*     — 19 industry hub operations                      │
│  /api/anthropic/* — AI conversations (Claude)                       │
│  /api/openrouter/*— AI conversations (multi-model)                  │
│  /api/twilio/telehealth/* — Telehealth/Healthcare                   │
│  /api/twilio/video/* — Video rooms                                  │
│  /api/twilio/conv/* — Conversations API                             │
│                                                                     │
│  Database: Cloudflare D1 (SQLite at the edge)                       │
│  Encryption: AES-256-GCM (Web Crypto API)                           │
└──────────┬────────────────────┬───────────────────────────────────┬─┘
           │                    │                                   │
    ┌──────▼──────┐    ┌────────▼──────┐                 ┌─────────▼──────┐
    │  Twilio API  │    │  Stripe API   │                 │  Anthropic /   │
    │  (SMS, Voice │    │  (Billing,    │                 │  OpenRouter AI │
    │  Video,      │    │   Webhooks,   │                 │  (Claude,      │
    │  Verify,     │    │   Portal)     │                 │   GPT, Mistral)│
    │  Studio...)  │    └───────────────┘                 └────────────────┘
    └─────────────┘
```

---

## Development Architecture (Replit)

```
┌─────────────────────────────────────────────────────┐
│                Replit Dev Environment                │
│                                                     │
│  ┌─────────────────────┐  ┌────────────────────┐   │
│  │  twilio-platform     │  │    api-server       │   │
│  │  React+Vite          │  │    Express 5        │   │
│  │  PORT: 19805         │  │    PORT: 8080       │   │
│  │                      │  │    PostgreSQL       │   │
│  │  /api/* → proxy →   │  │    Drizzle ORM      │   │
│  └──────────────────────┘  └────────────────────┘   │
│                                                     │
│  Auth: Clerk (dev keys)                             │
│  DB: Replit PostgreSQL (DATABASE_URL)               │
└─────────────────────────────────────────────────────┘
```

---

## Multi-Tenancy Model

Each tenant (business customer) has their own:
- **Twilio credentials** stored AES-256-GCM encrypted in the database (per userId)
- **Stripe customer record** tied to their Clerk userId
- **Industry hub records** isolated by userId scope (niche_records)
- **Subscription plan** (Starter / Growth / Business / Enterprise)

No shared Twilio credentials — every API call routes through the tenant's own Twilio account.

---

## Data Flow: Sending an SMS

```
User clicks "Send SMS"
       │
       ▼
Frontend (React) → POST /api/twilio/send-sms
       │
       ▼
CF Worker receives request
  1. Validates Clerk JWT → extracts userId
  2. Fetches encrypted tenant Twilio credentials from D1
  3. Decrypts with AES-256-GCM
  4. Creates per-tenant Twilio client
  5. Calls Twilio Messages API
       │
       ▼
Twilio delivers SMS to end recipient
```

---

## Authentication Flow

```
User visits app
       │
       ├── Not signed in → Landing page (public)
       │
       └── Sign in via Clerk
               │
               ▼
         Clerk issues JWT (sessionToken)
               │
               ▼
         Frontend stores JWT in memory
               │
               ▼
         All API calls include: Authorization: Bearer <jwt>
               │
               ▼
         CF Worker extracts userId from JWT sub claim
         (Full JWKS signature verification supported)
```

---

## Subscription Billing Flow

```
User selects plan → POST /api/stripe/checkout
       │
       ▼
CF Worker finds/creates Stripe customer (by userId)
       │
       ▼
Creates Stripe Checkout Session
       │
       ▼
User redirected to Stripe hosted checkout page
       │
       ▼
Stripe processes payment → fires webhook
       │
       ▼
CF Worker /api/stripe/webhook processes event
  - Subscription created → sends welcome email (Resend)
  - Payment failed → sends alert email
  - Subscription cancelled → sends cancellation email
       │
       ▼
Tenant plan updated in D1 database
```

---

## Database Schema (Cloudflare D1 / SQLite)

### Core Tables
| Table | Purpose |
|-------|---------|
| `tenant_credentials` | Per-user encrypted Twilio credentials + plan |
| `conversations` | AI chat conversation threads |
| `messages` | AI chat messages |
| `contacts` | Per-tenant contact book |
| `call_logs` | Call history cache |
| `sms_logs` | SMS history cache |

### Feature Tables
| Table | Purpose |
|-------|---------|
| `appointments` | Telehealth appointment scheduling |
| `video_rooms` | Twilio Video room tracking |
| `niche_records` | All 19 industry hub records (multi-slug) |

---

## Industry Hubs (19 Niches)

Each niche shares a single `niche_records` table, partitioned by `slug`:

| Slug | Industry | Key Entity |
|------|----------|------------|
| `credit-repair` | Credit Repair | Clients |
| `real-estate` | Real Estate | Leads |
| `insurance` | Insurance | Policyholders |
| `dental` | Dental | Patients |
| `legal` | Legal | Cases |
| `auto` | Automotive | Customers |
| `home-services` | Home Services | Jobs |
| `fitness` | Fitness | Members |
| `restaurant` | Restaurant | Reservations |
| `mortgage` | Mortgage | Borrowers |
| `chiropractic` | Chiropractic | Patients |
| `veterinary` | Veterinary | Patients |
| `education` | Education | Students |
| `nonprofit` | Nonprofit | Donors |
| `staffing` | Staffing | Candidates |
| `med-spa` | Medical Spa | Clients |
| `property-management` | Property Management | Tenants |
| `ecommerce` | E-Commerce | Customers |
| `financial-advisor` | Financial Advisory | Clients |

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| **Authentication** | Clerk JWT (RS256) |
| **Authorization** | Per-request userId extraction from JWT |
| **Credential Storage** | AES-256-GCM encrypted, key in Worker secret |
| **Transport** | TLS 1.3 (Cloudflare enforced) |
| **Stripe Webhooks** | HMAC-SHA256 signature verification |
| **CORS** | Origin whitelist (CF Pages domain) |
| **Rate Limiting** | Cloudflare WAF + Workers rate limiting |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Router | Wouter (lightweight, SPA) |
| State/Data | TanStack React Query |
| Auth | Clerk (JWT, social login, MFA) |
| Production API | Cloudflare Workers + Hono |
| Dev API | Express 5 + Node.js |
| Prod Database | Cloudflare D1 (SQLite) |
| Dev Database | PostgreSQL (Replit) |
| ORM (dev) | Drizzle ORM |
| Communications | Twilio (SMS, Voice, Video, Verify, Studio) |
| Payments | Stripe (Checkout, Portal, Webhooks) |
| AI | Anthropic Claude, OpenRouter (multi-model) |
| Email | Resend API |
| Hosting (frontend) | Cloudflare Pages |
| Hosting (API) | Cloudflare Workers |
| CI/CD | Wrangler CLI / GitHub Actions |
