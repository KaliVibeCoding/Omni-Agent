# Quickstart — From Sign-up to First SMS in 10 Minutes

**Audience:** New tenants signing up for the first time.
**Time to complete:** ~10 minutes.
**Prerequisites:** A Twilio account with at least one phone number and your `Account SID` + `Auth Token`.

---

## Step 1 — Create Your Account (1 min)

1. Go to **https://rj-agent-frontend.pages.dev**
2. Click **Sign Up** (top-right).
3. Enter your business email and choose a strong password.
4. Open the verification email Clerk sends and click **Verify**.
5. You're signed in.

> **Master admin?** If your email is on the allowlist (`rickjefferson@rickjeffersonsolutions.com`, etc.), you'll skip Steps 2–3 and land directly on `/dashboard` with full admin access.

---

## Step 2 — Connect Your Twilio Account (3 min)

After sign-up you're redirected to **`/connect`**.

1. **Account SID** — paste the `AC…` value from your Twilio Console dashboard.
2. **Auth Token** — paste the matching auth token.
3. *(Optional)* **API Key SID + Secret** — required only if you want to make outbound voice or video calls. Create at Console → **Account → API keys & tokens**.
4. Click **Connect Twilio Account**.

The platform will:
- Validate your credentials by calling Twilio's `Accounts.{sid}.fetch()` endpoint.
- Encrypt your auth token with AES-256-GCM.
- Store the encrypted blob in Cloudflare D1.
- Redirect you to `/dashboard`.

If validation fails you'll see the exact Twilio error — fix and retry.

---

## Step 3 — Pick a Plan (2 min)

1. From the sidebar, click **Billing** (or go to `/billing`).
2. Choose **Starter** ($79), **Growth** ($199), or **Business** ($499).
3. Click **Subscribe** → Stripe Checkout opens.
4. Pay with any major card.
5. On success you're redirected back; your plan is now active.

Master admins always see "Enterprise" automatically.

---

## Step 4 — Send Your First SMS (1 min)

1. Sidebar → **SMS Center** (`/sms`).
2. In the **Compose** card:
   - **From** — pick one of your Twilio numbers from the dropdown.
   - **To** — enter a recipient in E.164 format, e.g. `+15555550123`.
   - **Body** — type a short message.
3. Click **Send**.
4. The message appears in the **History** table within a second. Status updates live (queued → sent → delivered).

If your trial Twilio number requires verified destinations, verify the recipient in Twilio Console first.

---

## Step 5 — Explore the Rest (3 min)

| Page | What you'll find |
|---|---|
| **Dashboard** | Live account status, balance, recent SMS/calls, active numbers |
| **Calls** | Make outbound calls, view active and recent calls, play recordings |
| **Phone Numbers** | Edit friendly names, webhook URLs for inbound SMS/Voice |
| **Lookup** | Carrier, line type, caller name intelligence |
| **Voicemails** | Transcriptions + SMS reply |
| **Verify** | 2FA (Twilio Verify) — services, send code, check code |
| **Contacts** | Address book with tags + quick-dial/SMS |
| **Conversations** | Twilio Conversations (SMS + chat threads) |
| **Video** | Programmable Video rooms — create/end, access tokens |
| **Telehealth** | Appointments, SMS reminders, video invites, HIPAA checklist |
| **Email Campaigns** | Compose, templates, history, open/click stats |
| **AGI Framework** | Build multi-agent pipelines (Business+ plan) |
| **Niche Hubs** | 19 industry-specific dashboards — pick one in the sidebar |

---

## Where to Go Next

- 📘 **Full feature reference:** [`USER_MANUAL.md`](USER_MANUAL.md)
- 🏢 **Industry playbooks:** [`NICHE_PLAYBOOKS.md`](NICHE_PLAYBOOKS.md)
- 🆘 **Stuck?** [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
- 🛠 **Webhook URLs** for inbound traffic → see `/settings` → "Webhook URL references"

---

## Quick Reference — Phone Number Format

Always use **E.164 format**: `+` then country code then number, no spaces or dashes.

| Country | Example |
|---|---|
| US/Canada | `+15555550123` |
| UK | `+447700900123` |
| Germany | `+4915123456789` |
| Australia | `+61412345678` |

---

## Security Note

- Your Twilio auth token is **never stored in plaintext**. AES-256-GCM ciphertext only.
- The platform makes Twilio API calls **on your behalf** using your decrypted credentials at request time.
- You can disconnect (and wipe credentials) any time via **Settings → Disconnect Twilio Account**.
