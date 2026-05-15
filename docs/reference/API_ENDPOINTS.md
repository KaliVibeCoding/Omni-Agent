# API Endpoints Reference

> Every HTTP route exposed by the platform — verb, path, auth requirement, request shape, response shape, status codes.
> Source of truth: `artifacts/cf-worker/src/routes/*.ts` (production) + `server/routes/*.ts` (dev).
> The frontend reaches the API via the Pages Function proxy at `/api/*` → Worker.

---

## Base URLs

| Environment | URL |
|---|---|
| Production Worker | `https://rj-agent-worker.<account>.workers.dev` |
| Production via Pages proxy | `https://app.rickjeffersonsolutions.com/api/*` |
| Dev (Replit Express) | `http://localhost:5000/api/*` |
| Local Worker dev | `http://localhost:8787` |

## Auth Legend

| Symbol | Meaning |
|---|---|
| 🟢 | Public — no auth |
| 🔵 | Authenticated — `Authorization: Bearer <Clerk JWT>` |
| 🟣 | Master Admin only — Bearer JWT + email in allowlist |
| 🟡 | Webhook — Signature validation (Stripe-Signature / Twilio-X-Signature) |

All authenticated requests send the Clerk session token. The Pages Function proxy at `functions/api/[[path]].ts` forwards `Authorization` unchanged to the Worker.

## Standard error envelope

```json
{ "error": "human readable message", "code": "OPTIONAL_CODE", "details": { } }
```

Status code convention:
- `400` Bad request / validation failure
- `401` Missing or invalid JWT
- `402` Plan upgrade required
- `403` Authenticated but not authorized (e.g., not master admin)
- `404` Not found / no such tenant
- `409` Conflict (e.g., credential already exists)
- `429` Rate limited
- `500` Unhandled server error
- `502` Upstream provider error (Twilio, Stripe, Anthropic)

---

## 1. Health & Identity

### `GET /health` 🟢
Returns `{ ok: true, ts: <iso> }`. Cache-Control: no-store.

### `GET /api/me` 🔵
Returns the caller's identity + entitlements.
```json
{
  "signedIn": true,
  "userId": "user_2abc...",
  "email": "rickjefferson@rickjeffersonsolutions.com",
  "isMasterAdmin": true,
  "plan": "enterprise",
  "hasTwilioCreds": true,
  "createdAt": "2026-05-15T14:23:11Z"
}
```
- 401 if no JWT.

---

## 2. Integrations

### `GET /api/integrations/twilio` 🔵
```json
{ "configured": true, "fromNumber": "+15555550100", "accountSidLast4": "1234" }
```
Never returns the auth token in clear.

### `POST /api/integrations/twilio` 🔵
Body:
```json
{ "accountSid": "AC...", "authToken": "...", "fromNumber": "+15555550100" }
```
- Validates SID prefix (`AC` for accounts, `SK` for API keys).
- Encrypts authToken with AES-256-GCM keyed by `ENCRYPTION_KEY`.
- Persists to `tenant_credentials` keyed by `userId`.
Returns `{ ok: true }`. Errors: 400 invalid format, 502 Twilio probe failed.

### `DELETE /api/integrations/twilio` 🔵
Removes the tenant's Twilio credentials.

### `GET /api/integrations` 🔵
List status of every connectable provider for current user.
```json
[
  { "key": "twilio", "configured": true,  "label": "Twilio" },
  { "key": "stripe", "configured": false, "label": "Stripe" },
  { "key": "clerk",  "configured": true,  "label": "Clerk", "system": true }
]
```

---

## 3. Twilio Passthrough (per-tenant credentials)

All routes load encrypted creds, decrypt, and call Twilio API on the tenant's behalf.

### `POST /api/twilio/messages` 🔵
Send SMS.
```json
{ "to": "+15555550123", "body": "Hello", "mediaUrl": ["https://..."] }
```
Returns Twilio MessageResource. Logs to `sms_logs`.

### `GET /api/twilio/messages` 🔵
Recent messages for tenant. Query: `?limit=50&direction=inbound|outbound`.

### `POST /api/twilio/calls` 🔵
Place outbound voice call.
```json
{ "to": "+15555550123", "twiml": "<Response>...</Response>" }
```

### `GET /api/twilio/numbers` 🔵
List numbers owned in the tenant's Twilio account.

### `POST /api/twilio/numbers/buy` 🔵
Body: `{ "phoneNumber": "+15555550100" }`. Provisions a new number on tenant's Twilio account.

