# Tenant User Manual — Every Page, Every Feature

**Audience:** Tenants (paying customers) using the platform day-to-day.
**Version:** 7.0.0

---

## Navigation

The sidebar groups features into 5 sections:

1. **PLATFORM** — Dashboard, SMS, Calls, Phone Numbers, Lookup, Voicemails
2. **COMMUNICATIONS** — Verify, Messaging Services, Studio, Queues, Conferences, Conversations, Video
3. **CAMPAIGNS** — Email Campaigns, AGI Framework, Telehealth
4. **NICHES** — 19 industry hubs (Credit Repair, Real Estate, etc.)
5. **ACCOUNT** — Contacts, Usage, Alerts, Billing, Settings, Integrations

Master admins additionally see an **ADMIN** section with the Admin Panel.

---

## PLATFORM

### Dashboard (`/dashboard`)
At-a-glance health of your communications infrastructure.

- **Account Status card** — Twilio account status + balance ($USD)
- **Active Calls** — count of currently in-progress calls
- **Today's SMS** — outbound + inbound count
- **Recent Calls table** — last 10 calls with click-to-replay recording
- **Recent SMS table** — last 10 messages with click-to-thread
- **Phone Numbers** — your active numbers with capability badges (SMS/Voice/MMS)

### SMS Center (`/sms`)
Send and review SMS messages.

- **Compose:** choose From number, To number, body. Click **Send**.
- **History table:** filter by direction (inbound/outbound), status, date range, search by body.
- **Click a row** to see full message details + delivery callbacks.
- **Re-send** — clones the message into the composer.

### Call Manager (`/calls`)
Outbound dialer + call log.

- **Place a Call:** From + To + (optional) caller ID → click **Call**. Generates a TwiML response that bridges the two.
- **Active Calls:** live list — click **End Call** to hang up.
- **Recent Calls:** last 100 with duration, status, recording playback.
- **Recordings:** click ▶ to stream from Twilio media URL.

### Phone Numbers (`/phone-numbers`)
Manage every phone number on your Twilio account.

- View capability flags (SMS/MMS/Voice/Fax).
- **Edit friendly name** — inline editor.
- **Edit webhook URLs**:
  - **Voice URL** — TwiML endpoint for inbound calls
  - **SMS URL** — endpoint for inbound SMS
  - **Status Callback** — delivery receipts
- Click **Save** — Twilio is updated in real time.

### Number Lookup (`/lookup`)
Carrier + line-type intelligence (Twilio Lookup v2).

- Enter a number → see carrier, line type (mobile/landline/VoIP), caller name (CNAM where available).
- Useful before placing calls or sending SMS to avoid wasted spend on disconnected lines.

### Voicemails (`/voicemails`)
- List of voicemail recordings with auto-transcription.
- **Reply via SMS** — sends back to the caller.
- **Download** the audio (.mp3).

---

## COMMUNICATIONS

### Verify / 2FA (`/verify`)
Twilio Verify service — managed 2FA.

- **Services tab:** list of Verify services, click **Create** to add one.
- **Send Code tab:** pick service, enter recipient, channel (SMS/Call), → send.
- **Check Code tab:** pick service, enter recipient + 6-digit code → verify.

### Messaging Services (`/messaging-services`)
Twilio Messaging Service pools (for high-volume SMS with sender rotation).

- List of services with assigned numbers.
- Click a service to see numbers in the pool.
- Useful for A2P 10DLC US compliance.

### Studio Flows (`/studio`)
Twilio Studio (no-code IVR/SMS flows).

- List of flows from your Twilio account.
- **View Executions** — recent runs with status.
- **Trigger Flow** — manually start a flow with parameters.

### Call Queues (`/queues`)
Twilio TaskRouter queues for call center patterns.

- Create/delete queues.
- View live members.
- Pair with Studio flows or TwiML `<Enqueue>` verbs.

### Active Conferences (`/conferences`)
Live conference management.

- List of in-progress conferences.
- Participant list with mute/end controls.
- Useful for moderator workflows.

### Conversations (`/conversations`)
Twilio Conversations API — unified SMS + chat threading.

- List of conversations.
- Click into a thread → see messages from all channels (SMS, WhatsApp, chat).
- Reply inline — automatically routes via the right channel.

### Video Rooms (`/video`)
Twilio Programmable Video.

