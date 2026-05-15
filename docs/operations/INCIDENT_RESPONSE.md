# Incident Response Playbook

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Severity Definitions

| Severity | Definition | Response time | Comms |
|---|---|---|---|
| **SEV-1** | Production down, data breach, payments broken — affecting >50% of tenants | 15 min | Status page + email + SMS |
| **SEV-2** | Major feature degraded — affects >10% of tenants OR core feature for any tenant | 1 hour | Status page + email |
| **SEV-3** | Minor feature broken — affects <10% of tenants AND not core | 1 business day | Internal ticket |
| **SEV-4** | Cosmetic, no functional impact | Next sprint | Backlog |

---

## 2. Trigger Sources

- PagerDuty / OnCall alert from Cloudflare Notifications
- UptimeRobot ping failure on `/api/healthz`
- Tenant report via `support@rjbusinesssolutions.com`
- Twitter/social mention
- Auto-alert from `wrangler tail` aggregator

---

## 3. Response Steps

### Step 1 — Acknowledge (within response-time window)
- Page the on-call engineer
- Open a Slack channel: `#incident-YYYYMMDD-<short-desc>`
- Set status: "Investigating"

### Step 2 — Triage (5 min)
- Severity assigned
- Scope: which routes/tenants affected?
- Verify it's our side (not Cloudflare/Twilio/Stripe/Clerk outage). Check provider status pages.

### Step 3 — Mitigate (highest priority)
Restore service. Don't worry about root cause yet.

Common mitigations:
- **Rollback Worker:** `wrangler rollback`
- **Rollback Pages:** Cloudflare Dashboard → previous deployment → Rollback
- **Disable a feature:** flip a feature flag or push an emergency commit
- **Scale up D1:** Cloudflare Dashboard → D1 → upgrade plan
- **Rotate a leaked secret:** see `SECRETS_MANAGEMENT.md` § 5

### Step 4 — Communicate
- Update status page (TODO — set up Cloudflare Health Page or statuspage.io)
- Email affected tenants if SEV-1/SEV-2
- Tweet from `@rjbusinesssolutions` if widely visible

### Step 5 — Resolve
- Service fully restored
- Status: "Monitoring" for 30 min, then "Resolved"

### Step 6 — Post-mortem (within 5 business days of SEV-1 or SEV-2)
- Document in `docs/post-mortems/YYYYMMDD-summary.md`
- Sections:
  - Summary
  - Impact (tenants affected, duration)
  - Timeline (UTC)
  - Root cause
  - What went well
  - What went poorly
  - Action items (tracked in issue tracker)
- Blameless culture — focus on systems, not people

---

## 4. Common Incidents — Playbooks

### "401 on all API calls"
1. Check `wrangler tail` for the error
2. Most likely: `CLERK_SECRET_KEY` invalid or Clerk JWKS unreachable
3. Mitigate: re-set the secret from Clerk Dashboard
4. Verify with `curl -H "Authorization: Bearer $JWT" /api/me`

### "All Twilio calls failing"
1. Check Twilio Status Page first — https://status.twilio.com
2. If Twilio is up, check tenant credential decrypt errors in `wrangler tail`
3. Possible: `ENCRYPTION_KEY` was rotated without migration → restore from secret backup

### "Stripe webhook failing"
1. Stripe Dashboard → Webhooks → check delivery attempts
2. Common: `STRIPE_WEBHOOK_SECRET` rotated in Stripe but not in Worker
3. Mitigate: re-set the secret; **resend missed events** from Stripe

### "Database read errors"
1. Cloudflare Dashboard → D1 → check daily quota
2. Mitigate: upgrade plan or wait for daily reset
3. Long-term: add caching layer (Workers KV) for hot reads

### "Frontend stuck at /connect"
1. Likely the new master admin can't be verified
2. Check `/api/me` response — `isMasterAdmin` should be `true`
3. Verify `CLERK_SECRET_KEY` is set
4. Frontend fallback allowlist should still let master admin through

---

## 5. Communication Templates

### Status page — SEV-1 initial
> We're investigating reports of [SYMPTOM]. Tenants may experience [IMPACT]. Engineers are engaged. Updates every 15 minutes.

### Status page — Resolved
> The incident affecting [FEATURE] has been resolved as of [TIME UTC]. Root cause: [SHORT]. A full post-mortem will be published within 5 business days.

### Email to tenants (SEV-1)
> Subject: Service Restored — [Date]
>
> Between [START] and [END] UTC, [FEATURE] experienced [IMPACT]. The root cause was [SHORT]. We've deployed a fix and are monitoring. We apologize for the disruption — a full post-mortem will follow.
>
> — RJ Business Solutions team

---

## 6. On-Call Rotation

Currently single-person: Rick Jefferson, primary contact. Set up a backup delegate when team scales.

Phone: configured in Clerk org settings.
Email: `rickjefferson@rickjeffersonsolutions.com`
