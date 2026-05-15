# Secrets Management

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

Every secret used by the platform — what it is, where it lives, how to rotate.

---

## 1. Secrets Inventory

### Worker (`artifacts/cf-worker/`) — set via `wrangler secret put <NAME>`

| Secret | Purpose | Required | Rotation |
|---|---|---|---|
| `CLERK_SECRET_KEY` | Verify JWTs + fetch user emails via Clerk Backend API | Yes | Semi-annual |
| `CLERK_PUBLISHABLE_KEY` | (not used server-side; mirrors frontend) | No | — |
| `ENCRYPTION_KEY` | AES-256-GCM for Twilio credentials at rest. 32-byte hex. | Yes | Quarterly (requires migration) |
| `STRIPE_SECRET_KEY` | Stripe API calls (subs, checkout, portal) | Yes | When compromised |
| `STRIPE_PUBLISHABLE_KEY` | Returned to frontend via `/api/stripe/publishable-key` | Yes | When compromised |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signature | Yes | When rotated in Stripe Dashboard |
| `TWILIO_ACCOUNT_SID` | Fallback for master admin only | Yes | Semi-annual |
| `TWILIO_AUTH_TOKEN` | Fallback | Yes | Semi-annual |
| `TWILIO_API_KEY_SID` | Fallback for voice/video | No | Semi-annual |
| `TWILIO_API_KEY_SECRET` | Fallback | No | Semi-annual |
| `TWILIO_PHONE_NUMBER` | Default sender E.164 | No | When changed |
| `ANTHROPIC_API_KEY` | Claude API | Yes (for AI features) | Semi-annual |
| `OPENROUTER_API_KEY` | OpenRouter gateway | No | Semi-annual |
| `OPENAI_API_KEY` | GPT-4o, o1 | No | Semi-annual |
| `RESEND_API_KEY` | Transactional + campaign email | No | Semi-annual |
| `GROQ_API_KEY`, `TOGETHER_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `NVIDIA_API_KEY`, `MOONSHOT_API_KEY`, `MINIMAX_API_KEY`, `INFERMATIC_API_KEY`, `ZAI_API_KEY`, `CHUTES_API_KEY`, `CLOD_API_KEY` | Per-provider AI | Optional | Annual |
| `BRAVE_API_KEY`, `RAPIDAPI_KEY` | Search | Optional | Annual |
| `GOOGLE_MAPS_API_KEY` | Maps + geocoding | Optional | Annual |
| `COURTLISTENER_API_KEY`, `DATAGOV_API_KEY`, `GITHUB_TOKEN` | Data APIs | Optional | Annual |
| `DISPUTEFOX_API_KEY`, `MFSN_API_KEY` | Credit niche | Optional | When provider rotates |
| `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `COINBASE_API_KEY` | Alt payments | Optional | When provider rotates |
| `COMPOSIO_API_KEY`, `MEMORI_API_KEY` | Automation | Optional | Annual |

### Pages (per-project) — set via `wrangler pages secret put`

| Secret | Project | Purpose |
|---|---|---|
| `CF_WORKER_URL` | rj-agent-frontend, twilio-omni-agent | Proxy target |
| `VITE_CLERK_PUBLISHABLE_KEY` | rj-agent-frontend | Frontend Clerk init |

### Git repo (NEVER commit)
- All `.env*` files in `.gitignore`
- GitHub Push Protection enabled
- Secret scanning on the repo

---

## 2. Setting / Updating a Secret

```bash
cd artifacts/cf-worker
wrangler secret put NAME
# Paste value, Enter
```

Verify:
```bash
wrangler secret list
```

---

## 3. Rotation Procedure

### Generic
```bash
# 1. Generate new secret at the provider (Stripe Dashboard, Anthropic Console, etc.)
# 2. Update Worker
wrangler secret put SECRET_NAME
# 3. Test in production
curl -H "Authorization: Bearer $JWT" .../api/health-check-for-this-feature
# 4. Revoke old secret at the provider after 24h grace
```

### `ENCRYPTION_KEY` (special)
Rotating `ENCRYPTION_KEY` makes all existing `tenant_credentials` ciphertext unreadable. Procedure:

1. Generate new key: `openssl rand -hex 32` → save as `NEW_ENCRYPTION_KEY`
2. Deploy a one-time migration Worker route `/api/admin/migrate-encryption` that:
   - Reads every row with old key
   - Re-encrypts with new key
   - Writes back
3. Run migration as master admin
4. Verify random tenant can still sign in and use Twilio
5. `wrangler secret put ENCRYPTION_KEY` with new value
6. Remove the migration route in next deploy

> **Never** rotate `ENCRYPTION_KEY` without this migration — tenants will get "decryption failed" errors and have to re-enter their Twilio creds.

---

## 4. Local Dev Secrets

For local development with `wrangler dev`, create `artifacts/cf-worker/.dev.vars` (gitignored):
```
ENCRYPTION_KEY=deadbeef000000000000000000000000000000000000000000000000deadbeef
CLERK_SECRET_KEY=sk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
...
```

For the dev API server (`artifacts/api-server/`), use a `.env` file (also gitignored).

---

## 5. Compromise Response

If a secret leaks:
1. **Immediately** revoke at the provider
2. Generate a replacement
3. `wrangler secret put` the new value
4. Check Cloudflare Logs for suspicious activity since leak
5. Notify affected tenants if customer data was exposed (within 72h per GDPR)
6. File an incident report (see `INCIDENT_RESPONSE.md`)
