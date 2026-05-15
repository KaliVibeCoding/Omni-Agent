# Data Model — D1 and PostgreSQL Schemas

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Production: Cloudflare D1 (SQLite)

Schema file: `artifacts/cf-worker/db/schema.sql`

### 1.1 `tenant_credentials`
Per-tenant encrypted Twilio credentials + plan.

| Column | Type | Description |
|---|---|---|
| `user_id` | TEXT PK | Clerk userId |
| `account_sid` | TEXT | Twilio AC… SID (plaintext, validated against Twilio) |
| `account_name` | TEXT | Friendly name from Twilio Account.friendlyName |
| `auth_token` | TEXT | AES-256-GCM ciphertext |
| `api_key_sid` | TEXT NULL | Optional API Key SID (for Voice/Video) |
| `api_key_secret` | TEXT NULL | AES-256-GCM ciphertext |
| `plan` | TEXT | `starter` \| `growth` \| `business` \| `enterprise` |
| `stripe_customer_id` | TEXT NULL | `cus_…` |
| `stripe_subscription_id` | TEXT NULL | `sub_…` |
| `created_at` | TEXT | ISO datetime |
| `updated_at` | TEXT | ISO datetime |

**Indexes:** PK on `user_id`; secondary on `stripe_customer_id`.

### 1.2 `conversations`
AI chat conversation headers (Anthropic + OpenRouter).

| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK | Clerk userId |
| `provider` | TEXT | `anthropic` \| `openrouter` |
| `model` | TEXT | e.g. `claude-3-5-sonnet-20241022` |
| `title` | TEXT | Auto-generated or user-set |
| `created_at` | TEXT | ISO datetime |
| `updated_at` | TEXT | ISO datetime |

### 1.3 `messages`
Conversation message log.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `conversation_id` | TEXT FK | → conversations.id |
| `role` | TEXT | `user` \| `assistant` \| `system` |
| `content` | TEXT | Full message (JSON-encoded for multi-modal) |
| `tokens_in` | INTEGER | Prompt tokens |
| `tokens_out` | INTEGER | Completion tokens |
| `created_at` | TEXT | ISO datetime |

### 1.4 `sms_logs`
Outbound + inbound SMS audit log.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK | Clerk userId |
| `sid` | TEXT | Twilio MessageSid |
| `direction` | TEXT | `outbound-api` \| `inbound` |
| `from_number` | TEXT | E.164 |
| `to_number` | TEXT | E.164 |
| `body` | TEXT | Message body |
| `status` | TEXT | Twilio status |
| `price` | REAL NULL | Per-segment price USD |
| `created_at` | TEXT | ISO datetime |

### 1.5 `call_logs`
Voice call audit log.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK | Clerk userId |
| `sid` | TEXT | Twilio CallSid |
| `from_number` | TEXT | E.164 |
| `to_number` | TEXT | E.164 |
| `direction` | TEXT | `outbound-api` \| `inbound` |
| `status` | TEXT | `completed` \| `failed` \| `busy` \| `no-answer` |
| `duration_seconds` | INTEGER | |
| `recording_url` | TEXT NULL | Twilio recording URL |
| `created_at` | TEXT | ISO datetime |

### 1.6 `contacts`
Tenant address book.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK | Clerk userId |
| `name` | TEXT | |
| `phone` | TEXT | E.164 |
| `email` | TEXT NULL | |
| `tags` | TEXT | JSON array |
| `notes` | TEXT NULL | |
| `created_at` | TEXT | ISO datetime |
| `updated_at` | TEXT | ISO datetime |

### 1.7 `appointments`
Telehealth + niche scheduling.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK | Clerk userId |
| `niche` | TEXT NULL | Niche slug if niche-scoped |
| `patient_name` | TEXT | |
| `patient_phone` | TEXT | E.164 |
| `scheduled_at` | TEXT | ISO datetime |
| `duration_minutes` | INTEGER | |
| `status` | TEXT | `scheduled` \| `confirmed` \| `completed` \| `cancelled` \| `no-show` |
| `notes` | TEXT NULL | |
| `video_room_sid` | TEXT NULL | Twilio Video room SID |
| `created_at` | TEXT | ISO datetime |

### 1.8 `video_rooms`
Twilio Programmable Video rooms.

| Column | Type | Description |
|---|---|---|
| `sid` | TEXT PK | Twilio RM… |
| `user_id` | TEXT FK | Owner |
| `unique_name` | TEXT | App-friendly name |
| `status` | TEXT | `in-progress` \| `completed` |
| `created_at` | TEXT | ISO datetime |
| `ended_at` | TEXT NULL | ISO datetime |

### 1.9 `niche_records`
Generic table backing all 19 industry hubs.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK | Clerk userId |
| `niche` | TEXT | Slug: `credit-repair`, `real-estate`, … |
| `status` | TEXT | Niche-specific (e.g. `lead`, `active`, `closed`) |
| `data` | TEXT | JSON payload — niche-specific fields |
| `created_at` | TEXT | ISO datetime |
| `updated_at` | TEXT | ISO datetime |

**Indexes:** `(user_id, niche, status)` composite for fast filtering.

---

## 2. Development: PostgreSQL (Drizzle)

Schema location: `lib/db/src/schema.ts`

Mirrors the D1 model with PG-native types:
- `text` → `text`
- `INTEGER` → `integer`
- `REAL` → `numeric`
- All `created_at`/`updated_at` use `timestamp with time zone`

Drizzle migrations live in `lib/db/drizzle/`. Apply with:
```bash
pnpm --filter @workspace/db run push
```

---

## 3. Stripe Sync Schema

The `stripe-replit-sync` package maintains a separate `stripe.*` schema mirroring Stripe objects:
- `stripe.customers`
- `stripe.subscriptions`
- `stripe.prices`
- `stripe.products`
- `stripe.invoices`

Queried via `artifacts/api-server/src/lib/stripeStorage.ts`.

---

## 4. Relationships

```
clerk:user_id (1) ──┬── (N) tenant_credentials
                    ├── (N) conversations ── (N) messages
                    ├── (N) sms_logs
                    ├── (N) call_logs
                    ├── (N) contacts
                    ├── (N) appointments
                    ├── (N) video_rooms
                    └── (N) niche_records
```

All foreign keys point to Clerk userIds — there is no internal `users` table.

---

## 5. Migration Strategy

| Step | Command |
|---|---|
| Create initial schema | `wrangler d1 execute twilio-platform --file=db/schema.sql --remote` |
| Apply incremental migration | `wrangler d1 execute twilio-platform --file=db/migrations/NNNN_x.sql --remote` |
| Dev parity | `pnpm --filter @workspace/db run push` (Drizzle to PG) |

**Rule:** All schema changes ship as additive (new columns, new tables). Destructive changes require a numbered migration file and rollback script.
