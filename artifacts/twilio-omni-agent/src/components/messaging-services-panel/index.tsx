import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MessageSquareDashed, RefreshCw, Edit3, Save, X, CheckCircle2,
  ChevronDown, ChevronUp, Link, Globe, AlertCircle, Phone,
  Zap, ToggleLeft, ToggleRight,
} from "lucide-react";

const BASE = "/api/twilio";

interface MessagingService {
  sid: string;
  friendlyName: string;
  inboundRequestUrl: string;
  inboundMethod: string;
  fallbackUrl: string;
  fallbackMethod: string;
  statusCallback: string;
  useInboundWebhookOnNumber: boolean;
  stickySession: boolean;
  mmsConverter: boolean;
  smartEncoding: boolean;
  validityPeriod: number;
  dateCreated: string;
  dateUpdated: string;
}

interface SenderNumber {
  sid: string;
  phoneNumber: string;
  countryCode: string;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const METHOD_OPTS = ["GET", "POST"];

export function MessagingServicesPanel() {
  const [services, setServices] = useState<MessagingService[]>([]);
  const [senders, setSenders] = useState<Record<string, SenderNumber[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<MessagingService>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [sendersLoading, setSendersLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchServices = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${BASE}/messaging-services`);
      if (r.ok) setServices(await r.json());
      else setError("Failed to load messaging services");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, []);

  const toggleExpand = async (sid: string) => {
    if (expanded === sid) { setExpanded(null); setEditing(null); return; }
    setExpanded(sid);
    if (!senders[sid]) {
      setSendersLoading(sid);
      try {
        const r = await fetch(`${BASE}/messaging-services/${sid}/phone-numbers`);
        if (r.ok) {
          const data = await r.json();
          setSenders(s => ({ ...s, [sid]: data }));
        }
      } finally { setSendersLoading(null); }
    }
  };

  const startEdit = (svc: MessagingService) => {
    setEditing(svc.sid);
    setDraft({
      inboundRequestUrl: svc.inboundRequestUrl ?? "",
      inboundMethod: svc.inboundMethod ?? "POST",
      fallbackUrl: svc.fallbackUrl ?? "",
      fallbackMethod: svc.fallbackMethod ?? "POST",
      statusCallback: svc.statusCallback ?? "",
      useInboundWebhookOnNumber: svc.useInboundWebhookOnNumber,
      stickySession: svc.stickySession,
      mmsConverter: svc.mmsConverter,
      smartEncoding: svc.smartEncoding,
    });
  };

  const save = async (sid: string) => {
    setSaving(sid);
    try {
      const r = await fetch(`${BASE}/messaging-services/${sid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (r.ok) {
        showToast("Saved");
        setEditing(null);
        fetchServices();
      } else {
        const d = await r.json(); showToast(d.error ?? "Save failed");
      }
    } finally { setSaving(null); }
  };

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
      <button onClick={() => onChange(!value)}
        className={cn("flex items-center gap-1 text-[9px] font-mono transition-colors",
          value ? "text-indigo-400" : "text-muted-foreground/50")}>
        {value ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
        {value ? "ON" : "OFF"}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full text-xs relative">
      {toast && (
        <div className="absolute top-2 right-2 z-50 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-[10px] px-3 py-1.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 shrink-0">
        <button onClick={fetchServices} disabled={loading}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        </button>
        <span className="text-[10px] font-mono text-muted-foreground">{services.length} service{services.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-mono mb-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </div>
        )}

        {services.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <MessageSquareDashed className="w-7 h-7 mb-2 opacity-20" />
            <p className="text-[11px]">No messaging services found</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 text-center max-w-56 leading-relaxed">
              Create a Messaging Service in the Twilio console to manage sender pools and inbound webhooks.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {services.map(svc => {
            const isExpanded = expanded === svc.sid;
            const isEditing = editing === svc.sid;
            return (
              <div key={svc.sid} className="bg-[#151518] border border-border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 p-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <MessageSquareDashed className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[11px] text-foreground truncate">{svc.friendlyName}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {svc.stickySession && (
                        <span className="text-[8px] font-mono text-indigo-400 border border-indigo-500/20 bg-indigo-500/5 px-1 rounded">sticky</span>
                      )}
                      {svc.smartEncoding && (
                        <span className="text-[8px] font-mono text-green-400 border border-green-500/20 bg-green-500/5 px-1 rounded">smart-enc</span>
                      )}
                      {svc.mmsConverter && (
                        <span className="text-[8px] font-mono text-blue-400 border border-blue-500/20 bg-blue-500/5 px-1 rounded">mms-conv</span>
                      )}
                      <span className="text-[8px] font-mono text-muted-foreground/50">{fmtDate(svc.dateCreated)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isExpanded && !isEditing && (
                      <button onClick={() => startEdit(svc)}
                        className="p-1 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/5 rounded transition-colors">
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    <button onClick={() => toggleExpand(svc.sid)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-border/30">
                    {/* Sender numbers */}
                    <div className="px-2.5 pt-2 pb-1">
                      <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1.5">Sender Pool</div>
                      {sendersLoading === svc.sid ? (
                        <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />Loading…
                        </div>
                      ) : (senders[svc.sid] ?? []).length === 0 ? (
                        <div className="text-[10px] font-mono text-muted-foreground/50 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" />No numbers in pool
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(senders[svc.sid] ?? []).map(n => (
                            <span key={n.sid} className="font-mono text-[9px] text-foreground border border-border bg-[#0f0f12] px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Phone className="w-2 h-2 text-indigo-400" />{n.phoneNumber}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Webhook fields */}
                    <div className="px-2.5 pt-2 pb-2.5 space-y-2 border-t border-border/20 mt-2">
                      <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Webhooks</div>

                      {isEditing ? (
                        <div className="space-y-2">
                          {([
                            { label: "Inbound Request URL", field: "inboundRequestUrl", methodField: "inboundMethod" },
                            { label: "Fallback URL", field: "fallbackUrl", methodField: "fallbackMethod" },
                            { label: "Status Callback URL", field: "statusCallback", methodField: null },
                          ] as { label: string; field: keyof MessagingService; methodField: keyof MessagingService | null }[]).map(({ label, field, methodField }) => (
                            <div key={String(field)}>
                              <label className="text-[9px] font-mono text-muted-foreground/70 block mb-0.5">{label}</label>
                              <div className="flex gap-1">
                                <Input
                                  value={String(draft[field] ?? "")}
                                  onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
                                  className="h-6 text-[9px] font-mono flex-1"
                                  placeholder="https://…"
                                />
                                {methodField && (
                                  <select
                                    value={String(draft[methodField] ?? "POST")}
                                    onChange={e => setDraft(d => ({ ...d, [methodField]: e.target.value }))}
                                    className="h-6 text-[9px] bg-[#151518] border border-input rounded px-1 font-mono text-foreground">
                                    {METHOD_OPTS.map(m => <option key={m}>{m}</option>)}
                                  </select>
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="border-t border-border/30 pt-2">
                            <Toggle label="Sticky Session" value={!!draft.stickySession} onChange={v => setDraft(d => ({ ...d, stickySession: v }))} />
                            <Toggle label="MMS Converter" value={!!draft.mmsConverter} onChange={v => setDraft(d => ({ ...d, mmsConverter: v }))} />
                            <Toggle label="Smart Encoding" value={!!draft.smartEncoding} onChange={v => setDraft(d => ({ ...d, smartEncoding: v }))} />
                            <Toggle label="Use Inbound Webhook on Number" value={!!draft.useInboundWebhookOnNumber} onChange={v => setDraft(d => ({ ...d, useInboundWebhookOnNumber: v }))} />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button size="sm" onClick={() => save(svc.sid)} disabled={saving === svc.sid}
                              className="flex-1 h-6 text-[10px] font-mono bg-indigo-600 hover:bg-indigo-700 text-white gap-1">
                              <Save className="w-2.5 h-2.5" />{saving === svc.sid ? "Saving…" : "Save"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditing(null)}
                              className="h-6 text-[10px] border-border">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {[
                            { label: "Inbound", url: svc.inboundRequestUrl, method: svc.inboundMethod },
                            { label: "Fallback", url: svc.fallbackUrl, method: svc.fallbackMethod },
                            { label: "Status CB", url: svc.statusCallback, method: null },
                          ].map(({ label, url, method }) => (
                            <div key={label} className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-muted-foreground/50 w-14 shrink-0">{label}</span>
                              {url ? (
                                <div className="flex items-center gap-1 min-w-0">
                                  {method && (
                                    <span className="text-[8px] font-mono border border-border bg-[#0f0f12] px-1 py-0.5 rounded text-muted-foreground shrink-0">{method}</span>
                                  )}
                                  <span className="text-[9px] font-mono text-foreground/70 truncate">{url}</span>
                                </div>
                              ) : (
                                <span className="text-[9px] font-mono text-muted-foreground/30">—</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
