import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Phone, PhoneOff, RefreshCw, Mic, ArrowRightLeft,
  Clock, ArrowDown, ArrowUp, AlertCircle, Radio,
  History, ChevronDown, Link, Copy, Check, BarChart2,
  TrendingUp, DollarSign, PhoneCall, CheckCircle2,
  Play, Pause, Volume2, Users2, MicOff, Download,
  PhoneCall as Dial, FileText,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface ActiveCall {
  sid: string;
  from: string;
  to: string;
  status: string;
  direction: string;
  duration: string;
  startTime: string | null;
  callerName: string | null;
}

interface RecentCall {
  sid: string;
  from: string;
  to: string;
  status: string;
  direction: string;
  duration: string;
  startTime: string | null;
  endTime: string | null;
  price: string | null;
  priceUnit: string | null;
}

const BASE = "/api/twilio";

function elapsed(startTime: string | null, durationSec: string): string {
  if (!startTime) return durationSec ? `${durationSec}s` : "–";
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const secs = Math.floor((now - start) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function statusColor(status: string) {
  switch (status) {
    case "in-progress": return "text-green-400 bg-green-500/10 border-green-500/30";
    case "ringing": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "queued": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    case "completed": return "text-muted-foreground bg-muted/20 border-border";
    case "busy": return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "failed": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "no-answer": return "text-red-400/70 bg-red-500/5 border-red-500/20";
    default: return "text-muted-foreground bg-muted/20 border-border";
  }
}

function StatusDot({ status }: { status: string }) {
  const isLive = status === "in-progress";
  const isRinging = status === "ringing";
  return (
    <span className={cn("inline-block w-2 h-2 rounded-full shrink-0",
      isLive ? "bg-green-400 animate-pulse" :
      isRinging ? "bg-yellow-400 animate-pulse" :
      status === "completed" ? "bg-muted-foreground/40" :
      status === "failed" || status === "busy" ? "bg-red-400" :
      "bg-muted-foreground/40"
    )} />
  );
}

function WebhookSetup() {
  const [copied, setCopied] = useState(false);
  const domain = window.location.hostname;
  const url = `https://${domain}/api/twilio/calls/status-callback`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Link className="w-3 h-3 text-rose-400" />
        <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide font-mono">Webhook URL</span>
        <span className="text-[9px] text-muted-foreground ml-1">— paste into Twilio console</span>
      </div>
      <div className="flex items-center gap-1.5">
        <code className="flex-1 text-[9px] font-mono text-foreground/80 bg-[#151518] border border-border rounded px-2 py-1 truncate">
          {url}
        </code>
        <button onClick={copy}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-mono transition-colors shrink-0",
            copied
              ? "border-green-500/40 bg-green-500/10 text-green-400"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          )}>
          {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <p className="text-[9px] text-muted-foreground/60 mt-1.5 leading-relaxed">
        In Twilio Console → Phone Numbers → your number → Voice Configuration → set
        <span className="text-muted-foreground"> "Status Callback URL"</span> to this URL.
        Every completed call is automatically upserted into Cloudflare D1.
      </p>
    </div>
  );
}

