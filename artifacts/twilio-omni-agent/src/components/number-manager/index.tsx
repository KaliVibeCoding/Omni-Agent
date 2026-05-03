import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Phone, RefreshCw, Edit3, Save, X, Check, CheckCircle2,
  MessageSquare, Mic, Printer, ChevronDown, ChevronUp, Link,
  Globe, AlertCircle, Hash, Calendar, Info,
} from "lucide-react";

const BASE = "/api/twilio";

interface PhoneNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  dateCreated: string | null;
  capabilities: { voice: boolean; sms: boolean; mms: boolean; fax: boolean };
  voiceUrl: string | null;
  voiceMethod: string | null;
  voiceFallbackUrl: string | null;
  smsUrl: string | null;
  smsMethod: string | null;
  statusCallback: string | null;
  addressRequirements: string | null;
  beta: boolean;
  origin: string | null;
}

type EditForm = {
  friendlyName: string;
  voiceUrl: string;
  voiceMethod: string;
  voiceFallbackUrl: string;
  smsUrl: string;
  smsMethod: string;
  statusCallback: string;
};

function CapBadge({ active, icon, label }: { active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span className={cn(
      "flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border",
      active
        ? "text-green-400 border-green-500/30 bg-green-500/5"
        : "text-muted-foreground/40 border-border/40 bg-transparent line-through"
    )}>
      {icon}{label}
    </span>
  );
}

function WebhookField({
  label, value, onChange, placeholder, method, onMethodChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; method?: string; onMethodChange?: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Link className="w-2.5 h-2.5" />{label}
        </label>
        {method !== undefined && onMethodChange && (
          <select value={method} onChange={e => onMethodChange(e.target.value)}
            className="text-[9px] font-mono bg-[#0f0f12] border border-border rounded px-1 py-0.5 text-muted-foreground">
            <option value="POST">POST</option>
            <option value="GET">GET</option>
          </select>
        )}
      </div>
      <Input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "https://…"}
        className="h-6 text-[10px] bg-[#151518] border-border font-mono"
      />
    </div>
  );
}

