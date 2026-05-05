import React from "react";
import { useLocation } from "wouter";
import {
  Phone,
  MessageSquare,
  Video,
  HeartPulse,
  ShieldCheck,
  Activity,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
  Globe,
} from "lucide-react";
import LandingChatWidget from "@/components/LandingChatWidget";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const FEATURES = [
  {
    icon: MessageSquare,
    title: "SMS & Messaging",
    desc: "Two-way SMS, bulk campaigns, delivery tracking, and conversation threads — all in one place.",
  },
  {
    icon: Phone,
    title: "Voice & Calls",
    desc: "Programmable voice calls, IVR trees, call recording, voicemail transcription, and live call monitoring.",
  },
  {
    icon: Video,
    title: "Video Rooms",
    desc: "HIPAA-ready video consultations up to 50 participants. 1-on-1 telehealth sessions and group therapy.",
  },
  {
    icon: HeartPulse,
    title: "Telehealth Suite",
    desc: "Patient intake, appointment reminders, verbal consent recording, and AI-powered symptom triage.",
  },
  {
    icon: ShieldCheck,
    title: "HIPAA Compliant",
    desc: "End-to-end encryption, recording safeguards, PHI minimization, and BAA-ready infrastructure.",
  },
  {
    icon: Activity,
    title: "Usage & Analytics",
    desc: "Real-time billing, usage trends, alert thresholds, and account health — always in view.",
  },
];

const STATS = [
  { value: "18", label: "Platform Modules" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "HIPAA", label: "Compliant" },
  { value: "24/7", label: "AI Support" },
];

const PLANS = [
  {
    name: "Starter",
    price: "$79",
    period: "/mo",
    desc: "Perfect for solo practitioners & small teams",
    features: [
      "SMS & Voice calls",
      "Up to 1,000 messages/mo",
      "Basic analytics dashboard",
      "Email support",
      "1 Twilio account connected",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$199",
    period: "/mo",
    desc: "For growing practices and call centers",
    features: [
      "Everything in Starter",
      "Unlimited messages",
      "Video consultations",
      "Telehealth suite",
      "AI Voice Agents",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$499",
    period: "/mo",
    desc: "High-volume teams and agencies",
    features: [
      "Everything in Growth",
      "Multi-agent AGI framework",
      "Advanced automation",
      "White-label ready",
      "Dedicated Slack channel",
      "SLA guarantee",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Multi-location and regulated organizations",
    features: [
      "Everything in Business",
      "Dedicated account manager",
      "Custom integrations",
      "HIPAA BAA included",
      "On-prem deployment option",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground font-mono overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "hsl(348 83% 47%)" }}
            >
              RJ
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">
              RJ Business Solutions
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/sign-in")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={() => setLocation("/sign-up")}
              className="text-sm font-semibold px-4 py-1.5 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ background: "hsl(348 83% 47%)" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8 border"
          style={{ borderColor: "hsl(348 83% 47% / 0.4)", color: "hsl(348 83% 47%)", background: "hsl(348 83% 47% / 0.08)" }}
        >
          <Zap className="w-3 h-3" />
          Powered by Twilio — Built for Healthcare
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Communications
          <br />
          <span style={{ color: "hsl(348 83% 47%)" }}>built for your practice</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          One unified platform for SMS, voice, video, and telehealth. HIPAA-ready. AI-powered.
          Designed for modern healthcare organizations.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setLocation("/sign-up")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: "hsl(348 83% 47%)" }}
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLocation("/sign-in")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-sm border border-border hover:bg-muted transition-colors"
          >
            Access Portal
            <Globe className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold mb-1" style={{ color: "hsl(348 83% 47%)" }}>
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything your practice needs</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              18 integrated modules covering every aspect of healthcare communications — from
              appointment reminders to full telehealth sessions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "hsl(348 83% 47% / 0.12)" }}
                >
                  <f.icon className="w-5 h-5" style={{ color: "hsl(348 83% 47%)" }} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telehealth highlight */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-2xl border border-border p-10 md:p-16 flex flex-col md:flex-row gap-12 items-center"
            style={{ background: "hsl(348 83% 47% / 0.04)" }}>
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border"
                style={{ borderColor: "hsl(348 83% 47% / 0.4)", color: "hsl(348 83% 47%)", background: "hsl(348 83% 47% / 0.08)" }}
              >
                <HeartPulse className="w-3 h-3" />
                Telehealth Ready
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Run your entire telehealth practice from one dashboard
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Video consultations, patient intake, appointment reminders, AI symptom triage,
                and verbal consent recording — all HIPAA-compliant and ready to deploy.
              </p>
              <ul className="space-y-3">
                {[
                  "HIPAA-compliant video sessions",
                  "AI-powered patient triage",
                  "Automated appointment reminders",
                  "Verbal consent & recording",
                  "Twilio BAA available",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(348 83% 47%)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 flex flex-col gap-4 w-full md:w-72">
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold">Live Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">P</div>
                  <div>
                    <p className="text-xs font-medium">Dr. Jefferson</p>
                    <p className="text-[10px] text-muted-foreground">Video • 12:34 elapsed</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-[10px] text-muted-foreground mb-2">Today's Appointments</p>
                {["9:00 AM — Jane D.", "11:30 AM — Mark T.", "2:00 PM — Sarah K."].map((appt) => (
                  <div key={appt} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(348 83% 47%)" }} />
                    <span className="text-xs">{appt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free. Scale as your practice grows.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                }`}
                style={plan.highlight ? { borderColor: "hsl(348 83% 47%)", background: "hsl(348 83% 47% / 0.04)" } : {}}
              >
                {plan.highlight && (
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mb-4 px-2 py-0.5 rounded-full self-start"
                    style={{ background: "hsl(348 83% 47%)", color: "white" }}
                  >
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(348 83% 47%)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setLocation(plan.name === "Enterprise" ? "/sign-up" : "/sign-up")}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 ${
                    plan.highlight ? "text-white" : "border border-border hover:bg-muted"
                  }`}
                  style={plan.highlight ? { background: "hsl(348 83% 47%)" } : {}}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to modernize your practice?</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Join healthcare organizations already using RJ Business Solutions to deliver
            better patient experiences through smarter communications.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setLocation("/sign-up")}
              className="flex items-center gap-2 px-8 py-3.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: "hsl(348 83% 47%)" }}
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="mailto:support@rjbusinesssolutions.org"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              support@rjbusinesssolutions.org
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "hsl(348 83% 47%)" }}
            >
              RJ
            </div>
            <span className="text-sm font-semibold">RJ Business Solutions</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="mailto:support@rjbusinesssolutions.org" className="hover:text-foreground transition-colors">
              Support
            </a>
            <span>HIPAA Compliant</span>
            <span>Powered by Twilio</span>
            <span>© 2026 RJ Business Solutions</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Sales Agent */}
      <LandingChatWidget onSignUp={() => setLocation("/sign-up")} />
    </div>
  );
}
