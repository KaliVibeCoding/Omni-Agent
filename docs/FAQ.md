# RJ Business Solutions — Frequently Asked Questions

---

## General Questions

### What is RJ Business Solutions?
A production-grade, multi-tenant SaaS communications platform built on Twilio. It gives businesses in 20 different industries a single dashboard to manage SMS, calls, voicemails, AI agents, appointments, and client records — all branded and compliant for their specific industry.

### Who is this platform built for?
Two audiences:
1. **Buyers/Resellers** — People who purchase the platform and sell it as a subscription service to businesses in specific niches (dental offices, real estate agencies, credit repair firms, etc.)
2. **End Users** — The businesses that subscribe to use the platform for their daily client communications

### What industries does it cover?
20 industries: Healthcare/Telehealth, Credit Repair, Real Estate, Insurance, Dental, Legal, Auto Dealerships, Home Services, Fitness Studios, Restaurants, Mortgage Lending, Chiropractic, Veterinary, Education, Nonprofit, Staffing/Recruiting, Medical Spas, Property Management, E-Commerce, and Financial Advisory.

### Is this a white-label platform?
Yes. You can change the logo, company name, color scheme, and domain. The entire platform runs under your brand. See `docs/WHITE_LABEL_GUIDE.md`.

---

## Technical Questions

### What technology stack does it use?
- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui
- **Production API:** Cloudflare Workers (Hono framework) — globally distributed, ~0ms cold starts
- **Dev API:** Express 5 + Node.js (for local development)
- **Database (production):** Cloudflare D1 (SQLite at the edge)
- **Database (dev):** PostgreSQL
- **Auth:** Clerk (JWT, Google/GitHub/Apple login, MFA)
- **Communications:** Twilio (SMS, Voice, Video, Verify, Studio, Conversations)
- **Payments:** Stripe (Checkout, Billing Portal, Webhooks)
- **AI:** Anthropic Claude + OpenRouter (20+ models)
- **Email:** Resend API
- **Hosting:** Cloudflare Pages (frontend) + Cloudflare Workers (API)

### Do I need to know how to code?
For initial setup (~30 minutes), you need to run some terminal commands. After that, the platform runs itself — Cloudflare handles hosting, Stripe handles billing, Clerk handles auth. No ongoing coding required. See `docs/DEPLOYMENT.md`.

### Can I run it locally for development?
Yes. The monorepo includes a full local dev server (Express + PostgreSQL) that mirrors the production Cloudflare Worker. Run:
```bash
pnpm install
pnpm --filter @workspace/api-server run dev      # starts API on port 8080
pnpm --filter @workspace/twilio-platform run dev  # starts frontend on PORT (19805)
```

### How is data stored?
- **Tenant Twilio credentials** — AES-256-GCM encrypted before storage. The encryption key lives only in your Cloudflare Worker secret. Not even you can read a tenant's credentials without the key.
- **Records (patient/lead/client data)** — Stored in Cloudflare D1 (SQLite). Multi-tenant isolation by Clerk userId.
- **AI conversation history** — Stored in D1, per-conversation.
- **No PII sent to third parties** — Only Twilio (for delivery) and Stripe (for billing) receive tenant data.

### How do tenants connect their Twilio account?
After signing up, tenants visit `/connect`, enter their Twilio Account SID + Auth Token (optionally an API Key pair), and click Connect. The platform validates the credentials against Twilio's API before saving. Once connected, all SMS/call/video actions use their account — you never see their messages.

### What happens if a tenant's Twilio credentials are wrong?
The Connect page validates live against the Twilio API before saving. If credentials are invalid, a clear error message is shown and nothing is stored.

### Is it HIPAA compliant?
The platform is designed to support HIPAA compliance:
- No PHI stored on platform servers unnecessarily
- Credentials encrypted at rest (AES-256-GCM)
- All traffic over TLS 1.3 (enforced by Cloudflare)
- Twilio is a HIPAA-eligible service provider (sign a BAA with Twilio)
- Each industry hub includes a HIPAA compliance checklist
- Customers should conduct their own compliance review for their specific situation

### Does it support multi-location / multiple users per account?
Currently, each Clerk user account has one set of Twilio credentials. Multi-location support (multiple users under one account with shared Twilio credentials) can be added as a customization.

---

## Billing & Revenue Questions

### How does billing work for my customers?
Stripe Checkout handles all payments. When a customer selects a plan, they're redirected to Stripe's hosted checkout page to enter their card. You receive the subscription revenue automatically. They can manage/cancel via the Stripe Billing Portal at any time.

### What are the subscription tiers?
| Plan | Price | Target |
|------|-------|--------|
| Starter | $79/mo | Solo operators |
| Growth | $199/mo | Small teams |
| Business | $499/mo | Multi-location |
| Enterprise | Custom | Large orgs |

