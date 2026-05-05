# RJ Business Solutions — Full Deployment Guide

**Estimated time:** 30–45 minutes from zero to live  
**Skill level:** Basic (copy/paste commands, no coding required)

---

## Prerequisites

Before starting, make sure you have:
- [ ] A Cloudflare account (free at cloudflare.com)
- [ ] A Clerk account (free at clerk.com)
- [ ] A Stripe account (stripe.com) with products seeded (see Step 6)
- [ ] A Twilio account (twilio.com) for your demo/test account
- [ ] Node.js 18+ installed on your computer
- [ ] pnpm installed: `npm install -g pnpm`
- [ ] Wrangler CLI installed: `npm install -g wrangler`

---

## Step 1 — Clone and install dependencies

```bash
git clone <your-repo-url> rj-business-solutions
cd rj-business-solutions
pnpm install
```

---

## Step 2 — Authenticate with Cloudflare

```bash
wrangler login
```

This opens your browser. Log in to Cloudflare and authorize Wrangler.

---

## Step 3 — Create the D1 database

```bash
cd artifacts/cf-worker
wrangler d1 create twilio-platform
```

**Copy the `database_id` from the output.** Then open `artifacts/cf-worker/wrangler.toml` and replace `YOUR_D1_DATABASE_ID` with the real ID.

```toml
[[d1_databases]]
binding = "DB"
database_name = "twilio-platform"
database_id = "abc123de-f456-7890-abcd-ef1234567890"  # ← paste your ID here
```

---

## Step 4 — Apply the database schema

```bash
# Apply schema to production D1
wrangler d1 execute twilio-platform --file=db/schema.sql --remote
```

You should see confirmation that all tables were created.

---

## Step 5 — Set Worker secrets

Run each of the following commands. You'll be prompted to paste the value:

```bash
# Twilio (use your own account for testing, or leave as demo values)
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_PHONE_NUMBER

# Clerk Auth (from clerk.com → your app → API Keys)
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY

# Encryption key (generate a new random key)
# On Mac/Linux: openssl rand -hex 32
# On Windows: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
wrangler secret put ENCRYPTION_KEY

# Stripe (from stripe.com → Developers → API Keys)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_PUBLISHABLE_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# AI (optional — for AI agent features)
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENROUTER_API_KEY

# Email (optional — from resend.com, free tier available)
wrangler secret put RESEND_API_KEY
```

---

## Step 6 — Seed Stripe Products

This creates the 4 subscription plans in your Stripe account:

```bash
cd ../../  # back to monorepo root
STRIPE_SECRET_KEY=sk_live_xxx pnpm --filter @workspace/api-server run seed
```

Or run the seed script directly:
```bash
cd artifacts/api-server
npx tsx scripts/seed-products.ts
```

This creates:
- Starter — $79/month
- Growth — $199/month  
- Business — $499/month
- Enterprise — $0 (custom)

---

## Step 7 — Deploy the Cloudflare Worker (API)

```bash
cd artifacts/cf-worker
wrangler deploy
```

**Note the Worker URL** — it will look like:  
`https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev`

---

## Step 8 — Build the frontend

From the monorepo root:

```bash
pnpm --filter @workspace/twilio-platform run build
```

The built files will be in `artifacts/twilio-platform/dist/public/`.

---

## Step 9 — Deploy the frontend to Cloudflare Pages

### Option A: Wrangler CLI (fastest)
```bash
cd artifacts/twilio-platform
wrangler pages deploy dist/public --project-name twilio-platform
```

### Option B: Cloudflare Dashboard (more control)
1. Go to Cloudflare Dashboard → Pages → Create a project
2. Connect your Git repository
3. Set build settings:
   - **Framework preset:** None
   - **Build command:** `pnpm --filter @workspace/twilio-platform run build`
   - **Build output directory:** `artifacts/twilio-platform/dist/public`
   - **Root directory:** `/` (the monorepo root)
