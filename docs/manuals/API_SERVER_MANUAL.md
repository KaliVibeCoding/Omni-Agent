# Express Dev API Manual (`artifacts/api-server/`)

**Audience:** Engineers using Replit dev environment.
**Version:** 7.0.0
**Last reviewed:** 2026-05-15

> **Production runs on the Cloudflare Worker, NOT this Express server.** This dev API exists for fast local iteration with PostgreSQL + Drizzle. Schema parity with the Worker's D1 is maintained manually.

---

## 1. Stack

- **Framework:** Express 5
- **DB:** PostgreSQL via [Drizzle ORM](https://orm.drizzle.team)
- **Validation:** Zod (`zod/v4`) + `drizzle-zod`
- **Port:** 8080
- **Entry:** `artifacts/api-server/src/index.ts`

---

## 2. File Layout

```
artifacts/api-server/
├── src/
│   ├── index.ts                ← Express app + middleware chain
│   ├── routes/
│   │   ├── twilio/             ← Account, messages, calls, ...
│   │   ├── stripe/             ← Subscriptions, webhook
│   │   ├── tenant/             ← Credential vault
│   │   ├── anthropic/
│   │   └── …
│   └── lib/
│       ├── encrypt.ts          ← AES-256-GCM (node:crypto)
│       ├── tenantTwilio.ts     ← Per-tenant Twilio client
│       ├── stripeClient.ts
│       ├── stripeStorage.ts    ← Drizzle queries against stripe.* schema
│       ├── emailService.ts     ← Resend helpers
│       └── webhookHandlers.ts
├── package.json
└── tsconfig.json
```

---

## 3. Middleware Chain

```
1. cors()                                  ← permissive in dev
2. /api/stripe/webhook (RAW body)          ← MUST be before express.json()
3. express.json()                          ← parse JSON bodies
4. clerkAuthMiddleware                     ← attaches req.userId
5. routes
6. errorHandler                            ← typed JSON errors
```

**Webhook signature verification** requires the raw request body — that's why `/api/stripe/webhook` is mounted before the JSON body parser.

---

## 4. Multi-Tenancy

Same pattern as the Worker:
- `getTenantTwilioClient(userId)` reads `tenant_credentials` (PG table), decrypts, returns Twilio client.
- Routes use `req.userId` from Clerk middleware.

---

## 5. Drizzle Schema

`lib/db/src/schema.ts` defines all tables. Generate migrations:

```bash
cd lib/db
pnpm run generate         # creates drizzle/0001_*.sql
pnpm run push             # applies to dev PG
```

---

## 6. Dev Workflow

```bash
# Start the dev API
cd artifacts/api-server
pnpm run dev              # tsx watch → port 8080

# In another terminal, start the frontend
cd artifacts/twilio-platform
pnpm run dev              # vite → port 5173

# Vite proxy in vite.config.ts forwards /api → :8080
```

---

## 7. Routes (Subset Mirrored from Worker)

| Path | Method | Purpose |
|---|---|---|
| `/api/twilio/account` | GET | Account info |
| `/api/twilio/phone-numbers` | GET, PUT | List/edit numbers |
| `/api/twilio/sms/messages` | GET | Message history |
| `/api/twilio/send-sms` | POST | Outbound SMS |
| `/api/twilio/calls/active` | GET | Live calls |
| `/api/twilio/calls/recent` | GET | History |
| `/api/twilio/calls/outbound` | POST | Place a call |
| `/api/twilio/calls/:sid/hangup` | POST | End call |
| `/api/twilio/recordings` | GET | Recordings list |
| `/api/twilio/voicemails` | GET | Voicemails + transcriptions |
| `/api/twilio/usage/today` | GET | Today's usage |
| `/api/twilio/usage/thismonth` | GET | This month's usage |
| `/api/twilio/alerts` | GET | Monitor alerts |
| `/api/twilio/verify/services` | GET, POST | Verify services |
| `/api/twilio/verify/send` | POST | Send code |
| `/api/twilio/verify/check` | POST | Check code |
| `/api/twilio/messaging-services` | GET | Messaging Services |
| `/api/twilio/studio/flows` | GET | Studio flows |
| `/api/twilio/queues` | GET, POST, DELETE | Queues |
| `/api/twilio/conferences/active` | GET | Live conferences |
| `/api/twilio/contacts` | GET, POST, PATCH, DELETE | Local contacts |
| `/api/twilio/lookup` | GET | Number lookup |
| `/api/tenant/credentials` | GET, POST, PATCH, DELETE | Credential vault |
| `/api/tenant/plan` | PATCH | Update plan |
| `/api/stripe/*` | Various | Stripe billing |

---

## 8. When to Use Dev API vs Worker

| Task | Use |
|---|---|
| Quick iteration on a new route | Dev API |
| Verifying production behavior | Worker (`wrangler dev`) |
| Schema design | Dev API + Drizzle, then port to D1 |
| Heavy SQL (joins, transactions) | Dev API (D1 is more limited) |
| Production deploy | Worker only |
