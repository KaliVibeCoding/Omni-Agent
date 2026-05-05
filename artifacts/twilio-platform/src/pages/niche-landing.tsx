import React from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Zap,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import LandingChatWidget from "@/components/LandingChatWidget";
import { getNicheBySlug } from "@/data/niches";
import NotFound from "@/pages/not-found";

const RED = "hsl(348 83% 47%)";

const PLANS = [
  {
    name: "Starter",
    price: "$79",
    period: "/mo",
    features: [
      "SMS & Voice calls",
      "Up to 1,000 messages/mo",
      "Basic analytics dashboard",
      "Email support",
      "1 account connected",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$199",
    period: "/mo",
    features: [
      "Everything in Starter",
      "Unlimited messages",
      "Video & conferencing",
      "AI automation suite",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$499",
    period: "/mo",
    features: [
      "Everything in Growth",
      "Multi-agent AGI framework",
      "Advanced automation",
      "White-label ready",
      "Dedicated Slack channel",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Everything in Business",
      "Dedicated account manager",
      "Custom integrations",
      "Full compliance package",
      "On-prem option available",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function NicheLanding() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const niche = getNicheBySlug(params.slug);

  if (!niche) return <NotFound />;

  const {
    badge, headline1, headline2, subheadline,
    stats, features, highlight, compliance,
    ctaHeading, ctaBody,
  } = niche;

  return (
    <div className="min-h-screen bg-background text-foreground font-mono overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/niches")}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="All industries"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
              style={{ background: RED }}
            >
              RJ
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">
              RJ Business Solutions
            </span>
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ml-1"
              style={{ borderColor: `${RED}55`, color: RED, background: `${RED}11` }}
            >
              {niche.shortName}
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
              style={{ background: RED }}
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
          style={{ borderColor: `${RED}66`, color: RED, background: `${RED}14` }}
        >
          <Zap className="w-3 h-3" />
          {badge}
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          {headline1}
          <br />
          <span style={{ color: RED }}>{headline2}</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {subheadline}
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
            onClick={() => setLocation("/sign-in")}
            className="flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-sm border border-border hover:bg-muted transition-colors"
          >
            Access Portal
            <Globe className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold mb-1" style={{ color: RED }}>{s.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything {niche.shortName.toLowerCase()} businesses need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              18 integrated modules covering every aspect of{" "}
              {niche.shortName.toLowerCase()} communications — from automated
              follow-ups to full omnichannel campaigns.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${RED}1f` }}
                >
                  <f.icon className="w-5 h-5" style={{ color: RED }} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlight section */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div
            className="rounded-2xl border border-border p-10 md:p-16 flex flex-col md:flex-row gap-12 items-center"
            style={{ background: `${RED}0a` }}
          >
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border"
                style={{ borderColor: `${RED}66`, color: RED, background: `${RED}14` }}
              >
                <highlight.badgeIcon className="w-3 h-3" />
                {highlight.badge}
              </div>
              <h2 className="text-3xl font-bold mb-4">{highlight.heading}</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">{highlight.body}</p>
              <ul className="space-y-3">
                {highlight.bullets.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: RED }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 flex flex-col gap-4 w-full md:w-72">
              {highlight.mockupCards.map((card) => (
                <div key={card.label} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: RED }} />
                    <span className="text-xs font-semibold">{card.label}</span>
                  </div>
                  <div className="space-y-1.5">
                    {card.lines.map((line, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: RED }} />
                        <span className="text-xs text-muted-foreground">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Compliance Section ───────────────────────────────────────────── */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
              style={{ borderColor: `${RED}66`, color: RED, background: `${RED}14` }}
            >
              <ShieldCheck className="w-3 h-3" />
              Compliance & Regulatory Standards
            </div>
            <h2 className="text-3xl font-bold mb-4">{compliance.headline}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {compliance.body}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {compliance.badges.map((badge) => (
              <div
                key={badge.label}
                className="p-6 rounded-xl border bg-card"
                style={{ borderColor: `${RED}33` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${RED}18` }}
                  >
                    <ShieldCheck className="w-5 h-5" style={{ color: RED }} />
                  </div>
                  <div>
                    <div
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-2 border"
                      style={{ borderColor: `${RED}44`, color: RED, background: `${RED}0f` }}
                    >
                      {badge.label}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{badge.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-10 p-6 rounded-xl border text-center"
            style={{ borderColor: `${RED}33`, background: `${RED}08` }}
          >
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Not sure if your use case is covered?</span>
              {" "}Our compliance team reviews every enterprise deployment.{" "}
              <a
                href="mailto:support@rjbusinesssolutions.org"
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: RED }}
              >
                Talk to a compliance specialist →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free. Scale as your business grows.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="p-8 rounded-2xl border flex flex-col"
                style={
                  plan.highlight
                    ? { borderColor: RED, background: `${RED}0a`, boxShadow: `0 8px 30px ${RED}22` }
                    : { borderColor: "hsl(var(--border))" }
                }
              >
                {plan.highlight && (
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mb-4 px-2 py-0.5 rounded-full self-start"
                    style={{ background: RED, color: "white" }}
                  >
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6 mt-3">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: RED }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setLocation("/sign-up")}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 ${
                    plan.highlight ? "text-white" : "border border-border hover:bg-muted"
                  }`}
                  style={plan.highlight ? { background: RED } : {}}
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
          <h2 className="text-4xl font-bold mb-6">{ctaHeading}</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">{ctaBody}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setLocation("/sign-up")}
              className="flex items-center gap-2 px-8 py-3.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: RED }}
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
              style={{ background: RED }}
            >
              RJ
            </div>
            <span className="text-sm font-semibold">RJ Business Solutions</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="mailto:support@rjbusinesssolutions.org" className="hover:text-foreground transition-colors">Support</a>
            <button onClick={() => setLocation("/niches")} className="hover:text-foreground transition-colors">All Industries</button>
            <span>Powered by Twilio</span>
            <span>© 2026 RJ Business Solutions</span>
          </div>
        </div>
      </footer>

      <LandingChatWidget onSignUp={() => setLocation("/sign-up")} />
    </div>
  );
}
