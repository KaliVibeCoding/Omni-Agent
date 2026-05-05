# RJ Business Solutions — API Reference

**Base URL (production):** `https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev`  
**Base URL (development):** `http://localhost:8080`

All authenticated endpoints require:
```
Authorization: Bearer <clerk_session_token>
```

---

## Health

### GET /api/healthz
Returns server health status. No authentication required.

**Response:**
```json
{ "ok": true, "ts": 1715000000000 }
```

---

## Tenant Management

### GET /api/tenant/credentials
Returns the current user's connected Twilio account info (credentials are never returned raw).

**Auth:** Required

**Response (connected):**
```json
{
  "connected": true,
  "accountSid": "AC...",
  "accountName": "My Business",
  "plan": "growth",
  "hasApiKey": false,
  "createdAt": "2025-01-15T12:00:00.000Z"
}
```

**Response (not connected):**
```json
{ "connected": false }
```

---

### POST /api/tenant/credentials
Validates and saves Twilio credentials for the current user.

**Auth:** Required

**Request:**
```json
{
  "accountSid": "ACxxxxxxxxxx",
  "authToken": "your_auth_token",
  "apiKeySid": "SKxxxxxxxxxx",     // optional
  "apiKeySecret": "your_key_secret" // optional
}
```

**Response:**
```json
{
  "connected": true,
  "accountSid": "ACxxxxxxxxxx",
  "accountName": "My Twilio Account",
  "plan": "starter"
}
```

**Errors:**
- `400` — Missing required fields or invalid Twilio credentials
- `401` — Not authenticated
- `500` — Encryption key not configured

---

### PATCH /api/tenant/plan
Updates the subscription plan tier.

**Auth:** Required

**Request:**
```json
{ "plan": "growth" }
```

Valid values: `starter`, `growth`, `business`, `enterprise`

**Response:**
```json
{ "plan": "growth" }
```

---

### DELETE /api/tenant/credentials
Disconnects the Twilio account (removes credentials from database).

**Auth:** Required

**Response:**
```json
{ "connected": false }
```

---

## Stripe Billing

### GET /api/stripe/publishable-key
Returns the Stripe publishable key. No authentication required.

**Response:**
```json
{ "publishableKey": "pk_live_..." }
```

---

### GET /api/stripe/products
Returns all active Stripe products with prices. No authentication required.

**Response:**
```json
{
  "data": [
    {
      "id": "prod_xxx",
      "name": "Growth",
      "description": "For growing teams",
      "metadata": { "tier": "growth" },
      "prices": [
        {
          "id": "price_xxx",
          "unit_amount": 19900,
          "currency": "usd",
          "recurring": { "interval": "month" }
        }
      ]
    }
  ]
}
```

---

### GET /api/stripe/subscription
Returns the current user's active subscription.

**Auth:** Required

**Response (subscribed):**
```json
{
  "subscription": { "id": "sub_xxx", "status": "active", ... },
  "plan": "growth"
}
```

**Response (no subscription):**
```json
{ "subscription": null, "plan": "free" }
```

---

### POST /api/stripe/checkout
Creates a Stripe Checkout session for a plan upgrade.

**Auth:** Required

**Request:**
```json
{ "priceId": "price_xxx" }
```

**Response:**
```json
{ "url": "https://checkout.stripe.com/pay/cs_xxx" }
```

---

### POST /api/stripe/portal
Creates a Stripe Billing Portal session for subscription management.

**Auth:** Required

**Response:**
```json
{ "url": "https://billing.stripe.com/session/xxx" }
```

---

### POST /api/stripe/webhook
Stripe webhook endpoint. Called by Stripe on subscription events.

**No auth** — verified via Stripe-Signature header

**Handled events:**
- `customer.subscription.created` → sends welcome email
- `customer.subscription.updated` → sends upgrade email
- `customer.subscription.deleted` → sends cancellation email
- `invoice.payment_succeeded` → sends receipt email
- `invoice.payment_failed` → sends payment failure alert

---

## SMS & Messaging

### GET /api/twilio/sms/messages
Returns recent SMS messages for the tenant's Twilio account.

**Auth:** Required

**Query params:** `limit` (default: 50), `page`

**Response:**
```json
[
  {
    "sid": "SM...",
    "from": "+15551234567",
    "to": "+15559876543",
    "body": "Hello world",
    "status": "delivered",
    "direction": "outbound-api",
    "dateSent": "2025-01-15T12:00:00Z",
    "price": "-0.0075"
  }
]
```

---

### POST /api/twilio/send-sms
Sends an SMS message.

**Auth:** Required

**Request:**
```json
{
  "to": "+15551234567",
  "body": "Your appointment is tomorrow at 2pm."
}
```

**Response:**
```json
{
  "sid": "SM...",
  "status": "queued",
  "to": "+15551234567",
  "from": "+15559999999"
}
```

---

## Calls

