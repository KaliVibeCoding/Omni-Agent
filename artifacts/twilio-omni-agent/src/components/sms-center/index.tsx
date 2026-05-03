import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MessageSquare, Send, RefreshCw, BarChart2, Inbox, ArrowUp,
  ArrowDown, AlertCircle, TrendingUp, DollarSign, CheckCircle2,
  Package, Download, Link, Copy, Check,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const BASE = "/api/twilio";

interface SmsMessage {
  sid: string;
  body: string;
  from: string;
  to: string;
  status: string;
  direction: string;
  dateSent: string | null;
  price: string | null;
  priceUnit: string | null;
  numSegments: number;
  errorCode: string | null;
}

interface D1SmsLog {
  sid: string; from_number: string; to_number: string;
  body: string; status: string; direction: string;
  num_segments: number; price: string; created_at: string;
}

interface SmsAnalytics {
  days: number;
  daily: Array<{ day: string; total: number; delivered: number; day_cost: number }>;
  statuses: Array<{ status: string; count: number }>;
  summary: { total_messages: number; delivered: number; total_cost: number };
  directions: Array<{ direction: string; count: number }>;
}

type SmsTab = "compose" | "inbox" | "logs" | "analytics";

const STATUS_COLORS: Record<string, string> = {
  delivered: "#22c55e", sent: "#3b82f6", queued: "#a855f7",
  failed: "#ef4444", undelivered: "#f97316", received: "#10b981",
};

function fmtDay(day: string) {
  return new Date(day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-border rounded-md px-2.5 py-2 text-[10px] font-mono shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill ?? p.color }}>{p.name}: <span className="text-foreground">{p.value}</span></p>
      ))}
    </div>
  );
};

