import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, DollarSign, TrendingUp, BarChart2, AlertCircle } from "lucide-react";

const BASE = "/api/twilio";

interface UsageRecord {
  category: string;
  description: string;
  count: string;
  countUnit: string;
  usage: string;
  usageUnit: string;
  price: string;
  priceUnit: string;
}

type Period = "today" | "thismonth" | "alltime";

const CATEGORIES_PRIORITY = [
  "calls", "calls-inbound", "calls-outbound", "calls-client",
  "sms", "sms-inbound", "sms-outbound",
  "mms", "mms-inbound", "mms-outbound",
  "recordings", "transcriptions",
  "phonenumbers", "phonenumbers-local", "phonenumbers-tollfree",
  "tts", "lookups",
];

const CATEGORY_COLORS: Record<string, string> = {
  calls: "bg-blue-500",
  "calls-inbound": "bg-blue-400",
  "calls-outbound": "bg-blue-600",
  sms: "bg-green-500",
  "sms-inbound": "bg-green-400",
  "sms-outbound": "bg-green-600",
  mms: "bg-teal-500",
  recordings: "bg-purple-500",
  transcriptions: "bg-violet-500",
  phonenumbers: "bg-orange-500",
  "phonenumbers-local": "bg-orange-400",
  "phonenumbers-tollfree": "bg-orange-600",
  tts: "bg-yellow-500",
  lookups: "bg-pink-500",
};

function colorFor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-slate-500";
}

function fmt$(p: string | number | null) {
  const n = parseFloat(String(p ?? 0));
  if (isNaN(n) || n === 0) return "$0.00";
  return `$${n.toFixed(4)}`;
}

function fmtCount(count: string, unit: string) {
  const n = parseInt(count ?? "0", 10);
  if (!n) return "—";
  return `${n.toLocaleString()} ${unit ?? ""}`.trim();
}

export function UsagePanel() {
  const [period, setPeriod] = useState<Period>("thismonth");
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (p: Period) => {
    setLoading(true); setError(null);
    try {
      const url = p === "alltime" ? `${BASE}/usage` : `${BASE}/usage/${p}`;
      const r = await fetch(url);
      if (r.ok) {
        const data: UsageRecord[] = await r.json();
        // Filter out zero records and sort by price desc
        const filtered = data
          .filter(rec => parseFloat(rec.price ?? "0") !== 0 || parseInt(rec.count ?? "0", 10) > 0)
          .sort((a, b) => parseFloat(b.price ?? "0") - parseFloat(a.price ?? "0"));
        setRecords(filtered);
      } else { setError("Failed to load usage"); }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(period); }, [period]);

  const totalCost = records.reduce((s, r) => s + parseFloat(r.price ?? "0"), 0);
  const topRecords = records.slice(0, 20);
  const maxPrice = Math.max(...topRecords.map(r => parseFloat(r.price ?? "0")), 0.0001);

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Period tabs + refresh */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 shrink-0">
        {([["today", "Today"], ["thismonth", "This Month"], ["alltime", "All Time"]] as [Period, string][]).map(([p, label]) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn(
              "px-2.5 py-1 rounded-md font-mono text-[10px] transition-colors",
              period === p ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}>
            {label}
          </button>
        ))}
        <button onClick={() => fetch_(period)} disabled={loading}
          className="ml-auto p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        </button>
      </div>

      {/* Total summary card */}
      <div className="mx-3 mb-2 p-2.5 bg-[#151518] border border-emerald-500/20 rounded-lg shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Total Cost</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">${totalCost.toFixed(4)}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono text-muted-foreground">Resources</div>
            <div className="text-sm font-mono text-foreground mt-0.5">{records.length}</div>
          </div>
          <DollarSign className="w-8 h-8 text-emerald-500/20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-mono mb-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </div>
        )}

        {records.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <BarChart2 className="w-7 h-7 mb-2 opacity-20" />
            <p className="text-[11px]">No usage data for this period</p>
          </div>
        )}

        {topRecords.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider px-0.5 mb-2">
              Top {topRecords.length} resources by cost
            </div>
            {topRecords.map(rec => {
              const price = parseFloat(rec.price ?? "0");
              const barPct = maxPrice > 0 ? (price / maxPrice) * 100 : 0;
              return (
                <div key={rec.category} className="bg-[#151518] border border-border rounded-lg p-2 hover:border-border/80 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", colorFor(rec.category))} />
                      <div>
                        <div className="font-mono text-[10px] text-foreground font-medium">{rec.description || rec.category}</div>
                        <div className="font-mono text-[9px] text-muted-foreground/60">{rec.category}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="font-mono text-[11px] font-bold text-emerald-400">{fmt$(price)}</div>
                      <div className="font-mono text-[9px] text-muted-foreground">{fmtCount(rec.count, rec.countUnit)}</div>
                    </div>
                  </div>
                  {/* Mini bar */}
                  <div className="h-0.5 bg-border rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", colorFor(rec.category))}
                      style={{ width: `${barPct}%`, opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
