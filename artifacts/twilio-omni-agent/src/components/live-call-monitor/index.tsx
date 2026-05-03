import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Phone, PhoneOff, RefreshCw, Mic, ArrowRightLeft,
  Clock, ArrowDown, ArrowUp, AlertCircle, Radio,
  History, ChevronDown
} from "lucide-react";

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

type ActiveTab = "live" | "recent" | "logs";
type Dialog = { type: "whisper" | "transfer"; call: ActiveCall } | null;

export function LiveCallMonitor() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("live");
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [d1Logs, setD1Logs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notification, setNotification] = useState("");
  const [hangingUp, setHangingUp] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const refresh = useCallback(() => {
    if (activeTab === "live") fetchActive();
    else if (activeTab === "recent") fetchRecent();
    else fetchD1Logs();
  }, [activeTab, fetchActive, fetchRecent, fetchD1Logs]);

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

      {/* Dialog overlay */}
      {dialog && (
        dialog.type === "whisper"
          ? <WhisperDialog call={dialog.call} onClose={() => setDialog(null)} onSent={() => { setDialog(null); showNotif("Whisper sent!"); }} />
          : <TransferDialog call={dialog.call} onClose={() => setDialog(null)} onSent={() => { setDialog(null); showNotif("Call transferred!"); fetchActive(); }} />
      )}

      {/* Tabs + controls */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 shrink-0">
        {(["live", "recent", "logs"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-2.5 py-1 rounded-md font-mono capitalize transition-colors text-[10px]",
              activeTab === tab ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
            {tab === "live" && <><span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", activeCalls.length > 0 ? "bg-green-400 animate-pulse" : "bg-muted-foreground/40")} />Live ({activeCalls.length})</>}
            {tab === "recent" && `Recent`}
            {tab === "logs" && `D1 Logs`}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {activeTab === "live" && (
            <button onClick={() => setAutoRefresh(a => !a)}
              className={cn("text-[10px] font-mono px-2 py-1 rounded border transition-colors",
                autoRefresh ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-border text-muted-foreground")}>
              {autoRefresh ? "Auto" : "Manual"}
            </button>
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
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/50">
                    <button onClick={() => setDialog({ type: "whisper", call })}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-primary/30 bg-primary/5 text-primary text-[10px] font-mono hover:bg-primary/10 transition-colors">
                      <Mic className="w-3 h-3" /> Whisper
                    </button>
                    <button onClick={() => setDialog({ type: "transfer", call })}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-[10px] font-mono hover:bg-yellow-500/10 transition-colors">
                      <ArrowRightLeft className="w-3 h-3" /> Transfer
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

        {/* D1 LOGS tab */}
        {activeTab === "logs" && (
          d1Logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-[11px]">No D1 logs yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Logs are written when calls are completed via webhook</p>
            </div>
          ) : (
            <div className="space-y-1">
              {d1Logs.map((log, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-[#151518] border border-border rounded-md font-mono text-[10px]">
                  <span className="text-muted-foreground">{log.sid?.slice(0, 10)}…</span>
                  <span className="text-foreground">{log.from_number} → {log.to_number}</span>
                  <span className={cn("px-1 py-0.5 rounded text-[9px] border", statusColor(log.status))}>{log.status}</span>
                  <span className="ml-auto text-muted-foreground/60">{log.duration}s</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