interface WhisperDialogProps {
  call: ActiveCall;
  onClose: () => void;
  onSent: () => void;
}
function WhisperDialog({ call, onClose, onSent }: WhisperDialogProps) {
  const [message, setMessage] = useState("Please wrap up this call, you have a new priority customer waiting.");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    setSending(true); setError("");
    try {
      const resp = await fetch(`${BASE}/calls/${call.sid}/whisper`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error ?? "Failed");
      onSent();
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-md">
      <div className="bg-[#1a1a1e] border border-border rounded-lg p-4 w-72 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Mic className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Whisper to Agent</span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">
          Interrupts call {call.sid.slice(0, 12)}… with a TTS message only the agent hears.
        </p>
        <Input value={message} onChange={e => setMessage(e.target.value)}
          className="h-8 text-xs bg-[#151518] border-border mb-2"
          placeholder="Your whisper message..." />
        {error && <p className="text-[10px] text-red-400 mb-2">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSend} disabled={sending || !message.trim()}
            className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90">
            {sending ? "Sending…" : "Send Whisper"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}
            className="h-7 text-xs border-border">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

interface TransferDialogProps {
  call: ActiveCall;
  onClose: () => void;
  onSent: () => void;
}
function TransferDialog({ call, onClose, onSent }: TransferDialogProps) {
  const [queueName, setQueueName] = useState("support");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleTransfer = async () => {
    setSending(true); setError("");
    try {
      const resp = await fetch(`${BASE}/calls/${call.sid}/transfer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueName }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error ?? "Failed");
      onSent();
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-md">
      <div className="bg-[#1a1a1e] border border-border rounded-lg p-4 w-72 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold">Transfer to Queue</span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">
          Enqueues call {call.sid.slice(0, 12)}… into the named Twilio queue.
        </p>
        <Input value={queueName} onChange={e => setQueueName(e.target.value)}
          className="h-8 text-xs bg-[#151518] border-border mb-2"
          placeholder="Queue name..." />
        {error && <p className="text-[10px] text-red-400 mb-2">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleTransfer} disabled={sending || !queueName.trim()}
            className="flex-1 h-7 text-xs bg-yellow-500 hover:bg-yellow-500/90 text-black">
            {sending ? "Transferring…" : "Transfer"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}
            className="h-7 text-xs border-border">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

interface AnalyticsData {
  days: number;
  daily: Array<{ day: string; total_calls: number; completed: number; failed: number; avg_duration: number; day_cost: number }>;
  statuses: Array<{ status: string; count: number }>;
  summary: { total_calls: number; completed: number; avg_duration: number; max_duration: number; total_cost: number };
  directions: Array<{ direction: string; count: number }>;
  topCallers: Array<{ from_number: string; count: number; total_duration: number }>;
}

interface Recording {
  sid: string; callSid: string; duration: string;
  status: string; source: string; dateCreated: string;
  streamUrl: string; downloadUrl: string;
}

interface Conference {
  sid: string; friendlyName: string; status: string; dateCreated: string;
  participants: Array<{ callSid: string; muted: boolean; hold: boolean; coaching: boolean }>;
}

type ActiveTab = "live" | "recent" | "logs" | "analytics" | "recordings" | "conferences";
type Dialog = { type: "whisper" | "transfer"; call: ActiveCall } | null;

// ── Outbound Call Dialog ──────────────────────────────────────────────────────
function OutboundDialog({ onClose }: { onClose: () => void }) {
  const [to, setTo] = useState(""); const [from, setFrom] = useState("+18333827093");
  const [calling, setCalling] = useState(false); const [result, setResult] = useState("");
  const dial = async () => {
    if (!to) return; setCalling(true); setResult("");
    try {
      const resp = await fetch(`${BASE}/calls/outbound`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, from }),
      });
      const d = await resp.json();
      if (resp.ok) setResult(`✓ Called ${to} — SID: ${d.sid}`);
      else setResult(`✗ ${d.error ?? "Failed"}`);
    } catch (e: any) { setResult(`✗ ${e.message}`); }
    finally { setCalling(false); }
  };
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-md">
      <div className="bg-[#1a1a1e] border border-border rounded-lg p-4 w-72 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Dial className="w-4 h-4 text-green-400" /><span className="text-sm font-semibold">Outbound Call</span></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><PhoneOff className="w-3.5 h-3.5" /></button>
        </div>
        <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">To Number</label>
        <Input value={to} onChange={e => setTo(e.target.value)} placeholder="+15550001111"
          className="h-7 text-xs bg-[#151518] border-border mb-2 font-mono" />
        <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">From</label>
        <select value={from} onChange={e => setFrom(e.target.value)}
          className="w-full h-7 text-xs bg-[#151518] border border-input rounded-md px-2 font-mono text-foreground mb-2">
          <option value="+18333827093">+1 (833) 382-7093</option>
          <option value="+18667524618">+1 (866) 752-4618</option>
        </select>
        {result && <p className={cn("text-[10px] font-mono mb-2", result.startsWith("✓") ? "text-green-400" : "text-red-400")}>{result}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={dial} disabled={calling || !to}
            className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white font-mono gap-1">
            <Phone className="w-3 h-3" />{calling ? "Dialing…" : "Dial"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs border-border">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Note Dialog ───────────────────────────────────────────────────────────────
function NoteDialog({ sid, onClose, onSaved }: { sid: string; onClose: () => void; onSaved: () => void }) {
  const [note, setNote] = useState(""); const [saving, setSaving] = useState(false); const [err, setErr] = useState("");
  const save = async () => {
    if (!note.trim()) return; setSaving(true);
    try {
      const resp = await fetch(`${BASE}/calls/${sid}/note`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) });
      if (resp.ok) { onSaved(); } else setErr("Failed to save note");
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  };
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-md">
      <div className="bg-[#1a1a1e] border border-border rounded-lg p-4 w-72 shadow-2xl">
        <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Add Note</span></div>
        <p className="text-[10px] text-muted-foreground mb-2 font-mono">{sid.slice(0,14)}…</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Call notes…" rows={3}
          className="w-full text-xs bg-[#151518] border border-input rounded-md px-2 py-1.5 font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring mb-2" />
        {err && <p className="text-[10px] text-red-400 mb-2">{err}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !note.trim()} className="flex-1 h-7 text-xs bg-primary font-mono">{saving ? "Saving…" : "Save Note"}</Button>
          <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs border-border">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  failed: "#ef4444",
  busy: "#f97316",
  "no-answer": "#f87171",
  queued: "#3b82f6",
  "in-progress": "#10b981",
  ringing: "#eab308",
  unknown: "#6b7280",
};

const PIE_COLORS = ["#22c55e", "#ef4444", "#f97316", "#3b82f6", "#eab308", "#a855f7", "#6b7280"];

function fmtDur(secs: number | null | undefined): string {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDay(day: string): string {
  const d = new Date(day + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-border rounded-md px-2.5 py-2 text-[10px] font-mono shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>{p.name}: <span className="text-foreground">{p.value}</span></p>
      ))}
    </div>
  );
};

export function LiveCallMonitor() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("live");
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [d1Logs, setD1Logs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [playingSid, setPlayingSid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [showOutbound, setShowOutbound] = useState(false);
  const [noteForSid, setNoteForSid] = useState<string | null>(null);
  const [notification, setNotification] = useState("");
  const [hangingUp, setHangingUp] = useState<string | null>(null);
  const [endingConf, setEndingConf] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchActive = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/calls/active`);
      if (resp.ok) { setActiveCalls(await resp.json()); setLastRefresh(new Date()); }
    } finally { setLoading(false); }
  }, []);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/calls/recent`);
      if (resp.ok) { setRecentCalls(await resp.json()); setLastRefresh(new Date()); }
    } finally { setLoading(false); }
  }, []);

  const fetchD1Logs = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/calls/logs`);
      if (resp.ok) { setD1Logs(await resp.json()); }
    } finally { setLoading(false); }
  }, []);

  const fetchAnalytics = useCallback(async (days = analyticsDays) => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/calls/analytics?days=${days}`);
      if (resp.ok) { setAnalytics(await resp.json()); setLastRefresh(new Date()); }
    } finally { setLoading(false); }
  }, [analyticsDays]);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/recordings?limit=25`);
      if (resp.ok) { setRecordings(await resp.json()); setLastRefresh(new Date()); }
    } finally { setLoading(false); }
  }, []);

  const fetchConferences = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/conferences/active`);
      if (resp.ok) { setConferences(await resp.json()); setLastRefresh(new Date()); }
    } finally { setLoading(false); }
  }, []);

  const refresh = useCallback(() => {
    if (activeTab === "live") fetchActive();
    else if (activeTab === "recent") fetchRecent();
    else if (activeTab === "logs") fetchD1Logs();
    else if (activeTab === "analytics") fetchAnalytics();
    else if (activeTab === "recordings") fetchRecordings();
    else if (activeTab === "conferences") fetchConferences();
  }, [activeTab, fetchActive, fetchRecent, fetchD1Logs, fetchAnalytics, fetchRecordings, fetchConferences]);

  const togglePlayback = (rec: Recording) => {
    if (playingSid === rec.sid) {
      audioRef.current?.pause();
      setPlayingSid(null);
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      const audio = new Audio(rec.streamUrl);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingSid(null);
      setPlayingSid(rec.sid);
    }
  };

  const endConference = async (sid: string) => {
    setEndingConf(sid);
    try {
      await fetch(`${BASE}/conferences/${sid}/end`, { method: "POST" });
      showNotif("Conference ended");
      fetchConferences();
    } finally { setEndingConf(null); }
  };

  // Auto-refresh live tab every 5s
  useEffect(() => {
    refresh();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh && activeTab === "live") {
      intervalRef.current = setInterval(fetchActive, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeTab, autoRefresh, refresh, fetchActive]);

  // Tick for elapsed timers
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleHangup = async (call: ActiveCall) => {
    setHangingUp(call.sid);
    try {
      const resp = await fetch(`${BASE}/calls/${call.sid}/hangup`, { method: "POST" });
      if (resp.ok) { showNotif(`Call ${call.sid.slice(0, 8)}… ended`); fetchActive(); }
    } finally { setHangingUp(null); }
  };

  return (
    <div className="flex flex-col h-full text-xs relative">
      {/* Notification */}
      {notification && (
        <div className="absolute top-2 right-3 z-40 bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-mono px-3 py-1.5 rounded-md shadow-lg">
          {notification}
        </div>
      )}

      {/* Dialog overlays */}
      {dialog && (
        dialog.type === "whisper"
          ? <WhisperDialog call={dialog.call} onClose={() => setDialog(null)} onSent={() => { setDialog(null); showNotif("Whisper sent!"); }} />
          : <TransferDialog call={dialog.call} onClose={() => setDialog(null)} onSent={() => { setDialog(null); showNotif("Call transferred!"); fetchActive(); }} />
      )}
      {showOutbound && <OutboundDialog onClose={() => setShowOutbound(false)} />}
      {noteForSid && <NoteDialog sid={noteForSid} onClose={() => setNoteForSid(null)} onSaved={() => { setNoteForSid(null); showNotif("Note saved!"); fetchD1Logs(); }} />}

      {/* Tabs + controls */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 shrink-0 flex-wrap">
        {(["live", "recent", "recordings", "conferences", "logs", "analytics"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-2 py-1 rounded-md font-mono transition-colors text-[10px] flex items-center gap-1",
              activeTab === tab ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
            {tab === "live" && <><span className={cn("w-1.5 h-1.5 rounded-full shrink-0", activeCalls.length > 0 ? "bg-green-400 animate-pulse" : "bg-muted-foreground/40")} />Live ({activeCalls.length})</>}
            {tab === "recent" && "Recent"}
            {tab === "recordings" && <><Play className="w-2.5 h-2.5" />Recordings</>}
            {tab === "conferences" && <><Users2 className="w-2.5 h-2.5" />Conf</>}
            {tab === "logs" && "D1 Logs"}
            {tab === "analytics" && <><BarChart2 className="w-2.5 h-2.5" />Stats</>}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          {activeTab === "live" && (
            <>
              <button onClick={() => setShowOutbound(true)}
                className="flex items-center gap-1 px-2 py-1 rounded border border-green-500/30 bg-green-500/5 text-green-400 text-[9px] font-mono hover:bg-green-500/10 transition-colors">
                <Phone className="w-3 h-3" />Dial
              </button>
              <button onClick={() => setAutoRefresh(a => !a)}
                className={cn("text-[9px] font-mono px-1.5 py-1 rounded border transition-colors",
                  autoRefresh ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-border text-muted-foreground")}>
                {autoRefresh ? "Auto" : "Manual"}
              </button>
            </>
          )}
          <button onClick={refresh} disabled={loading}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          </button>
        </div>
      </div>
      {lastRefresh && (
        <div className="px-3 text-[9px] text-muted-foreground/50 font-mono shrink-0">
          Last updated {lastRefresh.toLocaleTimeString()}
          {autoRefresh && activeTab === "live" && " · refreshes every 5s"}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {/* LIVE tab */}
        {activeTab === "live" && (
          activeCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Radio className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-[11px]">No active calls right now</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Auto-refreshing every 5 seconds</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeCalls.map(call => (
                <div key={call.sid} className="bg-[#151518] border border-border rounded-lg p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot status={call.status} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold uppercase", statusColor(call.status))}>
                            {call.status}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {call.direction === "inbound" ? <><ArrowDown className="w-2.5 h-2.5 inline text-green-400" /> inbound</> : <><ArrowUp className="w-2.5 h-2.5 inline text-blue-400" /> outbound</>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px]">
                          <span className="text-muted-foreground">From:</span>
                          <span className="text-foreground font-medium">{call.from}</span>
                          {call.callerName && <span className="text-muted-foreground">({call.callerName})</span>}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-muted-foreground">To:</span>
                          <span className="text-foreground">{call.to}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1 text-green-400 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {elapsed(call.startTime, call.duration)}
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono">{call.sid.slice(0, 12)}…</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/50 flex-wrap">
                    <button onClick={() => setDialog({ type: "whisper", call })}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-primary/30 bg-primary/5 text-primary text-[10px] font-mono hover:bg-primary/10 transition-colors">
                      <Mic className="w-3 h-3" /> Whisper
                    </button>
                    <button onClick={() => setDialog({ type: "transfer", call })}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-[10px] font-mono hover:bg-yellow-500/10 transition-colors">
                      <ArrowRightLeft className="w-3 h-3" /> Transfer
                    </button>
                    <button onClick={() => setNoteForSid(call.sid)}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-purple-500/30 bg-purple-500/5 text-purple-400 text-[10px] font-mono hover:bg-purple-500/10 transition-colors">
                      <FileText className="w-3 h-3" /> Note
                    </button>
                    <button onClick={() => handleHangup(call)} disabled={hangingUp === call.sid}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-red-500/30 bg-red-500/5 text-red-400 text-[10px] font-mono hover:bg-red-500/10 transition-colors ml-auto">
                      <PhoneOff className="w-3 h-3" /> {hangingUp === call.sid ? "Hanging up…" : "Hang Up"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* RECENT tab */}
        {activeTab === "recent" && (
          recentCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <History className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-[11px]">No recent calls</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentCalls.map(call => (
                <div key={call.sid} className="flex items-center gap-2 px-2 py-1.5 bg-[#151518] border border-border rounded-md">
                  <StatusDot status={call.status} />
                  <div className={cn("text-[9px] px-1 py-0.5 rounded border font-mono shrink-0", statusColor(call.status))}>
                    {call.status}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] text-foreground truncate">
                      {call.direction === "inbound" ? "↙" : "↗"} {call.from} → {call.to}
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {call.duration ? `${call.duration}s` : "–"}
                    {call.price && <span className="ml-1 text-[9px]">{call.price}{call.priceUnit}</span>}
                  </div>
                  <div className="text-[9px] text-muted-foreground/50 font-mono shrink-0">
                    {call.startTime ? new Date(call.startTime).toLocaleTimeString() : "–"}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ANALYTICS tab */}
        {activeTab === "analytics" && (
          <div className="space-y-3">
            {/* Day-range picker */}
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-mono text-muted-foreground">Last</span>
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => { setAnalyticsDays(d); fetchAnalytics(d); }}
                  className={cn("px-2 py-0.5 rounded border text-[10px] font-mono transition-colors",
                    analyticsDays === d
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent")}>
                  {d}d
                </button>
              ))}
            </div>

            {!analytics ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                <span className="text-[11px]">Loading analytics…</span>
              </div>
            ) : (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { icon: <PhoneCall className="w-3.5 h-3.5" />, label: "Total Calls", value: analytics.summary.total_calls ?? 0, color: "text-primary" },
                    { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Completed", value: analytics.summary.completed ?? 0, color: "text-green-400" },
                    { icon: <Clock className="w-3.5 h-3.5" />, label: "Avg Duration", value: fmtDur(analytics.summary.avg_duration), color: "text-blue-400" },
                    { icon: <DollarSign className="w-3.5 h-3.5" />, label: "Total Cost", value: `$${(analytics.summary.total_cost ?? 0).toFixed(4)}`, color: "text-yellow-400" },
                  ].map(({ icon, label, value, color }) => (
                    <div key={label} className="bg-[#151518] border border-border rounded-lg p-2 flex flex-col gap-0.5">
                      <div className={cn("flex items-center gap-1", color)}>{icon}</div>
                      <div className="text-[13px] font-bold font-mono text-foreground leading-tight">{value}</div>
                      <div className="text-[9px] text-muted-foreground/70 font-mono">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Daily call volume bar chart */}
                {analytics.daily.length > 0 && (
                  <div className="bg-[#151518] border border-border rounded-lg p-2.5">
                    <p className="text-[10px] font-mono text-muted-foreground mb-2">Daily Call Volume</p>
                    <ResponsiveContainer width="100%" height={90}>
                      <BarChart data={analytics.daily.map(d => ({ ...d, day: fmtDay(d.day) }))} barGap={2}>
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                        <YAxis hide allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="completed" name="Completed" stackId="a" fill="#22c55e" radius={[0,0,0,0]} maxBarSize={24} />
                        <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" radius={[2,2,0,0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  {/* Status breakdown pie */}
                  {analytics.statuses.length > 0 && (
                    <div className="bg-[#151518] border border-border rounded-lg p-2.5">
                      <p className="text-[10px] font-mono text-muted-foreground mb-1.5">By Status</p>
                      <ResponsiveContainer width="100%" height={100}>
                        <PieChart>
                          <Pie data={analytics.statuses} dataKey="count" nameKey="status"
                            cx="50%" cy="50%" innerRadius={22} outerRadius={40} paddingAngle={2}>
                            {analytics.statuses.map((entry, i) => (
                              <Cell key={i} fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend iconSize={6} iconType="circle"
                            formatter={(val) => <span style={{ fontSize: 9, fontFamily: "monospace", color: "#9ca3af" }}>{val}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Direction split + top callers */}
                  <div className="flex flex-col gap-1.5">
                    {/* Direction */}
                    {analytics.directions.length > 0 && (
                      <div className="bg-[#151518] border border-border rounded-lg p-2">
                        <p className="text-[9px] font-mono text-muted-foreground mb-1">Direction</p>
                        {analytics.directions.map((d, i) => {
                          const total = analytics.directions.reduce((s, x) => s + x.count, 0);
                          const pct = total ? Math.round((d.count / total) * 100) : 0;
                          return (
                            <div key={i} className="mb-1">
                              <div className="flex justify-between text-[9px] font-mono mb-0.5">
                                <span className={d.direction === "inbound" ? "text-green-400" : "text-blue-400"}>
                                  {d.direction === "inbound" ? "↙" : "↗"} {d.direction ?? "unknown"}
                                </span>
                                <span className="text-muted-foreground">{d.count} ({pct}%)</span>
                              </div>
                              <div className="h-1 rounded-full bg-border overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: d.direction === "inbound" ? "#22c55e" : "#3b82f6" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Top callers */}
                    {analytics.topCallers.length > 0 && (
                      <div className="bg-[#151518] border border-border rounded-lg p-2 flex-1">
                        <p className="text-[9px] font-mono text-muted-foreground mb-1">Top Callers</p>
                        {analytics.topCallers.map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-[9px] font-mono py-0.5 border-b border-border/30 last:border-0">
                            <span className="text-foreground/70 truncate">{c.from_number}</span>
                            <span className="text-muted-foreground shrink-0 ml-1">{c.count}×</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {analytics.daily.length === 0 && analytics.statuses.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <BarChart2 className="w-6 h-6 mb-2 opacity-30" />
                    <p className="text-[11px]">No call data for this period</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Configure the D1 webhook so calls are logged automatically</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* D1 LOGS tab */}
        {activeTab === "logs" && (
          <>
            <WebhookSetup />
            {d1Logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <AlertCircle className="w-5 h-5 mb-2 opacity-30" />
                <p className="text-[11px]">No D1 logs yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Configure the webhook above — logs appear after first call</p>
              </div>
            ) : (
              <div className="space-y-1">
                {d1Logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-[#151518] border border-border rounded-md font-mono text-[10px]">
                    <StatusDot status={log.status} />
                    <span className="text-muted-foreground shrink-0">{log.sid?.slice(0, 10)}…</span>
                    <span className="text-foreground truncate">{log.from_number} → {log.to_number}</span>
                    <span className={cn("px-1 py-0.5 rounded text-[9px] border shrink-0", statusColor(log.status))}>{log.status}</span>
                    <span className="ml-auto text-muted-foreground/60 shrink-0">{log.duration}s</span>
                    <button onClick={() => setNoteForSid(log.sid)}
                      className="p-0.5 text-muted-foreground/40 hover:text-purple-400 transition-colors">
                      <FileText className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {d1Logs.length > 0 && (
              <a href={`${BASE}/calls/export`} target="_blank" rel="noreferrer"
                className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                <Download className="w-3 h-3" />Export CSV
              </a>
            )}
          </>
        )}

        {/* RECORDINGS tab */}
        {activeTab === "recordings" && (
          recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Play className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-[11px]">No recordings found</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Recordings appear here after calls with recording enabled</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recordings.map(rec => (
                <div key={rec.sid} className="bg-[#151518] border border-border rounded-lg p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-foreground">{rec.sid.slice(0, 16)}…</div>
                      <div className="font-mono text-[9px] text-muted-foreground">
                        Call: {rec.callSid?.slice(0, 14)}… · {rec.duration}s · {rec.source ?? "unknown"}
                      </div>
                      <div className="font-mono text-[9px] text-muted-foreground/60">
                        {rec.dateCreated ? new Date(rec.dateCreated).toLocaleString() : "–"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => togglePlayback(rec)}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded border text-[10px] font-mono transition-colors",
                          playingSid === rec.sid
                            ? "border-green-500/40 bg-green-500/10 text-green-400"
                            : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                        )}>
                        {playingSid === rec.sid ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {playingSid === rec.sid ? "Pause" : "Play"}
                      </button>
                      <a href={rec.downloadUrl} target="_blank" rel="noreferrer"
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  {playingSid === rec.sid && (
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/50">
                      <Volume2 className="w-3 h-3 text-green-400 animate-pulse" />
                      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-green-400 rounded-full animate-pulse" />
                      </div>
                      <span className="text-[9px] font-mono text-green-400">Playing…</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* CONFERENCES tab */}
        {activeTab === "conferences" && (
          conferences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users2 className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-[11px]">No active conferences</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Active Twilio conferences appear here in real time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conferences.map(conf => (
                <div key={conf.sid} className="bg-[#151518] border border-border rounded-lg p-2.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-mono text-[11px] font-semibold text-foreground">{conf.friendlyName || "Conference"}</div>
                      <div className="font-mono text-[9px] text-muted-foreground">{conf.sid.slice(0, 18)}…</div>
                      <div className="font-mono text-[9px] text-muted-foreground/60">
                        {conf.dateCreated ? new Date(conf.dateCreated).toLocaleString() : "–"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-green-400 border border-green-500/30 bg-green-500/5 px-1.5 py-0.5 rounded">
                        {conf.status}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                        {conf.participants.length} participant{conf.participants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {conf.participants.length > 0 && (
                    <div className="space-y-0.5 mb-2">
                      {conf.participants.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-[9px] font-mono px-1.5 py-1 bg-[#0f0f12] rounded border border-border/50">
                          <span className="text-muted-foreground truncate">{p.callSid.slice(0, 16)}…</span>
                          <div className="ml-auto flex items-center gap-1.5">
                            {p.muted && <span className="text-yellow-400 flex items-center gap-0.5"><MicOff className="w-2.5 h-2.5" />muted</span>}
                            {p.hold && <span className="text-blue-400">hold</span>}
                            {p.coaching && <span className="text-purple-400">coaching</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => endConference(conf.sid)} disabled={endingConf === conf.sid}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-red-500/30 bg-red-500/5 text-red-400 text-[10px] font-mono hover:bg-red-500/10 transition-colors">
                    <PhoneOff className="w-3 h-3" />{endingConf === conf.sid ? "Ending…" : "End Conference"}
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
