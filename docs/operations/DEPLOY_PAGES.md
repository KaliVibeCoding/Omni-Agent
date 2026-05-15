# Deploy Cloudflare Pages

**Audience:** Operators deploying the React frontends.
**Version:** 7.0.0

Two Pages projects:
- **`rj-agent-frontend`** ← `artifacts/twilio-platform/` (main SaaS dashboard)
- **`twilio-omni-agent`** ← `artifacts/twilio-omni-agent/` (AI chat)

---

## 1. One-Time Setup

```bash
wrangler login
```

## 2. Deploy `rj-agent-frontend`

```bash
cd artifacts/twilio-platform
pnpm install            # if not already
pnpm run build          # output: dist/public/

wrangler pages deploy dist/public \
  --project-name rj-agent-frontend \
  --commit-dirty=true
```

### One-time env vars
```bash
wrangler pages secret put CF_WORKER_URL --project-name rj-agent-frontend
# Enter: https://twilio-platform-api.rickjefferson.workers.dev

wrangler pages secret put VITE_CLERK_PUBLISHABLE_KEY --project-name rj-agent-frontend
# Enter: pk_live_…
```

## 3. Deploy `twilio-omni-agent`

```bash
cd artifacts/twilio-omni-agent
pnpm run build
wrangler pages deploy dist/public --project-name twilio-omni-agent
wrangler pages secret put CF_WORKER_URL --project-name twilio-omni-agent
```

## 4. Auto-Deploy via Git (recommended)

In the Cloudflare Dashboard:
1. Workers & Pages → Create → Pages → **Connect to Git**
2. Select the GitHub repo + `main` branch
3. Build settings:
   - **Build command:** `pnpm --filter @workspace/twilio-platform run build`
   - **Build output:** `artifacts/twilio-platform/dist/public`
   - **Root directory:** *(blank — monorepo root)*
   - **Env vars:** Node version `24`, plus `CF_WORKER_URL` and `VITE_CLERK_PUBLISHABLE_KEY`
4. Repeat for `twilio-omni-agent`.

Every push to `main` now auto-deploys.

## 5. Verify

```bash
curl -I https://rj-agent-frontend.pages.dev
# HTTP/2 200

curl https://rj-agent-frontend.pages.dev/api/healthz
# Proxied to worker → {"status":"ok",...}
```

## 6. Custom Domain

Cloudflare Dashboard → Pages → project → **Custom domains** → Add → e.g. `app.rjbusinesssolutions.com` → follow CNAME instructions.

## 7. Rollback

Cloudflare Dashboard → Pages → project → **Deployments** → previous → **Rollback to this deployment**.

## 8. Common Issues

| Symptom | Fix |
|---|---|
| 404 on `/dashboard` (etc.) | `_redirects` or `wrangler.toml [[redirects]]` for SPA fallback to `/index.html` |
| `/api/*` returns 404 | `CF_WORKER_URL` env var missing |
| Clerk loads but fails | `VITE_CLERK_PUBLISHABLE_KEY` missing or wrong env var (Pages prefix matters) |
| Old version cached | Hard refresh (Cmd+Shift+R) or purge in Cloudflare → Caching → Purge |
