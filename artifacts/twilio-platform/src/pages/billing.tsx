import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Check, Zap, ArrowRight, CreditCard, ExternalLink, Loader2, Star, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL ?? "/";
const API = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

const PLAN_META: Record<string, { color: string; badge?: string; icon: React.ReactNode }> = {
  Starter: { color: "hsl(210 40% 50%)", icon: <Zap className="size-4" /> },
  Growth: { color: "hsl(142 71% 45%)", badge: "Popular", icon: <Star className="size-4" /> },
  Business: { color: "hsl(348 83% 47%)", badge: "Best Value", icon: <Sparkles className="size-4" /> },
  Enterprise: { color: "hsl(262 80% 60%)", icon: <Shield className="size-4" /> },
};

const PLAN_FEATURES: Record<string, string[]> = {
  Starter: [
    "Up to 1,000 SMS/month",
    "Basic call center",
    "Email campaigns",
    "Phone number management",
    "Number lookup",
    "Voicemails & call logs",
  ],
  Growth: [
    "Up to 10,000 SMS/month",
    "Advanced call center",
    "AI voice agents",
    "Multi-channel campaigns",
    "Telehealth module",
    "Studio Flows",
    "Priority email support",
  ],
  Business: [
    "Unlimited SMS",
    "Multi-agent AGI framework",
    "Full call center suite",
    "Enterprise customization",
    "Custom integrations",
    "HIPAA compliance tools",
    "Dedicated account manager",
  ],
  Enterprise: [
    "Everything in Business",
    "Dedicated infrastructure",
    "SLA guarantees",
    "Custom contracts",
    "24/7 dedicated support",
    "Custom onboarding program",
    "Volume discounts",
  ],
};

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: any;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: any;
  prices: Price[];
}

export default function BillingPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check for success/cancel query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      showToast("Subscription activated! Welcome to your new plan.", "success");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("cancelled")) {
      showToast("Checkout cancelled — no charges made.", "error");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, subRes] = await Promise.all([
          fetch(`${API}/api/stripe/products`),
          fetch(`${API}/api/stripe/subscription`, { credentials: "include" }),
        ]);
        const prodData = await prodRes.json();
        const subData = await subRes.json();

        // Sort products by price
        const sorted = (prodData.data || []).sort((a: Product, b: Product) => {
          const aPrice = a.prices[0]?.unit_amount ?? 0;
          const bPrice = b.prices[0]?.unit_amount ?? 0;
          return aPrice - bPrice;
        });
        setProducts(sorted);
        setSubscription(subData.subscription);
        setCurrentPlan(subData.plan || "free");
      } catch (e) {
        console.error("Failed to load billing data", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCheckout(priceId: string) {
    setCheckoutLoading(priceId);
    try {
      const res = await fetch(`${API}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Failed to start checkout", "error");
      }
    } catch {
      showToast("Network error — please try again", "error");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch(`${API}/api/stripe/portal`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "No billing account found. Subscribe to a plan first.", "error");
      }
    } catch {
      showToast("Network error — please try again", "error");
    } finally {
      setPortalLoading(false);
    }
  }

  const isCurrentPlan = (product: Product) => {
    return currentPlan.toLowerCase() === product.name.toLowerCase() ||
      currentPlan === (product.metadata?.tier || "");
  };

  const formatPrice = (p: Price) => {
    if (!p || p.unit_amount <= 1) return "Custom";
    return `$${(p.unit_amount / 100).toFixed(0)}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl border transition-all",
            toast.type === "success"
              ? "bg-green-950 border-green-800 text-green-300"
              : "bg-red-950 border-red-800 text-red-300",
          )}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your plan and payment method
          </p>
        </div>
        {subscription && (
          <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading}>
            {portalLoading ? (
              <Loader2 className="size-3.5 animate-spin mr-1.5" />
            ) : (
              <CreditCard className="size-3.5 mr-1.5" />
            )}
            Manage Billing
            <ExternalLink className="size-3 ml-1.5 opacity-50" />
          </Button>
        )}
      </div>

      {/* Current plan banner */}
      {subscription && (
        <div className="flex items-center gap-4 p-4 bg-green-950/30 border border-green-900/50 rounded-xl">
          <div className="size-9 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Check className="size-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-300">
              Active subscription — {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Status: {subscription.status} · Renews:{" "}
              {subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={handlePortal} disabled={portalLoading} className="border-green-800 text-green-400 hover:bg-green-900/30">
              {portalLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Manage →"}
            </Button>
          </div>
        </div>
      )}

      {/* Plans grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <PricingFallback onCheckout={() => {}} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const meta = PLAN_META[product.name] || PLAN_META.Starter;
            const price = product.prices[0];
            const priceLabel = price ? formatPrice(price) : "Custom";
            const isEnterprise = priceLabel === "Custom";
            const isCurrent = isCurrentPlan(product);
            const features = PLAN_FEATURES[product.name] || [];
            const isPopular = meta.badge === "Popular";

            return (
              <div
                key={product.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-5 transition-all",
                  isCurrent
                    ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10"
                    : isPopular
                      ? "border-green-800/60 bg-green-950/10"
                      : "border-border bg-card hover:border-border/80",
                )}
              >
                {meta.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: meta.color }}
                    >
                      {meta.badge}
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                      Current
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-4">
                  <div
                    className="size-9 rounded-lg flex items-center justify-center mb-3 text-white"
                    style={{ background: meta.color + "22", color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{product.description}</p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {isEnterprise ? (
                    <div className="text-2xl font-black text-foreground">Contact Us</div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black text-foreground">{priceLabel}</span>
                      <span className="text-muted-foreground text-sm mb-1">/mo</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="size-3.5 mt-0.5 flex-shrink-0" style={{ color: meta.color }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : isEnterprise ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open("mailto:support@rjbusinesssolutions.org?subject=Enterprise%20Plan%20Inquiry", "_blank")}
                  >
                    Contact Sales
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Button>
                ) : price ? (
                  <Button
                    className="w-full font-semibold"
                    style={{ background: meta.color, color: "white" }}
                    onClick={() => handleCheckout(price.id)}
                    disabled={!!checkoutLoading}
                  >
                    {checkoutLoading === price.id ? (
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    ) : null}
                    {subscription ? "Switch Plan" : "Get Started"}
                    {checkoutLoading !== price.id && <ArrowRight className="size-3.5 ml-1.5" />}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Shield className="size-3.5" />
          <span>All plans include HIPAA compliance tools</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="size-3.5" />
          <span>Billed monthly · Cancel anytime</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="size-3.5" />
          <span>Powered by Stripe · Secure checkout</span>
        </div>
      </div>
    </div>
  );
}

// Fallback static pricing if Stripe products not yet seeded
function PricingFallback({ onCheckout }: { onCheckout: (p: string) => void }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="size-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
        <CreditCard className="size-5 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground">Plans loading...</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Products are being synced from Stripe. This only takes a moment.
      </p>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
        Refresh
      </Button>
    </div>
  );
}
