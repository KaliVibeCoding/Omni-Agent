import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, HeartPulse, CreditCard, Home, Umbrella, Scale, Car,
  Wrench, Dumbbell, UtensilsCrossed, Stethoscope, Zap, Globe,
  Building2, GraduationCap, Heart, Briefcase, Sparkles, KeyRound,
  ShoppingCart, LineChart, Search,
} from "lucide-react";
import LandingChatWidget from "@/components/LandingChatWidget";

const RED = "hsl(348 83% 47%)";

const NICHES = [
  { slug: "healthcare",         name: "Healthcare & Telehealth",        icon: HeartPulse,    tag: "HIPAA Ready",            category: "Health" },
  { slug: "dental",             name: "Dental Offices",                 icon: Stethoscope,   tag: "40% Fewer No-Shows",     category: "Health" },
  { slug: "chiropractic",       name: "Chiropractic & Physical Therapy",icon: HeartPulse,    tag: "HIPAA Compliant",        category: "Health" },
  { slug: "veterinary",         name: "Veterinary Practices",           icon: Heart,         tag: "Pet Wellness Automation",category: "Health" },
  { slug: "med-spa",            name: "Medical Spas & Aesthetics",      icon: Sparkles,      tag: "HIPAA + FDA Aligned",    category: "Health" },
  { slug: "credit-repair",      name: "Credit Repair Agencies",         icon: CreditCard,    tag: "TCPA + CROA Compliant",  category: "Financial" },
  { slug: "insurance",          name: "Insurance Agencies",             icon: Umbrella,      tag: "Retention Focused",      category: "Financial" },
  { slug: "mortgage",           name: "Mortgage & Lending",             icon: Building2,     tag: "RESPA + TILA Ready",     category: "Financial" },
  { slug: "financial-advisor",  name: "Financial Advisors",             icon: LineChart,     tag: "FINRA Aligned",          category: "Financial" },
  { slug: "real-estate",        name: "Real Estate Agents",             icon: Home,          tag: "Lead Conversion Engine", category: "Real Estate" },
  { slug: "property-management",name: "Property Management",            icon: KeyRound,      tag: "30% Less Late Payments", category: "Real Estate" },
  { slug: "legal",              name: "Law Firms & Legal",              icon: Scale,         tag: "50% Faster Intake",      category: "Professional" },
  { slug: "staffing",           name: "Staffing & Recruiting",          icon: Briefcase,     tag: "60% Faster Time-to-Fill",category: "Professional" },
  { slug: "education",          name: "Schools & Tutoring",             icon: GraduationCap, tag: "FERPA Compliant",        category: "Professional" },
  { slug: "nonprofit",          name: "Nonprofits & Charities",         icon: Heart,         tag: "2x Donor Retention",     category: "Professional" },
  { slug: "auto",               name: "Auto Dealerships",               icon: Car,           tag: "3x Lead Conversion",     category: "Business" },
  { slug: "home-services",      name: "Home Services Contractors",      icon: Wrench,        tag: "5min Dispatch",          category: "Business" },
  { slug: "fitness",            name: "Gyms & Fitness Studios",         icon: Dumbbell,      tag: "35% Less Churn",         category: "Business" },
  { slug: "restaurant",         name: "Restaurants & Hospitality",      icon: UtensilsCrossed, tag: "25% More Return Visits",category: "Business" },
  { slug: "ecommerce",          name: "E-Commerce & Retail",            icon: ShoppingCart,  tag: "15% Cart Recovery",      category: "Business" },
];

const CATEGORIES = ["All", "Health", "Financial", "Real Estate", "Professional", "Business"];

export default function NichesHub() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = NICHES.filter((n) => {
    const matchesCategory = activeCategory === "All" || n.category === activeCategory;
    const matchesSearch = n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.tag.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-mono overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold" style={{ background: RED }}>
              RJ
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">RJ Business Solutions</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Home</button>
            <button onClick={() => setLocation("/sign-in")} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Sign In</button>
            <button onClick={() => setLocation("/sign-up")} className="text-sm font-semibold px-4 py-1.5 rounded-md text-white transition-opacity hover:opacity-90" style={{ background: RED }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-12 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8 border"
          style={{ borderColor: `${RED}66`, color: RED, background: `${RED}14` }}
        >
          <Zap className="w-3 h-3" />
          Powered by Twilio — Built for Every Business
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          One platform.
          <br />
          <span style={{ color: RED }}>Every industry. Zero compromise.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
          RJ Business Solutions works for every client-facing business — not just a handful of niches.
          Select your industry to see a tailored solution built around your specific workflows,
          compliance requirements, and growth goals.
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Don't see your industry?{" "}
          <a href="mailto:support@rjbusinesssolutions.org" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: RED }}>
            Contact us
          </a>{" "}
          — we build custom solutions for any vertical.
        </p>
      </section>

      {/* Search + Category Filters */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search industries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full border transition-all"
                style={
                  activeCategory === cat
                    ? { background: RED, color: "white", borderColor: RED }
                    : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-muted-foreground mt-4">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
          <span className="font-semibold text-foreground">{NICHES.length}</span> industries
        </p>
      </section>

      {/* Niche Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No industries match your search.</p>
            <p className="text-sm">
              <a href="mailto:support@rjbusinesssolutions.org" className="font-semibold" style={{ color: RED }}>
                Contact us
              </a>{" "}
              — we build for every vertical.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((niche) => (
              <button
                key={niche.slug}
                onClick={() => setLocation(`/niches/${niche.slug}`)}
                className="group text-left p-6 rounded-2xl border border-border bg-card hover:border-red-500/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Category */}
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  {niche.category}
                </div>

                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200"
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
                <h3 className="font-bold text-sm mb-4 leading-snug">{niche.name}</h3>

                {/* CTA */}
                <div
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: RED }}
                >
                  View solution
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Stats bar */}
      <section className="border-y border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "20+", label: "Industry Solutions" },
              { value: "18", label: "Platform Modules" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "24/7", label: "AI Support" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold mb-1" style={{ color: RED }}>{s.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Built for your business — whatever it is.</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            If your business communicates with clients, patients, customers, or prospects,
            RJ Business Solutions has a solution built for you. Start free and customize it
            to fit your exact workflow.
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
            <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: RED }}>RJ</div>
            <span className="text-sm font-semibold">RJ Business Solutions</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="mailto:support@rjbusinesssolutions.org" className="hover:text-foreground transition-colors">Support</a>
            <span>Powered by Twilio</span>
            <span>© 2026 RJ Business Solutions</span>
          </div>
        </div>
      </footer>

      <LandingChatWidget onSignUp={() => setLocation("/sign-up")} />
    </div>
  );
}
