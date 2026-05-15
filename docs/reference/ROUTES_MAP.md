# Frontend Routes Map

> Every URL in the frontend apps — purpose, auth requirement, component, sidebar group.
> Routing is via `wouter` in `twilio-platform/src/App.tsx`.

---

## Legend

| Symbol | Meaning |
|---|---|
| 🟢 | Public — sign-in not required |
| 🔵 | Authenticated — wrapped in `<ProtectedRoute>` |
| 🟣 | Master admin only — `<ProtectedRoute admin>` |

---

## 1. `twilio-platform` (main app)

Base URL: `https://app.rickjeffersonsolutions.com`

### Public

| Path | Component | Notes |
|---|---|---|
| `/` | `pages/landing.tsx` 🟢 | Marketing landing. Redirects to `/dashboard` if signed in. |
| `/sign-in/*` | Clerk `<SignIn>` 🟢 | Catch-all for Clerk routes. |
| `/sign-up/*` | Clerk `<SignUp>` 🟢 | Catch-all for Clerk routes. |
| `/pricing` | `pages/pricing.tsx` 🟢 | Plan comparison. |
| `/legal/terms` | `pages/legal/terms.tsx` 🟢 | |
| `/legal/privacy` | `pages/legal/privacy.tsx` 🟢 | |
| `/legal/dpa` | `pages/legal/dpa.tsx` 🟢 | Data Processing Addendum. |

### Platform (sidebar group: **PLATFORM**)

| Path | Component | Notes |
|---|---|---|
| `/dashboard` | `pages/dashboard.tsx` 🔵 | Home — KPIs, recent activity. |
| `/inbox` | `pages/inbox.tsx` 🔵 | Unified message inbox. |
| `/conversations` | `pages/conversations.tsx` 🔵 | All threads. |
| `/conversations/:id` | `pages/conversation-detail.tsx` 🔵 | Single thread. |
| `/contacts` | `pages/contacts.tsx` 🔵 | CRM list. |
| `/contacts/:id` | `pages/contact-detail.tsx` 🔵 | Single contact. |
| `/contacts/new` | `pages/contact-new.tsx` 🔵 | Create contact. |
| `/calendar` | `pages/calendar.tsx` 🔵 | Appointments calendar. |
| `/video` | `pages/video.tsx` 🔵 | Twilio Video rooms. |

### Communications (sidebar group: **COMMUNICATIONS**)

| Path | Component | Notes |
|---|---|---|
| `/sms` | `pages/sms.tsx` 🔵 | Send / log SMS. |
| `/voice` | `pages/voice.tsx` 🔵 | Outbound calls + TwiML. |
| `/email` | `pages/email.tsx` 🔵 | Transactional email (Resend). |
| `/numbers` | `pages/numbers.tsx` 🔵 | Buy / manage phone numbers. |
| `/verify` | `pages/verify.tsx` 🔵 | Twilio Verify (2FA). |

### Campaigns (sidebar group: **CAMPAIGNS**)

| Path | Component | Notes |
|---|---|---|
| `/campaigns` | `pages/campaigns.tsx` 🔵 | List + create. |
| `/campaigns/:id` | `pages/campaign-detail.tsx` 🔵 | Edit + stats. |
| `/campaigns/new` | `pages/campaign-new.tsx` 🔵 | Wizard. |
| `/templates` | `pages/templates.tsx` 🔵 | Reusable message templates. |
| `/agi` | `pages/agi.tsx` 🔵 | AGI Framework — multi-agent pipelines. Business+. |
| `/agi/:id` | `pages/agi-detail.tsx` 🔵 | Pipeline builder canvas. |
| `/agi/runs/:id` | `pages/agi-run-detail.tsx` 🔵 | Single pipeline run trace. |

### Niches (sidebar group: **NICHES**)

19 industry hubs. All follow `/niches/:niche` pattern.

| Path | Niche | Notes |
|---|---|---|
| `/niches/credit-repair` | Credit Repair 🔵 | DisputeFox / MFSN integrated. |
| `/niches/real-estate` | Real Estate 🔵 | |
| `/niches/insurance` | Insurance 🔵 | |
| `/niches/legal` | Legal 🔵 | CourtListener integrated. |
| `/niches/medical` | Medical 🔵 | HIPAA mode. |
| `/niches/dental` | Dental 🔵 | HIPAA mode. |
| `/niches/fitness` | Fitness 🔵 | |
| `/niches/restaurant` | Restaurant 🔵 | |
| `/niches/automotive` | Automotive 🔵 | |
| `/niches/retail` | Retail 🔵 | |
| `/niches/education` | Education 🔵 | FERPA notes. |
| `/niches/finance` | Finance 🔵 | SEC/FINRA notes. |
| `/niches/beauty` | Beauty / Salon 🔵 | |
| `/niches/construction` | Construction 🔵 | |
| `/niches/nonprofit` | Nonprofit 🔵 | Data.gov integrated. |
| `/niches/events` | Events 🔵 | |
| `/niches/technology` | Technology / SaaS 🔵 | GitHub integrated. |
| `/niches/hospitality` | Hospitality 🔵 | |
| `/niches/logistics` | Logistics 🔵 | |

