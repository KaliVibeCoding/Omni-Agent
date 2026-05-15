# Error Codes Reference

> Every error code the API can return — what it means, why it happens, how to fix it.
> The error envelope is `{ "error": <message>, "code": <CODE>, "details": { ... } }`.

---

## HTTP Status Codes — Overview

| Status | Class | Meaning |
|---|---|---|
| 200 | Success | Request completed. |
| 201 | Success | Resource created. |
| 202 | Success | Accepted (async work queued). |
| 204 | Success | No content (DELETE / idempotent ops). |
| 400 | Client | Bad request — validation failed. |
| 401 | Client | Unauthenticated. |
| 402 | Client | Plan upgrade required. |
| 403 | Client | Authenticated but forbidden. |
| 404 | Client | Resource not found. |
| 409 | Client | Conflict (e.g., duplicate). |
| 410 | Client | Gone (resource was deleted). |
| 422 | Client | Unprocessable entity. |
| 429 | Client | Rate limited. |
| 500 | Server | Unhandled server error. |
| 502 | Server | Upstream provider error. |
| 503 | Server | Service unavailable (maintenance / overload). |
| 504 | Server | Upstream timeout. |

---

## Application Error Codes

### Authentication (1xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `AUTH_MISSING_TOKEN` | 401 | No `Authorization` header. | Frontend must call `getToken()` from Clerk before requests. Check that `setAuthTokenGetter` is wired in `App.tsx`. |
| `AUTH_INVALID_TOKEN` | 401 | JWT failed signature/expiry verification. | Re-sign-in. If recurring, check `CLERK_ISSUER` matches the JWKS URL. |
| `AUTH_EXPIRED_TOKEN` | 401 | JWT past `exp`. | Clerk auto-refreshes; if persistent, check device clock skew. |
| `AUTH_WRONG_ISSUER` | 401 | JWT `iss` claim doesn't match `CLERK_ISSUER` env. | Verify env var on Worker matches Clerk dashboard. |
| `AUTH_CLERK_LOOKUP_FAILED` | 502 | Couldn't fetch email from Clerk Backend API. | Check `CLERK_SECRET_KEY` is set and valid. |
| `AUTH_USER_NOT_FOUND` | 404 | Clerk userId resolved but user record missing. | Likely deleted in Clerk; clear client session. |

### Authorization (2xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `AUTHZ_NOT_MASTER_ADMIN` | 403 | Caller is authenticated but not in master admin allowlist. | Email isn't in `MASTER_ADMIN_EMAILS` env. Add to env on both Worker + frontend and redeploy. |
| `AUTHZ_PLAN_REQUIRED` | 402 | Current plan doesn't include this feature. `details.required` lists minimum plan. | Upgrade via `/billing`. Master admins shouldn't hit this. |
| `AUTHZ_TENANT_MISMATCH` | 403 | Trying to access another tenant's data. | Bug — never returned in normal flow. Report. |
| `AUTHZ_SUSPENDED` | 403 | Tenant is suspended. | Contact admin or check `/billing`. |