4. Add environment variable:
   - `CF_WORKER_URL` = `https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev`
   - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key

---

## Step 10 — Configure the Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
2. **Endpoint URL:** `https://twilio-platform-api.YOUR_SUBDOMAIN.workers.dev/api/stripe/webhook`
3. **Events to listen for:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Signing secret** and set it as `STRIPE_WEBHOOK_SECRET` (repeat Step 5)

---

## Step 11 — Configure Clerk

1. Go to clerk.com → Your app → Settings → Domains
2. Add your Cloudflare Pages domain: `twilio-platform.pages.dev`
3. Go to → API Keys → copy the **Publishable key**
4. Add it to your CF Pages environment variables as `VITE_CLERK_PUBLISHABLE_KEY`

---

## Step 12 — Update APP_URL in wrangler.toml

Open `artifacts/cf-worker/wrangler.toml` and update:

```toml
[vars]
APP_URL = "https://twilio-platform.pages.dev"  # ← your Pages URL
```

Then redeploy the Worker:
```bash
cd artifacts/cf-worker
wrangler deploy
```

---

## Step 13 — Test the deployment

1. Visit your Pages URL: `https://twilio-platform.pages.dev`
2. Click **Get Started** → sign up with your email
3. Click **Connect Twilio Account** → enter your Twilio Account SID + Auth Token
4. Click any dashboard section (SMS, Calls, etc.)
5. Send a test SMS to your phone

---

## Step 14 — Set up a custom domain (optional)

### For Cloudflare Pages (frontend):
1. Pages → Your project → Custom domains → Add custom domain
2. Enter your domain (e.g., `app.rjbusiness.com`)
3. Follow DNS instructions

### For Cloudflare Workers (API):
1. Workers → Your worker → Triggers → Add Custom Domain
2. Enter your API domain (e.g., `api.rjbusiness.com`)
3. Update `APP_URL` and `CF_WORKER_URL` accordingly

---

## Troubleshooting

**"CF_WORKER_URL not configured" error on the frontend**
→ Add `CF_WORKER_URL` environment variable in your Cloudflare Pages project settings

**Auth errors / "Unauthorized"**
→ Verify `CLERK_SECRET_KEY` is set correctly in Worker secrets

**Stripe checkout not loading**
→ Verify `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set; check Stripe dashboard for API errors

**SMS not sending**
→ Tenant must connect their own Twilio account via the Connect page first. Check the tenant credentials in the dashboard Settings page.

**D1 table not found errors**
→ Re-run: `wrangler d1 execute twilio-platform --file=db/schema.sql --remote`

---

## Environment Variables Reference

| Variable | Where to set | Required | Description |
|----------|-------------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Worker secret | Yes (fallback) | Default Twilio account |
| `TWILIO_AUTH_TOKEN` | Worker secret | Yes (fallback) | Default Twilio auth |
| `TWILIO_PHONE_NUMBER` | Worker secret | Yes | Default from number |
| `CLERK_SECRET_KEY` | Worker secret | Yes | Clerk backend key |
| `CLERK_PUBLISHABLE_KEY` | Worker secret | Yes | Clerk public key |
| `ENCRYPTION_KEY` | Worker secret | Yes | 64-char hex key |
| `STRIPE_SECRET_KEY` | Worker secret | Yes | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Worker secret | Yes | Stripe public key |
| `STRIPE_WEBHOOK_SECRET` | Worker secret | Yes | Stripe webhook sig |
| `ANTHROPIC_API_KEY` | Worker secret | No | For Claude AI |
| `OPENROUTER_API_KEY` | Worker secret | No | For multi-model AI |
| `RESEND_API_KEY` | Worker secret | No | For transactional email |
| `VITE_CLERK_PUBLISHABLE_KEY` | CF Pages env | Yes | Frontend Clerk key |
| `CF_WORKER_URL` | CF Pages env | Yes | Worker URL for proxy |
| `APP_URL` | wrangler.toml [vars] | Yes | Pages URL for redirects |
