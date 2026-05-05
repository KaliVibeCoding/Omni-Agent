# White-Label Guide — Make It Your Own Brand

Rebrand the entire platform in under an hour. No deep coding required.

---

## 1. Company Name & Logo

### Update the brand name
Open `artifacts/twilio-platform/src/components/layout.tsx` and find:
```tsx
RJ Business Solutions
```
Replace with your company name everywhere it appears.

### Update the logo
Replace `artifacts/twilio-platform/public/logo.svg` with your logo file (SVG preferred, or PNG).
Also replace `artifacts/twilio-platform/public/favicon.svg` with your favicon.

### Update the opengraph image
Replace `artifacts/twilio-platform/public/opengraph.jpg` with a 1200×630px banner image for social sharing.

---

## 2. Colors & Theme

The platform uses a dark theme with Twilio red (`#F22F46`) as the primary accent. To change the accent color:

Open `artifacts/twilio-platform/src/index.css` and find the CSS variables:
```css
:root {
  --primary: ...
  --primary-foreground: ...
  --ring: ...
}
```

Or search for `#F22F46` or `#f22f46` across the frontend source files and replace with your brand color.

For Clerk auth screens (sign-in, sign-up), go to your Clerk Dashboard:
1. Clerk Dashboard → Customization → Appearance
2. Set your primary color
3. Upload your logo
4. Set the application name

---

## 3. Domain Setup

### Frontend (Cloudflare Pages)
1. Cloudflare Dashboard → Pages → Your project → Custom domains
2. Add your domain: `app.yourbrand.com`
3. Add the DNS CNAME record that Cloudflare shows you

### API (Cloudflare Workers)
1. Cloudflare Dashboard → Workers → Your worker → Triggers → Custom Domains
2. Add: `api.yourbrand.com`
3. Update `APP_URL` in `artifacts/cf-worker/wrangler.toml`
4. Update `CF_WORKER_URL` environment variable in your Cloudflare Pages project

### Email sender domain (Resend)
1. resend.com → Domains → Add domain
2. Add DNS records as instructed
3. Update email sender addresses in `artifacts/api-server/src/lib/emailService.ts`

---

## 4. Pricing Tiers

### Update pricing display
Open `artifacts/twilio-platform/src/pages/landing.tsx` and find the pricing section. Update:
- Plan names
- Prices
- Features list per tier
- CTA button text

### Update Stripe products
Re-run the seed script with new prices:
```bash
# Edit the prices in artifacts/api-server/scripts/seed-products.ts first
cd artifacts/api-server
npx tsx scripts/seed-products.ts
```

---

## 5. Industry Niches — Add or Remove

### Remove an industry
1. Remove its entry from `artifacts/twilio-platform/src/components/layout.tsx` sidebar
2. Remove its landing page link from `artifacts/twilio-platform/src/data/niches.ts`
3. Remove its config from `artifacts/twilio-platform/src/data/niche-dashboard-configs.ts`

### Add a new industry
1. Add a config to `src/data/niche-dashboard-configs.ts`:
```typescript
"my-new-niche": {
  slug: "my-new-niche",
  label: "My New Industry",
  entityName: "Client",
  entityNamePlural: "Clients",
  icon: "Users",
  color: "blue",
  kpis: [...],
  smsTemplates: [...],
  statusOptions: [...],
  typeOptions: [...],
  complianceItems: [...],
},
```
2. Add a sidebar link in `layout.tsx`
3. Add a landing page entry in `niches.ts`

No backend changes needed — the niche router handles all slugs automatically.

---

## 6. Landing Page Content

Open `artifacts/twilio-platform/src/pages/landing.tsx` to customize:
- Hero headline and subheadline
- Feature bullet points
- Social proof stats (18 industries, 99.9% uptime, etc.)
- Testimonials section
- Company description in footer
- Footer links

---

## 7. Email Templates

Email copy lives in `artifacts/api-server/src/lib/emailService.ts`. Update:
- `sendWelcomeEmail` — Sent when a new customer subscribes
- `sendUpgradeEmail` — Sent when a customer upgrades their plan
- `sendCancellationEmail` — Sent when a customer cancels
- `sendPaymentFailedEmail` — Sent when a payment fails
- `sendReceiptEmail` — Sent for successful payments

---

## 8. Compliance & Legal Pages

Each industry landing page has a compliance section. Update the compliance items in:
`artifacts/twilio-platform/src/data/niches.ts` → each niche's `compliance` array.

For your own Terms of Service and Privacy Policy, add routes to the landing page and create new page components. The existing footer has placeholder links you can wire up.

---

## 9. AI System Prompt

The Twilio Omni-Agent has a detailed system prompt at:
`artifacts/cf-worker/src/system-prompt.ts`

Customize it to:
- Use your brand name instead of "TWILIO OMNI-AGENT"
- Add information specific to your platform features
- Adjust the AI's persona and communication style

---

## 10. Remove Replit Branding (if needed)

The development environment includes some Replit-specific plugins. These are automatically disabled in production builds — no action needed. In production (Cloudflare), only your code runs.

---

## Quick Checklist

- [ ] Company name replaced in layout.tsx, landing.tsx
- [ ] Logo files replaced (logo.svg, favicon.svg, opengraph.jpg)
- [ ] Brand color updated in index.css
- [ ] Clerk auth screens customized (Clerk Dashboard → Appearance)
- [ ] Custom domain configured in Cloudflare Pages
- [ ] Custom domain configured in Cloudflare Workers
- [ ] APP_URL and CF_WORKER_URL updated to custom domains
- [ ] Pricing updated in landing page and Stripe
- [ ] Email templates updated with brand voice
- [ ] Unwanted industry niches removed from sidebar
- [ ] Compliance/legal pages added (Terms of Service, Privacy Policy)
- [ ] Footer links updated
