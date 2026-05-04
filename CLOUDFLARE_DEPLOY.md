# Cloudflare Deployment Guide

This project is fully configured for Cloudflare deployment:
- **API** → Cloudflare Worker (Hono) at `artifacts/cf-worker/`
- **Frontends** → Cloudflare Pages (React + Vite)
- **Database** → Cloudflare D1 (SQLite)

---

## Prerequisites

```bash
npm install -g wrangler
wrangler login
```

---

## 1. Deploy the Worker

```bash
cd artifacts/cf-worker

# Create D1 database (one-time)
wrangler d1 create twilio-platform
# → copy the database_id output into wrangler.toml (replace YOUR_D1_DATABASE_ID)

# Initialize the schema (one-time)
wrangler d1 execute twilio-platform --file=db/schema.sql --remote

# Set secrets
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_API_KEY_SID
wrangler secret put TWILIO_API_KEY_SECRET
wrangler secret put TWILIO_PHONE_NUMBER
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENROUTER_API_KEY   # optional — for OpenRouter model switching

# Deploy
wrangler deploy
# Output: https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev
```

---

## 2. Build the Frontends

From the monorepo root:

```bash
# Install all dependencies
pnpm install

# Build twilio-platform dashboard
pnpm --filter @workspace/twilio-platform run build
# Output: artifacts/twilio-platform/dist/public

# Build twilio-omni-agent
pnpm --filter @workspace/twilio-omni-agent run build
# Output: artifacts/twilio-omni-agent/dist/public
```

---

## 3. Deploy Frontends to Cloudflare Pages

### Option A — Wrangler CLI

```bash
# Deploy twilio-platform
cd artifacts/twilio-platform
wrangler pages deploy dist/public \
  --project-name twilio-platform \
  --commit-dirty=true

# Set the worker URL env var (required for the API proxy function)
wrangler pages env add CF_WORKER_URL production
# Enter: https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev

# Deploy twilio-omni-agent
cd ../twilio-omni-agent
wrangler pages deploy dist/public \
  --project-name twilio-omni-agent \
  --commit-dirty=true

wrangler pages env add CF_WORKER_URL production
# Enter: https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev
```

### Option B — Cloudflare Dashboard (Git integration)

1. Go to Cloudflare Dashboard → Workers & Pages → Create → Pages
2. Connect your GitHub/GitLab repo
3. Configure build settings:
   - **Build command:** `pnpm --filter @workspace/twilio-platform run build`
   - **Build output directory:** `artifacts/twilio-platform/dist/public`
   - **Root directory:** `/` (leave blank — monorepo root)
4. Add environment variable: `CF_WORKER_URL = https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev`
5. Repeat for twilio-omni-agent with its own Pages project

---

## How the Proxy Works

Each frontend has a `functions/api/[[path]].ts` Cloudflare Pages Function that proxies
all `/api/*` requests to the Worker. The frontend only needs `CF_WORKER_URL` set.

```
Browser → Cloudflare Pages → functions/api/[[path]].ts → CF Worker (Hono)
                                                              ↓
                                                        D1 Database
                                                        Twilio API
                                                        Anthropic API
```

---

## Local Development (Replit)

No changes needed. The Express API server (`artifacts/api-server`) still runs on Replit
with the existing PostgreSQL database. The Cloudflare Worker is the production target only.

```bash
# Dev server starts automatically via Replit workflows
# API: http://localhost:8080
# twilio-platform frontend proxies /api → localhost:8080
```

---

## Environment Variables Summary

| Variable | Where | Required |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Worker secret | Yes |
| `TWILIO_AUTH_TOKEN` | Worker secret | Yes (or API Key pair) |
| `TWILIO_API_KEY_SID` | Worker secret | Alt to auth token |
| `TWILIO_API_KEY_SECRET` | Worker secret | Alt to auth token |
| `TWILIO_PHONE_NUMBER` | Worker secret | Yes |
| `ANTHROPIC_API_KEY` | Worker secret | Yes (for AI chat) |
| `OPENROUTER_API_KEY` | Worker secret | Optional |
| `CF_WORKER_URL` | Pages env var | Yes (for proxy) |