Every niche has these subroutes:
- `/niches/:niche` — overview
- `/niches/:niche/records` — list
- `/niches/:niche/records/:id` — detail
- `/niches/:niche/records/new` — create
- `/niches/:niche/import` — CSV import
- `/niches/:niche/playbook` — niche-specific playbook

### Account (sidebar group: **ACCOUNT**)

| Path | Component | Notes |
|---|---|---|
| `/settings` | `pages/settings.tsx` 🔵 | Profile, notifications, keyboard. |
| `/integrations` | `pages/integrations.tsx` 🔵 | Connect / disconnect providers. |
| `/integrations/twilio` | `pages/integrations/twilio.tsx` 🔵 | Twilio setup wizard. |
| `/integrations/stripe` | `pages/integrations/stripe.tsx` 🔵 | Stripe connect. |
| `/integrations/ai` | `pages/integrations/ai.tsx` 🔵 | AI provider keys (optional override). |
| `/connect` | `pages/connect.tsx` 🔵 | Onboarding wizard (first-run). |
| `/billing` | `pages/billing.tsx` 🔵 | Subscription + invoices. |
| `/usage` | `pages/usage.tsx` 🔵 | Rate-limit + quota visualization. |
| `/api-keys` | `pages/api-keys.tsx` 🔵 | Generate personal API tokens (roadmap). |
| `/team` | `pages/team.tsx` 🔵 | Team members (roadmap). |
| `/audit` | `pages/audit.tsx` 🔵 | Tenant audit log. |
| `/help` | `pages/help.tsx` 🔵 | In-app docs. |

### Master Admin (sidebar group: **ADMIN**, gated)

| Path | Component | Notes |
|---|---|---|
| `/admin` | `pages/admin.tsx` 🟣 | Tenants tab default. |
| `/admin/tenants` | `pages/admin.tsx#tenants` 🟣 | Tenant list (live D1). |
| `/admin/tenants/:userId` | `pages/admin/tenant-detail.tsx` 🟣 | Single tenant detail + actions. |
| `/admin/metrics` | `pages/admin.tsx#metrics` 🟣 | Platform metrics. |
| `/admin/system` | `pages/admin.tsx#system` 🟣 | Health + env diagnostics. |
| `/admin/audit` | `pages/admin/audit.tsx` 🟣 | Admin action log. |

### Fallback

| Path | Component | Notes |
|---|---|---|
| `*` | `pages/not-found.tsx` 🟢 | 404. |

---

## 2. `twilio-omni-agent` (chat app)

Base URL: `https://chat.rickjeffersonsolutions.com` (or a path under the main domain).

| Path | Component | Notes |
|---|---|---|
| `/` | `pages/chat.tsx` 🔵 | Main chat surface. |
| `/c/:threadId` | `pages/chat.tsx?thread=` 🔵 | Specific thread. |
| `/models` | `pages/models.tsx` 🔵 | Model picker / details. |
| `/settings` | `pages/settings.tsx` 🔵 | Chat preferences. |
| `/sign-in/*` | Clerk `<SignIn>` 🟢 | |

---

## 3. Route Guard Behavior

`<ProtectedRoute>` (defined in `App.tsx`):
- If Clerk is still loading → renders `<LoadingScreen>`.
- If user signed out → redirects to `/sign-in?redirect_url=<current>`.
- If `admin` prop is set and `useMasterAdmin()` is `false` → redirects to `/dashboard`.
- Otherwise renders children.

`<PublicRoute>` (used on `/sign-in`, `/sign-up`):
- If user signed in → redirects to `/dashboard`.

---

## 4. Pages Function Routes

`twilio-platform/functions/api/[[path]].ts` — catch-all proxy to the Worker. Preserves:
- HTTP method
- All request headers (especially `Authorization`)
- Request body (streamed)
- Handles `OPTIONS` preflight with CORS headers

Worker URL is configured via `API_BASE_URL` env binding at the Pages level.

---

## 5. Deep-link Patterns (URL params)

| Pattern | Example | Behavior |
|---|---|---|
| `?from=...` | `/sign-up?from=pricing` | Track conversion source. |
| `?redirect_url=...` | `/sign-in?redirect_url=/admin` | Post-sign-in landing. |
| `?tab=...` | `/admin?tab=metrics` | Pre-select tab. |
| `?ref=...` | `/?ref=blog` | Marketing attribution. |
| `?thread=...` | `/inbox?thread=abc123` | Open specific thread in inbox. |

---

**See also:**
- [`API_ENDPOINTS.md`](API_ENDPOINTS.md) — every backend route these pages call
- [`KEYBOARD_SHORTCUTS.md`](KEYBOARD_SHORTCUTS.md) — `g + letter` navigation maps to these routes
- [`../manuals/FRONTEND_MANUAL.md`](../manuals/FRONTEND_MANUAL.md#routing) — routing implementation details
