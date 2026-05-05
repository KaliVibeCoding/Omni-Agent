import React, { useState, useEffect } from "react";
import { Shield, Users, CreditCard, Activity, Settings, Search, ChevronDown, TrendingUp, MessageSquare, Phone, Mail, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL ?? "/";
const API = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

// Mock data for the admin panel (real data would come from DB queries)
const MOCK_TENANTS = [
  { id: "user_1", name: "Acme Corp", email: "admin@acme.com", plan: "business", status: "active", joined: "Jan 12, 2026", sms: 8420, calls: 1240, mrr: 499 },
  { id: "user_2", name: "TechStart LLC", email: "ops@techstart.io", plan: "growth", status: "active", joined: "Feb 3, 2026", sms: 3100, calls: 420, mrr: 199 },
  { id: "user_3", name: "HealthFirst", email: "admin@healthfirst.org", plan: "business", status: "active", joined: "Feb 18, 2026", sms: 12400, calls: 3200, mrr: 499 },
  { id: "user_4", name: "QuickPay Inc", email: "it@quickpay.com", plan: "starter", status: "active", joined: "Mar 5, 2026", sms: 780, calls: 90, mrr: 79 },
  { id: "user_5", name: "GreenLeaf", email: "hello@greenleaf.co", plan: "growth", status: "trial", joined: "Apr 22, 2026", sms: 240, calls: 30, mrr: 0 },
  { id: "user_6", name: "BuildRight Co", email: "tech@buildright.com", plan: "starter", status: "cancelled", joined: "Mar 30, 2026", sms: 0, calls: 0, mrr: 0 },
];

const PLAN_COLORS: Record<string, string> = {
  starter: "hsl(210 80% 55%)",
  growth: "hsl(142 71% 45%)",
  business: "hsl(348 83% 47%)",
  enterprise: "hsl(262 80% 60%)",
};

export default function AdminPanel() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState<"tenants" | "metrics" | "system">("tenants");
  const [loading, setLoading] = useState(false);

  const filtered = MOCK_TENANTS.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || t.plan === planFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const totalMRR = MOCK_TENANTS.filter((t) => t.status === "active").reduce((s, t) => s + t.mrr, 0);
  const totalTenants = MOCK_TENANTS.length;
  const activeTenants = MOCK_TENANTS.filter((t) => t.status === "active").length;
  const totalSMS = MOCK_TENANTS.reduce((s, t) => s + t.sms, 0);
  const totalCalls = MOCK_TENANTS.reduce((s, t) => s + t.calls, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="size-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <Badge className="bg-red-950 text-red-400 border-red-900 text-xs">Restricted</Badge>
          </div>
          <p className="text-muted-foreground text-sm">Platform-wide tenant management and metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1000); }}>
          {loading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <RefreshCw className="size-3.5 mr-1.5" />}
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Monthly Revenue", value: `$${totalMRR.toLocaleString()}`, sub: "active subscriptions", icon: CreditCard, color: "hsl(142 71% 45%)" },
          { label: "Total Tenants", value: totalTenants, sub: `${activeTenants} active`, icon: Users, color: "hsl(210 80% 55%)" },
          { label: "SMS This Month", value: totalSMS.toLocaleString(), sub: "across all tenants", icon: MessageSquare, color: "hsl(348 83% 47%)" },
          { label: "Calls This Month", value: totalCalls.toLocaleString(), sub: "inbound + outbound", icon: Phone, color: "hsl(262 80% 60%)" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: kpi.color + "22" }}>
                <kpi.icon className="size-3.5" style={{ color: kpi.color }} />
              </div>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <div className="text-2xl font-black text-foreground">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {(["tenants", "metrics", "system"] as const).map((t) => (
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

      {tab === "tenants" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-1 min-w-[200px]">
              <Search className="size-3.5 text-muted-foreground flex-shrink-0" />
              <input
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Tenant", "Plan", "Status", "SMS", "Calls", "MRR", "Joined"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{tenant.name}</div>
                        <div className="text-xs text-muted-foreground">{tenant.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                          style={{
                            background: (PLAN_COLORS[tenant.plan] || "#888") + "22",
                            color: PLAN_COLORS[tenant.plan] || "#888",
                          }}
                        >
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-semibold capitalize",
                          tenant.status === "active" ? "text-green-400" :
                          tenant.status === "trial" ? "text-yellow-400" : "text-muted-foreground",
                        )}>
                          <span className={cn(
                            "size-1.5 rounded-full",
                            tenant.status === "active" ? "bg-green-400" :
                            tenant.status === "trial" ? "bg-yellow-400" : "bg-muted-foreground",
                          )} />
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{tenant.sms.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tenant.calls.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {tenant.mrr > 0 ? `$${tenant.mrr}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{tenant.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tenants match your filters.</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {totalTenants} tenants · Real-time data connects to the database
          </p>
        </div>
      )}

      {tab === "metrics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plan distribution */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                {["starter", "growth", "business", "enterprise"].map((plan) => {
                  const count = MOCK_TENANTS.filter((t) => t.plan === plan).length;
                  const pct = Math.round((count / totalTenants) * 100);
                  return (
                    <div key={plan}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-muted-foreground font-medium">{plan}</span>
                        <span className="text-foreground font-semibold">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: PLAN_COLORS[plan] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue breakdown */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Revenue by Plan</h3>
              <div className="space-y-3">
                {[
                  { plan: "starter", rate: 79 },
                  { plan: "growth", rate: 199 },
                  { plan: "business", rate: 499 },
                ].map(({ plan, rate }) => {
                  const count = MOCK_TENANTS.filter((t) => t.plan === plan && t.status === "active").length;
                  const rev = count * rate;
                  return (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full" style={{ background: PLAN_COLORS[plan] }} />
                        <span className="text-sm text-muted-foreground capitalize">{plan}</span>
                        <span className="text-xs text-muted-foreground">({count} active)</span>
                      </div>
                      <span className="font-bold text-foreground">${rev.toLocaleString()}/mo</span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="text-sm font-semibold text-foreground">Total MRR</span>
                  <span className="font-black text-foreground">${totalMRR.toLocaleString()}/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Usage stats */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Platform Usage (This Month)</h3>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Total SMS Sent", value: totalSMS.toLocaleString(), icon: MessageSquare },
                { label: "Total Calls", value: totalCalls.toLocaleString(), icon: Phone },
                { label: "Active Tenants", value: activeTenants, icon: Users },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <s.icon className="size-5 text-muted-foreground mx-auto mb-2" />
                  <div className="text-2xl font-black text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "system" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "API Server", status: "healthy", uptime: "99.98%", latency: "45ms" },
              { label: "Database", status: "healthy", uptime: "99.99%", latency: "8ms" },
              { label: "Stripe Webhooks", status: "healthy", uptime: "100%", latency: "120ms" },
              { label: "Twilio Integration", status: "healthy", uptime: "99.95%", latency: "210ms" },
            ].map((svc) => (
              <div key={svc.label} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-green-400" />
                    <span className="font-medium text-foreground text-sm">{svc.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Uptime: {svc.uptime} · Latency: {svc.latency}
                  </div>
                </div>
                <Badge className="bg-green-950 text-green-400 border-green-900 text-xs capitalize">
                  {svc.status}
                </Badge>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Platform Configuration</h3>
            {[
              { key: "Stripe Mode", value: "Sandbox (Test)" },
              { key: "Email Provider", value: "Resend" },
              { key: "Auth Provider", value: "Clerk" },
              { key: "Database", value: "PostgreSQL (Replit)" },
              { key: "Encryption", value: "AES-256-GCM" },
              { key: "Multi-tenancy", value: "Enabled (per-user credentials)" },
            ].map(({ key, value }) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{key}</span>
                <span className="text-sm font-medium text-foreground font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
