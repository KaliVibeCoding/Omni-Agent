import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Workflow, RefreshCw, Play, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle2, Clock, Calendar, Send, X, Globe, Layers,
} from "lucide-react";

const BASE = "/api/twilio";

interface StudioFlow {
  sid: string;
  friendlyName: string;
  status: string;
  revision: number;
  dateCreated: string;
  dateUpdated: string;
  webhookUrl: string;
  commitMessage: string | null;
}

interface Execution {
  sid: string;
  status: string;
  dateCreated: string;
  dateUpdated: string;
}

const STATUS_STYLES: Record<string, string> = {
  published: "text-green-400 border-green-500/30 bg-green-500/5",
  draft: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
  archived: "text-muted-foreground border-border bg-border/10",
};

const EXEC_STATUS_STYLES: Record<string, string> = {
  active: "text-blue-400 border-blue-500/30 bg-blue-500/5",
  completed: "text-green-400 border-green-500/30 bg-green-500/5",
  failed: "text-red-400 border-red-500/30 bg-red-500/5",
  ended: "text-muted-foreground border-border",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function StudioPanel() {
  const [flows, setFlows] = useState<StudioFlow[]>([]);
  const [executions, setExecutions] = useState<Record<string, Execution[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [execsLoading, setExecsLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggerSid, setTriggerSid] = useState<string | null>(null);
  const [triggerTo, setTriggerTo] = useState("");
  const [triggerFrom, setTriggerFrom] = useState("+18333827093");
  const [triggerParams, setTriggerParams] = useState("");
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  const fetchFlows = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${BASE}/studio/flows`);
      if (r.ok) setFlows(await r.json());
      else setError("Failed to load Studio flows");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFlows(); }, []);

  const toggleExpand = async (sid: string) => {
    if (expanded === sid) { setExpanded(null); return; }
    setExpanded(sid);
    if (!executions[sid]) {
      setExecsLoading(sid);
      try {
        const r = await fetch(`${BASE}/studio/flows/${sid}/executions`);
        if (r.ok) {
          const data = await r.json();
          setExecutions(e => ({ ...e, [sid]: data }));
        }
      } finally { setExecsLoading(null); }
    }
  };

  const triggerFlow = async () => {
    if (!triggerSid || !triggerTo || !triggerFrom) return;
    setTriggering(true); setTriggerResult(null);
    try {
      let parameters: Record<string, unknown> | undefined;
      if (triggerParams.trim()) {
        try { parameters = JSON.parse(triggerParams); } catch { /* ignore */ }
      }
      const r = await fetch(`${BASE}/studio/flows/${triggerSid}/executions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: triggerTo, from: triggerFrom, parameters }),
      });
      const d = await r.json();
      if (r.ok) {
        setTriggerResult(`Started! Execution SID: ${d.sid}`);
        // Refresh executions for this flow
        const r2 = await fetch(`${BASE}/studio/flows/${triggerSid}/executions`);
        if (r2.ok) {
          const execData = await r2.json();
          setExecutions(e => ({ ...e, [triggerSid!]: execData }));
        }
      } else {
        setTriggerResult(`Error: ${d.error ?? "Failed to trigger"}`);
      }
    } finally { setTriggering(false); }
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Trigger dialog overlay */}
      {triggerSid && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-md">
          <div className="bg-[#1a1a1e] border border-border rounded-lg p-4 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold">Trigger Flow</span>
              </div>
              <button onClick={() => { setTriggerSid(null); setTriggerResult(null); }}
                className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 mb-3">
              <div>
                <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">To (phone number)</label>
                <Input value={triggerTo} onChange={e => setTriggerTo(e.target.value)}
                  placeholder="+15551234567" className="h-7 text-[10px] font-mono" />
              </div>
              <div>
                <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">From</label>
                <select value={triggerFrom} onChange={e => setTriggerFrom(e.target.value)}
                  className="w-full h-7 text-[10px] bg-[#151518] border border-input rounded-md px-2 font-mono text-foreground">
                  <option value="+18333827093">+1 (833) 382-7093</option>
                  <option value="+18667524618">+1 (866) 752-4618</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Parameters (JSON, optional)</label>
                <textarea value={triggerParams} onChange={e => setTriggerParams(e.target.value)}
                  placeholder={'{"key": "value"}'}
                  rows={2}
                  className="w-full text-[9px] bg-[#151518] border border-input rounded-md px-2 py-1 font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            {triggerResult && (
              <div className={cn("text-[10px] font-mono px-2 py-1.5 rounded border mb-2",
                triggerResult.startsWith("Error") ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-green-400 bg-green-500/10 border-green-500/30")}>
                {triggerResult}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={triggerFlow} disabled={triggering || !triggerTo}
                className="flex-1 h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white font-mono gap-1">
                <Play className="w-3 h-3" />{triggering ? "Starting…" : "Trigger"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setTriggerSid(null); setTriggerResult(null); }}
                className="h-7 text-xs border-border">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 shrink-0">
        <button onClick={fetchFlows} disabled={loading}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        </button>
        <span className="text-[10px] font-mono text-muted-foreground">{flows.length} flow{flows.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-mono mb-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </div>
        )}

        {flows.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Workflow className="w-7 h-7 mb-2 opacity-20" />
            <p className="text-[11px]">No Studio flows found</p>
            <a href="https://www.twilio.com/console/studio" target="_blank" rel="noreferrer"
              className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" />Open Twilio Studio
            </a>
          </div>
        )}

        <div className="space-y-2">
          {flows.map(flow => {
            const isExpanded = expanded === flow.sid;
            return (
              <div key={flow.sid} className="bg-[#151518] border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-2.5">
                  <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Workflow className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[11px] text-foreground truncate">{flow.friendlyName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border", STATUS_STYLES[flow.status] ?? "text-muted-foreground border-border")}>
                        {flow.status}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground">rev {flow.revision}</span>
                      <span className="text-[8px] font-mono text-muted-foreground">{fmtDate(flow.dateUpdated)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {flow.status === "published" && (
                      <button onClick={() => setTriggerSid(flow.sid)}
                        className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono rounded border border-purple-500/30 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 transition-colors">
                        <Play className="w-2.5 h-2.5" />Run
                      </button>
                    )}
                    <button onClick={() => toggleExpand(flow.sid)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Webhook URL */}
                {isExpanded && (
                  <div className="border-t border-border/30 px-2.5 py-2 space-y-2">
                    {flow.webhookUrl && (
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Webhook URL</div>
                        <div className="text-[9px] font-mono text-foreground/70 bg-[#0f0f12] border border-border/50 rounded p-1.5 break-all">
                          {flow.webhookUrl}
                        </div>
                      </div>
                    )}

                    {flow.commitMessage && (
                      <div>
                        <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-0.5">Last commit</div>
                        <p className="text-[9px] font-mono text-muted-foreground italic">{flow.commitMessage}</p>
                      </div>
                    )}

                    {/* Recent executions */}
                    <div>
                      <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1.5">Recent Executions</div>
                      {execsLoading === flow.sid ? (
                        <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />Loading…
                        </div>
                      ) : (executions[flow.sid] ?? []).length === 0 ? (
                        <div className="text-[10px] font-mono text-muted-foreground/50">No recent executions</div>
                      ) : (
                        <div className="space-y-1">
                          {(executions[flow.sid] ?? []).slice(0, 5).map(exec => (
                            <div key={exec.sid} className="flex items-center gap-2 bg-[#0f0f12] border border-border/50 rounded p-1.5">
                              <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border shrink-0", EXEC_STATUS_STYLES[exec.status] ?? "text-muted-foreground border-border")}>
                                {exec.status}
                              </span>
                              <span className="font-mono text-[9px] text-muted-foreground/70 truncate flex-1">{exec.sid.slice(0, 20)}…</span>
                              <span className="font-mono text-[8px] text-muted-foreground/50 shrink-0">{fmtDate(exec.dateCreated)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <a href={`https://www.twilio.com/console/studio/flows/${flow.sid}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] font-mono text-purple-400 hover:text-purple-300 transition-colors">
                      <Globe className="w-2.5 h-2.5" />Open in Studio
                    </a>
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
