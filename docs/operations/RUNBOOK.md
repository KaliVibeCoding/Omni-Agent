# Operations Runbook

**Audience:** On-call engineers and platform operators.
**Version:** 7.0.0
**Last reviewed:** 2026-05-15

The day-2 ops handbook. Every routine task, every common incident, every restart procedure.

---

## 1. Live Production URLs

| Service | URL |
|---|---|
| Frontend (Pages) | https://rj-agent-frontend.pages.dev |
| API (Worker) | https://twilio-platform-api.rickjefferson.workers.dev |
| Omni-Agent chat | (Pages project: `twilio-omni-agent`) |
| Health check | https://twilio-platform-api.rickjefferson.workers.dev/api/healthz |

## 2. Routine Tasks

### Daily
- Glance at `/admin → System` (integration dots)
- Spot-check Cloudflare Workers Analytics (errors, P99)

### Weekly
- Review tenant growth (`/admin → Tenants`)
- `pnpm audit` on the monorepo root — patch criticals
- Cloudflare Worker Logs — search for `ERROR` patterns

### Monthly
- Master admin allowlist audit
- Verify Stripe webhook signature still matches
- Verify Clerk JWKS still resolves

### Quarterly
- Rotate `ENCRYPTION_KEY` (requires migration script — see `BACKUP_RESTORE.md`)
- Rotate `CLERK_SECRET_KEY` and Stripe restricted keys
- Penetration test

## 3. Restart / Redeploy Procedures

### Worker
```bash
cd artifacts/cf-worker
wrangler deploy
```
Zero-downtime: Cloudflare blue/green swap. Old isolate drains within seconds.

### Pages frontend
```bash
cd artifacts/twilio-platform
pnpm run build
wrangler pages deploy dist/public --project-name rj-agent-frontend
```
New deployment goes live immediately on the production alias.

### D1 schema migration
```bash
cd artifacts/cf-worker
wrangler d1 execute twilio-platform --file=db/migrations/NNNN_xyz.sql --remote
```

## 4. Rollback

### Worker
1. Cloudflare Dashboard → Workers & Pages → `twilio-platform-api`
2. **Deployments** tab → previous deployment → **Rollback**
3. Or CLI: `wrangler rollback --message "reason"`

### Pages
1. Cloudflare Dashboard → Pages → `rj-agent-frontend`
2. **Deployments** tab → click an earlier deploy → **Rollback to this deployment**

### D1
- D1 doesn't support automatic rollback. Use the backup migration script in `BACKUP_RESTORE.md`.

## 5. Common Incidents

### "All API calls returning 401"
- Cause: `CLERK_SECRET_KEY` rotated or expired
- Fix: `cd artifacts/cf-worker && wrangler secret put CLERK_SECRET_KEY`
- Verify: `curl -H "Authorization: Bearer $JWT" .../api/me` returns 200

### "Twilio routes return 412 'not connected'"
- Cause: tenant's credentials deleted or never saved
- Fix: tenant signs into `/connect` and re-saves
- Master admin can verify in `/admin → Tenants`

### "Stripe webhook fires but plan doesn't update"
- Cause: `STRIPE_WEBHOOK_SECRET` mismatch
- Fix: Stripe Dashboard → Webhooks → endpoint → reveal signing secret → `wrangler secret put STRIPE_WEBHOOK_SECRET`
- Replay: Stripe Dashboard → event → **Resend**

### "Pages /api/* returns 502"
- Cause: `CF_WORKER_URL` env var missing or wrong
- Fix: `wrangler pages secret put CF_WORKER_URL --project-name rj-agent-frontend`
- Verify: `curl https://rj-agent-frontend.pages.dev/api/healthz`

### "D1 read errors"
- Cause: hit free-tier read limit (100k/day)
- Fix: upgrade D1 to paid (5M/day) — Cloudflare Dashboard → D1 → billing

### "Worker bundle exceeds 1 MB"
- Cause: new dependency bloated the bundle
- Fix: `wrangler deploy --dry-run` to see what's big; tree-shake or split routes

## 6. Logs

### Worker logs (live tail)
```bash
cd artifacts/cf-worker
wrangler tail
```

### Worker logs (historical)
Cloudflare Dashboard → Workers → `twilio-platform-api` → **Logs**

### Pages logs
Cloudflare Dashboard → Pages → project → **Functions logs**

### D1 query log
```bash
wrangler d1 execute twilio-platform --command "SELECT * FROM tenant_credentials LIMIT 5" --remote
```

## 7. On-Call Escalation

| Severity | Response | Who |
|---|---|---|
| SEV-1 (down, breach) | 15 min | Rick (primary) + delegate |
| SEV-2 (major degradation) | 1 hr | Rick |
| SEV-3 (feature broken) | 1 business day | Rick |
| SEV-4 (cosmetic) | Next sprint | Backlog |

See `INCIDENT_RESPONSE.md` for the full playbook.
