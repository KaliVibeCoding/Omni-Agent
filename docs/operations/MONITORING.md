# Monitoring & Observability

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Layers

| Layer | Tool | Coverage |
|---|---|---|
| Edge requests | Cloudflare Analytics | Request count, P50/P95/P99, error rate, country, status code |
| Worker code | `wrangler tail` + Cloudflare Logs | console.* + stack traces |
| Frontend | Browser devtools + sonner toasts | User-facing errors |
| Business KPIs | `/admin → Metrics` | Tenants, plans, MRR, SMS/calls/appts |
| Provider health | Twilio/Stripe/Clerk/Anthropic dashboards | Their side of the API |

## 2. Health Checks

| Endpoint | Expected |
|---|---|
| `GET /api/healthz` | `{"status":"ok","timestamp":"..."}` |
| `GET /api/me` (with auth) | `{"signedIn":true,...}` |
| `GET /api/integrations` | `{ai:{...},payments:{...}}` — non-empty per category |

Uptime monitor (e.g. UptimeRobot) on `/api/healthz` is recommended — 1-min interval.

## 3. Worker Live Logs

```bash
cd artifacts/cf-worker
wrangler tail
# Now click around the app — every request streams here
```

Filter:
```bash
wrangler tail --status error
wrangler tail --search "tenant_credentials"
```

## 4. Historical Logs

Cloudflare Dashboard → Workers → `twilio-platform-api` → **Logs** tab. Retained 24 hours on free tier, 7 days on paid.

For longer retention, ship to Logflare or Datadog via Logpush.

## 5. Worker Analytics

Cloudflare Dashboard → Workers → `twilio-platform-api` → **Metrics**:

- **Requests/sec** — capacity planning
- **CPU time P50/P99** — slowdown detection
- **Errors** — anything > 1% sustained → investigate
- **Subrequests** — outbound calls to Twilio/Stripe/etc. — billing impact

## 6. D1 Metrics

Cloudflare Dashboard → D1 → `twilio-platform`:
- Reads, writes
- Storage
- Query duration P50/P99

## 7. Frontend Errors

The frontend currently surfaces errors via sonner toasts and console. For production-grade error tracking, integrate Sentry:

```ts
// twilio-platform/src/main.tsx
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

Add `VITE_SENTRY_DSN` to Pages env vars.

## 8. Recommended Alerts

| Trigger | Threshold | Action |
|---|---|---|
| Worker error rate | > 1% over 5 min | Page on-call |
| Worker P99 | > 2s over 10 min | Investigate |
| `/api/healthz` 5xx | Any | Page on-call (SEV-1) |
| Stripe webhook failures | > 3 in an hour | Investigate (SEV-2) |
| Clerk JWKS fetch error | Any | Investigate (SEV-2) |
| D1 quota | > 80% daily | Upgrade plan |

Set these in Cloudflare → **Notifications** → custom alerts.

## 9. Business Metrics Dashboard

`/admin → Metrics` shows:
- Plan distribution
- MRR
- Lifetime SMS / calls / appointments

For richer analytics (cohort, retention, conversion), Logpush → BigQuery + Metabase is the recommended path.