### `POST /api/twilio/verify/start` 🔵
`{ "to": "+15555550123", "channel": "sms" }`

### `POST /api/twilio/verify/check` 🔵
`{ "to": "+15555550123", "code": "123456" }`

---

## 4. Twilio Webhooks (from Twilio → us)

### `POST /api/twilio/webhook/sms` 🟡
Inbound SMS. Validates `X-Twilio-Signature`. Persists to `messages`. Triggers AGI inbound pipeline if configured.

### `POST /api/twilio/webhook/voice` 🟡
Inbound voice. Returns TwiML.

### `POST /api/twilio/webhook/status` 🟡
Message/call delivery status updates.

---

## 5. Stripe

### `POST /api/stripe/checkout` 🔵
Create checkout session.
```json
{ "priceId": "price_xxx", "successUrl": "...", "cancelUrl": "..." }
```
Returns `{ "url": "https://checkout.stripe.com/..." }`.

### `POST /api/stripe/portal` 🔵
Create billing portal session for the current customer.

### `GET /api/stripe/subscription` 🔵
Current subscription summary.

### `POST /api/stripe/webhook` 🟡
**Mounted BEFORE express.json()** so we receive raw body for signature verification. Handles:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

## 6. Conversations / Messages

### `GET /api/conversations` 🔵
Returns recent conversations grouped by counterpart number. Query: `?limit=50&search=...`.

### `GET /api/conversations/:id` 🔵
Single conversation with messages array.

### `POST /api/conversations/:id/reply` 🔵
Send a reply in an existing thread.

### `DELETE /api/conversations/:id` 🔵
Archive a conversation.

### `GET /api/messages` 🔵
Flat message list. Query: `?conversationId=...&limit=...`.

---

## 7. Contacts / CRM

### `GET /api/contacts` 🔵
Query: `?search=&tag=&limit=&offset=`.

### `POST /api/contacts` 🔵
```json
{ "phone": "+1...", "name": "...", "email": "...", "tags": ["..."] }
```

### `GET /api/contacts/:id` 🔵
### `PATCH /api/contacts/:id` 🔵
### `DELETE /api/contacts/:id` 🔵
### `POST /api/contacts/bulk` 🔵 — CSV import (multipart/form-data)
### `GET /api/contacts/export` 🔵 — CSV export

---

## 8. Campaigns

### `GET /api/campaigns` 🔵
### `POST /api/campaigns` 🔵
```json
{
  "name": "Spring promo",
  "audience": { "tag": "vip" },
  "template": "Hi {{name}}, ...",
  "schedule": { "startAt": "2026-06-01T15:00:00Z" }
}
```
### `GET /api/campaigns/:id` 🔵
### `PATCH /api/campaigns/:id` 🔵
### `POST /api/campaigns/:id/start` 🔵
### `POST /api/campaigns/:id/pause` 🔵
### `POST /api/campaigns/:id/cancel` 🔵
### `GET /api/campaigns/:id/stats` 🔵 — `{ sent, delivered, failed, replies }`

---

## 9. Niches (industry hubs)

All 19 industry hubs use the same generic CRUD against `niche_records`.

### `GET /api/niches/:niche/records` 🔵
`:niche ∈ { credit-repair | real-estate | insurance | legal | medical | dental | fitness | restaurant | automotive | retail | education | finance | beauty | construction | nonprofit | events | technology | hospitality | logistics }`

Query: `?q=&status=&limit=&offset=`.

### `POST /api/niches/:niche/records` 🔵
Schema is niche-specific JSON validated server-side. See [`../user-guides/NICHE_PLAYBOOKS.md`](../user-guides/NICHE_PLAYBOOKS.md).

### `GET /api/niches/:niche/records/:id` 🔵
### `PATCH /api/niches/:niche/records/:id` 🔵
### `DELETE /api/niches/:niche/records/:id` 🔵
### `POST /api/niches/:niche/import` 🔵 — multipart CSV
### `GET /api/niches/:niche/export` 🔵

---

## 10. AGI Framework (multi-agent pipelines)

Requires **Business+ plan** (master admins bypass).

