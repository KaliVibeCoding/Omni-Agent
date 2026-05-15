# Niche Playbooks — Industry-Specific Workflows

**Audience:** Tenants in one of the 19 supported verticals.
**Version:** 7.0.0

Each niche shares the same backend table (`niche_records`) and frontend template (`pages/niche-dashboard.tsx`), but defaults — statuses, SMS templates, compliance items — differ.

---

## Common Patterns

Every niche hub at `/niche/<slug>` offers:

1. **Records list** — searchable, status-filtered table of customers/leads/cases.
2. **Add Record** — modal with niche-specific fields.
3. **SMS Quick Send** — pre-filled templates per status.
4. **Bulk SMS** — send the same templated message to every record matching a status.
5. **Compliance Checklist** — TCPA + niche-specific items.

The niche landing pages at `/niches/<slug>` are public marketing pages for SEO.

---

## Credit Repair (`/niche/credit-repair`)
- **Statuses:** lead → contracted → in-dispute → review → closed
- **SMS templates:** new-client welcome, dispute filed, monthly update, review request
- **Compliance:** CROA (Credit Repair Organizations Act), state-specific bonds
- **Integrations recommended:** DisputeFox (CRM), MyFreeScoreNow (monitoring)

## Real Estate (`/niche/real-estate`)
- **Statuses:** lead → showing → offer → under-contract → closed → past-client
- **SMS templates:** showing reminder, offer follow-up, closing-day, post-close check-in
- **Compliance:** TCPA written consent before automated messaging

## Insurance (`/niche/insurance`)
- **Statuses:** lead → quoted → bound → renewed → lapsed
- **SMS templates:** quote ready, renewal reminder, claim received, lapsed re-engage
- **Compliance:** state insurance regulations; do-not-call lists

## Dental (`/niche/dental`)
- **Statuses:** new-patient → scheduled → completed → recall-due → overdue
- **SMS templates:** appointment confirm, day-before reminder, recall, post-visit survey
- **Compliance:** HIPAA — use the **Telehealth** module's BAA path for PHI

## Legal (`/niche/legal`)
- **Statuses:** consult → engaged → in-progress → trial → resolved → closed
- **SMS templates:** consult confirmation, court reminder, billing update
- **Compliance:** ABA Model Rule 1.6 (confidentiality) — encrypt all communications

## Auto (`/niche/auto`)
- **Statuses:** test-drive → quoted → financing → delivered → service-due
- **SMS templates:** test drive booking, financing approved, service reminder
- **Compliance:** TCPA, state DMV regulations

## Home Services (`/niche/home-services`)
- **Statuses:** estimate → scheduled → in-progress → completed → invoiced → paid
- **SMS templates:** estimate ready, ETA, on-the-way, payment due
- **Compliance:** State licensing reminders in welcome flow

## Fitness (`/niche/fitness`)
- **Statuses:** trial → member → at-risk → churned → win-back
- **SMS templates:** class reminder, motivation, win-back offer
- **Compliance:** TCPA written consent

## Restaurant (`/niche/restaurant`)
- **Statuses:** reservation → seated → completed → review-pending
- **SMS templates:** reservation confirm, table ready, post-meal review
- **Compliance:** TCPA

## Mortgage (`/niche/mortgage`)
- **Statuses:** pre-qual → application → underwriting → cleared → funded → past
- **SMS templates:** doc request, conditional approval, clear-to-close
- **Compliance:** TILA-RESPA Integrated Disclosure (TRID), state lender licensing

## Chiropractic (`/niche/chiropractic`)
- **Statuses:** new-patient → active-care → maintenance → discharged
- **SMS templates:** appointment confirm, no-show follow-up, wellness check
- **Compliance:** HIPAA (Telehealth module)

## Veterinary (`/niche/veterinary`)
- **Statuses:** new → active → vaccine-due → boarding → memorial
- **SMS templates:** vaccine reminder, post-op check, boarding confirm
- **Compliance:** State veterinary practice acts

## Education (`/niche/education`)
- **Statuses:** inquiry → enrolled → in-session → completed → alumni
- **SMS templates:** class reminder, assignment due, parent update
- **Compliance:** FERPA (student records); COPPA if under 13

## Nonprofit (`/niche/nonprofit`)
- **Statuses:** prospect → donor → recurring → lapsed → major-gift
- **SMS templates:** thank you, campaign launch, recurring fail, year-end
- **Compliance:** State charitable solicitation registrations

## Staffing (`/niche/staffing`)
- **Statuses:** candidate → interviewing → placed → active → ended
- **SMS templates:** interview confirm, offer, onboarding, milestone
- **Compliance:** EEOC, state-specific candidate communication rules

## Med Spa (`/niche/med-spa`)
- **Statuses:** consult → booked → treated → maintenance → win-back
- **SMS templates:** booking confirm, pre-treatment prep, aftercare, retouch
- **Compliance:** HIPAA (medical procedures)

## Property Management (`/niche/property-management`)
- **Statuses:** prospect → applicant → tenant → notice-given → moved-out
- **SMS templates:** showing reminder, lease ready, rent due, maintenance update
- **Compliance:** Fair Housing Act; state tenant communication laws

## E-commerce (`/niche/ecommerce`)
- **Statuses:** abandoned-cart → customer → vip → at-risk → win-back
- **SMS templates:** cart abandon, order confirm, ship, post-purchase
- **Compliance:** TCPA written consent; PCI (handled by Stripe Checkout)

## Financial Advisor (`/niche/financial-advisor`)
- **Statuses:** lead → consult → onboarded → quarterly-review → ended
- **SMS templates:** review reminder, market update, doc request
- **Compliance:** SEC/FINRA — log all client communications (use the audit log)

---

## Customizing a Niche

The frontend template is config-driven. To customize a niche's defaults:

1. Edit `artifacts/twilio-platform/src/pages/niche-config.ts` (config map).
2. Adjust statuses, SMS templates, compliance items.
3. Commit + PR + deploy.

Backend reads no niche-specific code — every niche shares the same CRUD route at `/api/niche/:slug/*`.