function WebhookBanner() {
  const [copied, setCopied] = useState(false);
  const domain = window.location.hostname;
  const url = `https://${domain}/api/twilio/sms/status-callback`;
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className="mb-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Link className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide font-mono">SMS Webhook URL</span>
      </div>
      <div className="flex items-center gap-1.5">
        <code className="flex-1 text-[9px] font-mono text-foreground/80 bg-[#151518] border border-border rounded px-2 py-1 truncate">{url}</code>
        <button onClick={copy}
          className={cn("flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-mono transition-colors shrink-0",
            copied ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent")}>
          {copied ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
        </button>
      </div>
      <p className="text-[9px] text-muted-foreground/60 mt-1 leading-relaxed">
        Twilio Console → Phone Numbers → your number → Messaging → Status Callback URL
      </p>
    </div>
  );
}

export function SmsCenter() {
  const [activeTab, setActiveTab] = useState<SmsTab>("compose");
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [d1Logs, setD1Logs] = useState<D1SmsLog[]>([]);
  const [analytics, setAnalytics] = useState<SmsAnalytics | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [loading, setLoading] = useState(false);

  // Compose state
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("+18333827093");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Phone numbers for from dropdown
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(["+18333827093", "+18667524618"]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/sms/messages?limit=50`);
      if (resp.ok) setMessages(await resp.json());
    } finally { setLoading(false); }
  }, []);

  const fetchD1Logs = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/sms/logs`);
      if (resp.ok) setD1Logs(await resp.json());
    } finally { setLoading(false); }
  }, []);

  const fetchAnalytics = useCallback(async (days = analyticsDays) => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/sms/analytics?days=${days}`);
      if (resp.ok) setAnalytics(await resp.json());
    } finally { setLoading(false); }
  }, [analyticsDays]);

  useEffect(() => {
    if (activeTab === "inbox") fetchMessages();
    else if (activeTab === "logs") fetchD1Logs();
    else if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab]);

  const handleSend = async () => {
    if (!to || !body) return;
    setSending(true); setSendResult(null);
    try {
      const resp = await fetch(`${BASE}/send-sms`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, from, body }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setSendResult({ type: "success", msg: `Sent! SID: ${data.sid}` });
        setBody(""); setTo("");
      } else {
        setSendResult({ type: "error", msg: data.error ?? data.message ?? "Failed to send" });
      }
    } catch (e: any) {
      setSendResult({ type: "error", msg: e.message });
    } finally { setSending(false); }
  };

  const charCount = body.length;
  const segments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 shrink-0">
        {(["compose", "inbox", "logs", "analytics"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-2.5 py-1 rounded-md font-mono capitalize transition-colors text-[10px] flex items-center gap-1",
              activeTab === tab ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
            {tab === "compose" && <Send className="w-3 h-3" />}
            {tab === "inbox" && <Inbox className="w-3 h-3" />}
            {tab === "logs" && <Package className="w-3 h-3" />}
            {tab === "analytics" && <BarChart2 className="w-3 h-3" />}
            {tab}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          {activeTab !== "compose" && (
            <button onClick={() => activeTab === "inbox" ? fetchMessages() : activeTab === "logs" ? fetchD1Logs() : fetchAnalytics()}
              disabled={loading} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            </button>
          )}
          {(activeTab === "inbox" || activeTab === "logs") && (
            <a href={`${BASE}/sms/export`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[9px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Download className="w-3 h-3" />CSV
            </a>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0 space-y-2">

        {/* COMPOSE */}
        {activeTab === "compose" && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">To</label>
                <Input value={to} onChange={e => setTo(e.target.value)}
                  placeholder="+15550001111" className="h-7 text-xs bg-[#151518] border-border font-mono" />
              </div>
              <div>
                <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">From</label>
                <select value={from} onChange={e => setFrom(e.target.value)}
                  className="w-full h-7 text-xs bg-[#151518] border border-input rounded-md px-2 font-mono text-foreground">
                  <option value="+18333827093">+1 (833) 382-7093</option>
                  <option value="+18667524618">+1 (866) 752-4618</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)}
                placeholder="Type your SMS message here…"
                rows={4}
                className="w-full text-xs bg-[#151518] border border-input rounded-md px-3 py-2 font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
              <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono mt-0.5">
                <span>{charCount} chars</span>
                <span>{segments} segment{segments !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {sendResult && (
              <div className={cn("text-[10px] font-mono px-3 py-1.5 rounded border",
                sendResult.type === "success" ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-red-400 bg-red-500/10 border-red-500/30")}>
                {sendResult.msg}
              </div>
            )}
            <Button size="sm" onClick={handleSend}
              disabled={sending || !to || !body}
              className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-mono gap-1.5">
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : "Send SMS"}
            </Button>
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground font-mono mb-2">Quick Templates</p>
              <div className="space-y-1">
                {[
                  "Hi! Thanks for reaching out to RJ Business Solutions. How can we help you today?",
                  "Your appointment has been confirmed. Reply STOP to unsubscribe.",
                  "We received your message and will get back to you within 1 business day.",
                  "Your verification code is [CODE]. Do not share this with anyone.",
                ].map((tmpl, i) => (
                  <button key={i} onClick={() => setBody(tmpl)}
                    className="w-full text-left text-[9px] font-mono text-muted-foreground hover:text-foreground bg-[#151518] border border-border hover:border-blue-500/30 rounded px-2 py-1.5 transition-colors">
                    {tmpl.slice(0, 60)}…
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INBOX */}
        {activeTab === "inbox" && (
          messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-[11px]">No messages found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map(m => (
                <div key={m.sid} className="bg-[#151518] border border-border rounded-md p-2">
                  <div className="flex items-start gap-2">
                    <div className={cn("shrink-0 mt-0.5", m.direction === "inbound" ? "text-green-400" : "text-blue-400")}>
                      {m.direction === "inbound" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-foreground">{m.from} → {m.to}</span>
                        <span className={cn("text-[9px] px-1 py-0.5 rounded border font-mono shrink-0",
                          m.status === "delivered" ? "text-green-400 border-green-500/30 bg-green-500/5" :
                          m.status === "failed" ? "text-red-400 border-red-500/30 bg-red-500/5" :
                          "text-muted-foreground border-border bg-muted/10")}>{m.status}</span>
                      </div>
                      <p className="text-[10px] text-foreground/70 break-words leading-relaxed">{m.body}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-muted-foreground/50 font-mono">
                          {m.dateSent ? new Date(m.dateSent).toLocaleString() : "–"}
                        </span>
                        {m.price && <span className="text-[9px] text-muted-foreground/50 font-mono">{m.price} {m.priceUnit}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* D1 LOGS */}
        {activeTab === "logs" && (
          <>
            <WebhookBanner />
            {d1Logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <AlertCircle className="w-5 h-5 mb-2 opacity-30" />
                <p className="text-[11px]">No D1 SMS logs yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Configure the webhook above to auto-log messages</p>
              </div>
            ) : (
              <div className="space-y-1">
                {d1Logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-[#151518] border border-border rounded-md font-mono text-[10px]">
                    <span className={cn("w-2 h-2 rounded-full shrink-0",
                      log.status === "delivered" ? "bg-green-400" : log.status === "failed" ? "bg-red-400" : "bg-muted-foreground/40")} />
                    <span className="text-muted-foreground shrink-0">{log.sid?.slice(0, 10)}…</span>
                    <span className="text-foreground truncate">{log.from_number} → {log.to_number}</span>
                    <span className={cn("px-1 py-0.5 rounded text-[9px] border shrink-0",
                      STATUS_COLORS[log.status] ? `text-[${STATUS_COLORS[log.status]}]` : "text-muted-foreground border-border")}>{log.status}</span>
                    <span className="ml-auto text-muted-foreground/60 shrink-0">{log.num_segments}seg</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-mono text-muted-foreground">Last</span>
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => { setAnalyticsDays(d); fetchAnalytics(d); }}
                  className={cn("px-2 py-0.5 rounded border text-[10px] font-mono transition-colors",
                    analyticsDays === d ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent")}>
                  {d}d
                </button>
              ))}
            </div>

            {!analytics ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                <span className="text-[11px]">Loading…</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Total", value: analytics.summary.total_messages ?? 0, color: "text-blue-400" },
                    { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Delivered", value: analytics.summary.delivered ?? 0, color: "text-green-400" },
                    { icon: <DollarSign className="w-3.5 h-3.5" />, label: "Cost", value: `$${(analytics.summary.total_cost ?? 0).toFixed(4)}`, color: "text-yellow-400" },
                  ].map(({ icon, label, value, color }) => (
                    <div key={label} className="bg-[#151518] border border-border rounded-lg p-2 flex flex-col gap-0.5">
                      <div className={cn("flex items-center gap-1", color)}>{icon}</div>
                      <div className="text-[13px] font-bold font-mono text-foreground leading-tight">{value}</div>
                      <div className="text-[9px] text-muted-foreground/70 font-mono">{label}</div>
                    </div>
                  ))}
                </div>

                {analytics.daily.length > 0 && (
                  <div className="bg-[#151518] border border-border rounded-lg p-2.5">
                    <p className="text-[10px] font-mono text-muted-foreground mb-2">Daily Message Volume</p>
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart data={analytics.daily.map(d => ({ ...d, day: fmtDay(d.day) }))} barGap={2}>
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                        <YAxis hide allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="delivered" name="Delivered" fill="#22c55e" maxBarSize={20} radius={[2,2,0,0]} />
                        <Bar dataKey="total" name="Total" fill="#3b82f6" maxBarSize={20} radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {analytics.statuses.length > 0 && (
                  <div className="bg-[#151518] border border-border rounded-lg p-2.5">
                    <p className="text-[10px] font-mono text-muted-foreground mb-1.5">Status Breakdown</p>
                    <div className="space-y-1">
                      {analytics.statuses.map((s, i) => {
                        const total = analytics.statuses.reduce((a, x) => a + x.count, 0);
                        const pct = total ? Math.round((s.count / total) * 100) : 0;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-[9px] font-mono mb-0.5">
                              <span style={{ color: STATUS_COLORS[s.status] ?? "#6b7280" }}>{s.status}</span>
                              <span className="text-muted-foreground">{s.count} ({pct}%)</span>
                            </div>
                            <div className="h-1 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: STATUS_COLORS[s.status] ?? "#6b7280" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {analytics.daily.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                    <BarChart2 className="w-5 h-5 mb-2 opacity-30" />
                    <p className="text-[11px]">No SMS data for this period</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