### `GET /api/agi/pipelines` 🔵
### `POST /api/agi/pipelines` 🔵
```json
{
  "name": "Lead intake",
  "nodes": [
    { "id":"n1", "type":"intent", "params":{ ... } },
    { "id":"n2", "type":"extract", "params":{ ... } },
    { "id":"n3", "type":"compose", "params":{ ... } },
    { "id":"n4", "type":"notify", "params":{ ... } }
  ],
  "edges": [["n1","n2"],["n2","n3"],["n3","n4"]],
  "trigger": "inbound_sms"
}
```
### `GET /api/agi/pipelines/:id` 🔵
### `PATCH /api/agi/pipelines/:id` 🔵
### `DELETE /api/agi/pipelines/:id` 🔵
### `POST /api/agi/pipelines/:id/run` 🔵 — manual trigger; body is the simulated input event
### `GET /api/agi/runs` 🔵 — recent execution history
### `GET /api/agi/runs/:id` 🔵 — single run with per-node traces

---

## 11. AI Chat (Omni-Agent)

### `POST /api/chat` 🔵
SSE streaming.
```json
{ "model":"claude-3-5-sonnet", "messages":[ { "role":"user","content":"..." } ] }
```
Streams `data: {chunk}\n\n` events; terminates with `data: [DONE]`.

### `GET /api/chat/threads` 🔵
### `POST /api/chat/threads` 🔵
### `GET /api/chat/threads/:id` 🔵
### `DELETE /api/chat/threads/:id` 🔵

### `GET /api/ai/models` 🔵
List of models available to current plan.

---

## 12. Appointments

### `GET /api/appointments` 🔵
### `POST /api/appointments` 🔵
### `GET /api/appointments/:id` 🔵
### `PATCH /api/appointments/:id` 🔵
### `DELETE /api/appointments/:id` 🔵
### `GET /api/appointments/availability` 🔵 — `?date=YYYY-MM-DD`

---

## 13. Video Rooms

### `GET /api/video/rooms` 🔵
### `POST /api/video/rooms` 🔵 — creates Twilio Video room, returns join token
### `POST /api/video/rooms/:sid/end` 🔵
### `GET /api/video/rooms/:sid/recordings` 🔵

---

## 14. Email (Resend)

### `POST /api/email/send` 🔵
```json
{ "to":"...", "subject":"...", "html":"...", "from":"..." }
```
### `GET /api/email/logs` 🔵

---

## 15. Master Admin 🟣

All require master admin (email in allowlist). 403 otherwise.

### `GET /api/admin/tenants` 🟣
Paginated tenant list.
```json
{
  "tenants": [
    { "userId":"user_x", "email":"...", "plan":"starter",
      "hasTwilio": true, "createdAt":"...", "lastActive":"..." }
  ],
  "total": 137,
  "page": 1
}
```

### `GET /api/admin/tenants/:userId` 🟣
Full tenant detail incl. usage counters.

### `PATCH /api/admin/tenants/:userId` 🟣
```json
{ "plan":"business", "suspended": false, "notes":"..." }
```

### `DELETE /api/admin/tenants/:userId` 🟣
Soft-delete tenant (data preserved for 30 days, GDPR purge available separately).

### `GET /api/admin/metrics` 🟣
Platform-wide rollups.
```json
{
  "totals": { "tenants": 137, "smsLast30d": 48211, "callsLast30d": 1924 },
  "plansBreakdown": { "free": 80, "starter": 30, "growth": 18, "business": 7, "enterprise": 2 },
  "mrrUsd": 7942
}
```

### `GET /api/admin/audit-log` 🟣
Recent admin actions.

### `POST /api/admin/impersonate/:userId` 🟣
Generate a short-lived impersonation token (for support — logged).

---

## 16. Rate Limit Headers

Every authenticated response includes:
```
X-RateLimit-Limit:     60
X-RateLimit-Remaining: 58
X-RateLimit-Reset:     1715800000
```
Free: 60/min · Starter 300/min · Growth 1k/min · Business 5k/min · Enterprise unlimited. Master admins are exempt.

---

## 17. CORS

The Worker responds to preflight `OPTIONS *` with:
```
Access-Control-Allow-Origin:      <configured origin>
Access-Control-Allow-Methods:     GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers:     Authorization, Content-Type, X-Requested-With
Access-Control-Max-Age:           600
```

The Pages Function proxy at `functions/api/[[path]].ts` mirrors this for browser clients.

---

**See also:**
- [`COMMANDS.md`](COMMANDS.md#8-curl-recipes-for-the-api) — curl recipes
- [`ERROR_CODES.md`](ERROR_CODES.md) — every error code returned
- [`ENV_VARS.md`](ENV_VARS.md) — env vars these routes depend on
- [`../architecture/SECURITY_MODEL.md`](../architecture/SECURITY_MODEL.md) — auth deep dive
