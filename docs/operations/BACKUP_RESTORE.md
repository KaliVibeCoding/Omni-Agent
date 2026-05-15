# Backup & Disaster Recovery

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. RTO / RPO Targets

| Component | RPO | RTO |
|---|---|---|
| D1 (tenant data) | 24h | 1h |
| Worker code | 0 (git) | 5 min |
| Pages frontend | 0 (git) | 5 min |
| Wrangler secrets | 0 (offline copy in 1Password) | 10 min |
| Clerk user data | 0 (Clerk-managed) | N/A |
| Stripe data | 0 (Stripe-managed) | N/A |

---

## 2. D1 Backup

### Cloudflare-managed (automatic)
- D1 takes **automatic daily snapshots** retained 30 days on paid plans (7 days on free).
- Restore via Cloudflare Dashboard → D1 → snapshot → **Restore**.

### Manual on-demand export
```bash
cd artifacts/cf-worker
wrangler d1 export twilio-platform --remote --output backup-$(date +%Y%m%d).sql
```

Compressed and uploaded to a separate Cloudflare R2 bucket nightly via cron:
```bash
gzip backup-*.sql
wrangler r2 object put backup-bucket/d1/$(date +%Y%m%d).sql.gz --file backup-*.sql.gz
```

### Restore from manual export
```bash
# 1. Drop & recreate (DANGEROUS — only in DR)
wrangler d1 execute twilio-platform --remote --command "DROP TABLE IF EXISTS tenant_credentials; ..."

# 2. Apply schema
wrangler d1 execute twilio-platform --file=db/schema.sql --remote

# 3. Apply backup
wrangler d1 execute twilio-platform --file=backup-20260515.sql --remote
```

---

## 3. Code Backup

- Primary: GitHub repo `KaliVibeCoding/Omni-Agent`
- Mirror: Cloudflare-side R2 mirror (TODO)
- Local dev clones on each engineer's machine

Recovery: `git clone https://github.com/KaliVibeCoding/Omni-Agent.git`

## 4. Secrets Backup

Worker secrets are stored encrypted by Cloudflare. **Cannot be read back** — you can only re-set them. Keep an offline copy in **1Password** under "RJBS Platform Production Secrets":

- All secret names and current values
- Provider account credentials (Twilio, Stripe, Anthropic, etc.) so secrets can be re-issued
- Last rotation date

## 5. Full Disaster Recovery Playbook

Scenario: Cloudflare account compromised; need to rebuild from scratch.

1. **New Cloudflare account** — sign up
2. **Restore Workers** — `git clone` + `wrangler deploy`
3. **Restore D1** — `wrangler d1 create twilio-platform`, get new ID, edit `wrangler.toml`, apply schema, apply most recent backup
4. **Restore Pages** — re-deploy via `wrangler pages deploy`
5. **Restore secrets** — `wrangler secret put` for each value from 1Password
6. **DNS** — point custom domain to new account
7. **Verify** — smoke test checklist from `TESTING_MANUAL.md` § 6
8. **Notify tenants** of any service interruption per SLA

Target: < 4 hours total.

## 6. Per-Tenant Data Export (GDPR)

```bash
USER_ID="user_2abc..."
wrangler d1 execute twilio-platform --remote --command "
  SELECT 'tenant_credentials' as t, * FROM tenant_credentials WHERE user_id='$USER_ID';
  SELECT 'sms_logs' as t, * FROM sms_logs WHERE user_id='$USER_ID';
  SELECT 'call_logs' as t, * FROM call_logs WHERE user_id='$USER_ID';
  SELECT 'contacts' as t, * FROM contacts WHERE user_id='$USER_ID';
  SELECT 'appointments' as t, * FROM appointments WHERE user_id='$USER_ID';
  SELECT 'niche_records' as t, * FROM niche_records WHERE user_id='$USER_ID';
" --json > export-$USER_ID.json
```

Encrypted columns remain ciphertext (the user can decrypt by re-uploading their Twilio token; we never reveal it).

## 7. Per-Tenant Data Delete (GDPR right to erasure)

```bash
USER_ID="user_2abc..."
wrangler d1 execute twilio-platform --remote --command "
  DELETE FROM tenant_credentials WHERE user_id='$USER_ID';
  DELETE FROM sms_logs WHERE user_id='$USER_ID';
  DELETE FROM call_logs WHERE user_id='$USER_ID';
  DELETE FROM contacts WHERE user_id='$USER_ID';
  DELETE FROM appointments WHERE user_id='$USER_ID';
  DELETE FROM niche_records WHERE user_id='$USER_ID';
  DELETE FROM conversations WHERE user_id='$USER_ID';
  DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id='$USER_ID');
"
```

Then delete the Clerk user via Clerk Dashboard or Backend API. Document the action in your GDPR log.