export function NumberManager() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSid, setExpandedSid] = useState<string | null>(null);
  const [editingSid, setEditingSid] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm>({
    friendlyName: "", voiceUrl: "", voiceMethod: "POST",
    voiceFallbackUrl: "", smsUrl: "", smsMethod: "POST", statusCallback: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/phone-numbers`);
      if (resp.ok) setNumbers(await resp.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNumbers(); }, []);

  const openEdit = (n: PhoneNumber) => {
    setEditingSid(n.sid);
    setExpandedSid(n.sid);
    setForm({
      friendlyName: n.friendlyName ?? "",
      voiceUrl: n.voiceUrl ?? "",
      voiceMethod: n.voiceMethod ?? "POST",
      voiceFallbackUrl: n.voiceFallbackUrl ?? "",
      smsUrl: n.smsUrl ?? "",
      smsMethod: n.smsMethod ?? "POST",
      statusCallback: n.statusCallback ?? "",
    });
    setError("");
  };

  const cancelEdit = () => { setEditingSid(null); setError(""); };

  const handleSave = async (sid: string) => {
    setSaving(true); setError("");
    try {
      const resp = await fetch(`${BASE}/phone-numbers/${sid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) {
        const d = await resp.json();
        setError(d.error ?? d.message ?? "Save failed");
        return;
      }
      setSaved(sid);
      setTimeout(() => setSaved(null), 2500);
      setEditingSid(null);
      fetchNumbers();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const toggleExpand = (sid: string) => {
    if (editingSid === sid) return;
    setExpandedSid(p => p === sid ? null : sid);
  };

  const fmtDate = (d: string | null) => {
    if (!d) return "–";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const autoFill = (n: PhoneNumber) => {
    const base = window.location.hostname;
    const voiceUrl = `https://${base}/api/twilio/voice-webhook`;
    const smsUrl = `https://${base}/api/twilio/sms/status-callback`;
    const statusCallback = `https://${base}/api/twilio/calls/status-callback`;
    setForm(f => ({ ...f, voiceUrl, smsUrl, statusCallback }));
  };

  return (
    <div className="flex flex-col h-full text-xs">
      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 shrink-0">
        <div className="flex-1">
          <p className="text-[9px] font-mono text-muted-foreground/60">
            {numbers.length} number{numbers.length !== 1 ? "s" : ""} on account
          </p>
        </div>
        <button onClick={fetchNumbers} disabled={loading}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0 space-y-2">
        {numbers.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Phone className="w-7 h-7 mb-2 opacity-20" />
            <p className="text-[11px]">No phone numbers found</p>
          </div>
        )}

        {numbers.map(n => (
          <div key={n.sid}
            className={cn(
              "rounded-lg border transition-colors",
              editingSid === n.sid ? "border-orange-500/30 bg-[#1a150f]" : "border-border bg-[#151518]"
            )}>
            {/* Header row */}
            <div className="flex items-center gap-2.5 p-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-bold text-foreground">{n.phoneNumber}</span>
                  {saved === n.sid && (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-green-400">
                      <Check className="w-2.5 h-2.5" />Saved!
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">{n.friendlyName}</div>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <CapBadge active={n.capabilities.voice} icon={<Mic className="w-2.5 h-2.5" />} label="Voice" />
                  <CapBadge active={n.capabilities.sms} icon={<MessageSquare className="w-2.5 h-2.5" />} label="SMS" />
                  <CapBadge active={n.capabilities.mms} icon={<MessageSquare className="w-2.5 h-2.5" />} label="MMS" />
                  {n.capabilities.fax && <CapBadge active icon={<Printer className="w-2.5 h-2.5" />} label="Fax" />}
                  {n.beta && (
                    <span className="text-[9px] font-mono text-yellow-400 border border-yellow-500/30 bg-yellow-500/5 px-1.5 py-0.5 rounded">Beta</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {editingSid !== n.sid && (
                  <button onClick={() => openEdit(n)}
                    className="p-1 text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 rounded transition-colors">
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
                <button onClick={() => toggleExpand(n.sid)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                  {expandedSid === n.sid ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Expanded: info + edit form */}
            {expandedSid === n.sid && (
              <div className="border-t border-border/50 px-2.5 pb-2.5 pt-2 space-y-3">
                {/* Read-only info */}
                {editingSid !== n.sid && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
                      <Calendar className="w-2.5 h-2.5" />
                      Provisioned {fmtDate(n.dateCreated)}
                      {n.origin && <span className="ml-2">· Origin: {n.origin}</span>}
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground/60">{n.sid}</div>

                    {/* Current webhook URLs */}
                    <div className="space-y-1 pt-1">
                      {[
                        { label: "Voice URL", value: n.voiceUrl, method: n.voiceMethod },
                        { label: "Voice Fallback", value: n.voiceFallbackUrl, method: null },
                        { label: "SMS URL", value: n.smsUrl, method: n.smsMethod },
                        { label: "Status Callback", value: n.statusCallback, method: null },
                      ].map(({ label, value, method }) => (
                        <div key={label} className="flex items-start gap-1.5">
                          <span className="text-[9px] font-mono text-muted-foreground/60 w-20 shrink-0 pt-0.5">{label}:</span>
                          {value ? (
                            <div className="flex items-center gap-1 min-w-0">
                              <Globe className="w-2.5 h-2.5 text-green-400 shrink-0 mt-0.5" />
                              <span className="text-[9px] font-mono text-green-400/80 truncate">{value}</span>
                              {method && <span className="text-[8px] font-mono text-muted-foreground/40 border border-border/30 px-1 py-0.5 rounded shrink-0">{method}</span>}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0" />
                              <span className="text-[9px] font-mono text-muted-foreground/30">not configured</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button onClick={() => openEdit(n)}
                      className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-orange-400 hover:text-orange-300 transition-colors">
                      <Edit3 className="w-3 h-3" />Configure webhooks
                    </button>
                  </div>
                )}

                {/* Edit form */}
                {editingSid === n.sid && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold font-mono text-orange-400 uppercase tracking-wide">Edit Configuration</span>
                      <button onClick={() => autoFill(n)}
                        className="flex items-center gap-1 text-[9px] font-mono text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded transition-colors">
                        <Zap className="w-2.5 h-2.5" />Auto-fill this app's URLs
                      </button>
                    </div>

                    {/* Friendly name */}
                    <div>
                      <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Hash className="w-2.5 h-2.5" />Friendly Name
                      </label>
                      <Input value={form.friendlyName} onChange={e => setForm(f => ({ ...f, friendlyName: e.target.value }))}
                        className="h-6 text-[10px] bg-[#0f0f12] border-border font-mono" />
                    </div>

                    {/* Voice webhook */}
                    <div className="rounded-md border border-primary/10 bg-primary/5 p-2 space-y-1.5">
                      <p className="text-[9px] font-mono text-primary/80 uppercase font-semibold flex items-center gap-1">
                        <Mic className="w-2.5 h-2.5" />Voice
                      </p>
                      <WebhookField label="Voice URL" value={form.voiceUrl} onChange={v => setForm(f => ({ ...f, voiceUrl: v }))}
                        placeholder="https://your-app.com/voice" method={form.voiceMethod}
                        onMethodChange={v => setForm(f => ({ ...f, voiceMethod: v }))} />
                      <WebhookField label="Fallback URL" value={form.voiceFallbackUrl} onChange={v => setForm(f => ({ ...f, voiceFallbackUrl: v }))}
                        placeholder="https://your-app.com/voice-fallback" />
                    </div>

                    {/* SMS webhook */}
                    <div className="rounded-md border border-blue-500/10 bg-blue-500/5 p-2 space-y-1.5">
                      <p className="text-[9px] font-mono text-blue-400/80 uppercase font-semibold flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" />SMS
                      </p>
                      <WebhookField label="SMS URL" value={form.smsUrl} onChange={v => setForm(f => ({ ...f, smsUrl: v }))}
                        placeholder="https://your-app.com/sms" method={form.smsMethod}
                        onMethodChange={v => setForm(f => ({ ...f, smsMethod: v }))} />
                    </div>

                    {/* Status callback */}
                    <div className="rounded-md border border-yellow-500/10 bg-yellow-500/5 p-2 space-y-1.5">
                      <p className="text-[9px] font-mono text-yellow-400/80 uppercase font-semibold flex items-center gap-1">
                        <Info className="w-2.5 h-2.5" />Status &amp; Events
                      </p>
                      <WebhookField label="Status Callback" value={form.statusCallback} onChange={v => setForm(f => ({ ...f, statusCallback: v }))}
                        placeholder="https://your-app.com/status" />
                    </div>

                    {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => handleSave(n.sid)} disabled={saving}
                        className="flex-1 h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white font-mono gap-1">
                        <Save className="w-3 h-3" />{saving ? "Saving…" : "Save Changes"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}
                        className="h-7 text-xs border-border font-mono">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Zap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