### Validation (3xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `VAL_INVALID_BODY` | 400 | JSON body didn't match schema. `details.errors` is a Zod error array. | Fix request shape; see endpoint docs in [`API_ENDPOINTS.md`](API_ENDPOINTS.md). |
| `VAL_INVALID_PHONE` | 400 | Phone not in E.164 format. | Reformat to `+1XXXXXXXXXX`. |
| `VAL_INVALID_EMAIL` | 400 | Email format invalid. | Validate client-side first. |
| `VAL_INVALID_NICHE` | 400 | `:niche` path param not one of the 19 supported. | See [`ROUTES_MAP.md`](ROUTES_MAP.md#niches-sidebar-group-niches). |
| `VAL_INVALID_PAGINATION` | 400 | `limit > 100` or `offset < 0`. | Clamp client-side. |
| `VAL_BAD_DATE` | 400 | Date not ISO-8601. | Use `new Date().toISOString()`. |
| `VAL_FILE_TOO_LARGE` | 400 | Upload > 10 MB. | Split or compress. |

### Twilio Integration (4xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `TWILIO_NOT_CONFIGURED` | 400 | Tenant hasn't saved Twilio credentials. | Go to `/integrations/twilio` and save creds. |
| `TWILIO_BAD_SID_FORMAT` | 400 | SID doesn't start with `AC` or `SK`. | Use the SID from Twilio console. |
| `TWILIO_AUTH_FAILED` | 502 | Twilio rejected the credentials. | Re-enter SID + auth token. |
| `TWILIO_NUMBER_NOT_OWNED` | 400 | Tried to send from a number not in this Twilio account. | Buy or transfer the number first. |
| `TWILIO_RATE_LIMITED` | 429 | Twilio (not us) returned 429. | Back off and retry. |
| `TWILIO_INSUFFICIENT_FUNDS` | 402 | Twilio account balance too low. | Top up Twilio account. |
| `TWILIO_A2P_REQUIRED` | 400 | US destination but no A2P 10DLC registration. | Complete A2P registration in Twilio console. |
| `TWILIO_UNDELIVERABLE` | 400 | Number is invalid / landline / unreachable. | Verify number. |
| `TWILIO_WEBHOOK_BAD_SIGNATURE` | 401 | Inbound webhook signature invalid. | Verify `Twilio Auth Token` matches saved credential. |

### Stripe / Billing (5xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `STRIPE_NOT_CONFIGURED` | 500 | Server missing `STRIPE_SECRET_KEY`. | Set secret and redeploy. |
| `STRIPE_NO_CUSTOMER` | 404 | Tenant has no Stripe customer yet. | Hit checkout to auto-create. |
| `STRIPE_CHECKOUT_FAILED` | 502 | Stripe rejected checkout creation. | Inspect `details.raw`. |
| `STRIPE_WEBHOOK_BAD_SIGNATURE` | 401 | Webhook signature failed. | Verify `STRIPE_WEBHOOK_SECRET`. Note: webhook route must be mounted before `express.json()` in dev API. |
| `STRIPE_PRICE_UNKNOWN` | 400 | `priceId` not one of configured plan prices. | Use a price from `STRIPE_PRICE_*` env. |
| `STRIPE_INVOICE_FAILED` | 402 | Last invoice payment failed. | Open `/billing` portal, update payment method. |

### Database / Storage (6xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `DB_CONFLICT` | 409 | Unique constraint violation. | E.g., contact phone already exists. |
| `DB_NOT_FOUND` | 404 | Row not found. | Verify ID. |
| `DB_QUERY_FAILED` | 500 | SQL error. | Check `LOG_LEVEL=debug` logs. |
| `DB_FOREIGN_KEY` | 409 | Referenced resource doesn't exist. | Create parent first. |

### Encryption (7xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `CRYPTO_KEY_MISSING` | 500 | `ENCRYPTION_KEY` not set. | Set with `wrangler secret put ENCRYPTION_KEY`. |
| `CRYPTO_KEY_INVALID` | 500 | Key not 32 bytes base64. | Generate with `openssl rand -base64 32`. |
| `CRYPTO_DECRYPT_FAILED` | 500 | Stored ciphertext can't be decrypted (key rotated?). | See [`SECRETS_MANAGEMENT.md`](../operations/SECRETS_MANAGEMENT.md#encryption-key-rotation). |

### AI Providers (8xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `AI_NO_KEY` | 500 | Required provider key missing. | Set the relevant `*_API_KEY` secret. |
| `AI_PROVIDER_DOWN` | 502 | Provider returned 5xx. | Will auto-failover if alt provider configured. |
| `AI_PROVIDER_RATE_LIMITED` | 429 | Provider returned 429. | Back off; consider raising plan with provider. |
| `AI_CONTEXT_TOO_LONG` | 400 | Prompt + history exceeds model's context window. | Truncate or use a larger-context model. |
| `AI_MODEL_NOT_AVAILABLE` | 400 | Model not enabled for current plan. | Upgrade or pick a different model. |

### AGI Framework (9xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `AGI_PLAN_REQUIRED` | 402 | AGI is Business+. | Upgrade. |
| `AGI_INVALID_GRAPH` | 400 | Cycle or orphan node detected. | Inspect `details.path`. |
| `AGI_UNKNOWN_NODE_TYPE` | 400 | Node `type` not registered. | See [`AGI_FRAMEWORK.md`](../architecture/AGI_FRAMEWORK.md#node-types). |
| `AGI_NODE_FAILED` | 500 | Single node execution failed. `details.nodeId` + `details.cause`. | Check run trace. |
| `AGI_TIMEOUT` | 504 | Pipeline exceeded 60s. | Shorten or split. |

### Rate Limiting (10xxx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `RATE_TENANT_LIMIT` | 429 | Per-tenant per-minute limit hit. | Back off; respect `X-RateLimit-Reset`. |
| `RATE_IP_LIMIT` | 429 | Per-IP burst limit. | Slow down. |
| `RATE_GLOBAL_LIMIT` | 503 | Platform-wide protection tripped. | Wait and retry; likely incident in progress. |

### Generic / Unknown (99xx)

| Code | HTTP | Meaning | Resolution |
|---|---|---|---|
| `INTERNAL_ERROR` | 500 | Unhandled exception. | Capture trace from `wrangler tail`; report. |
| `NOT_IMPLEMENTED` | 501 | Endpoint exists but feature off. | Check feature flag / plan. |
| `BAD_GATEWAY` | 502 | Generic upstream failure. | Retry; check status page. |
| `MAINTENANCE` | 503 | Planned maintenance window. | See status banner. |

---

## Frontend Error Display

The `apiFetch` helper throws `ApiHttpError` with fields:
```ts
class ApiHttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;
}
```

Components should:
1. Catch `ApiHttpError`.
2. Map known `code` to friendly UI message (see `src/lib/error-messages.ts`).
3. Default to `err.message` if code unknown.
4. Toast for transient (4xx/429); page-level banner for 5xx.

Example:
```ts
try {
  await apiFetch('/api/twilio/messages', { method:'POST', body });
} catch (e) {
  if (e instanceof ApiHttpError) {
    if (e.code === 'TWILIO_NOT_CONFIGURED') {
      router.push('/integrations/twilio');
      return;
    }
    if (e.code === 'AUTHZ_PLAN_REQUIRED') {
      openUpgradeModal(e.details?.required);
      return;
    }
  }
  toast.error('Something went wrong. Please try again.');
}
```

---

## Reporting an Error

When filing a bug, include:
1. HTTP status + `code`.
2. `details` payload (redact any secrets).
3. Request ID from response header `X-Request-Id` if present.
4. UTC timestamp.
5. Tenant userId (master admins) or "self" for own account.

---

**See also:**
- [`API_ENDPOINTS.md`](API_ENDPOINTS.md) — which endpoints can return which codes
- [`../user-guides/TROUBLESHOOTING.md`](../user-guides/TROUBLESHOOTING.md) — user-facing remediation
- [`../operations/INCIDENT_RESPONSE.md`](../operations/INCIDENT_RESPONSE.md) — when codes signal an incident
