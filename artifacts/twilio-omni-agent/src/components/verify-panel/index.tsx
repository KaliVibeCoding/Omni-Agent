import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, RefreshCw, Plus, Send, CheckCircle2, XCircle,
  AlertCircle, X, Phone, MessageSquare, Mail,
} from "lucide-react";

const BASE = "/api/twilio";

interface VerifyService {
  sid: string;
  friendlyName: string;
  codeLength: number;
  lookupEnabled: boolean;
  psd2Enabled: boolean;
  dateCreated: string;
}

type Channel = "sms" | "call" | "email";
type Step = "idle" | "sent" | "checked";

const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
  sms: <MessageSquare className="w-3 h-3" />,
  call: <Phone className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
};

export function VerifyPanel() {
  const [services, setServices] = useState<VerifyService[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSid, setSelectedSid] = useState<string>("");
  const [to, setTo] = useState("");
  const [channel, setChannel] = useState<Channel>("sms");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [sendResult, setSendResult] = useState<{ status: string } | null>(null);
  const [checkResult, setCheckResult] = useState<{ status: string; valid: boolean } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/verify/services`);
      if (r.ok) {
        const data = await r.json();
        setServices(data);
        if (data.length > 0 && !selectedSid) setSelectedSid(data[0].sid);
      }
    } finally { setLoading(false); }
  }, [selectedSid]);

  useEffect(() => { fetchServices(); }, []);

  const sendCode = async () => {
    if (!selectedSid || !to.trim()) return;
    setActionLoading(true); setError(null);
    try {
      const r = await fetch(`${BASE}/verify/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceSid: selectedSid, to: to.trim(), channel }),
      });
      const d = await r.json();
      if (r.ok) { setSendResult(d); setStep("sent"); }
      else setError(d.error ?? "Failed to send verification");
    } catch (e: any) { setError(e.message); }
    finally { setActionLoading(false); }
  };

  const checkCode = async () => {
    if (!selectedSid || !to.trim() || !code.trim()) return;
    setActionLoading(true); setError(null);
    try {
      const r = await fetch(`${BASE}/verify/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceSid: selectedSid, to: to.trim(), code: code.trim() }),
      });
      const d = await r.json();
      if (r.ok) { setCheckResult(d); setStep("checked"); }
      else setError(d.error ?? "Failed to check code");
    } catch (e: any) { setError(e.message); }
    finally { setActionLoading(false); }
  };

  const reset = () => {
    setStep("idle"); setCode(""); setSendResult(null); setCheckResult(null); setError(null);
  };

  const createService = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`${BASE}/verify/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendlyName: newName }),
      });
      if (r.ok) { setNewName(""); setShowCreate(false); fetchServices(); }
    } finally { setCreating(false); }
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Service selector */}
      <div className="px-3 pt-2 pb-2 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <select value={selectedSid} onChange={e => setSelectedSid(e.target.value)}
            className="flex-1 h-7 text-[10px] bg-[#151518] border border-input rounded-md px-2 font-mono text-foreground">
            {services.length === 0 && <option value="">No services found</option>}
            {services.map(s => <option key={s.sid} value={s.sid}>{s.friendlyName} ({s.codeLength}-digit)</option>)}
          </select>
          <button onClick={fetchServices} disabled={loading}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          </button>
          <button onClick={() => setShowCreate(c => !c)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border border-violet-500/30 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10 transition-colors">
            <Plus className="w-3 h-3" />New
          </button>
        </div>

        {showCreate && (
          <div className="flex gap-2 items-center">
            <Input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Service name" className="h-6 text-[10px] font-mono flex-1" />
            <Button size="sm" onClick={createService} disabled={creating || !newName.trim()}
              className="h-6 px-2 text-[10px] bg-violet-600 hover:bg-violet-700 text-white">
              {creating ? "…" : "Create"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}
              className="h-6 px-2 text-[10px] border-border">
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Service info */}
        {services.find(s => s.sid === selectedSid) && (() => {
          const svc = services.find(s => s.sid === selectedSid)!;
          return (
            <div className="flex gap-3 p-2 bg-[#151518] border border-violet-500/10 rounded-md">
              <div className="text-center">
                <div className="text-xs font-mono font-bold text-violet-400">{svc.codeLength}</div>
                <div className="text-[8px] font-mono text-muted-foreground">digits</div>
              </div>
              <div className="text-center">
                <div className={cn("text-[9px] font-mono font-bold", svc.lookupEnabled ? "text-green-400" : "text-muted-foreground")}>
                  {svc.lookupEnabled ? "ON" : "OFF"}
                </div>
                <div className="text-[8px] font-mono text-muted-foreground">lookup</div>
              </div>
              <div className="text-center">
                <div className={cn("text-[9px] font-mono font-bold", svc.psd2Enabled ? "text-green-400" : "text-muted-foreground")}>
                  {svc.psd2Enabled ? "ON" : "OFF"}
                </div>
                <div className="text-[8px] font-mono text-muted-foreground">PSD2</div>
              </div>
              <div className="ml-auto text-[9px] font-mono text-muted-foreground/50 self-center">{svc.sid.slice(0, 14)}…</div>
            </div>
          );
        })()}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0 space-y-3">

        {/* Step 1: Send */}
        <div className={cn("rounded-lg border p-3 space-y-2.5 transition-colors",
          step === "idle" ? "border-violet-500/30 bg-violet-500/5" : "border-border bg-[#151518]")}>
          <div className="flex items-center gap-2">
            <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-mono font-bold shrink-0",
              step !== "idle" ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-violet-500/40 bg-violet-500/10 text-violet-400")}>
              {step !== "idle" ? <CheckCircle2 className="w-3 h-3" /> : "1"}
            </div>
            <span className="text-[11px] font-semibold font-mono">Send Verification Code</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Phone / Email</label>
              <Input value={to} onChange={e => setTo(e.target.value)}
                placeholder="+15551234567 or user@email.com"
                className="h-7 text-[10px] font-mono" disabled={step !== "idle"} />
            </div>

            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Channel</label>
              <div className="flex gap-1.5">
                {(["sms", "call", "email"] as Channel[]).map(ch => (
                  <button key={ch} onClick={() => setChannel(ch)} disabled={step !== "idle"}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded border text-[10px] font-mono transition-colors capitalize",
                      channel === ch
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                        : "border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
                    )}>
                    {CHANNEL_ICONS[ch]}{ch}
                  </button>
                ))}
              </div>
            </div>

            {step === "idle" && (
              <Button onClick={sendCode} disabled={actionLoading || !to.trim() || !selectedSid}
                className="w-full h-7 text-[10px] font-mono bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
                <Send className="w-3 h-3" />{actionLoading ? "Sending…" : "Send Code"}
              </Button>
            )}

            {sendResult && step !== "idle" && (
              <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/20 rounded p-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                <span className="text-[10px] font-mono text-green-400">Code sent via {channel.toUpperCase()} — status: {sendResult.status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Verify */}
        {step !== "idle" && (
          <div className={cn("rounded-lg border p-3 space-y-2.5 transition-colors",
            step === "sent" ? "border-violet-500/30 bg-violet-500/5" : "border-border bg-[#151518]")}>
            <div className="flex items-center gap-2">
              <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-mono font-bold shrink-0",
                step === "checked" ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-violet-500/40 bg-violet-500/10 text-violet-400")}>
                {step === "checked" ? <CheckCircle2 className="w-3 h-3" /> : "2"}
              </div>
              <span className="text-[11px] font-semibold font-mono">Enter & Check Code</span>
            </div>

            <Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="123456" className="h-8 text-base font-mono text-center tracking-widest"
              disabled={step === "checked"} />

            {step === "sent" && (
              <Button onClick={checkCode} disabled={actionLoading || code.length < 4}
                className="w-full h-7 text-[10px] font-mono bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
                <ShieldCheck className="w-3 h-3" />{actionLoading ? "Checking…" : "Verify Code"}
              </Button>
            )}

            {checkResult && (
              <div className={cn("flex items-center gap-2 rounded p-2 border",
                checkResult.valid
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400")}>
                {checkResult.valid ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                <div>
                  <div className="text-[11px] font-semibold font-mono">
                    {checkResult.valid ? "Verified!" : "Invalid code"}
                  </div>
                  <div className="text-[9px] font-mono opacity-70">Status: {checkResult.status}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded text-red-400 text-[10px] font-mono">
            <AlertCircle className="w-3 h-3 shrink-0" />{error}
          </div>
        )}

        {(step !== "idle") && (
          <button onClick={reset}
            className="w-full py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors">
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
