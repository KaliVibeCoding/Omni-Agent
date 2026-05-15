# Troubleshooting Guide

**Audience:** Tenants and admins.
**Version:** 7.0.0

---

## 1. Sign-up / Sign-in Issues

### "Email already exists" but you don't remember signing up
- The platform uses Clerk — your email may already have an account from a previous trial.
- Use **Forgot password** on the sign-in page to reset.

### Verification email never arrives
- Check spam/junk folder.
- Clerk uses `clerk.com` sender domain — whitelist it.
- Try a different email if your corporate mail server blocks it.

### Master admin email signs up but doesn't see `/admin`
- Confirm the email is **exactly** on the allowlist (lowercase match).
- Check `/api/me` response — open browser devtools → Network → look for `me` request → `isMasterAdmin` should be `true`.
- If `isMasterAdmin: false`, the worker can't reach Clerk Backend API. Verify `CLERK_SECRET_KEY` secret is set on the worker.
- Refresh the page — the frontend allowlist mirror is a fallback that catches this case.

---

## 2. Twilio Credential Save Fails

### "Failed to validate Twilio credentials"
- Open Twilio Console → **Account Info** → re-copy Account SID + Auth Token (no leading/trailing spaces).
- If you regenerated the auth token recently, the old one is now invalid.
- Trial accounts: confirm the account isn't suspended.

### "Failed (412)"
- This means the Twilio API call succeeded but returned an error (e.g., suspended account, region restriction).
- See the exact Twilio error in the response body.

### Stuck on `/connect` even after successful save
- Hard-refresh (Cmd/Ctrl+Shift+R) to clear the React Query cache.
- Sign out + sign back in.
- Master admins should never see this — confirm allowlist match.

---

## 3. SMS Sending Failures

### "Trial account cannot send to unverified numbers"
- Twilio trial restriction. Either:
  - Verify the recipient at Twilio Console → Phone Numbers → Verified Caller IDs.
  - Upgrade your Twilio account (separate from RJ Business Solutions plan).

### "Error 21610: Recipient unsubscribed"
- The recipient has replied STOP. They must reply START to re-enable.
- TCPA-compliant; cannot be overridden.

### "Error 21408: Permission to send to this region not enabled"
- Twilio Console → **Voice & Messaging → Geo Permissions** → enable the destination country.

### Messages send but recipient gets nothing
- Check Twilio Logs → Programmable Messaging → search by `MessageSid`.
- A2P 10DLC US: confirm your sender (long code, short code, or messaging service) is registered.

---

## 4. Call Failures

### Outbound call hangs up immediately
- Most likely cause: missing API Key SID / Secret.
- Settings → reconnect with API Key fields populated (Voice requires API Key, not auth token).

### "Error 13224: Invalid phone number"
- Use E.164 format strictly: `+15555550123`.

### Recording playback fails
- Recordings auto-expire on Twilio's free tier after 30 days. Subscribe to Twilio recording storage.

---

## 5. Billing Issues

### Plan didn't upgrade after Stripe payment
- Stripe webhook may have failed. Open Stripe Dashboard → Webhooks → find the event → **Resend**.
- Confirm `STRIPE_WEBHOOK_SECRET` matches between Stripe Dashboard and `wrangler secret`.

### "No billing account found" on Manage Subscription
- You haven't subscribed yet. Pick a plan first.

### Stripe Customer Portal won't open
- Confirm `STRIPE_SECRET_KEY` is set on the worker.
- Stripe Customer Portal must be enabled in your Stripe Dashboard → Settings → Customer Portal.

---

## 6. Performance / Errors

### Pages slow to load
- Cloudflare Pages serves static assets from edge — should be < 100 ms globally.
- Slow page = API call slow. Check Cloudflare Workers Analytics for P99 latency.

### Random 401 errors
- Your Clerk session expired. Refresh — Clerk auto-renews.
- If it persists, sign out + sign back in.

### Random 500 errors
- Check Cloudflare Worker logs: `cd artifacts/cf-worker && wrangler tail`.
- Most common: missing secret. See `reference/ENV_VARS.md`.

### "Network error — please try again"
- Cloudflare Pages Function proxy may have failed. Check that `CF_WORKER_URL` is set as a Pages env var.

---

## 7. Webhook Issues (Inbound SMS / Voice)

### Inbound SMS not arriving
- Twilio Console → Phone Numbers → click the number → confirm **SMS URL** points to your handler.
- Default: `https://twilio-platform-api.rickjefferson.workers.dev/api/twilio/webhook/sms`.
- Test with **Webhook Tester** (`/webhook-tester`) — sends a sample payload.

### Inbound voice rings then drops
- Same fix — confirm the **Voice URL** webhook returns valid TwiML.

---

## 8. AGI Framework Issues

### "Plan upgrade required"
- AGI Framework requires Business or Enterprise plan. Upgrade at `/billing`.

### Pipeline runs but does nothing
- Check the conversation log — every node's input/output is recorded under that pipeline's `conversation_id` in `messages`.

### Token budget exceeded
- Plan limits:
  - Growth: 100k tokens/mo
  - Business: 1M tokens/mo
  - Enterprise: unlimited

---

## 9. Master Admin Specific

### Tenant list is empty
- Either no tenants have connected yet, or your `Authorization` header isn't reaching the worker.
- Open devtools → Network → confirm `/api/admin/tenants` returns 200 with a JSON body.

### Plan dropdown change doesn't stick
- Check Network response — must be 200 with `{ ok: true }`.
- If 403, your master admin gate is failing — verify `CLERK_SECRET_KEY`.

---

## 10. Getting Help

- **Email:** `support@rjbusinesssolutions.com`
- **For master admin:** worker logs via `wrangler tail` from `artifacts/cf-worker/`
- **Stripe issues:** Stripe Dashboard → Logs
- **Twilio issues:** Twilio Console → Logs → Programmable Messaging / Voice
- **Clerk issues:** Clerk Dashboard → Logs

For everything else, the playbooks in [`docs/operations/`](../operations/) cover incident response and recovery.
