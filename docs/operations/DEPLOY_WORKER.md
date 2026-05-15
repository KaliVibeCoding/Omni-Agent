# Deploy the Cloudflare Worker

**Audience:** Anyone with `wrangler` access to the `rickjefferson` Cloudflare account.
**Version:** 7.0.0

The Worker is `artifacts/cf-worker/` and hosts every `/api/*` endpoint in production.

---

## 1. One-Time Setup

```bash
npm install -g wrangler                     # if not already installed
wrangler login                              # opens browser for OAuth

cd artifacts/cf-worker
```

Verify auth: `wrangler whoami` — should show Rick's account.

## 2. First Deploy (new account only)

```bash
# Create D1 database
wrangler d1 create twilio-platform
# Output: database_id = "abc123…"
# Paste that ID into wrangler.toml (replace YOUR_D1_DATABASE_ID)

# Apply schema
wrangler d1 execute twilio-platform --file=db/schema.sql --remote

# Set all secrets (see reference/ENV_VARS.md for the complete list)
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY
wrangler secret put ENCRYPTION_KEY          # openssl rand -hex 32
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_PUBLISHABLE_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_PHONE_NUMBER
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENROUTER_API_KEY
wrangler secret put RESEND_API_KEY
# ... any additional integration keys

# Deploy
wrangler deploy
# Output: https://twilio-platform-api.<your-subdomain>.workers.dev
```

## 3. Routine Deploy

```bash
cd artifacts/cf-worker
wrangler deploy
```

That's it. Zero-downtime swap via Cloudflare's blue/green isolate model.

## 4. Verify

```bash
curl https://twilio-platform-api.rickjefferson.workers.dev/api/healthz
# → {"status":"ok","timestamp":"..."}
```

## 5. Tail Live Logs

```bash
wrangler tail
```
Streams every `console.log` and request from the live Worker.

## 6. Rollback

```bash
wrangler rollback --message "reverting bad deploy"
```
Or via Cloudflare Dashboard → Workers → `twilio-platform-api` → **Deployments** → previous → **Rollback**.

## 7. Deploy to a Staging Worker

```bash
wrangler deploy --name twilio-platform-api-staging
```
Creates a separate Worker with its own URL. Set staging Pages env var:
```bash
cd artifacts/twilio-platform
wrangler pages secret put CF_WORKER_URL --project-name rj-agent-frontend-staging
# enter https://twilio-platform-api-staging.<subdomain>.workers.dev
```

## 8. CI Deploy (recommended)

Add `.github/workflows/deploy.yml`:
```yaml
name: Deploy Worker
on:
  push:
    branches: [main]
    paths: ['artifacts/cf-worker/**', 'lib/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @workspace/cf-worker run typecheck
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: artifacts/cf-worker
          command: deploy
```

Set repo secrets:
- `CLOUDFLARE_API_TOKEN` — create at https://dash.cloudflare.com/profile/api-tokens with **Edit Cloudflare Workers** template
- `CLOUDFLARE_ACCOUNT_ID` — your account ID from the Cloudflare Dashboard URL