### Do I pay per-message fees?
No. Tenants pay Twilio directly for their SMS/call usage via their own Twilio account. You only collect the platform subscription fee. This means no markup, no hidden costs, and no surprise bills for you.

### What does it cost me to run the platform?
- **Cloudflare Workers:** Free tier handles 100,000 requests/day. Paid plan is $5/month for 10M requests.
- **Cloudflare Pages:** Free
- **Cloudflare D1:** Free for up to 5M rows. $0.75/million rows after.
- **Clerk:** Free up to 10,000 monthly active users. Then $0.02/user/month.
- **Stripe:** 2.9% + $0.30 per transaction (standard rate)
- **Resend (email):** Free for 3,000 emails/month. Then $20/month for 50k.

### How do I seed the Stripe products?
See Step 6 in `docs/DEPLOYMENT.md`. The seed script creates all 4 plans in your Stripe account idempotently (safe to run multiple times).

---

## Usage & Features Questions

### Can tenants use the platform immediately after signing up?
Partially. The landing page, sign-up, sign-in, and billing pages are accessible immediately. The communications dashboard requires connecting a Twilio account first (the `/connect` page guides them through it).

### What AI features are included?
1. **Multi-agent AGI Framework** (`/agi-framework`) — Build and run AI pipelines that span SMS, voice, email, and data channels. Create multi-step agent workflows with branching logic.
2. **Twilio Omni-Agent** — A specialized AI chat assistant that knows the entire Twilio platform. Ask it anything about setting up studio flows, handling webhooks, debugging SMS delivery, etc.
3. **Email Campaigns** — AI-powered email composition with templates.

### How many SMS templates come pre-loaded per industry?
5–6 per industry, covering the most common use cases. For example, Mortgage includes: New Lead Response, Application Status Update, Rate Alert, Document Request, Closing Reminder, and Past Client Check-In.

### Can tenants customize SMS templates?
Yes — they can edit templates in the compose window before sending, and save custom messages. Full template management (create/edit/delete saved templates) is a planned enhancement.

### What Twilio features are included in the dashboard?
- SMS Center (send/receive, history, filtering)
- Call Manager (outbound calls, active calls, recordings)
- Phone Numbers (list, edit webhook URLs)
- Number Lookup (carrier, line type, caller name)
- Voicemails (transcriptions, recordings, reply via SMS)
- Usage & Billing (today/month usage records and costs)
- Alerts (Twilio Monitor error/warning log)
- Verify (2FA — manage services, send/check codes)
- Messaging Services
- Studio Flows (list, executions, trigger)
- Call Queues
- Active Conferences (participant management, mute/end)
- Contacts (full CRUD, quick-dial/SMS)
- Video Rooms (create/end rooms, participants, access token generator)
- Conversations (Twilio Conversations API threads)

### What does the Admin panel show?
The admin panel (`/admin`) shows:
- All tenant accounts and their plans
- KPI cards (total tenants, MRR, active subscriptions, churn)
- Plan distribution chart
- Revenue metrics over time
- System health indicators

Note: The admin panel is accessible to signed-in users. For production, add role-based access control to restrict it to platform admins.

---

## White-Label Questions

### Can I resell this to my clients?
Yes. You can purchase this platform, white-label it under your brand, and resell it to any number of businesses. There are no royalties or revenue shares.

### Can I change the pricing tiers?
Yes. Update the Stripe products and the pricing display in the landing page (`/src/pages/landing.tsx`). The Stripe products are seeded via a script you can modify.

### Can I add new industries?
Yes. Adding a new niche requires:
1. Adding a config entry in `src/data/niche-dashboard-configs.ts`
2. Adding a landing page entry in `src/data/niches.ts`
3. Adding a sidebar link in `src/components/layout.tsx`
No backend changes needed — the niche router handles all slugs automatically.

### Can I remove industries I don't need?
Yes — just remove the entries from the sidebar and data files. The router ignores unused slugs.

---

## Support Questions

### Where do I get help if I'm stuck?
1. Check `docs/DEPLOYMENT.md` for setup troubleshooting
2. Check Cloudflare Workers logs: `wrangler tail` (real-time logs)
3. Check Clerk Dashboard → Logs for auth issues
4. Check Stripe Dashboard → Events for payment issues
5. Check Twilio Console → Monitor for SMS/call issues

### How do I update the platform after purchase?
Since you own the full source code, you update by:
1. Making changes in the codebase
2. Rebuilding the frontend: `pnpm --filter @workspace/twilio-platform run build`
3. Redeploying: `wrangler pages deploy dist/public` and/or `wrangler deploy`

No downtime required — Cloudflare's zero-downtime deployments handle it.
