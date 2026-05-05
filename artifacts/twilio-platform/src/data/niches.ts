import {
  MessageSquare, Phone, Video, ShieldCheck, Activity, Zap, Users,
  HeartPulse, CreditCard, Home, Umbrella, Scale, Car, Wrench,
  Dumbbell, UtensilsCrossed, Stethoscope, Bell, Star, CalendarClock,
  FileText, TrendingUp, Megaphone, Lock, ClipboardList, Banknote,
  MapPin, Send, Building2, GraduationCap, Heart, Briefcase, Sparkles,
  KeyRound, ShoppingCart, LineChart, type LucideIcon,
} from "lucide-react";

export interface NicheFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface NicheStat {
  value: string;
  label: string;
}

export interface NicheComplianceBadge {
  label: string;
  desc: string;
}

export interface NicheCompliance {
  headline: string;
  body: string;
  badges: NicheComplianceBadge[];
}

export interface NicheHighlight {
  badge: string;
  badgeIcon: LucideIcon;
  heading: string;
  body: string;
  bullets: string[];
  mockupCards: { label: string; lines: string[] }[];
}

export interface NicheConfig {
  slug: string;
  name: string;
  shortName: string;
  badge: string;
  headline1: string;
  headline2: string;
  subheadline: string;
  stats: NicheStat[];
  features: NicheFeature[];
  highlight: NicheHighlight;
  compliance: NicheCompliance;
  ctaHeading: string;
  ctaBody: string;
}

