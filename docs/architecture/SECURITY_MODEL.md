# Security Model

**Version:** 7.0.0
**Last reviewed:** 2026-05-15

---

## 1. Threat Model (STRIDE)

| Threat | Mitigation |
|---|---|
| **Spoofing** — fake Clerk tokens | JWKS signature verification on every request; short-lived JWTs (60s) |
| **Tampering** — modified request bodies | TLS 1.3; Zod schema validation server-side |
| **Repudiation** — denial of action | `sms_logs`, `call_logs`, `appointments` append-only history |
| **Information disclosure** — credential leak | AES-256-GCM at rest; `auth_token` never returned to frontend |
| **Denial of service** | Cloudflare WAF + per-IP rate limiting; provider-side rate limits |
| **Elevation of privilege** | Master-admin allowlist on both worker + frontend; plan gates on premium features |

---

## 2. Authentication

- **Provider:** Clerk (managed)
- **Protocol:** JWT (RS256) verified against Clerk JWKS
- **Token lifetime:** 60 seconds (auto-refreshed by Clerk SDK)
- **Worker verification:** `extractUserId(authHeader)` in `cf-worker/src/lib/auth.ts`
  ```ts
  const { sub } = await verifyJWT(token, jwksUri);
  return sub; // Clerk userId
  ```
- **Failure mode:** invalid/missing token → 401 with `{ error: "Unauthorized" }`

---

## 3. Authorization

### 3.1 Roles

| Role | How granted | Permissions |
|---|---|---|
| `unauthenticated` | No Clerk session | Public pages only (`/`, `/sign-in`, `/sign-up`) |
| `tenant` | Signed-in Clerk user | Own data only; gated by plan |
| `master_admin` | Email ∈ `MASTER_ADMIN_EMAILS` | Bypass Twilio gate; full admin panel; cross-tenant queries |

### 3.2 Master Admin Allowlist

Source of truth: `artifacts/cf-worker/src/lib/admin.ts`

```ts
export const MASTER_ADMIN_EMAILS = [
  "rickjefferson@rickjeffersonsolutions.com",
  "rickjefferson@rjbusinesssolutions.com",
  "admin@rjbusinesssolutions.org",
];
```

Frontend mirror: `artifacts/twilio-platform/src/lib/admin.ts` (kept in sync). The frontend check serves as a fallback if the Worker's Clerk Backend API call fails.

### 3.3 Plan Gating

Premium features check `plan` on `/api/me`:
- `free` — public marketing only
- `starter` — basic SMS, voicemails, lookup
- `growth` — AI agents, telehealth, studio flows
- `business` — AGI framework, full call center
- `enterprise` — dedicated infra, SLA

Master admins always report `plan = "enterprise"`.

---

## 4. Encryption

### 4.1 At Rest
- **What:** Twilio `auth_token`, `api_key_secret`
- **Algorithm:** AES-256-GCM (Web Crypto API)
- **Key:** `ENCRYPTION_KEY` (32-byte hex) — Wrangler secret
- **IV:** Random 12 bytes per encryption, prepended to ciphertext
- **Tag:** Built-in GCM auth tag, appended

Implementation: `artifacts/cf-worker/src/lib/encrypt.ts`

```ts
export async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", hexToBytes(keyHex), "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  return btoa(String.fromCharCode(...iv, ...new Uint8Array(ct)));
}
```

### 4.2 In Transit
- **TLS 1.3** enforced by Cloudflare for all public endpoints
- **HSTS** with 1-year max-age, includeSubDomains, preload

### 4.3 Secrets
- All secrets stored as Wrangler secrets (Cloudflare KV, encrypted)
- Never committed to git
- Rotated via `wrangler secret put <NAME>` (see `operations/SECRETS_MANAGEMENT.md`)

---

## 5. Data Isolation (Multi-Tenancy)

- **Tenant key:** Clerk userId (`sub` claim)
- **Every tenant-scoped row** carries `user_id`
- **Every tenant query** includes `WHERE user_id = ?`
- **Twilio client:** instantiated per-request with decrypted per-tenant credentials
- **No shared Twilio client** across tenants in production

Audit checklist for new routes:
1. Does the route accept `requireUserId(authHeader)`?
2. Does every SQL query filter by `user_id = ?`?
3. Does the response exclude any other tenant's data?

---

## 6. Input Validation

- **Zod schemas** generated from OpenAPI spec (`@workspace/api-zod`)
- **Body validation** on every POST/PUT/PATCH before business logic
- **Phone numbers** normalized to E.164 via `libphonenumber-js`
- **SQL injection:** all D1 calls use parameterized queries (`?` placeholders)
- **XSS:** React's default escaping + `dangerouslySetInnerHTML` is forbidden

---

## 7. Compliance Posture

| Standard | Status |
|---|---|
| **SOC 2 Type II** | Architecture-ready (Cloudflare + Clerk + Stripe all certified) |
| **HIPAA** | Conditional — requires BAA with Twilio + Cloudflare for telehealth tenants; PHI confined to `appointments` + `messages` |
| **PCI DSS** | Stripe Checkout means no PAN data touches our infra |
| **GDPR** | Data export + delete endpoints (`DELETE /api/tenant/credentials` cascades all tenant data); EU residency available via Cloudflare Smart Placement |
| **CCPA** | Same as GDPR |

---

## 8. Vulnerability Management

- **Dependency scanning:** `pnpm audit` weekly + Renovate bot
- **SAST:** TypeScript strict mode + ESLint security rules
- **Secret scanning:** GitHub Push Protection enabled
- **Bug bounty:** disclosure path at `security@rjbusinesssolutions.com`

---

## 9. Incident Response

See [`operations/INCIDENT_RESPONSE.md`](../operations/INCIDENT_RESPONSE.md) for full playbook.

**Severity definitions:**
- **SEV-1:** Production down, data breach, payments broken → 15-min response
- **SEV-2:** Major feature degraded → 1-hour response
- **SEV-3:** Minor feature broken → 1-business-day response
- **SEV-4:** Cosmetic → next sprint

---

## 10. Master Admin Account Hardening Recommendations

- Enable Clerk MFA (TOTP or WebAuthn) on the master admin email
- Enable Cloudflare Access policy on `/admin` route (optional belt-and-suspenders)
- Rotate `ENCRYPTION_KEY` quarterly (requires data re-encryption migration)
- Rotate `CLERK_SECRET_KEY` semi-annually
- Audit `tenant_credentials` writes weekly via Cloudflare Logs
