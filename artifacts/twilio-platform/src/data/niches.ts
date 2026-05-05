import {
  MessageSquare,
  Phone,
  Video,
  ShieldCheck,
  Activity,
  Zap,
  Users,
  HeartPulse,
  CreditCard,
  Home,
  Umbrella,
  Scale,
  Car,
  Wrench,
  Dumbbell,
  UtensilsCrossed,
  Stethoscope,
  Bell,
  Star,
  CalendarClock,
  FileText,
  TrendingUp,
  Megaphone,
  Lock,
  ClipboardList,
  Banknote,
  MapPin,
  Send,
  type LucideIcon,
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

export interface NicheHighlightBullet {
  text: string;
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
  ctaHeading: string;
  ctaBody: string;
}

const NICHES: NicheConfig[] = [
  // 1. Healthcare / Telehealth
  {
    slug: "healthcare",
    name: "Healthcare & Telehealth",
    shortName: "Healthcare",
    badge: "Powered by Twilio — Built for Healthcare",
    headline1: "Communications",
    headline2: "built for your practice",
    subheadline:
      "One unified platform for SMS, voice, video, and telehealth. HIPAA-ready. AI-powered. Designed for modern healthcare organizations.",
    stats: [
      { value: "18", label: "Platform Modules" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "HIPAA", label: "Compliant" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Patient SMS", desc: "Two-way texting with patients, bulk appointment reminders, and delivery tracking — all HIPAA-safe." },
      { icon: Phone, title: "Voice & IVR", desc: "Programmable voice calls, IVR trees, call recording, voicemail transcription, and live call monitoring." },
      { icon: Video, title: "Video Sessions", desc: "HIPAA-ready video consultations up to 50 participants. 1-on-1 telehealth and group therapy rooms." },
      { icon: HeartPulse, title: "Telehealth Suite", desc: "Patient intake, appointment reminders, verbal consent recording, and AI-powered symptom triage." },
      { icon: ShieldCheck, title: "HIPAA Compliant", desc: "End-to-end encryption, recording safeguards, PHI minimization, and BAA-ready infrastructure." },
      { icon: Activity, title: "Usage & Analytics", desc: "Real-time billing, usage trends, alert thresholds, and account health — always in view." },
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
        "Verbal consent & recording",
        "Twilio BAA available",
      ],
      mockupCards: [
        { label: "Live Session", lines: ["Dr. Jefferson", "Video • 12:34 elapsed"] },
        { label: "Today's Appointments", lines: ["9:00 AM — Jane D.", "11:30 AM — Mark T.", "2:00 PM — Sarah K."] },
      ],
    },
    ctaHeading: "Ready to modernize your practice?",
    ctaBody: "Join healthcare organizations already using RJ Business Solutions to deliver better patient experiences through smarter communications.",
  },

  // 2. Credit Repair
  {
    slug: "credit-repair",
    name: "Credit Repair Agencies",
    shortName: "Credit Repair",
    badge: "Powered by Twilio — Built for Credit Repair",
    headline1: "Close more clients.",
    headline2: "Automate every follow-up.",
    subheadline:
      "SMS campaigns, dispute status alerts, automated payment reminders, and AI-powered lead conversion — built for credit repair agencies that want to scale.",
    stats: [
      { value: "3x", label: "Lead Conversion" },
      { value: "TCPA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "SMS Follow-Ups", desc: "Automated dispute status texts, payment reminders, and check-in messages keep clients engaged and on track." },
      { icon: Phone, title: "Inbound Call Routing", desc: "Route client calls to the right advisor instantly. Record every call for compliance and coaching." },
      { icon: Megaphone, title: "Lead Campaigns", desc: "Bulk SMS campaigns targeting cold, warm, and hot leads with smart drip sequences and opt-out handling." },
      { icon: CreditCard, title: "Payment Alerts", desc: "Automated billing reminders and payment confirmation texts to reduce churn and failed charges." },
      { icon: ShieldCheck, title: "TCPA Compliant", desc: "Built-in opt-in management, do-not-call scrubbing, and consent logging to keep you legally protected." },
      { icon: Activity, title: "Pipeline Analytics", desc: "Track leads, conversions, message volume, and revenue attribution in one real-time dashboard." },
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
        "TCPA opt-in management built-in",
      ],
      mockupCards: [
        { label: "Dispute Alert Sent", lines: ["TransUnion dispute filed", "Client notified via SMS", "Status: Delivered"] },
        { label: "Today's Follow-Ups", lines: ["8 payment reminders sent", "3 new leads responded", "12 status updates queued"] },
      ],
    },
    ctaHeading: "Ready to scale your credit repair agency?",
    ctaBody: "Automate your client communications, close more deals, and stay compliant — all from one platform built for credit repair professionals.",
  },

  // 3. Real Estate
  {
    slug: "real-estate",
    name: "Real Estate Agents & Brokerages",
    shortName: "Real Estate",
    badge: "Powered by Twilio — Built for Real Estate",
    headline1: "Respond faster.",
    headline2: "Close more deals.",
    subheadline:
      "Instant lead response, listing alerts, showing confirmations, and automated follow-up sequences — built for agents and brokerages who never want to miss a lead.",
    stats: [
      { value: "2x", label: "Lead Response Speed" },
      { value: "5min", label: "Avg Response Time" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Instant Lead Texting", desc: "Auto-respond to new leads within seconds via SMS — before any competitor picks up the phone." },
      { icon: Bell, title: "Listing Alerts", desc: "Notify buyers the moment a matching property hits the market with personalized SMS and voice messages." },
      { icon: CalendarClock, title: "Showing Reminders", desc: "Automated confirmation and reminder texts for showings reduce no-shows and keep schedules tight." },
      { icon: Phone, title: "Smart Call Routing", desc: "Route inbound buyer and seller calls to the right agent. Record every call for training and follow-up." },
      { icon: TrendingUp, title: "Drip Campaigns", desc: "Long-term nurture sequences for cold leads — stay top of mind until they're ready to buy or sell." },
      { icon: Star, title: "Review Requests", desc: "Automatically send post-close review request texts to build your Google and Zillow reputation." },
    ],
    highlight: {
      badge: "Lead Conversion Engine",
      badgeIcon: Home,
      heading: "Never miss a lead — respond in seconds, not hours",
      body: "The first agent to respond wins the deal. Our AI-powered lead response system texts every inquiry immediately, qualifies them, and notifies your agent — all while you're on another showing.",
      bullets: [
        "Sub-60-second lead response via SMS",
        "AI qualification and routing",
        "Automated showing scheduling",
        "Long-term nurture drip sequences",
        "Post-close review automation",
      ],
      mockupCards: [
        { label: "New Lead Response", lines: ["Zillow inquiry → SMS sent", "Response in 23 seconds", "Showing booked: Tomorrow 3pm"] },
        { label: "Today's Activity", lines: ["14 leads responded to", "6 showings confirmed", "3 offers in review"] },
      ],
    },
    ctaHeading: "Ready to never lose another lead?",
    ctaBody: "Join agents and brokerages already using RJ Business Solutions to respond faster, close more deals, and automate their entire client journey.",
  },

  // 4. Insurance
  {
    slug: "insurance",
    name: "Insurance Agencies",
    shortName: "Insurance",
    badge: "Powered by Twilio — Built for Insurance",
    headline1: "Retain more clients.",
    headline2: "Quote faster. Close easier.",
    subheadline:
      "Quote follow-ups, policy renewal reminders, claims status alerts, and AI-powered agent routing — built for independent agents and large insurance agencies alike.",
    stats: [
      { value: "60%", label: "Faster Quote Delivery" },
      { value: "TCPA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: MessageSquare, title: "Quote Follow-Ups", desc: "Automated SMS sequences after quote delivery — keep prospects warm until they're ready to bind." },
      { icon: Bell, title: "Renewal Reminders", desc: "30/60/90-day policy renewal alerts reduce lapse rates and give agents time to upsell coverage." },
      { icon: Phone, title: "Claims Routing", desc: "Route inbound claims calls to the right handler instantly. Track every call for compliance." },
      { icon: FileText, title: "Document Collection", desc: "SMS-based document request and confirmation flows speed up underwriting and reduce back-and-forth." },
      { icon: Lock, title: "2FA Verification", desc: "Secure client portal access and policy changes with Twilio Verify — TCPA-compliant and instant." },
      { icon: Activity, title: "Agent Analytics", desc: "Track quote volume, conversion rates, renewal success, and agent performance in real time." },
    ],
    highlight: {
      badge: "Retention Automation",
      badgeIcon: Umbrella,
      heading: "Automate renewals, reduce lapse rates, and grow your book",
      body: "Most policy lapses happen because no one followed up. Our automated renewal sequences keep every client engaged 90 days before expiration — saving revenue on autopilot.",
      bullets: [
        "90/60/30-day renewal reminder sequences",
        "Lapse win-back SMS campaigns",
        "Cross-sell and upsell automation",
        "Claims status update notifications",
        "E-signature document collection via SMS",
      ],
      mockupCards: [
        { label: "Renewal Alert Sent", lines: ["Policy #4821 expires in 30 days", "SMS sent to client", "Agent assigned: Sarah M."] },
        { label: "Today's Pipeline", lines: ["22 renewals in 30-day window", "8 quotes awaiting response", "3 claims opened today"] },
      ],
    },
    ctaHeading: "Ready to grow your book of business?",
    ctaBody: "Join insurance agencies already using RJ Business Solutions to automate renewals, respond to leads faster, and retain more clients every month.",
  },

  // 5. Dental Offices
  {
    slug: "dental",
    name: "Dental Practices",
    shortName: "Dental",
    badge: "Powered by Twilio — Built for Dentistry",
    headline1: "Fill your schedule.",
    headline2: "Reduce no-shows by 40%.",
    subheadline:
      "Automated appointment reminders, recall campaigns, post-procedure follow-ups, and 2-way patient texting — built for dental offices that want a full chair every day.",
    stats: [
      { value: "40%", label: "Fewer No-Shows" },
      { value: "HIPAA", label: "Compliant" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Appointment Reminders", desc: "Automated 72hr, 24hr, and 2hr reminders via SMS reduce no-shows and keep your chair full." },
      { icon: MessageSquare, title: "2-Way Patient Texting", desc: "Patients can confirm, cancel, or reschedule via SMS without calling. Your front desk saves hours daily." },
      { icon: CalendarClock, title: "Recall Campaigns", desc: "Automated 6-month recall and hygiene appointment reminders bring patients back on schedule." },
      { icon: HeartPulse, title: "Post-Procedure Follow-Up", desc: "Check in on patients after procedures, collect feedback, and catch complications early via SMS." },
      { icon: Star, title: "Review Generation", desc: "Automatically request Google and Healthgrades reviews after successful appointments to build your reputation." },
      { icon: ClipboardList, title: "Patient Intake", desc: "Send digital intake forms via SMS before appointments — arrive paperless, start on time." },
    ],
    highlight: {
      badge: "No-Show Prevention",
      badgeIcon: Stethoscope,
      heading: "Turn missed appointments into filled schedules automatically",
      body: "Every missed appointment costs your practice hundreds. Our multi-touch reminder system sends 3 timed reminders, allows instant SMS confirmation, and auto-fills cancellations with waitlisted patients.",
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
    ctaHeading: "Ready to fill every appointment slot?",
    ctaBody: "Join dental practices already using RJ Business Solutions to reduce no-shows, automate patient communications, and grow 5-star reviews on autopilot.",
  },

  // 6. Law Firms
  {
    slug: "legal",
    name: "Law Firms & Legal Practices",
    shortName: "Legal",
    badge: "Powered by Twilio — Built for Legal",
    headline1: "Intake more clients.",
    headline2: "Keep them informed automatically.",
    subheadline:
      "Client intake automation, case status updates, appointment reminders, document requests, and secure 2-way messaging — built for law firms focused on results.",
    stats: [
      { value: "50%", label: "Faster Client Intake" },
      { value: "GDPR", label: "Ready" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: ClipboardList, title: "Intake Automation", desc: "Capture and qualify new client leads via SMS within minutes of inquiry — before competitors respond." },
      { icon: Bell, title: "Case Status Updates", desc: "Keep clients informed with automated case milestone notifications — reduce 'where is my case?' calls by 70%." },
      { icon: CalendarClock, title: "Appointment Reminders", desc: "Automated consultation and court date reminders reduce no-shows and keep your docket moving." },
      { icon: FileText, title: "Document Collection", desc: "Request, track, and confirm document submissions via SMS — accelerate case preparation without chasing clients." },
      { icon: Banknote, title: "Payment Reminders", desc: "Automated retainer and billing reminders improve collection rates and reduce awkward conversations." },
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
        { label: "New Inquiry", lines: ["Personal injury inquiry", "Qualified by AI", "Consultation booked: Mon 2pm"] },
        { label: "Today's Reminders", lines: ["6 court date reminders sent", "4 document requests pending", "2 retainer payments collected"] },
      ],
    },
    ctaHeading: "Ready to modernize your practice?",
    ctaBody: "Join law firms already using RJ Business Solutions to intake faster, keep clients informed, and collect more revenue with less administrative overhead.",
  },

  // 7. Auto Dealerships
  {
    slug: "auto",
    name: "Auto Dealerships",
    shortName: "Auto",
    badge: "Powered by Twilio — Built for Auto Dealers",
    headline1: "Sell more cars.",
    headline2: "Keep the service drive full.",
    subheadline:
      "Instant lead response, service appointment reminders, trade-in follow-ups, inventory alerts, and post-purchase review requests — built for dealerships of every size.",
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
      { icon: Star, title: "Review Requests", desc: "Post-purchase SMS review requests build your Google, DealerRater, and Cars.com reputation automatically." },
      { icon: Banknote, title: "F&I Follow-Ups", desc: "Finance and insurance product follow-ups via SMS increase back-end revenue per vehicle sold." },
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
        { label: "New Lead", lines: ["2024 F-150 inquiry", "SMS sent in 42 seconds", "Appointment booked: Sat 11am"] },
        { label: "Service Drive", lines: ["24 appointments today", "8 overdue service reminders sent", "6 new 5-star reviews"] },
      ],
    },
    ctaHeading: "Ready to outsell the competition?",
    ctaBody: "Join auto dealerships already using RJ Business Solutions to respond to leads faster, keep the service drive full, and grow 5-star reviews on autopilot.",
  },

  // 8. Home Services
  {
    slug: "home-services",
    name: "Home Services Contractors",
    shortName: "Home Services",
    badge: "Powered by Twilio — Built for Home Services",
    headline1: "Dispatch faster.",
    headline2: "Never miss a call.",
    subheadline:
      "Job dispatch automation, appointment reminders, technician tracking notifications, estimate follow-ups, and review requests — built for HVAC, plumbing, electrical, and more.",
    stats: [
      { value: "50%", label: "Fewer Missed Calls" },
      { value: "5min", label: "Dispatch Time" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Phone, title: "24/7 Call Capture", desc: "AI answers every missed call, captures job details, and creates a dispatch ticket — even at 2am." },
      { icon: CalendarClock, title: "Job Reminders", desc: "Automated appointment confirmations and technician ETA notifications keep customers happy." },
      { icon: Wrench, title: "Dispatch SMS", desc: "Send technicians job details via SMS and notify customers when their tech is on the way with tracking info." },
      { icon: MessageSquare, title: "Estimate Follow-Ups", desc: "Automated estimate follow-up sequences convert more quotes into booked jobs without manual chasing." },
      { icon: Star, title: "Review Automation", desc: "Post-job review request SMS sequences build your Google reputation and drive more organic leads." },
      { icon: Megaphone, title: "Seasonal Campaigns", desc: "Bulk SMS campaigns for tune-up specials, winterization, and service plan renewals to existing customers." },
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
    ctaHeading: "Ready to never miss another job?",
    ctaBody: "Join home service contractors already using RJ Business Solutions to capture every lead, dispatch faster, and build an unbeatable online reputation.",
  },

  // 9. Fitness & Gyms
  {
    slug: "fitness",
    name: "Gyms & Fitness Studios",
    shortName: "Fitness",
    badge: "Powered by Twilio — Built for Fitness",
    headline1: "Retain more members.",
    headline2: "Fill every class.",
    subheadline:
      "Class booking confirmations, membership renewal reminders, trainer check-ins, challenge updates, and referral campaigns — built for gyms, studios, and wellness centers.",
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
      { icon: Megaphone, title: "Challenge & Promo Campaigns", desc: "Bulk SMS for 30-day challenges, referral promos, and new class announcements drive engagement." },
      { icon: Star, title: "Review Requests", desc: "After milestones and wins, automatically request Google reviews to build social proof." },
      { icon: Users, title: "Referral Automation", desc: "SMS-based referral campaigns give members an easy way to share — and track every conversion." },
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
    ctaHeading: "Ready to grow your membership and keep it?",
    ctaBody: "Join gyms and studios already using RJ Business Solutions to fill classes, reduce churn, and turn every member into a referral source.",
  },

  // 10. Restaurants & Hospitality
  {
    slug: "restaurant",
    name: "Restaurants & Hospitality",
    shortName: "Restaurants",
    badge: "Powered by Twilio — Built for Hospitality",
    headline1: "More covers.",
    headline2: "More return visits.",
    subheadline:
      "Reservation confirmations, waitlist management, loyalty SMS campaigns, event invites, review requests, and staff alerts — built for restaurants, catering, and hospitality businesses.",
    stats: [
      { value: "25%", label: "More Return Visits" },
      { value: "Zero", label: "No-Show Surprises" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "24/7", label: "AI Support" },
    ],
    features: [
      { icon: Bell, title: "Reservation Confirmations", desc: "Instant SMS confirmation and 2-hour reminder texts reduce reservation no-shows and keep covers filled." },
      { icon: MessageSquare, title: "Waitlist Management", desc: "Notify guests the moment their table is ready via SMS — eliminate lobby crowding and improve experience." },
      { icon: Megaphone, title: "Loyalty Campaigns", desc: "Targeted SMS campaigns for loyal guests — birthday offers, anniversary promos, and VIP invites." },
      { icon: CalendarClock, title: "Event Marketing", desc: "Bulk SMS invites for wine dinners, live music nights, and holiday events drive pre-booked covers." },
      { icon: Star, title: "Review Requests", desc: "Post-visit review request texts build your Yelp, Google, and TripAdvisor ratings automatically." },
      { icon: Users, title: "Staff Alerts", desc: "Automated shift reminders, last-minute fill requests, and manager alerts keep operations running smoothly." },
    ],
    highlight: {
      badge: "Guest Experience",
      badgeIcon: UtensilsCrossed,
      heading: "Turn every visit into a loyal, returning guest",
      body: "Most guests who have a great experience never come back simply because they forgot about you. Our loyalty SMS system keeps your restaurant top of mind with personalized offers that bring guests back again and again.",
      bullets: [
        "Post-visit loyalty SMS enrollment",
        "Birthday and anniversary automated offers",
        "VIP guest early access campaigns",
        "No-show reduction via SMS reminders",
        "Staff shift alert automation",
      ],
      mockupCards: [
        { label: "Table Ready", lines: ["Party of 4 — Martinez", "SMS sent: \"Your table is ready\"", "Seated in 2 minutes"] },
        { label: "This Weekend", lines: ["48 reservations confirmed", "12 loyalty offers sent", "22 new Google reviews"] },
      ],
    },
    ctaHeading: "Ready to fill tables and build loyal guests?",
    ctaBody: "Join restaurants already using RJ Business Solutions to eliminate no-shows, drive repeat visits, and build the kind of reviews that keep new guests coming in.",
  },
];

export default NICHES;

export function getNicheBySlug(slug: string): NicheConfig | undefined {
  return NICHES.find((n) => n.slug === slug);
}
