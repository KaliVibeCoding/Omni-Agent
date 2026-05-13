import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Users, CreditCard, Search, MessageSquare, Phone, Loader2, RefreshCw, Trash2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useApi, useMe } from "@/hooks/use-api";

const PLAN_COLORS: Record<string, string> = {
  starter: "hsl(210 80% 55%)",
  growth: "hsl(142 71% 45%)",
  business: "hsl(348 83% 47%)",
  enterprise: "hsl(262 80% 60%)",
  free: "hsl(0 0% 50%)",
};

interface Tenant {
  id: string;
  accountSid: string;
  name: string;
  plan: string;
  hasApiKey: boolean;
  createdAt: string;
  updatedAt: string;
}
interface TenantsResponse {
  tenants: Tenant[];
  totals: { tenants: number; sms: number; calls: number };
}
interface MetricsResponse {
  planCounts: Record<string, number>;
  totals: { sms: number; calls: number; appointments: number };
}

export default function AdminPanel() {
  const api = useApi();
  const qc = useQueryClient();
  const { email, isMasterAdmin, loading: meLoading } = useMe();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [tab, setTab] = useState<"tenants" | "metrics" | "system">("tenants");

  const tenantsQ = useQuery<TenantsResponse>({
    queryKey: ["admin-tenants"],
    queryFn: () => api<TenantsResponse>("/api/admin/tenants"),
    enabled: isMasterAdmin && !meLoading,
  });
  const metricsQ = useQuery<MetricsResponse>({
    queryKey: ["admin-metrics"],
    queryFn: () => api<MetricsResponse>("/api/admin/metrics"),
    enabled: isMasterAdmin && !meLoading,
  });
  const integrationsQ = useQuery<any>({
    queryKey: ["integrations-status"],
    queryFn: () => api<any>("/api/integrations"),
    enabled: isMasterAdmin && !meLoading,
  });

  const planMutation = useMutation({
    mutationFn: (vars: { userId: string; plan: string }) =>
      api(`/api/admin/tenants/${vars.userId}/plan`, { method: "PATCH", body: { plan: vars.plan } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tenants"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api(`/api/admin/tenants/${userId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tenants"] }),
  });

  const tenants = tenantsQ.data?.tenants ?? [];
  const filtered = tenants.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.accountSid.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || t.plan === planFilter;
    return matchSearch && matchPlan;
  });

  // ── Revenue math (rough — uses local plan rate table) ────────────────────
  const PLAN_RATES: Record<string, number> = { starter: 79, growth: 199, business: 499, enterprise: 0 };
  const totalMRR = tenants.reduce((s, t) => s + (PLAN_RATES[t.plan] ?? 0), 0);
  const totalTenants = tenantsQ.data?.totals.tenants ?? tenants.length;
  const totalSMS = tenantsQ.data?.totals.sms ?? 0;
  const totalCalls = tenantsQ.data?.totals.calls ?? 0;

  if (meLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="size-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <Badge className="bg-red-950 text-red-400 border-red-900 text-xs">Master Admin</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Platform-wide tenant management · Signed in as <span className="font-mono text-foreground">{email ?? "—"}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ["admin-tenants"] });
            qc.invalidateQueries({ queryKey: ["admin-metrics"] });
            qc.invalidateQueries({ queryKey: ["integrations-status"] });
          }}
        >
          {tenantsQ.isFetching ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <RefreshCw className="size-3.5 mr-1.5" />}
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Monthly Revenue", value: `$${totalMRR.toLocaleString()}`, sub: "from connected plans", icon: CreditCard, color: "hsl(142 71% 45%)" },
          { label: "Total Tenants", value: totalTenants, sub: `${tenants.length} loaded`, icon: Users, color: "hsl(210 80% 55%)" },
          { label: "Total SMS", value: totalSMS.toLocaleString(), sub: "across all tenants", icon: MessageSquare, color: "hsl(348 83% 47%)" },
          { label: "Total Calls", value: totalCalls.toLocaleString(), sub: "lifetime", icon: Phone, color: "hsl(262 80% 60%)" },
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
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-1 min-w-[200px]">
              <Search className="size-3.5 text-muted-foreground flex-shrink-0" />
              <input
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
                placeholder="Search by name, user ID, or account SID..."
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
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {tenantsQ.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : tenantsQ.isError ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-400">Failed to load tenants: {(tenantsQ.error as any)?.message ?? "Unknown error"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Tenant", "Account SID", "Plan", "API Key", "Joined", "Actions"].map((h) => (
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
                          <div className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">{tenant.id}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {tenant.accountSid.slice(0, 8)}…{tenant.accountSid.slice(-6)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <select
                              value={tenant.plan}
                              onChange={(e) => planMutation.mutate({ userId: tenant.id, plan: e.target.value })}
                              className="appearance-none bg-card border border-border rounded-md pl-2 pr-7 py-1 text-xs font-semibold capitalize focus:outline-none cursor-pointer"
                              style={{ color: PLAN_COLORS[tenant.plan] || "#888" }}
                            >
                              {["starter", "growth", "business", "enterprise"].map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                            <ChevronDown className="size-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {tenant.hasApiKey ? (
                            <Badge className="bg-green-950 text-green-400 border-green-900 text-xs">Yes</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-border text-xs">No</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Disconnect ${tenant.name}? Their Twilio credentials will be wiped.`)) {
                                deleteMutation.mutate(tenant.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-950"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      {tenants.length === 0 ? "No tenants have connected yet." : "No tenants match your filters."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {totalTenants} tenants · Live data from D1
          </p>
        </div>
      )}

      {tab === "metrics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                {["starter", "growth", "business", "enterprise"].map((plan) => {
                  const count = metricsQ.data?.planCounts?.[plan] ?? 0;
                  const total = Object.values(metricsQ.data?.planCounts ?? {}).reduce((s, n) => s + n, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={plan}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-muted-foreground font-medium">{plan}</span>
                        <span className="text-foreground font-semibold">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PLAN_COLORS[plan] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Revenue by Plan</h3>
              <div className="space-y-3">
                {[
                  { plan: "starter", rate: 79 },
                  { plan: "growth", rate: 199 },
                  { plan: "business", rate: 499 },
                ].map(({ plan, rate }) => {
                  const count = metricsQ.data?.planCounts?.[plan] ?? 0;
                  const rev = count * rate;
                  return (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full" style={{ background: PLAN_COLORS[plan] }} />
                        <span className="text-sm text-muted-foreground capitalize">{plan}</span>
                        <span className="text-xs text-muted-foreground">({count})</span>
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

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Platform Usage (Lifetime)</h3>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Total SMS Sent", value: (metricsQ.data?.totals.sms ?? 0).toLocaleString(), icon: MessageSquare },
                { label: "Total Calls", value: (metricsQ.data?.totals.calls ?? 0).toLocaleString(), icon: Phone },
                { label: "Appointments", value: (metricsQ.data?.totals.appointments ?? 0).toLocaleString(), icon: Users },
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
              { key: "twilio", label: "Twilio", section: "communications" },
              { key: "clerk", label: "Clerk Auth", section: "auth" },
              { key: "stripe", label: "Stripe", section: "payments" },
              { key: "anthropic", label: "Anthropic AI", section: "ai" },
              { key: "openrouter", label: "OpenRouter", section: "ai" },
              { key: "resend", label: "Resend Email", section: "email" },
            ].map((svc) => {
              const ok = integrationsQ.data?.[svc.section]?.[svc.key];
              return (
                <div key={svc.label} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", ok ? "bg-green-400" : "bg-red-400")} />
                      <span className="font-medium text-foreground text-sm">{svc.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {ok ? "Configured · secrets present" : "Missing API key in Worker secrets"}
                    </div>
                  </div>
                  <Badge className={cn("text-xs capitalize", ok
                    ? "bg-green-950 text-green-400 border-green-900"
                    : "bg-red-950 text-red-400 border-red-900")}>
                    {ok ? "Healthy" : "Not Configured"}
                  </Badge>
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Platform Configuration</h3>
            {[
              { key: "Worker URL", value: window.location.origin },
              { key: "Auth Provider", value: "Clerk" },
              { key: "Database", value: "Cloudflare D1 (SQLite)" },
              { key: "Encryption", value: "AES-256-GCM" },
              { key: "Multi-tenancy", value: "Enabled (per-user credentials)" },
              { key: "Master admin email", value: email ?? "—" },
            ].map(({ key, value }) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{key}</span>
                <span className="text-sm font-medium text-foreground font-mono truncate max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