### GET /api/twilio/calls/active
Returns currently active calls.

### GET /api/twilio/calls/recent
Returns recent call logs.

### POST /api/twilio/calls/outbound
Initiates an outbound call.

**Request:**
```json
{
  "to": "+15551234567",
  "from": "+15559999999"
}
```

### DELETE /api/twilio/calls/:sid/hangup
Hangs up an active call by SID.

---

## Industry Hub Records (Niche)

All niche routes use the `slug` to identify the industry (e.g., `dental`, `real-estate`).

### GET /api/niche/:slug/stats
Returns aggregate stats for the niche.

**Response:**
```json
{
  "total": 142,
  "active": 38,
  "today": 5,
  "thisWeek": 22,
  "byStatus": [
    { "status": "new", "count": 15 },
    { "status": "active", "count": 23 }
  ]
}
```

---

### GET /api/niche/:slug/records
Returns records for the niche, newest first.

**Query params:** `status` (filter by status, or `all`)

**Response:**
```json
[
  {
    "id": 1,
    "slug": "dental",
    "entity_name": "Jane Smith",
    "entity_phone": "+15551234567",
    "entity_email": "jane@example.com",
    "record_type": "cleaning",
    "status": "active",
    "notes": "Prefers morning appointments",
    "assigned_to": "Dr. Johnson",
    "scheduled_at": "2025-02-01T09:00:00Z",
    "reminder_sent": 0,
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
]
```

---

### POST /api/niche/:slug/records
Creates a new record.

**Request:**
```json
{
  "entity_name": "Jane Smith",
  "entity_phone": "+15551234567",
  "entity_email": "jane@example.com",
  "record_type": "cleaning",
  "notes": "Prefers morning appointments",
  "assigned_to": "Dr. Johnson",
  "scheduled_at": "2025-02-01T09:00:00Z"
}
```

**Response:** `201` with the created record.

---

### PATCH /api/niche/:slug/records/:id/status
Updates the status of a record.

**Request:**
```json
{ "status": "completed" }
```

---

### DELETE /api/niche/:slug/records/:id
Deletes a record.

**Response:**
```json
{ "success": true }
```

---

### POST /api/niche/:slug/records/:id/sms
Sends an SMS to the record's phone number.

**Auth:** Required (uses tenant's Twilio credentials)

**Request:**
```json
{ "message": "Your appointment is tomorrow at 2pm." }
```

**Response:**
```json
{
  "sid": "SM...",
  "status": "queued",
  "to": "+15551234567",
  "body": "Your appointment is tomorrow at 2pm. Reply STOP to opt out."
}
```

---

### POST /api/niche/:slug/bulk-sms
Sends an SMS to all records in the niche (optionally filtered by status).

**Auth:** Required

**Request:**
```json
{
  "message": "We have a special offer for you this week!",
  "status_filter": "active"
}
```

**Response:**
```json
{ "sent": 23, "total": 38 }
```

---

## Telehealth

### GET /api/twilio/telehealth/stats
Returns telehealth dashboard stats.

### GET /api/twilio/telehealth/appointments
Returns appointments. Query params: `status`, `date`.

### POST /api/twilio/telehealth/appointments
Creates an appointment.

### PUT /api/twilio/telehealth/appointments/:id
Updates an appointment.

### PATCH /api/twilio/telehealth/appointments/:id/status
Updates appointment status.

### DELETE /api/twilio/telehealth/appointments/:id
Deletes an appointment.

### POST /api/twilio/telehealth/appointments/:id/remind
Sends an SMS reminder to the patient.

### POST /api/twilio/telehealth/appointments/:id/video-invite
Sends a video room join link via SMS.

### POST /api/twilio/telehealth/appointments/bulk-remind
Sends reminders to all un-reminded appointments for a given date.

---

## AI Conversations

### GET /api/anthropic/conversations
Returns all conversation threads.

### POST /api/anthropic/conversations
Creates a new conversation.

### GET /api/anthropic/conversations/:id/messages
Returns messages in a conversation.

### POST /api/anthropic/conversations/:id/messages
Sends a message and streams Claude's response.

### DELETE /api/anthropic/conversations/:id
Deletes a conversation and all its messages.

Same endpoints available under `/api/openrouter/` for OpenRouter models.

---

## Video Rooms

### GET /api/twilio/video/rooms
Returns video rooms (filterable by status).

### POST /api/twilio/video/rooms
Creates a new video room.

### DELETE /api/twilio/video/rooms/:sid
Ends a video room.

### POST /api/twilio/video/token
Generates an access token for joining a video room.

---

## Error Responses

All endpoints return errors in this format:
```json
{ "error": "Human-readable error message" }
```

**Common HTTP status codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (missing/invalid parameters) |
| 401 | Unauthorized (missing or invalid JWT) |
| 404 | Not found |
| 500 | Internal server error |
| 503 | Service unavailable (database not connected) |