- Create rooms (peer-to-peer or group).
- Generate access tokens for participants.
- End rooms on demand.
- View active participants.

---

## CAMPAIGNS

### Email Campaigns (`/email-campaigns`)
Bulk + transactional email via Resend.

- **Compose** — subject, HTML body, recipient list (CSV or paste).
- **Templates** — save and reuse layouts.
- **Send** — Resend API delivers; per-message tracking.
- **History** — campaigns with open/click stats.

### AGI Framework (`/agi-framework`)
Multi-agent pipeline builder (**Business plan or above**).

- Drag agent nodes onto a canvas.
- Wire inputs → outputs.
- Define triggers (inbound SMS, schedule, manual).
- See [AGI Framework architecture](../architecture/AGI_FRAMEWORK.md) for full node reference.

### Telehealth (`/telehealth`)
Appointment management with HIPAA-aware features.

- **Appointments tab:** CRUD list. Each appointment has patient name, phone, scheduled time, duration, status.
- **Upcoming tab:** today + next 7 days, sorted.
- **SMS Reminder** button per appointment — sends a templated reminder.
- **Video Invite** button — creates Twilio Video room and SMS the join URL.
- **HIPAA checklist** — compliance items for the tenant to acknowledge.

---

## NICHES (Industry Hubs)

19 niches — same config-driven template, different defaults:

| Slug | Industry |
|---|---|
| `credit-repair` | Credit Repair |
| `real-estate` | Real Estate |
| `insurance` | Insurance |
| `dental` | Dental |
| `legal` | Legal Services |
| `auto` | Auto Sales / Repair |
| `home-services` | Home Services |
| `fitness` | Fitness & Gyms |
| `restaurant` | Restaurants |
| `mortgage` | Mortgage |
| `chiropractic` | Chiropractic |
| `veterinary` | Veterinary |
| `education` | Education / Tutoring |
| `nonprofit` | Nonprofit |
| `staffing` | Staffing / Recruiting |
| `med-spa` | Med Spa |
| `property-management` | Property Mgmt |
| `ecommerce` | E-commerce |
| `financial-advisor` | Financial Advisor |

Each hub provides:
- **Records list** — backed by `niche_records` D1 table
- **Status tracking** — niche-specific lifecycle states
- **SMS quick-send** — pre-filled industry templates
- **Compliance checklist** — TCPA, A2P 10DLC, HIPAA where relevant
- **Bulk SMS** — send to all records matching a status

Open a niche at `/niche/<slug>`. Niche landing pages live at `/niches/<slug>`.

---

## ACCOUNT

### Contacts (`/contacts`)
Full CRUD address book.

- Search by name, phone, email, or tag.
- Quick-dial / quick-SMS icons per row.
- Bulk import via CSV (coming soon).
- Tags as colored chips.

### Usage & Billing (`/usage`)
Today + this-month usage records from Twilio.

- Per-category counts and cost (SMS, Voice, MMS, Verify, Lookup, etc.).
- Useful for budget alerts and reconciliation.

### Alerts (`/alerts`)
Twilio Monitor error/warning log.

- Filter by severity (error/warning/notice).
- Click into an alert for the raw error payload.

### Billing (`/billing`)
Stripe subscription management.

- See your active plan and renewal date.
- **Upgrade/Downgrade** — opens Stripe Checkout.
- **Manage Subscription** — opens Stripe Customer Portal (update card, cancel, invoices).

### Settings (`/settings`)
- Connected Twilio account info — masked SID + plan badge.
- **Reconnect** — replace credentials (validates the new ones first).
- **Disconnect** — wipes encrypted credentials; you'll be returned to `/connect`.
- Phone numbers and webhook URL references for copy/paste.

### Integrations (`/integrations`)
Health status for every external API the platform talks to.

- Green dot = secret configured.
- Red X = missing/invalid.
- 9 categories: AI Models, Search, Payments, Credit & Finance, Data & Research, Communications, Authentication, AI Automation, Email.
- **Refresh Status** button re-polls `/api/integrations`.

---

## Shortcuts & Tips

- **Cmd/Ctrl+K** — coming soon — global search.
- Click your avatar → **Sign Out** to end the session.
- Avatar shows your initials; hovering reveals your full email + plan badge.
- Master admin? An "Admin" sidebar item appears between PLATFORM and COMMUNICATIONS.
