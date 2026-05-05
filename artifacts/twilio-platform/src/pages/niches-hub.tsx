import React from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
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
  Zap,
  Globe,
} from "lucide-react";
import LandingChatWidget from "@/components/LandingChatWidget";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const RED = "hsl(348 83% 47%)";

const NICHES = [
  {
    slug: "healthcare",
    name: "Healthcare & Telehealth",
    desc: "HIPAA-compliant telehealth, patient reminders, video consultations, and AI symptom triage.",
    icon: HeartPulse,
    tag: "HIPAA Ready",
  },
  {
    slug: "credit-repair",
    name: "Credit Repair",
    desc: "TCPA-compliant lead follow-ups, dispute status alerts, payment reminders, and client drip campaigns.",
    icon: CreditCard,
    tag: "TCPA Compliant",
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    desc: "Instant lead response, listing alerts, showing confirmations, and long-term nurture sequences.",
    icon: Home,
    tag: "Lead Conversion",
  },
  {
    slug: "insurance",
    name: "Insurance Agencies",
    desc: "Quote follow-ups, policy renewal reminders, claims routing, and document collection via SMS.",
    icon: Umbrella,
    tag: "Retention Focused",
  },
  {
    slug: "dental",
    name: "Dental Offices",
    desc: "Appointment reminders, recall campaigns, post-procedure follow-ups, and 2-way patient texting.",
    icon: Stethoscope,
    tag: "40% Fewer No-Shows",
  },
  {
    slug: "legal",
    name: "Law Firms & Legal",
    desc: "Intake automation, case status updates, document collection, and payment reminders.",
    icon: Scale,
    tag: "50% Faster Intake",
  },
  {
    slug: "auto",
    name: "Auto Dealerships",
    desc: "Instant lead response, service reminders, trade-in follow-ups, and inventory arrival alerts.",
    icon: Car,
    tag: "3x Lead Conversion",
  },
  {
    slug: "home-services",
    name: "Home Services",
    desc: "Job dispatch SMS, technician tracking, estimate follow-ups, and after-hours call capture.",
    icon: Wrench,
    tag: "5min Dispatch",
  },
  {
    slug: "fitness",
    name: "Gyms & Fitness Studios",
    desc: "Class reminders, member win-backs, renewal sequences, and referral campaign automation.",
    icon: Dumbbell,
    tag: "35% Less Churn",
  },
  {
    slug: "restaurant",
    name: "Restaurants & Hospitality",
    desc: "Reservation confirmations, waitlist SMS, loyalty campaigns, event invites, and review requests.",
    icon: UtensilsCrossed,
    tag: "25% More Repeat Visits",
  },
];

export default function NichesHub() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground font-mono overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
              style={{ background: RED }}
            >
              RJ
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">
              RJ Business Solutions
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Home
            </button>
            <button
              onClick={() => setLocation("/sign-in")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={() => setLocation("/sign-up")}
              className="text-sm font-semibold px-4 py-1.5 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ background: RED }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8 border"
          style={{ borderColor: `${RED}66`, color: RED, background: `${RED}14` }}
        >
          <Zap className="w-3 h-3" />
          Powered by Twilio — Built for Every Industry
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          One platform.
          <br />
          <span style={{ color: RED }}>10 industries. Zero compromise.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          RJ Business Solutions adapts to your niche. Select your industry below to see
          exactly how we solve your specific communications challenges — with messaging, voice,
          video, and AI built precisely for your business.
        </p>
      </section>

      {/* Niche Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {NICHES.map((niche) => (
            <button
              key={niche.slug}
              onClick={() => setLocation(`/niches/${niche.slug}`)}
              className="group text-left p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ ["--tw-shadow-color" as string]: `${RED}22` }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:scale-105 duration-200"
                style={{ background: `${RED}1a` }}
              >
                <niche.icon className="w-5 h-5" style={{ color: RED }} />
              </div>

              {/* Tag */}
              <div
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border"
                style={{ borderColor: `${RED}44`, color: RED, background: `${RED}0f` }}
              >
                {niche.tag}
              </div>

              {/* Name */}
              <h3 className="font-bold text-base mb-2 group-hover:text-foreground transition-colors">
                {niche.name}
              </h3>

              {/* Desc */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {niche.desc}
              </p>

              {/* CTA */}
              <div
                className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                style={{ color: RED }}
              >
                View landing page
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Don't see your industry?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Our platform works for any client-facing business. Contact us and we'll show you
            exactly how RJ Business Solutions fits your workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setLocation("/sign-up")}
              className="flex items-center gap-2 px-8 py-3.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: RED }}
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-sm border border-border hover:bg-muted transition-colors"
            >
              Back to Home
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ background: RED }}
            >
              RJ
            </div>
            <span className="text-sm font-semibold">RJ Business Solutions</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="mailto:support@rjbusinesssolutions.org" className="hover:text-foreground transition-colors">
              Support
            </a>
            <span>Powered by Twilio</span>
            <span>© 2026 RJ Business Solutions</span>
          </div>
        </div>
      </footer>

      <LandingChatWidget onSignUp={() => setLocation("/sign-up")} />
    </div>
  );
}
