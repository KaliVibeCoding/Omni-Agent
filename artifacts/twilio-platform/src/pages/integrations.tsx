import React, { useState, useEffect } from "react";
import { Plug, CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink, Brain, Search, CreditCard, MessageSquare, Shield, Database, Globe, Zap, GitBranch, Scale, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL ?? "/";
const API = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

interface IntegrationStatus {
  ai: Record<string, boolean>;
  search: Record<string, boolean>;
  payments: Record<string, boolean>;
  communications: Record<string, boolean>;
  auth: Record<string, boolean>;
  credit: Record<string, boolean>;
  data: Record<string, boolean>;
  automation: Record<string, boolean>;
  email: Record<string, boolean>;
}

interface IntegrationMeta {
  label: string;
  description: string;
  docsUrl: string;
  badge?: string;
}

const AI_PROVIDERS: Record<string, IntegrationMeta> = {
  anthropic:   { label: "Anthropic Claude",  description: "Claude Opus/Sonnet — primary AI backbone for all agents",           docsUrl: "https://docs.anthropic.com", badge: "Primary" },
  openai:      { label: "OpenAI",             description: "GPT-4o, o1-mini — general purpose + vision tasks",                  docsUrl: "https://platform.openai.com/docs" },
  openrouter:  { label: "OpenRouter",         description: "Unified gateway to 200+ models from any provider",                  docsUrl: "https://openrouter.ai/docs" },
  clod:        { label: "CLōD",               description: "OpenAI-compatible endpoint with extended context windows",           docsUrl: "https://api.clod.io" },
  groq:        { label: "Groq",               description: "Ultra-fast LLaMA 3.3 70B — sub-100ms inference",                    docsUrl: "https://console.groq.com/docs" },
  together:    { label: "Together AI",        description: "Open models at scale — LLaMA, Mixtral, Qwen",                       docsUrl: "https://docs.together.ai" },
  deepseek:    { label: "DeepSeek",           description: "DeepSeek-V3 + DeepSeek-R1 reasoning model",                         docsUrl: "https://api-docs.deepseek.com" },
  perplexity:  { label: "Perplexity",         description: "Real-time web search + citations powered by LLMs",                  docsUrl: "https://docs.perplexity.ai" },
  nvidia:      { label: "NVIDIA NIM",         description: "Optimized inference for LLaMA, Nemotron on A100s",                  docsUrl: "https://build.nvidia.com/explore/discover" },
  kimi:        { label: "Moonshot Kimi",      description: "Long-context Chinese + English model (128k tokens)",                docsUrl: "https://platform.moonshot.cn" },
  minimax:     { label: "MiniMax",            description: "MiniMax-Text-01 + audio generation capabilities",                    docsUrl: "https://api.minimax.io" },
  infermatic:  { label: "Infermatic",         description: "Roleplay + creative writing specialized models",                     docsUrl: "https://infermatic.ai" },
  zai:         { label: "ZAI",                description: "High-performance inference for commercial deployments",              docsUrl: "https://zai.ai" },
  chutes:      { label: "Chutes AI",          description: "DeepSeek-V3, Qwen3-235B, Llama-4 via GPU cloud",                   docsUrl: "https://chutes.ai" },
};

const SEARCH_PROVIDERS: Record<string, IntegrationMeta> = {
  brave:    { label: "Brave Search",   description: "Privacy-focused web + news search API — no tracking",     docsUrl: "https://api.search.brave.com/app/documentation" },
  rapidapi: { label: "RapidAPI",       description: "Access to 40,000+ APIs through a single gateway key",    docsUrl: "https://rapidapi.com/docs" },
};

const PAYMENT_PROVIDERS: Record<string, IntegrationMeta> = {
  stripe:   { label: "Stripe",    description: "Subscriptions, billing, invoicing — live keys configured",  docsUrl: "https://stripe.com/docs", badge: "Live" },
  paypal:   { label: "PayPal",    description: "PayPal Checkout Orders API — capture payments worldwide",    docsUrl: "https://developer.paypal.com/api/rest" },
  coinbase: { label: "Coinbase",  description: "Crypto exchange rates + CDP wallet integration",             docsUrl: "https://docs.cdp.coinbase.com" },
};

const CREDIT_PROVIDERS: Record<string, IntegrationMeta> = {
  disputefox: { label: "DisputeFox",       description: "Credit repair CRM — clients, disputes, letters",             docsUrl: "https://pulse.disputeprocess.com" },
  mfsn:       { label: "MyFreeScoreNow",   description: "Credit monitoring enrollment + report retrieval",            docsUrl: "https://api.myfreescorenow.com" },
};

const DATA_PROVIDERS: Record<string, IntegrationMeta> = {
  courtlistener: { label: "CourtListener",   description: "Federal + state court opinions, dockets, judges",     docsUrl: "https://www.courtlistener.com/api/rest/v4" },
  datagov:       { label: "Data.gov",        description: "U.S. government open datasets — 300,000+ resources",  docsUrl: "https://catalog.data.gov/api/action" },
  google_maps:   { label: "Google Maps",     description: "Geocoding, places search, routing for all 19 niches", docsUrl: "https://developers.google.com/maps" },
  github:        { label: "GitHub",          description: "Repo management, code search, CI/CD webhooks",        docsUrl: "https://docs.github.com/en/rest" },
};

const AUTOMATION_PROVIDERS: Record<string, IntegrationMeta> = {
  composio: { label: "Composio",  description: "150+ pre-built integrations for AI agent tool use",          docsUrl: "https://docs.composio.dev" },
  memori:   { label: "Memori",    description: "Long-term memory layer for persistent AI agent context",     docsUrl: "https://memorilabs.ai/docs" },
};

const SECTION_META = [
  { key: "ai",          label: "AI Models",          icon: Brain,         color: "hsl(262 80% 60%)",  providers: AI_PROVIDERS },
  { key: "search",      label: "Search",              icon: Search,        color: "hsl(210 80% 55%)",  providers: SEARCH_PROVIDERS },
  { key: "payments",    label: "Payments",            icon: CreditCard,    color: "hsl(142 71% 45%)",  providers: PAYMENT_PROVIDERS },
  { key: "credit",      label: "Credit & Finance",    icon: BarChart3,     color: "hsl(30 90% 55%)",   providers: CREDIT_PROVIDERS },
  { key: "data",        label: "Data & Research",     icon: Database,      color: "hsl(180 60% 50%)",  providers: DATA_PROVIDERS },
  { key: "communications", label: "Communications",  icon: MessageSquare, color: "hsl(348 83% 47%)",  providers: { twilio: { label: "Twilio", description: "SMS, Voice, Video, Conversations — all channels", docsUrl: "https://www.twilio.com/docs", badge: "Core" } } },
  { key: "auth",        label: "Authentication",      icon: Shield,        color: "hsl(262 80% 60%)",  providers: { clerk: { label: "Clerk", description: "Multi-tenant auth with JWKS JWT verification", docsUrl: "https://clerk.com/docs" } } },
  { key: "automation",  label: "AI Automation",       icon: Zap,           color: "hsl(45 90% 55%)",   providers: AUTOMATION_PROVIDERS },
  { key: "email",       label: "Email",               icon: Globe,         color: "hsl(210 80% 55%)",  providers: { resend: { label: "Resend", description: "Transactional email + bulk campaigns API", docsUrl: "https://resend.com/docs" } } },
] as const;

function StatusDot({ ok, loading }: { ok?: boolean; loading?: boolean }) {
  if (loading) return <Loader2 className="size-3.5 animate-spin text-muted-foreground" />;
  if (ok) return <CheckCircle2 className="size-3.5 text-green-400" />;
  return <XCircle className="size-3.5 text-red-400/70" />;
}

export default function Integrations() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "connected" | "missing">("all");

  async function fetchStatus() {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/integrations`);
      if (resp.ok) setStatus(await resp.json() as IntegrationStatus);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchStatus(); }, []);

  const isConnected = (sectionKey: string, providerKey: string): boolean => {
    if (!status) return false;
    const section = (status as Record<string, Record<string, boolean>>)[sectionKey];
    return section?.[providerKey] ?? false;
  };

  const totalConnected = status
    ? Object.values(status).flatMap(Object.values).filter(Boolean).length
    : 0;
  const totalProviders = SECTION_META.reduce((sum, s) => sum + Object.keys(s.providers).length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Plug className="size-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
            {!loading && (
              <Badge className="bg-green-950 text-green-400 border-green-900 text-xs">
                {totalConnected}/{totalProviders} Connected
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            All external APIs, AI providers, and services wired into the RJ Business Solutions platform.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <RefreshCw className="size-3.5 mr-1.5" />}
          Refresh Status
        </Button>
      </div>

      {/* Summary bar */}
      {!loading && status && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Integration health</span>
                <span className="font-semibold text-foreground">{Math.round((totalConnected / totalProviders) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(totalConnected / totalProviders) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-green-400 font-bold">{totalConnected} active</span>
              <span className="text-muted-foreground">{totalProviders - totalConnected} missing</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {(["all", "connected", "missing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {SECTION_META.map((section) => {
          const entries = Object.entries(section.providers).filter(([key]) => {
            const connected = isConnected(section.key, key);
            if (tab === "connected") return connected;
            if (tab === "missing") return !connected;
            return true;
          });

          if (entries.length === 0) return null;

          const SectionIcon = section.icon;

          return (
            <div key={section.key}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="size-6 rounded-lg flex items-center justify-center"
                  style={{ background: section.color + "22" }}
                >
                  <SectionIcon className="size-3.5" style={{ color: section.color }} />
                </div>
                <h2 className="font-semibold text-foreground text-sm">{section.label}</h2>
                <span className="text-xs text-muted-foreground">
                  {Object.keys(section.providers).filter((k) => isConnected(section.key, k)).length}/{Object.keys(section.providers).length} connected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {entries.map(([key, meta]) => {
                  const connected = isConnected(section.key, key);
                  return (
                    <div
                      key={key}
                      className={cn(
                        "bg-card border rounded-xl p-4 transition-all",
                        connected ? "border-border hover:border-green-800/60" : "border-border/50 opacity-70",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-foreground truncate">{meta.label}</span>
                            {meta.badge && (
                              <Badge
                                className="text-[10px] px-1.5 py-0 border"
                                style={{
                                  background: section.color + "22",
                                  color: section.color,
                                  borderColor: section.color + "44",
                                }}
                              >
                                {meta.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
                        </div>
                        <StatusDot ok={connected} loading={loading} />
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-semibold",
                          connected ? "text-green-400" : "text-red-400/70",
                        )}>
                          {connected ? "● Connected" : "○ Not configured"}
                        </span>
                        <a
                          href={meta.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Docs
                          <ExternalLink className="size-2.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* API endpoints reference */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <GitBranch className="size-4 text-muted-foreground" />
          Live API Endpoints
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
          {[
            ["GET",  "/api/integrations",          "Integration status dashboard"],
            ["GET",  "/api/ai/providers",           "List all AI providers + models"],
            ["POST", "/api/ai/chat",                "Unified chat (any provider)"],
            ["POST", "/api/ai/compare",             "Compare same prompt across providers"],
            ["GET",  "/api/search/web?q=",          "Brave web search"],
            ["GET",  "/api/search/news?q=",         "Brave news search"],
            ["POST", "/api/search/perplexity",      "Perplexity AI search + citations"],
            ["POST", "/api/search/rapidapi",        "RapidAPI proxy"],
            ["POST", "/api/payments/paypal/order",  "Create PayPal order"],
            ["GET",  "/api/payments/coinbase/rates","Crypto exchange rates"],
            ["GET",  "/api/data/legal/cases",       "CourtListener case search"],
            ["GET",  "/api/data/gov/datasets",      "Data.gov datasets"],
            ["GET",  "/api/data/github/repos",      "GitHub repos"],
            ["GET",  "/api/data/maps/geocode",      "Google Maps geocoding"],
            ["GET",  "/api/credit/disputefox/clients","DisputeFox clients"],
            ["POST", "/api/credit/disputefox/disputes","File dispute"],
            ["POST", "/api/credit/analyze",         "AI credit report analysis"],
            ["POST", "/api/mfsn/enroll",            "MyFreeScoreNow enrollment"],
          ].map(([method, path, desc]) => (
            <div key={path} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0 group">
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 w-10 text-center",
                method === "GET" ? "bg-blue-950 text-blue-400" :
                method === "POST" ? "bg-green-950 text-green-400" :
                "bg-yellow-950 text-yellow-400",
              )}>
                {method}
              </span>
              <span className="text-primary/80 flex-1 truncate">{path}</span>
              <span className="text-muted-foreground hidden group-hover:block">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