const NICHES: NicheConfig[] = [
  // ─── 1. Healthcare / Telehealth ───────────────────────────────────────────
  {
    slug: "healthcare",
    name: "Healthcare & Telehealth",
    shortName: "Healthcare",
    badge: "Powered by Twilio — Built for Healthcare",
    headline1: "Communications",
    headline2: "built for your practice",
    subheadline: "One unified platform for SMS, voice, video, and telehealth. HIPAA-ready. AI-powered. Designed for modern healthcare organizations.",
    stats: [
      { value: "18", label: "Platform Modules" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "HIPAA", label: "Compliant" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Patient SMS", desc: "Two-way texting with patients, bulk appointment reminders, and HIPAA-safe delivery tracking." },
      { icon: Phone, title: "Voice & IVR", desc: "Programmable voice calls, IVR trees, call recording, voicemail transcription, and live monitoring." },
      { icon: Video, title: "Video Sessions", desc: "HIPAA-ready video consultations for up to 50 participants — 1-on-1 and group therapy rooms." },
      { icon: HeartPulse, title: "Telehealth Suite", desc: "Patient intake, appointment reminders, verbal consent recording, and AI-powered triage." },
      { icon: ShieldCheck, title: "HIPAA Compliance", desc: "End-to-end encryption, PHI minimization, recording safeguards, and BAA-ready infrastructure." },
      { icon: Activity, title: "Usage & Analytics", desc: "Real-time billing, usage trends, alert thresholds, and account health dashboards." },
    ],
    highlight: {
      badge: "Telehealth Ready",
      badgeIcon: HeartPulse,
      heading: "Run your entire telehealth practice from one dashboard",
      body: "Video consultations, patient intake, appointment reminders, AI symptom triage, and verbal consent recording — all HIPAA-compliant and ready to deploy.",
      bullets: [
        "HIPAA-compliant video sessions",
        "AI-powered patient triage",
        "Automated appointment reminders",
        "Verbal consent & call recording",
        "Twilio BAA available on request",
      ],
      mockupCards: [
        { label: "Live Session", lines: ["Dr. Jefferson", "Video • 12:34 elapsed", "Encrypted end-to-end"] },
        { label: "Today's Schedule", lines: ["9:00 AM — Jane D.", "11:30 AM — Mark T.", "2:00 PM — Sarah K."] },
      ],
    },
    compliance: {
      headline: "Built HIPAA-compliant from the ground up",
      body: "Every feature is engineered with healthcare compliance as a non-negotiable. We handle the regulatory complexity so your team stays focused on patient care.",
      badges: [
        { label: "HIPAA", desc: "All PHI transmissions and storage meet HIPAA Security Rule requirements including encryption at rest and in transit." },
        { label: "HITECH", desc: "Enhanced audit controls, breach notification procedures, and business associate responsibilities fully covered." },
        { label: "BAA Ready", desc: "Business Associate Agreements available for all plans — required for covered entities and their associates." },
        { label: "TCPA", desc: "Built-in patient consent management, opt-out handling, and quiet-hours enforcement for all outbound SMS and calls." },
        { label: "SOC 2 Type II", desc: "Twilio's SOC 2 Type II certified infrastructure powers every message, call, and video session on our platform." },
        { label: "GDPR / CCPA", desc: "Data subject access, right to deletion, and consent audit trails support global and California privacy laws." },
      ],
    },
    ctaHeading: "Ready to modernize your practice?",
    ctaBody: "Join healthcare organizations already using RJ Business Solutions to deliver better patient experiences through smarter, compliant communications.",
  },

  // ─── 2. Credit Repair ─────────────────────────────────────────────────────
  {
    slug: "credit-repair",
    name: "Credit Repair Agencies",
    shortName: "Credit Repair",
    badge: "Powered by Twilio — Built for Credit Repair",
    headline1: "Close more clients.",
    headline2: "Automate every follow-up.",
    subheadline: "SMS campaigns, dispute status alerts, automated payment reminders, and AI-powered lead conversion — built for credit repair agencies that want to scale.",
    stats: [
      { value: "3x", label: "Lead Conversion" },
      { value: "TCPA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "SMS Follow-Ups", desc: "Automated dispute status texts, payment reminders, and check-in messages keep clients engaged." },
      { icon: Phone, title: "Inbound Call Routing", desc: "Route client calls to the right advisor instantly. Record every call for compliance and coaching." },
      { icon: Megaphone, title: "Lead Campaigns", desc: "Bulk SMS campaigns with smart drip sequences and built-in opt-in/opt-out handling." },
      { icon: CreditCard, title: "Payment Alerts", desc: "Automated billing reminders and payment confirmation texts reduce churn and failed charges." },
      { icon: ShieldCheck, title: "Compliance Tools", desc: "Built-in TCPA consent management, CROA disclosures, and do-not-call scrubbing." },
      { icon: Activity, title: "Pipeline Analytics", desc: "Track leads, conversions, message volume, and revenue attribution in real time." },
    ],
    highlight: {
      badge: "Dispute Automation",
      badgeIcon: CreditCard,
      heading: "Automate client communications from intake to results",
      body: "Send dispute filed alerts, bureau response updates, and score improvement notifications automatically — so your team focuses on results, not callbacks.",
      bullets: [
        "Automated dispute status SMS",
        "Credit score milestone alerts",
        "AI-powered intake & qualification",
        "Payment plan reminder sequences",
        "TCPA & CROA opt-in management",
      ],
      mockupCards: [
        { label: "Dispute Alert Sent", lines: ["TransUnion dispute filed", "Client notified via SMS", "Status: Delivered"] },
        { label: "Today's Follow-Ups", lines: ["8 payment reminders sent", "3 new leads responded", "12 status updates queued"] },
      ],
    },
    compliance: {
      headline: "Every message sent in full regulatory compliance",
      body: "The credit repair industry is heavily regulated. Our platform is built to keep your agency legally protected on every channel — no exceptions.",
      badges: [
        { label: "CROA", desc: "Credit Repair Organizations Act disclosures, cooling-off periods, and written contract requirements are enforced at the platform level." },
        { label: "TCPA", desc: "Written consent capture, opt-out automation, time-of-day restrictions, and do-not-call list scrubbing on every SMS and call campaign." },
        { label: "FCRA", desc: "Fair Credit Reporting Act compliant dispute communication workflows — no unauthorized pulls or misleading dispute language." },
        { label: "CAN-SPAM", desc: "All email follow-up campaigns include required unsubscribe mechanics, sender identification, and physical address disclosure." },
        { label: "FTC Rules", desc: "Platform enforces FTC Telemarketing Sales Rule restrictions on advance fees and prohibited claims for credit repair services." },
        { label: "SOC 2 Type II", desc: "Industry-leading infrastructure security for client data — audit logs, access controls, and encrypted storage throughout." },
      ],
    },
    ctaHeading: "Ready to scale your credit repair agency?",
    ctaBody: "Automate your client communications, close more deals, and stay 100% compliant — all from one platform built for credit repair professionals.",
  },

  // ─── 3. Real Estate ───────────────────────────────────────────────────────
  {
    slug: "real-estate",
    name: "Real Estate Agents & Brokerages",
    shortName: "Real Estate",
    badge: "Powered by Twilio — Built for Real Estate",
    headline1: "Respond faster.",
    headline2: "Close more deals.",
    subheadline: "Instant lead response, listing alerts, showing confirmations, and automated follow-up sequences — built for agents and brokerages who never want to miss a lead.",
    stats: [
      { value: "2x", label: "Lead Response Speed" },
      { value: "5min", label: "Avg Response Time" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Instant Lead Texting", desc: "Auto-respond to new leads within seconds via SMS — before any competitor picks up the phone." },
      { icon: Bell, title: "Listing Alerts", desc: "Notify buyers the moment a matching property hits the market with personalized SMS messages." },
      { icon: CalendarClock, title: "Showing Reminders", desc: "Automated confirmation and reminder texts reduce no-shows and keep schedules tight." },
      { icon: Phone, title: "Smart Call Routing", desc: "Route inbound buyer and seller calls to the right agent with full call recording." },
      { icon: TrendingUp, title: "Drip Campaigns", desc: "Long-term nurture sequences for cold leads — stay top of mind until they're ready." },
      { icon: Star, title: "Review Requests", desc: "Automatically send post-close review request texts to build your online reputation." },
    ],
    highlight: {
      badge: "Lead Conversion Engine",
      badgeIcon: Home,
      heading: "Never miss a lead — respond in seconds, not hours",
      body: "The first agent to respond wins the deal. Our AI-powered lead response system texts every inquiry immediately, qualifies them, and notifies your agent — all while you're on another showing.",
      bullets: [
        "Sub-60-second lead response via SMS",
        "AI qualification and agent routing",
        "Automated showing scheduling",
        "Long-term nurture drip sequences",
        "Post-close review automation",
      ],
      mockupCards: [
        { label: "New Lead Response", lines: ["Zillow inquiry → SMS in 23s", "Buyer qualified by AI", "Showing booked: Tomorrow 3pm"] },
        { label: "Today's Activity", lines: ["14 leads responded to", "6 showings confirmed", "3 offers in review"] },
      ],
    },
    compliance: {
      headline: "Stay compliant across every buyer and seller interaction",
      body: "Real estate communications are regulated by federal and state law. Our platform keeps every touchpoint legally sound — automatically.",
      badges: [
        { label: "TCPA", desc: "Express written consent capture before any SMS campaign. Opt-out automation, quiet hours, and DNC list scrubbing on every sequence." },
        { label: "CAN-SPAM", desc: "All email drip campaigns include compliant unsubscribe, sender ID, and physical address — enforced automatically." },
        { label: "Fair Housing Act", desc: "Messaging templates reviewed for Fair Housing compliance — no discriminatory language, segmentation by protected class, or steering language." },
        { label: "NAR Code", desc: "All AI-generated outreach aligns with National Association of Realtors standards for honesty and non-misleading communication." },
        { label: "State MLS Rules", desc: "Listing alert content stays within authorized data use per your MLS agreement — no unauthorized scraping or data distribution." },
        { label: "GDPR / CCPA", desc: "Buyer and seller contact data is handled with full privacy law compliance including consent capture and the right to deletion." },
      ],
    },
    ctaHeading: "Ready to never lose another lead?",
    ctaBody: "Join agents and brokerages already using RJ Business Solutions to respond faster, close more deals, and automate their entire client journey compliantly.",
  },

  // ─── 4. Insurance ─────────────────────────────────────────────────────────
  {
    slug: "insurance",
    name: "Insurance Agencies",
    shortName: "Insurance",
    badge: "Powered by Twilio — Built for Insurance",
    headline1: "Retain more clients.",
    headline2: "Quote faster. Close easier.",
    subheadline: "Quote follow-ups, policy renewal reminders, claims status alerts, and AI-powered agent routing — built for independent agents and large insurance agencies alike.",
    stats: [
      { value: "60%", label: "Faster Quote Delivery" },
      { value: "TCPA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Quote Follow-Ups", desc: "Automated SMS sequences after quote delivery — keep prospects warm until they're ready to bind." },
      { icon: Bell, title: "Renewal Reminders", desc: "30/60/90-day policy renewal alerts reduce lapse rates and give agents time to upsell." },
      { icon: Phone, title: "Claims Routing", desc: "Route inbound claims calls to the right handler instantly with full recording for compliance." },
      { icon: FileText, title: "Document Collection", desc: "SMS-based document request and confirmation flows speed up underwriting." },
      { icon: Lock, title: "2FA Verification", desc: "Secure client portal access and policy changes with Twilio Verify — TCPA-compliant." },
      { icon: Activity, title: "Agent Analytics", desc: "Track quote volume, conversion rates, renewal success, and agent performance in real time." },
    ],
    highlight: {
      badge: "Retention Automation",
      badgeIcon: Umbrella,
      heading: "Automate renewals, reduce lapse rates, and grow your book",
      body: "Most policy lapses happen because no one followed up in time. Our automated renewal sequences engage every client 90 days before expiration — saving revenue on autopilot.",
      bullets: [
        "90/60/30-day renewal reminder sequences",
        "Lapse win-back SMS campaigns",
        "Cross-sell and upsell automation",
        "Claims status update notifications",
        "E-signature document collection via SMS",
      ],
      mockupCards: [
        { label: "Renewal Alert Sent", lines: ["Policy #4821 expires in 30d", "SMS sent to client", "Agent: Sarah M. notified"] },
        { label: "Today's Pipeline", lines: ["22 renewals in 30-day window", "8 quotes awaiting response", "3 claims opened today"] },
      ],
    },
    compliance: {
      headline: "Fully compliant with insurance industry regulations",
      body: "Insurance is one of the most regulated industries for client communications. Every outreach on our platform is built to meet state and federal requirements.",
      badges: [
        { label: "TCPA", desc: "Express written consent before any SMS or voice campaign. Opt-out automation, DNC scrubbing, and quiet-hour enforcement built in." },
        { label: "GLBA", desc: "Gramm-Leach-Bliley Act safeguards for non-public personal information — data minimization, access controls, and secure transmission." },
        { label: "State Insurance Regs", desc: "Renewal and lapse notice timing aligns with state-mandated advance notice requirements — configurable per state." },
        { label: "CAN-SPAM", desc: "All email campaigns include required sender identification, physical address, and one-click unsubscribe enforcement." },
        { label: "E-SIGN Act", desc: "Document collection and e-signature flows comply with the Electronic Signatures in Global and National Commerce Act." },
        { label: "SOC 2 Type II", desc: "Client policy data and PII stored and transmitted on SOC 2 Type II certified infrastructure with full audit logging." },
      ],
    },
    ctaHeading: "Ready to grow your book of business?",
    ctaBody: "Join insurance agencies already using RJ Business Solutions to automate renewals, respond to leads faster, and retain more clients every month.",
  },

  // ─── 5. Dental ────────────────────────────────────────────────────────────
  {
    slug: "dental",
    name: "Dental Practices",
    shortName: "Dental",
    badge: "Powered by Twilio — Built for Dentistry",
    headline1: "Fill your schedule.",
    headline2: "Reduce no-shows by 40%.",
    subheadline: "Automated appointment reminders, recall campaigns, post-procedure follow-ups, and 2-way patient texting — built for dental offices that want a full chair every day.",
    stats: [
      { value: "40%", label: "Fewer No-Shows" },
      { value: "HIPAA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Appointment Reminders", desc: "Automated 72hr, 24hr, and 2hr reminders via SMS reduce no-shows and keep your chair full." },
      { icon: MessageSquare, title: "2-Way Patient Texting", desc: "Patients confirm, cancel, or reschedule via SMS without calling — saving your front desk hours daily." },
      { icon: CalendarClock, title: "Recall Campaigns", desc: "Automated 6-month recall and hygiene appointment reminders bring patients back on schedule." },
      { icon: HeartPulse, title: "Post-Procedure Follow-Up", desc: "Check in on patients after procedures, collect feedback, and catch complications early." },
      { icon: Star, title: "Review Generation", desc: "Automatically request Google and Healthgrades reviews after successful appointments." },
      { icon: ClipboardList, title: "Digital Intake", desc: "Send digital intake forms via SMS before appointments — arrive paperless, start on time." },
    ],
    highlight: {
      badge: "No-Show Prevention",
      badgeIcon: Stethoscope,
      heading: "Turn missed appointments into filled schedules automatically",
      body: "Every missed appointment costs your practice hundreds. Our multi-touch reminder system sends 3 timed reminders, allows instant SMS confirmation, and auto-fills cancellations from your waitlist.",
      bullets: [
        "3-touch reminder sequences (72hr/24hr/2hr)",
        "SMS confirmation with 1-tap response",
        "Automatic waitlist filling on cancellations",
        "6-month recall campaign automation",
        "Post-procedure AI follow-up messages",
      ],
      mockupCards: [
        { label: "Reminder Sent", lines: ["Cleaning — Tomorrow 10am", "Patient: Jennifer K.", "Status: Confirmed via SMS"] },
        { label: "Today's Schedule", lines: ["18/20 chairs filled", "2 waitlist patients notified", "3 new reviews received"] },
      ],
    },
    compliance: {
      headline: "HIPAA-compliant dental communications, built in",
      body: "Patient communications carry significant privacy obligations. Our platform is purpose-built to protect PHI at every touchpoint — from the first reminder to post-procedure follow-up.",
      badges: [
        { label: "HIPAA", desc: "All patient SMS, call recordings, and intake data are encrypted in transit and at rest — fully PHI-compliant." },
        { label: "HITECH", desc: "Enhanced breach notification protocols and electronic PHI audit controls comply with HITECH Act requirements." },
        { label: "BAA Ready", desc: "Business Associate Agreements available for all plans — required for covered dental practices and group practices." },
        { label: "TCPA", desc: "Patient consent captured at intake and stored with timestamps. Opt-out requests are honored automatically within seconds." },
        { label: "ADA Guidelines", desc: "Patient communication templates reviewed for alignment with American Dental Association ethical communication standards." },
        { label: "SOC 2 Type II", desc: "Infrastructure-level security certifications cover all patient data handled through the platform." },
      ],
    },
    ctaHeading: "Ready to fill every appointment slot?",
    ctaBody: "Join dental practices already using RJ Business Solutions to reduce no-shows, automate patient communications, and grow 5-star reviews on autopilot.",
  },

  // ─── 6. Legal ─────────────────────────────────────────────────────────────
  {
    slug: "legal",
    name: "Law Firms & Legal Practices",
    shortName: "Legal",
    badge: "Powered by Twilio — Built for Legal",
    headline1: "Intake more clients.",
    headline2: "Keep them informed automatically.",
    subheadline: "Client intake automation, case status updates, appointment reminders, document requests, and secure 2-way messaging — built for law firms focused on results.",
    stats: [
      { value: "50%", label: "Faster Client Intake" },
      { value: "GDPR", label: "Ready" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: ClipboardList, title: "Intake Automation", desc: "Capture and qualify new client leads via SMS within minutes of inquiry — before competitors respond." },
      { icon: Bell, title: "Case Status Updates", desc: "Keep clients informed with automated case milestone notifications — reduce status calls by 70%." },
      { icon: CalendarClock, title: "Appointment Reminders", desc: "Automated consultation and court date reminders reduce no-shows and keep your docket moving." },
      { icon: FileText, title: "Document Collection", desc: "Request, track, and confirm document submissions via SMS — accelerate case preparation." },
      { icon: Banknote, title: "Payment Reminders", desc: "Automated retainer and billing reminders improve collection rates without awkward conversations." },
      { icon: Lock, title: "Secure Messaging", desc: "End-to-end encrypted 2-way SMS threads keep client communications confidential and organized." },
    ],
    highlight: {
      badge: "Client Communication Suite",
      badgeIcon: Scale,
      heading: "Stop losing clients to slow intake and poor communication",
      body: "Prospects who don't hear back within minutes go to the next attorney on their list. Our intake automation captures, qualifies, and books consultations automatically — even at midnight.",
      bullets: [
        "Instant lead response under 60 seconds",
        "AI-powered intake qualification",
        "Automated consultation scheduling",
        "Case milestone notification sequences",
        "Secure document collection via SMS",
      ],
      mockupCards: [
        { label: "New Inquiry", lines: ["Personal injury inquiry", "Qualified by AI", "Consultation: Mon 2pm"] },
        { label: "Today's Reminders", lines: ["6 court date reminders sent", "4 document requests pending", "2 retainer payments collected"] },
      ],
    },
    compliance: {
      headline: "Designed to meet bar and ethics requirements",
      body: "Attorney-client privilege, confidentiality obligations, and advertising rules apply to every client communication. Our platform is built to keep you on the right side of all of them.",
      badges: [
        { label: "ABA Model Rules", desc: "Intake and advertising messaging is structured to comply with ABA Model Rules 7.1-7.5 on attorney advertising and solicitation." },
        { label: "Attorney-Client Privilege", desc: "All client communications are encrypted and access-controlled — only authorized users can view thread contents." },
        { label: "TCPA", desc: "Express written consent required before any outbound SMS or call campaign. Opt-out honored instantly and logged with timestamps." },
        { label: "CAN-SPAM", desc: "All email sequences include required sender identification, physical address, and one-click unsubscribe." },
        { label: "GDPR / CCPA", desc: "Client data is handled with full privacy compliance — data minimization, consent records, and deletion rights honored." },
        { label: "SOC 2 Type II", desc: "All client intake data, case communications, and documents transmitted over SOC 2 Type II certified infrastructure." },
      ],
    },
    ctaHeading: "Ready to modernize your practice?",
    ctaBody: "Join law firms already using RJ Business Solutions to intake faster, keep clients informed, and collect more revenue with less administrative overhead.",
  },

  // ─── 7. Auto Dealerships ──────────────────────────────────────────────────
  {
    slug: "auto",
    name: "Auto Dealerships",
    shortName: "Auto",
    badge: "Powered by Twilio — Built for Auto Dealers",
    headline1: "Sell more cars.",
    headline2: "Keep the service drive full.",
    subheadline: "Instant lead response, service appointment reminders, trade-in follow-ups, inventory alerts, and post-purchase review requests — built for dealerships of every size.",
    stats: [
      { value: "3x", label: "Lead Conversion" },
      { value: "10min", label: "Avg Response Time" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Lead Response", desc: "Auto-respond to every internet lead via SMS within minutes — before the prospect shops your competitor." },
      { icon: CalendarClock, title: "Service Reminders", desc: "Oil change, tire rotation, and recall notification sequences keep your service drive full automatically." },
      { icon: Car, title: "Trade-In Follow-Ups", desc: "Automated trade-in value follow-up sequences re-engage shoppers who got a quote but didn't come in." },
      { icon: Bell, title: "Inventory Alerts", desc: "Notify waitlisted buyers the moment their target vehicle arrives on the lot — sell before it's listed." },
      { icon: Star, title: "Review Requests", desc: "Post-purchase SMS review requests build your Google and DealerRater reputation automatically." },
      { icon: Banknote, title: "F&I Follow-Ups", desc: "Finance and insurance product follow-ups via SMS increase back-end revenue per vehicle." },
    ],
    highlight: {
      badge: "Sales Automation",
      badgeIcon: Car,
      heading: "Never lose an internet lead to a slow response again",
      body: "70% of car buyers choose the first dealer who responds. Our AI responds to every web lead via SMS within 60 seconds, qualifies the buyer, and routes to your sales team — 24/7.",
      bullets: [
        "Sub-60-second lead response via SMS",
        "AI buyer qualification and routing",
        "Trade-in follow-up drip sequences",
        "Inventory arrival notifications",
        "Service appointment reminder automation",
      ],
      mockupCards: [
        { label: "New Lead", lines: ["2024 F-150 inquiry", "SMS sent in 42 seconds", "Appointment: Sat 11am"] },
        { label: "Service Drive", lines: ["24 appointments today", "8 overdue reminders sent", "6 new 5-star reviews"] },
      ],
    },
    compliance: {
      headline: "Compliant with FTC, TCPA, and state dealer regulations",
      body: "Dealership communications are scrutinized by multiple regulators. Our platform keeps every message, call, and email within the lines — protecting your franchise agreement and license.",
      badges: [
        { label: "TCPA", desc: "Written consent captured at lead form, showroom, or service intake. DNC scrubbing, opt-out automation, and quiet-hour enforcement on all campaigns." },
        { label: "FTC Dealer Rule", desc: "All lead response and promotional messaging complies with FTC Motor Vehicle Dealers Trade Regulation Rule on advertising and add-on disclosures." },
        { label: "GLBA", desc: "For dealerships with in-house financing: customer financial data is safeguarded per Gramm-Leach-Bliley Act requirements." },
        { label: "CAN-SPAM", desc: "All email sequences for service and marketing include required unsubscribe, sender identification, and address disclosure." },
        { label: "State DMV Rules", desc: "Advertising content tools flag potentially non-compliant claims before messages are sent — protecting your dealer license." },
        { label: "SOC 2 Type II", desc: "Customer contact data, financing info, and purchase records transmitted on SOC 2 Type II certified, encrypted infrastructure." },
      ],
    },
    ctaHeading: "Ready to outsell the competition?",
    ctaBody: "Join auto dealerships already using RJ Business Solutions to respond to leads faster, keep the service drive full, and grow 5-star reviews on autopilot.",
  },

  // ─── 8. Home Services ─────────────────────────────────────────────────────
  {
    slug: "home-services",
    name: "Home Services Contractors",
    shortName: "Home Services",
    badge: "Powered by Twilio — Built for Home Services",
    headline1: "Dispatch faster.",
    headline2: "Never miss a call.",
    subheadline: "Job dispatch automation, appointment reminders, technician tracking notifications, estimate follow-ups, and review requests — built for HVAC, plumbing, electrical, and more.",
    stats: [
      { value: "50%", label: "Fewer Missed Calls" },
      { value: "5min", label: "Dispatch Time" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Phone, title: "24/7 Call Capture", desc: "AI answers every missed call, captures job details, and creates a dispatch ticket — even at 2am." },
      { icon: CalendarClock, title: "Job Reminders", desc: "Automated appointment confirmations and technician ETA notifications keep customers happy." },
      { icon: Wrench, title: "Dispatch SMS", desc: "Send technicians job details via SMS and notify customers when their tech is en route." },
      { icon: MessageSquare, title: "Estimate Follow-Ups", desc: "Automated estimate follow-up sequences convert more quotes into booked jobs." },
      { icon: Star, title: "Review Automation", desc: "Post-job review request SMS sequences build your Google reputation and drive organic leads." },
      { icon: Megaphone, title: "Seasonal Campaigns", desc: "Bulk SMS for tune-up specials, winterization, and service plan renewals to existing customers." },
    ],
    highlight: {
      badge: "Dispatch Automation",
      badgeIcon: Wrench,
      heading: "Turn every missed call into a booked job automatically",
      body: "Every missed call is a competitor's gain. Our AI answers after-hours calls, captures the service need, sends a dispatch confirmation, and routes urgent jobs to your on-call tech — all while you sleep.",
      bullets: [
        "AI after-hours call capture & ticketing",
        "Automated technician dispatch SMS",
        "Customer ETA tracking notifications",
        "Estimate follow-up drip sequences",
        "Post-job review request automation",
      ],
      mockupCards: [
        { label: "Job Dispatched", lines: ["AC emergency — Maple St", "Tech: Mike R. en route", "Customer ETA SMS sent"] },
        { label: "Today's Jobs", lines: ["12 jobs completed", "4 estimates sent", "8 review requests queued"] },
      ],
    },
    compliance: {
      headline: "Compliant contractor communications in every state",
      body: "Home service businesses face TCPA exposure and state licensing compliance. Our platform keeps every customer touchpoint legally sound — protecting your business and your license.",
      badges: [
        { label: "TCPA", desc: "Customer consent captured at booking and stored with timestamps. Opt-out honored in real time. DNC scrubbing on all seasonal campaign lists." },
        { label: "CAN-SPAM", desc: "All email estimate follow-ups and seasonal campaigns include required unsubscribe mechanics, sender ID, and physical address." },
        { label: "FTC Endorsement Rules", desc: "Review request workflows comply with FTC guidelines — no incentivized or selective review solicitation that could constitute fraud." },
        { label: "State Contractor Laws", desc: "Customer communication templates avoid claims that could violate state contractor advertising or licensing regulations." },
        { label: "EPA Section 608", desc: "For HVAC businesses: refrigerant communication workflows flag EPA Section 608 requirements for technician certification disclosure." },
        { label: "SOC 2 Type II", desc: "Customer contact data, service history, and dispatch records stored on SOC 2 Type II certified, encrypted infrastructure." },
      ],
    },
    ctaHeading: "Ready to never miss another job?",
    ctaBody: "Join home service contractors already using RJ Business Solutions to capture every lead, dispatch faster, and build an unbeatable online reputation.",
  },

  // ─── 9. Fitness ───────────────────────────────────────────────────────────
  {
    slug: "fitness",
    name: "Gyms & Fitness Studios",
    shortName: "Fitness",
    badge: "Powered by Twilio — Built for Fitness",
    headline1: "Retain more members.",
    headline2: "Fill every class.",
    subheadline: "Class booking confirmations, membership renewal reminders, trainer check-ins, challenge updates, and referral campaigns — built for gyms, studios, and wellness centers.",
    stats: [
      { value: "35%", label: "Fewer Cancellations" },
      { value: "2x", label: "Referral Rate" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Class Reminders", desc: "Automated booking confirmations and class reminder texts reduce no-shows and keep classes full." },
      { icon: MessageSquare, title: "Member Check-Ins", desc: "AI-powered check-in messages re-engage members who haven't visited in 7, 14, or 30 days." },
      { icon: Banknote, title: "Renewal Reminders", desc: "Membership expiration sequences reduce churn before it happens — automatically." },
      { icon: Megaphone, title: "Challenge Campaigns", desc: "Bulk SMS for 30-day challenges, referral promos, and new class announcements drive engagement." },
      { icon: Star, title: "Review Requests", desc: "After member milestones, automatically request Google reviews to build social proof." },
      { icon: Users, title: "Referral Automation", desc: "SMS-based referral campaigns give members an easy way to share — track every conversion." },
    ],
    highlight: {
      badge: "Retention Engine",
      badgeIcon: Dumbbell,
      heading: "Re-engage at-risk members before they cancel",
      body: "Members who stop showing up cancel within 30 days. Our AI detects inactivity and sends personalized check-in messages, win-back offers, and trainer shoutouts to bring them back — automatically.",
      bullets: [
        "Inactivity detection & win-back SMS",
        "Membership renewal reminder sequences",
        "Challenge and progress update messages",
        "Automated referral campaign flows",
        "Post-milestone review request automation",
      ],
      mockupCards: [
        { label: "Win-Back Sent", lines: ["Member: Alex T. — 14 days out", "\"We miss you\" SMS sent", "Free class offer redeemed"] },
        { label: "This Week", lines: ["42 renewals processed", "8 win-backs converted", "15 new referrals tracked"] },
      ],
    },
    compliance: {
      headline: "Member communications that stay on the right side of the law",
      body: "Gym and studio communications face TCPA exposure for SMS and state regulations for membership agreements. Our platform keeps your member outreach fully protected.",
      badges: [
        { label: "TCPA", desc: "Member consent captured at sign-up with full timestamp and stored record. SMS campaigns include mandatory opt-out and comply with quiet-hour rules." },
        { label: "COPPA", desc: "For studios with youth programs: additional consent and parental permission workflows prevent communications with minors without guardian approval." },
        { label: "State Health Club Laws", desc: "Renewal reminder timing and cancellation communication workflows align with state health club and fitness facility consumer protection laws." },
        { label: "CAN-SPAM", desc: "All email newsletter and promotional campaigns include required unsubscribe, sender identification, and physical location disclosure." },
        { label: "FTC Endorsement Rules", desc: "Review request and referral workflows comply with FTC endorsement guidelines — no incentivized reviews that violate platform or FTC rules." },
        { label: "GDPR / CCPA", desc: "Member data including health info and payment records handled with full GDPR and CCPA compliance — consent records maintained." },
      ],
    },
    ctaHeading: "Ready to grow your membership and keep it?",
    ctaBody: "Join gyms and studios already using RJ Business Solutions to fill classes, reduce churn, and turn every member into a referral source.",
  },

  // ─── 10. Restaurants ──────────────────────────────────────────────────────
  {
    slug: "restaurant",
    name: "Restaurants & Hospitality",
    shortName: "Restaurants",
    badge: "Powered by Twilio — Built for Hospitality",
    headline1: "More covers.",
    headline2: "More return visits.",
    subheadline: "Reservation confirmations, waitlist management, loyalty SMS campaigns, event invites, review requests, and staff alerts — built for restaurants and hospitality businesses.",
    stats: [
      { value: "25%", label: "More Return Visits" },
      { value: "Zero", label: "No-Show Surprises" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Reservation Confirmations", desc: "Instant SMS confirmation and 2-hour reminder texts reduce no-shows and keep covers filled." },
      { icon: MessageSquare, title: "Waitlist Management", desc: "Notify guests the moment their table is ready via SMS — eliminate lobby crowding." },
      { icon: Megaphone, title: "Loyalty Campaigns", desc: "Targeted SMS for loyal guests — birthday offers, anniversary promos, and VIP invites." },
      { icon: CalendarClock, title: "Event Marketing", desc: "Bulk SMS invites for wine dinners, live music, and holiday events drive pre-booked covers." },
      { icon: Star, title: "Review Requests", desc: "Post-visit review request texts build your Yelp, Google, and TripAdvisor ratings automatically." },
      { icon: Users, title: "Staff Alerts", desc: "Automated shift reminders, last-minute fill requests, and manager alerts keep operations smooth." },
    ],
    highlight: {
      badge: "Guest Experience",
      badgeIcon: UtensilsCrossed,
      heading: "Turn every visit into a loyal, returning guest",
      body: "Most guests who have a great experience never come back simply because they forgot about you. Our loyalty SMS system keeps your restaurant top of mind with personalized offers that bring guests back.",
      bullets: [
        "Post-visit loyalty SMS enrollment",
        "Birthday and anniversary automated offers",
        "VIP guest early access campaigns",
        "No-show reduction via SMS reminders",
        "Staff shift alert automation",
      ],
      mockupCards: [
        { label: "Table Ready", lines: ["Party of 4 — Martinez", "SMS: \"Your table is ready\"", "Seated in 2 minutes"] },
        { label: "This Weekend", lines: ["48 reservations confirmed", "12 loyalty offers sent", "22 new Google reviews"] },
      ],
    },
    compliance: {
      headline: "Guest and staff communications that meet every standard",
      body: "Restaurant SMS and loyalty programs carry TCPA and state law obligations. Our platform ensures every guest and staff message is legally compliant from day one.",
      badges: [
        { label: "TCPA", desc: "Guest opt-in captured at reservation, loyalty sign-up, or waitlist entry. Opt-outs honored instantly. DNC scrubbing on all list-based campaigns." },
        { label: "CAN-SPAM", desc: "All email loyalty and promotional campaigns include required unsubscribe, sender identification, and physical address disclosure." },
        { label: "State Labor Laws", desc: "Staff scheduling and shift-fill alerts are structured to comply with state predictive scheduling laws and advance notice requirements." },
        { label: "FTC Endorsement Rules", desc: "Review request flows comply with FTC guidelines — no incentivized or quid-pro-quo review solicitation that could constitute a violation." },
        { label: "GDPR / CCPA", desc: "Guest contact data collected for loyalty and reservation programs is handled with full GDPR and CCPA compliance — consent records maintained." },
        { label: "PCI DSS", desc: "No payment card data is transmitted over SMS or stored in the platform — all payment integrations use PCI-compliant processors." },
      ],
    },
    ctaHeading: "Ready to fill tables and build loyal guests?",
    ctaBody: "Join restaurants already using RJ Business Solutions to eliminate no-shows, drive repeat visits, and build the kind of reviews that keep new guests coming in.",
  },

  // ─── 11. Mortgage / Lending ───────────────────────────────────────────────
  {
    slug: "mortgage",
    name: "Mortgage & Lending Companies",
    shortName: "Mortgage",
    badge: "Powered by Twilio — Built for Mortgage Lenders",
    headline1: "Close loans faster.",
    headline2: "Keep borrowers in the loop.",
    subheadline: "Loan status updates, document collection automation, rate alert campaigns, pre-approval follow-ups, and AI-powered borrower communication — built for mortgage and lending teams.",
    stats: [
      { value: "40%", label: "Faster Loan Close" },
      { value: "RESPA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Loan Status SMS", desc: "Automated borrower updates at every milestone — application received, approved, conditions cleared, and closing scheduled." },
      { icon: FileText, title: "Document Collection", desc: "SMS-based document request and submission confirmation flows cut days off underwriting timelines." },
      { icon: Bell, title: "Rate Alerts", desc: "Notify rate-watching prospects the moment rates move into their target range — convert shoppers into applicants." },
      { icon: Phone, title: "Lead Response", desc: "Respond to purchase and refi inquiries within 60 seconds via SMS — before the borrower calls three lenders." },
      { icon: CalendarClock, title: "Closing Reminders", desc: "Automated closing appointment confirmations and document checklist reminders prevent last-minute surprises." },
      { icon: TrendingUp, title: "Past Client Campaigns", desc: "Annual check-in and rate-drop campaigns turn past borrowers into repeat business and referrals." },
    ],
    highlight: {
      badge: "Borrower Communication Engine",
      badgeIcon: Building2,
      heading: "Faster closings start with better borrower communication",
      body: "Missing documents and borrower confusion are the top causes of closing delays. Our automated document collection and status update system keeps every loan moving — and every borrower informed — without manual follow-up.",
      bullets: [
        "Automated loan milestone SMS updates",
        "Document request and confirmation flows",
        "Rate drop and market alert notifications",
        "Closing appointment reminder sequences",
        "Past client referral and refi campaigns",
      ],
      mockupCards: [
        { label: "Loan Update Sent", lines: ["Loan #7821 — Conditional Approval", "SMS sent to borrower", "3 documents still needed"] },
        { label: "Today's Pipeline", lines: ["12 applications in processing", "5 closings this week", "8 rate alerts queued"] },
      ],
    },
    compliance: {
      headline: "Built to meet the strictest lending compliance standards",
      body: "Mortgage communications are regulated by federal law and state licensing requirements. Every outreach on our platform is designed to keep your team compliant at every touchpoint.",
      badges: [
        { label: "RESPA", desc: "Real Estate Settlement Procedures Act compliance — no kickback or referral fee arrangements communicated through the platform. Disclosure timing enforced." },
        { label: "TILA", desc: "Truth in Lending Act compliant rate and APR communication — no misleading or incomplete rate advertising in SMS or email campaigns." },
        { label: "TCPA", desc: "Written consent required before any SMS campaign. Opt-out automation, DNC scrubbing, and quiet-hour enforcement built in for all borrower outreach." },
        { label: "GLBA", desc: "Gramm-Leach-Bliley Act safeguards for borrower non-public personal information — data minimization, encryption, and access controls throughout." },
        { label: "ECOA / Fair Lending", desc: "No discriminatory targeting or steering in campaign segmentation — Equal Credit Opportunity Act compliance embedded in audience tools." },
        { label: "SOC 2 Type II", desc: "Borrower SSNs, income data, and loan details are never stored in our platform — all sensitive data stays in your LOS with encrypted references only." },
      ],
    },
    ctaHeading: "Ready to close faster and communicate better?",
    ctaBody: "Join mortgage and lending teams already using RJ Business Solutions to accelerate closings, reduce document delays, and keep borrowers informed every step of the way.",
  },

  // ─── 12. Chiropractic & Physical Therapy ──────────────────────────────────
  {
    slug: "chiropractic",
    name: "Chiropractic & Physical Therapy",
    shortName: "Chiropractic / PT",
    badge: "Powered by Twilio — Built for Chiro & PT",
    headline1: "Full schedules.",
    headline2: "Better patient outcomes.",
    subheadline: "HIPAA-compliant appointment reminders, care plan check-ins, insurance auth status updates, and re-activation campaigns — built for chiropractic and physical therapy practices.",
    stats: [
      { value: "45%", label: "Fewer No-Shows" },
      { value: "HIPAA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Appointment Reminders", desc: "Multi-touch SMS reminders reduce no-shows and keep your treatment rooms generating revenue." },
      { icon: HeartPulse, title: "Care Plan Check-Ins", desc: "Automated mid-plan progress check-ins improve patient adherence and treatment outcomes." },
      { icon: FileText, title: "Insurance Auth Alerts", desc: "Notify patients when insurance authorization is approved — keep them engaged during the wait." },
      { icon: MessageSquare, title: "2-Way Patient Texting", desc: "Patients reschedule or confirm via SMS without calling — freeing your front desk for in-office care." },
      { icon: TrendingUp, title: "Re-Activation Campaigns", desc: "Automated win-back sequences for discharged patients due for their next episode of care." },
      { icon: Star, title: "Outcome & Review Collection", desc: "Post-care outcome surveys and review requests build your reputation and improve clinical insights." },
    ],
    highlight: {
      badge: "Patient Retention Suite",
      badgeIcon: HeartPulse,
      heading: "Keep patients on their care plan — and coming back",
      body: "Patient drop-off mid-plan is the biggest revenue leak in chiro and PT practices. Our automated care plan check-ins and re-engagement sequences keep patients committed to their health — and your schedule full.",
      bullets: [
        "Multi-touch appointment reminder sequences",
        "Care plan adherence check-in messages",
        "Insurance authorization status updates",
        "Discharged patient re-activation campaigns",
        "Outcome survey and review request automation",
      ],
      mockupCards: [
        { label: "Care Plan Check-In", lines: ["Week 3 of 8 — Patient: Tom R.", "Check-in SMS sent", "Response: Feeling better!"] },
        { label: "Today's Schedule", lines: ["22/24 slots filled", "1 auth approval SMS sent", "5 re-activation responses"] },
      ],
    },
    compliance: {
      headline: "HIPAA-compliant communications for every patient interaction",
      body: "Chiropractic and PT practices handle protected health information in every appointment reminder and care communication. Our platform is purpose-built to keep every touchpoint compliant.",
      badges: [
        { label: "HIPAA", desc: "All patient SMS, call recordings, and health-related communications are encrypted in transit and at rest — fully PHI-compliant." },
        { label: "HITECH", desc: "Breach notification procedures, audit trails for PHI access, and electronic health record linkage comply with HITECH Act standards." },
        { label: "BAA Ready", desc: "Business Associate Agreements available for all plans — required for covered chiropractic and PT practices." },
        { label: "TCPA", desc: "Patient consent captured at intake with timestamp. Opt-out requests honored automatically within seconds of receipt." },
        { label: "State Board Rules", desc: "Care plan and outcome communication templates reviewed for compliance with state chiropractic and physical therapy board advertising standards." },
        { label: "SOC 2 Type II", desc: "All patient data transmitted and stored on SOC 2 Type II certified infrastructure with full audit logging." },
      ],
    },
    ctaHeading: "Ready to fill your schedule and improve outcomes?",
    ctaBody: "Join chiropractic and physical therapy practices already using RJ Business Solutions to reduce no-shows, retain patients longer, and automate every touchpoint.",
  },

  // ─── 13. Veterinary ───────────────────────────────────────────────────────
  {
    slug: "veterinary",
    name: "Veterinary Practices",
    shortName: "Veterinary",
    badge: "Powered by Twilio — Built for Veterinary Practices",
    headline1: "Healthy pets.",
    headline2: "Full appointment books.",
    subheadline: "Appointment reminders, vaccine due alerts, post-visit follow-ups, prescription pickup notifications, and 2-way client texting — built for veterinary practices of every size.",
    stats: [
      { value: "38%", label: "Fewer No-Shows" },
      { value: "TCPA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Appointment Reminders", desc: "Automated 48hr and 24hr SMS reminders reduce no-shows and keep exam rooms generating revenue." },
      { icon: CalendarClock, title: "Vaccine Due Alerts", desc: "Proactive vaccine and wellness reminder campaigns bring pets back on schedule automatically." },
      { icon: HeartPulse, title: "Post-Visit Follow-Up", desc: "Check in on patients after procedures, surgeries, or illness visits — catch complications early." },
      { icon: MessageSquare, title: "2-Way Client Texting", desc: "Clients reschedule, ask questions, and confirm visits via SMS — freeing your reception team." },
      { icon: Bell, title: "Prescription Pickup", desc: "Notify pet owners when prescriptions, food orders, or lab results are ready for pickup." },
      { icon: Star, title: "Review Generation", desc: "Automated post-visit review requests build your Google and Yelp reputation on autopilot." },
    ],
    highlight: {
      badge: "Pet Wellness Automation",
      badgeIcon: Heart,
      heading: "Bring pets back for preventive care — automatically",
      body: "Preventive care is the foundation of a healthy practice and a healthy revenue stream. Our automated vaccine due and wellness reminder system keeps every patient on schedule — without manual follow-up.",
      bullets: [
        "Automated vaccine and wellness due alerts",
        "Multi-touch appointment reminder sequences",
        "Post-surgery and illness follow-up messages",
        "Prescription and lab result pickup notifications",
        "Annual wellness visit re-activation campaigns",
      ],
      mockupCards: [
        { label: "Vaccine Due Alert", lines: ["Patient: Buddy (Lab Mix)", "Rabies due in 14 days", "Appointment booked: Wed 10am"] },
        { label: "Today's Reminders", lines: ["28 appointments confirmed", "6 vaccine due alerts sent", "4 post-op check-ins sent"] },
      ],
    },
    compliance: {
      headline: "Client communications built for veterinary best practices",
      body: "Veterinary client communications must respect TCPA requirements and state veterinary board standards. Our platform keeps every message legally compliant and professionally appropriate.",
      badges: [
        { label: "TCPA", desc: "Client consent captured at intake. SMS appointment and wellness campaigns comply with quiet-hour rules, opt-out automation, and DNC scrubbing." },
        { label: "VCPR Standards", desc: "All automated health communications align with Veterinarian-Client-Patient Relationship standards — no diagnosis or prescription claims in automated messages." },
        { label: "State Vet Board Rules", desc: "Reminder and follow-up templates reviewed for compliance with state veterinary board advertising and communication standards." },
        { label: "CAN-SPAM", desc: "All email wellness newsletters and promotional campaigns include required unsubscribe, sender ID, and physical address disclosure." },
        { label: "FTC Endorsement Rules", desc: "Review request workflows comply with FTC endorsement guidelines — no incentivized reviews that violate Google or FTC rules." },
        { label: "GDPR / CCPA", desc: "Client and pet patient data handled with full GDPR and CCPA compliance — consent records, data minimization, and deletion rights maintained." },
      ],
    },
    ctaHeading: "Ready to keep every patient on schedule?",
    ctaBody: "Join veterinary practices already using RJ Business Solutions to reduce no-shows, automate wellness reminders, and build a thriving, loyal client base.",
  },

  // ─── 14. Education & Tutoring ─────────────────────────────────────────────
  {
    slug: "education",
    name: "Schools, Tutoring & Education",
    shortName: "Education",
    badge: "Powered by Twilio — Built for Education",
    headline1: "Engage every student.",
    headline2: "Keep every parent informed.",
    subheadline: "Session reminders, progress updates, enrollment follow-ups, parent notifications, and student re-engagement campaigns — built for tutoring centers, private schools, and online educators.",
    stats: [
      { value: "50%", label: "Better Attendance" },
      { value: "FERPA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Session Reminders", desc: "Automated SMS reminders for tutoring sessions, classes, and evaluations reduce no-shows dramatically." },
      { icon: MessageSquare, title: "Parent Notifications", desc: "2-way texting with parents for progress updates, attendance alerts, and schedule changes." },
      { icon: TrendingUp, title: "Progress Updates", desc: "Automated milestone and progress report notifications keep families engaged in student success." },
      { icon: Megaphone, title: "Enrollment Campaigns", desc: "SMS and email drip campaigns for open enrollment, summer programs, and new course launches." },
      { icon: Users, title: "Student Re-Engagement", desc: "Automated win-back sequences for students who missed sessions or stopped enrolling." },
      { icon: Star, title: "Testimonial Collection", desc: "Automated parent and student testimonial request campaigns build trust and drive referrals." },
    ],
    highlight: {
      badge: "Enrollment Retention Engine",
      badgeIcon: GraduationCap,
      heading: "Keep students enrolled and parents engaged throughout the year",
      body: "Student drop-off costs tutoring and education businesses thousands in lost monthly recurring revenue. Our automated re-engagement and parent communication system keeps families committed — and re-enrolling.",
      bullets: [
        "Session reminder sequences for students and parents",
        "Progress milestone notification automation",
        "Enrollment expiration and renewal reminders",
        "Dropped student re-activation campaigns",
        "Referral and testimonial request automation",
      ],
      mockupCards: [
        { label: "Session Reminder", lines: ["Math tutoring — Today 4pm", "Student: Emma T.", "Parent notified via SMS"] },
        { label: "This Month", lines: ["92% session attendance", "14 re-enrollments", "8 new referrals tracked"] },
      ],
    },
    compliance: {
      headline: "FERPA-compliant student and family communications",
      body: "Education communications involve student records and minor communications — both heavily regulated. Our platform is built to protect families and keep your institution compliant.",
      badges: [
        { label: "FERPA", desc: "Family Educational Rights and Privacy Act compliance — no student educational record data transmitted without appropriate consent and authorization." },
        { label: "COPPA", desc: "Children's Online Privacy Protection Act compliance for students under 13 — parental consent required for all communications involving minors." },
        { label: "TCPA", desc: "Parent and student consent captured at enrollment. SMS campaigns comply with quiet-hour rules, opt-out automation, and DNC requirements." },
        { label: "CAN-SPAM", desc: "All enrollment and educational email campaigns include required unsubscribe, sender identification, and physical address disclosure." },
        { label: "State Education Laws", desc: "Communication templates reviewed for alignment with state student data privacy laws including SOPIPA and state equivalents." },
        { label: "GDPR / CCPA", desc: "Student and family data handled with full GDPR and CCPA compliance — parental consent records and data deletion rights maintained." },
      ],
    },
    ctaHeading: "Ready to improve enrollment and engagement?",
    ctaBody: "Join schools, tutoring centers, and online educators already using RJ Business Solutions to communicate better, retain more students, and grow enrollments.",
  },

  // ─── 15. Nonprofits ───────────────────────────────────────────────────────
  {
    slug: "nonprofit",
    name: "Nonprofits & Charities",
    shortName: "Nonprofit",
    badge: "Powered by Twilio — Built for Nonprofits",
    headline1: "Raise more funds.",
    headline2: "Engage more supporters.",
    subheadline: "Donor follow-ups, event reminders, volunteer coordination, campaign updates, and stewardship sequences — built for nonprofits that want to do more with less.",
    stats: [
      { value: "2x", label: "Donor Retention" },
      { value: "CAN-SPAM", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Donor Follow-Ups", desc: "Automated thank-you and impact update sequences keep donors feeling valued and re-engaging them for the next ask." },
      { icon: Bell, title: "Event Reminders", desc: "Fundraiser event confirmations, reminders, and day-of logistics delivered automatically via SMS." },
      { icon: Users, title: "Volunteer Coordination", desc: "Shift reminders, schedule changes, and urgent volunteer recruitment via SMS — fill gaps in minutes." },
      { icon: Megaphone, title: "Campaign Updates", desc: "Real-time campaign progress texts and matching gift alerts create urgency and drive donations." },
      { icon: TrendingUp, title: "Lapsed Donor Win-Back", desc: "Automated sequences re-engage donors who haven't given in 12+ months with personalized impact stories." },
      { icon: Star, title: "Stewardship Campaigns", desc: "Anniversary of first gift, milestone recognition, and impact report delivery via SMS and email." },
    ],
    highlight: {
      badge: "Donor Stewardship Suite",
      badgeIcon: Heart,
      heading: "Turn one-time donors into lifelong supporters automatically",
      body: "Most donors lapse not because they stopped caring — but because no one stayed in touch. Our automated stewardship sequences keep every donor feeling valued and informed — making the next gift a natural step.",
      bullets: [
        "Immediate post-donation thank-you sequences",
        "Quarterly impact update SMS campaigns",
        "Lapsed donor win-back sequences",
        "Event attendance and volunteer coordination",
        "Year-end giving campaign automation",
      ],
      mockupCards: [
        { label: "Donor Thank-You", lines: ["Gift received: $250 from Sarah M.", "Impact SMS sent in 30 seconds", "12-month stewardship enrolled"] },
        { label: "Campaign Progress", lines: ["Year-end goal: 78% reached", "42 matching gift alerts sent", "18 lapsed donors responded"] },
      ],
    },
    compliance: {
      headline: "Communications that meet nonprofit and fundraising regulations",
      body: "Nonprofit fundraising communications are regulated by state charitable solicitation laws, federal tax rules, and consumer protection statutes. Our platform keeps every outreach legally sound.",
      badges: [
        { label: "CAN-SPAM", desc: "All donor email campaigns include required unsubscribe mechanics, sender identification, physical address, and clear identification as a solicitation." },
        { label: "TCPA", desc: "Donor and volunteer SMS consent captured at opt-in. Campaigns comply with quiet-hour rules, opt-out automation, and federal DNC requirements." },
        { label: "State Solicitation Laws", desc: "Platform flags campaigns to states requiring prior charitable solicitation registration — protecting your nonprofit from unauthorized solicitation violations." },
        { label: "IRS 501(c)(3)", desc: "Donation acknowledgment message templates include required IRS language for tax-deductible gift receipts — keeping your donors' deductions intact." },
        { label: "FTC Charitable Giving Rules", desc: "All fundraising campaign language reviewed for FTC compliance — no misleading overhead claims or false emergency declarations." },
        { label: "GDPR / CCPA", desc: "Donor data handled with full GDPR and CCPA compliance — consent records, data minimization, and deletion rights maintained for all contacts." },
      ],
    },
    ctaHeading: "Ready to raise more and retain more donors?",
    ctaBody: "Join nonprofits already using RJ Business Solutions to automate donor stewardship, coordinate volunteers, and maximize every fundraising campaign.",
  },

  // ─── 16. Staffing & Recruiting ────────────────────────────────────────────
  {
    slug: "staffing",
    name: "Staffing & Recruiting Agencies",
    shortName: "Staffing",
    badge: "Powered by Twilio — Built for Staffing & Recruiting",
    headline1: "Fill roles faster.",
    headline2: "Keep candidates engaged.",
    subheadline: "Interview reminders, offer follow-ups, onboarding check-ins, candidate pipeline SMS, and client update automation — built for staffing agencies and in-house recruiting teams.",
    stats: [
      { value: "60%", label: "Faster Time-to-Fill" },
      { value: "TCPA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Candidate SMS Pipeline", desc: "Automated touchpoints at every recruiting stage — applied, phone screen, interview, offer, and onboarding." },
      { icon: CalendarClock, title: "Interview Reminders", desc: "Multi-touch interview confirmation and reminder sequences dramatically reduce no-shows and ghosting." },
      { icon: Bell, title: "Offer Follow-Ups", desc: "Automated offer acceptance check-in sequences keep candidates warm and prevent last-minute declines." },
      { icon: Users, title: "Client Status Updates", desc: "Automated pipeline status updates keep hiring managers informed without manual recruiter effort." },
      { icon: Briefcase, title: "Onboarding Check-Ins", desc: "New hire first-day reminders, document checklists, and 30-day check-in sequences improve retention." },
      { icon: TrendingUp, title: "Talent Pool Campaigns", desc: "SMS re-engagement campaigns for dormant candidates in your ATS — surface passive talent on demand." },
    ],
    highlight: {
      badge: "Candidate Experience Engine",
      badgeIcon: Briefcase,
      heading: "Stop losing candidates to poor communication and ghosting",
      body: "Candidates accept other offers simply because they didn't hear from you fast enough. Our automated candidate pipeline keeps every applicant informed, engaged, and warm — at every stage of your recruiting process.",
      bullets: [
        "Stage-by-stage automated SMS touchpoints",
        "Interview confirmation and reminder sequences",
        "Offer follow-up and acceptance monitoring",
        "New hire onboarding communication flows",
        "Dormant candidate re-engagement campaigns",
      ],
      mockupCards: [
        { label: "Interview Confirmed", lines: ["Candidate: Jordan M.", "Wed 2pm — Senior Dev role", "Reminder SMS scheduled: 24hr/2hr"] },
        { label: "This Week's Pipeline", lines: ["48 candidates in active stages", "12 offers pending response", "8 new hires onboarding"] },
      ],
    },
    compliance: {
      headline: "Recruiting communications that meet EEOC and TCPA standards",
      body: "Staffing and recruiting agencies face TCPA exposure for candidate outreach and EEOC requirements for non-discriminatory communications. Our platform keeps every touchpoint legally protected.",
      badges: [
        { label: "TCPA", desc: "Candidate consent captured at application or opt-in. All SMS outreach complies with quiet-hour rules, opt-out automation, and DNC scrubbing." },
        { label: "EEOC Compliance", desc: "Campaign segmentation and messaging tools enforce non-discriminatory outreach — no targeting by protected class characteristics." },
        { label: "FCRA", desc: "Background check initiation communications comply with Fair Credit Reporting Act requirements — proper disclosure and authorization language enforced." },
        { label: "CAN-SPAM", desc: "All email candidate nurture and client update campaigns include required unsubscribe, sender ID, and physical address disclosure." },
        { label: "State Employment Laws", desc: "Offer and onboarding communication templates flag state-specific requirements for employment offer documentation and disclosures." },
        { label: "GDPR / CCPA", desc: "Candidate data including resume information is handled with full GDPR and CCPA compliance — consent records and data deletion rights maintained." },
      ],
    },
    ctaHeading: "Ready to fill roles faster and retain more candidates?",
    ctaBody: "Join staffing and recruiting agencies already using RJ Business Solutions to reduce ghosting, fill roles faster, and deliver a candidate experience that wins placements.",
  },

  // ─── 17. Med Spa & Aesthetics ─────────────────────────────────────────────
  {
    slug: "med-spa",
    name: "Medical Spas & Aesthetics",
    shortName: "Med Spa",
    badge: "Powered by Twilio — Built for Med Spas",
    headline1: "Fully booked.",
    headline2: "Every week, on autopilot.",
    subheadline: "HIPAA-compliant appointment reminders, post-treatment follow-ups, membership renewal sequences, skincare plan check-ins, and review generation — built for med spas and aesthetic practices.",
    stats: [
      { value: "42%", label: "Fewer No-Shows" },
      { value: "HIPAA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Appointment Reminders", desc: "Multi-touch HIPAA-compliant SMS reminders keep your treatment rooms booked solid every week." },
      { icon: HeartPulse, title: "Post-Treatment Follow-Up", desc: "Automated aftercare check-ins improve client safety, outcomes, and loyalty after every treatment." },
      { icon: Banknote, title: "Membership Renewals", desc: "Med spa membership expiration sequences reduce churn and protect your recurring revenue." },
      { icon: CalendarClock, title: "Skincare Plan Check-Ins", desc: "Automated progress check-ins keep clients engaged with their skincare journey between visits." },
      { icon: Megaphone, title: "Seasonal Promotions", desc: "Targeted SMS campaigns for new treatments, seasonal specials, and VIP client pre-launch offers." },
      { icon: Star, title: "Review Generation", desc: "Post-visit review request sequences build your Yelp, Google, and RealSelf reputation automatically." },
    ],
    highlight: {
      badge: "Client Retention Suite",
      badgeIcon: Sparkles,
      heading: "Keep every client on their aesthetic journey — and coming back",
      body: "Most med spa clients return for repeat treatments — but only if you stay in touch. Our automated skincare plan check-ins, seasonal campaigns, and renewal sequences keep clients engaged between visits and loyal for life.",
      bullets: [
        "HIPAA-compliant appointment reminder sequences",
        "Post-treatment aftercare follow-up messages",
        "Skincare plan progress check-in automation",
        "Membership renewal and upgrade sequences",
        "Seasonal promotion and VIP campaign tools",
      ],
      mockupCards: [
        { label: "Post-Treatment Follow-Up", lines: ["Botox — Patient: Lisa M.", "24hr aftercare check-in sent", "Response: Great results!"] },
        { label: "This Week", lines: ["36 appointments confirmed", "8 membership renewals", "12 new Google reviews"] },
      ],
    },
    compliance: {
      headline: "HIPAA-compliant med spa communications, built for clinical settings",
      body: "Medical spas operate in a regulated clinical environment with HIPAA obligations and state medical board oversight. Every communication on our platform is built to meet that standard.",
      badges: [
        { label: "HIPAA", desc: "All patient treatment communications, appointment reminders, and follow-ups are encrypted and handled as PHI — fully HIPAA-compliant." },
        { label: "HITECH", desc: "Breach notification protocols, PHI audit trails, and business associate responsibilities addressed under HITECH Act standards." },
        { label: "BAA Ready", desc: "Business Associate Agreements available for all plans — required for covered med spa practices supervised by licensed physicians or NPs." },
        { label: "TCPA", desc: "Patient consent captured at intake with timestamp. All SMS campaigns comply with quiet hours, opt-out automation, and DNC requirements." },
        { label: "FDA Device Rules", desc: "Promotional messaging for FDA-regulated devices and injectables is structured to avoid off-label promotion and unauthorized clinical claims." },
        { label: "State Medical Board", desc: "Treatment result messaging templates avoid before/after guarantee language or testimonial formats that violate state medical advertising boards." },
      ],
    },
    ctaHeading: "Ready to keep your treatment rooms fully booked?",
    ctaBody: "Join med spas and aesthetic practices already using RJ Business Solutions to fill schedules, retain members, and deliver a premium client experience on autopilot.",
  },

  // ─── 18. Property Management ──────────────────────────────────────────────
  {
    slug: "property-management",
    name: "Property Management Companies",
    shortName: "Property Mgmt",
    badge: "Powered by Twilio — Built for Property Management",
    headline1: "Happier tenants.",
    headline2: "Fewer maintenance headaches.",
    subheadline: "Rent reminders, maintenance request updates, lease renewal campaigns, inspection notifications, and emergency alerts — built for residential and commercial property managers.",
    stats: [
      { value: "30%", label: "Fewer Late Payments" },
      { value: "TCPA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Rent Reminders", desc: "Automated rent due and overdue reminders reduce late payments and awkward collection conversations." },
      { icon: Wrench, title: "Maintenance Updates", desc: "Keep tenants informed on maintenance request status — submitted, assigned, scheduled, and completed." },
      { icon: CalendarClock, title: "Lease Renewal Campaigns", desc: "90/60/30-day lease renewal sequences reduce vacancy and give you time to find replacements." },
      { icon: MessageSquare, title: "2-Way Tenant Texting", desc: "Tenants submit requests, get updates, and communicate with management via SMS — without calling." },
      { icon: Bell, title: "Inspection Alerts", desc: "Advance notice and day-of inspection reminder texts keep tenants informed and reduce conflict." },
      { icon: Megaphone, title: "Emergency Notifications", desc: "Instant bulk SMS for utility outages, weather emergencies, or property-wide alerts." },
    ],
    highlight: {
      badge: "Tenant Communication Suite",
      badgeIcon: KeyRound,
      heading: "Reduce late rent, vacancies, and maintenance chaos — automatically",
      body: "Most property management headaches are communication failures. Our automated tenant reminder system, maintenance update flows, and lease renewal campaigns turn reactive management into proactive retention.",
      bullets: [
        "Automated rent due and overdue sequences",
        "Maintenance request status update automation",
        "Lease renewal 90/60/30-day campaign sequences",
        "Emergency property-wide SMS broadcasting",
        "Move-in, move-out, and inspection notification flows",
      ],
      mockupCards: [
        { label: "Rent Reminder Sent", lines: ["Unit 4B — Rent due in 3 days", "SMS sent to tenant", "Auto-escalation scheduled"] },
        { label: "This Month", lines: ["94% on-time payment rate", "8 lease renewals confirmed", "3 maintenance jobs closed"] },
      ],
    },
    compliance: {
      headline: "Tenant communications compliant with landlord-tenant law",
      body: "Property management communications are governed by federal Fair Housing laws, state landlord-tenant statutes, and TCPA requirements. Our platform keeps every notice and reminder legally sound.",
      badges: [
        { label: "Fair Housing Act", desc: "Tenant communications are segmented without regard to protected class characteristics. No discriminatory language or disparate impact in any automated message." },
        { label: "TCPA", desc: "Tenant consent captured at lease signing. All SMS outreach complies with quiet-hour rules, opt-out automation, and federal DNC requirements." },
        { label: "State Landlord-Tenant Laws", desc: "Rent notice and eviction-related communication templates comply with state-mandated notice timing, format, and delivery requirements." },
        { label: "FCRA", desc: "Tenant screening communication workflows comply with Fair Credit Reporting Act adverse action and disclosure requirements." },
        { label: "CAN-SPAM", desc: "All email tenant newsletters and promotional communications include required unsubscribe, sender identification, and physical address." },
        { label: "GDPR / CCPA", desc: "Tenant personal data handled with full GDPR and CCPA compliance — consent records, data minimization, and deletion rights maintained." },
      ],
    },
    ctaHeading: "Ready to modernize your tenant communications?",
    ctaBody: "Join property management companies already using RJ Business Solutions to collect rent faster, retain tenants longer, and manage properties with less friction.",
  },

  // ─── 19. E-commerce & Retail ──────────────────────────────────────────────
  {
    slug: "ecommerce",
    name: "E-Commerce & Retail",
    shortName: "E-Commerce",
    badge: "Powered by Twilio — Built for E-Commerce & Retail",
    headline1: "Recover more carts.",
    headline2: "Build loyal buyers.",
    subheadline: "Abandoned cart SMS recovery, order updates, shipping notifications, loyalty campaigns, post-purchase review requests, and back-in-stock alerts — built for e-commerce and retail brands.",
    stats: [
      { value: "15%", label: "Cart Recovery Rate" },
      { value: "3x", label: "Repeat Purchase Rate" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: ShoppingCart, title: "Cart Recovery SMS", desc: "Automated abandoned cart SMS sequences recover 15-25% of lost revenue within hours." },
      { icon: Bell, title: "Order & Shipping Updates", desc: "Real-time order confirmation, shipped, out for delivery, and delivered SMS notifications." },
      { icon: Megaphone, title: "Loyalty Campaigns", desc: "Segmented SMS campaigns for VIP buyers, lapsed customers, and seasonal promotions." },
      { icon: MessageSquare, title: "Back-in-Stock Alerts", desc: "Notify waitlisted shoppers the moment a sold-out item returns — convert intent into instant sales." },
      { icon: Star, title: "Review Requests", desc: "Post-delivery review request SMS builds product ratings and drives organic discovery." },
      { icon: TrendingUp, title: "Win-Back Sequences", desc: "Automated re-engagement for customers who haven't purchased in 60, 90, or 180 days." },
    ],
    highlight: {
      badge: "Revenue Recovery Engine",
      badgeIcon: ShoppingCart,
      heading: "Recover abandoned carts and build buyers who come back",
      body: "The average e-commerce store loses 70% of its carts. Our 3-touch abandoned cart SMS recovery sequence recaptures a significant portion of that revenue — automatically, within hours of abandonment.",
      bullets: [
        "3-touch abandoned cart recovery sequences",
        "Real-time order and shipping status SMS",
        "Back-in-stock and price-drop alert automation",
        "VIP and loyalty tier campaign tools",
        "Post-purchase review and referral sequences",
      ],
      mockupCards: [
        { label: "Cart Recovery", lines: ["Cart abandoned: $127 order", "SMS sent 1hr after exit", "Recovered: Customer checked out"] },
        { label: "This Week", lines: ["$8,400 in recovered cart revenue", "42 loyalty SMS campaigns", "18 new product reviews"] },
      ],
    },
    compliance: {
      headline: "E-commerce communications built for full legal compliance",
      body: "E-commerce SMS and email marketing face some of the strictest compliance requirements of any industry. Our platform is built to keep every campaign fully within the law — at scale.",
      badges: [
        { label: "TCPA", desc: "Explicit opt-in consent required before any SMS campaign. Double opt-in support, opt-out automation, quiet-hour enforcement, and DNC scrubbing built in." },
        { label: "CAN-SPAM", desc: "All promotional email campaigns include required unsubscribe mechanics, sender identification, physical address, and clear advertising identification." },
        { label: "CCPA / CPRA", desc: "California Consumer Privacy Act and CPRA compliance — consent capture, data sale opt-out, and deletion request workflows built in." },
        { label: "GDPR", desc: "EU/UK customer data handled with full GDPR compliance — lawful basis for processing, consent management, and data subject rights honored." },
        { label: "PCI DSS", desc: "No payment card data is ever captured or stored via SMS — all checkout links use PCI-compliant payment processors exclusively." },
        { label: "FTC Endorsement Rules", desc: "Review request workflows comply with FTC endorsement guidelines — no incentivized reviews or undisclosed sponsored testimonials." },
      ],
    },
    ctaHeading: "Ready to recover more revenue and build loyal buyers?",
    ctaBody: "Join e-commerce and retail brands already using RJ Business Solutions to recover abandoned carts, drive repeat purchases, and build a customer base that keeps coming back.",
  },

  // ─── 20. Financial Advisors ───────────────────────────────────────────────
  {
    slug: "financial-advisor",
    name: "Financial Advisors & Wealth Management",
    shortName: "Financial Advisory",
    badge: "Powered by Twilio — Built for Financial Advisors",
    headline1: "Grow your AUM.",
    headline2: "Deepen every client relationship.",
    subheadline: "Client review meeting reminders, portfolio update notifications, referral campaign automation, prospect follow-ups, and compliance-approved communications — built for RIAs, broker-dealers, and financial planners.",
    stats: [
      { value: "2x", label: "Client Meeting Rate" },
      { value: "FINRA", label: "Aligned" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: CalendarClock, title: "Review Meeting Reminders", desc: "Automated annual and quarterly client review scheduling sequences fill your calendar without manual outreach." },
      { icon: Bell, title: "Market Update Alerts", desc: "Timely market commentary and portfolio check-in notifications keep clients engaged during volatility." },
      { icon: Users, title: "Referral Campaigns", desc: "Structured referral ask sequences for satisfied clients — the most powerful growth lever for advisors." },
      { icon: MessageSquare, title: "Prospect Follow-Ups", desc: "Automated prospect nurture sequences convert seminar attendees and inquiry leads over time." },
      { icon: LineChart, title: "AUM Milestone Alerts", desc: "Automated client congratulation messages at portfolio milestones deepen relationships and loyalty." },
      { icon: FileText, title: "Document Request Flows", desc: "Secure document collection for account opening, beneficiary updates, and annual reviews via SMS." },
    ],
    highlight: {
      badge: "Client Relationship Engine",
      badgeIcon: LineChart,
      heading: "Turn satisfied clients into your most powerful growth engine",
      body: "The best source of new assets under management is your existing clients. Our structured referral campaign and annual review reminder systems systematically unlock introductions — without cold calling or high marketing spend.",
      bullets: [
        "Annual and quarterly review scheduling sequences",
        "Market update and portfolio check-in SMS",
        "Structured referral ask campaign automation",
        "Prospect seminar follow-up drip sequences",
        "AUM milestone and anniversary recognition messages",
      ],
      mockupCards: [
        { label: "Review Scheduled", lines: ["Client: Patricia H.", "Annual review confirmed: Thu 2pm", "Referral ask queued post-meeting"] },
        { label: "This Quarter", lines: ["28 review meetings booked", "6 new client referrals received", "$2.1M in new AUM from referrals"] },
      ],
    },
    compliance: {
      headline: "Communications designed to meet FINRA, SEC, and TCPA requirements",
      body: "Financial advisor communications are among the most regulated in any industry. Every campaign, message, and sequence on our platform is structured to align with FINRA, SEC, and state securities regulations.",
      badges: [
        { label: "FINRA Rules", desc: "All client and prospect communications align with FINRA Rule 2210 requirements for retail communications — no promissory or misleading performance statements." },
        { label: "SEC Advertising Rule", desc: "Marketing and referral campaign content aligns with SEC Marketing Rule (206(4)-1) requirements — no cherry-picked performance, hypothetical results without disclosures, or unsubstantiated claims." },
        { label: "TCPA", desc: "Client and prospect SMS consent captured and stored with timestamps. Opt-out honored immediately. DNC scrubbing and quiet-hour enforcement built in for all campaigns." },
        { label: "GLBA", desc: "Gramm-Leach-Bliley Act safeguards for client non-public personal financial information — data encryption, access controls, and security program alignment." },
        { label: "State Securities Laws", desc: "Advisor communication templates avoid claims that could violate state blue sky laws or require state securities advertising pre-approval." },
        { label: "SOC 2 Type II", desc: "All client account information and financial data referenced in communications transmitted over SOC 2 Type II certified, encrypted infrastructure." },
      ],
    },
    ctaHeading: "Ready to grow your AUM through better client relationships?",
    ctaBody: "Join financial advisors and wealth managers already using RJ Business Solutions to schedule more reviews, capture more referrals, and deepen every client relationship.",
  },
];

export default NICHES;

export function getNicheBySlug(slug: string): NicheConfig | undefined {
  return NICHES.find((n) => n.slug === slug);
}
