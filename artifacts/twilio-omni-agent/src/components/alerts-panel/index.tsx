import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  RefreshCw, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp,
  Calendar, Link, Globe, X,
} from "lucide-react";

const BASE = "/api/twilio";

interface TwilioAlert {
  sid: string;
  logLevel: string;
  errorCode: string;
  alertText: string;
  requestUrl: string;
  requestMethod: string;
  responseBody: string;
  responseStatusCode: number;
  dateCreated: string;
  resourceSid: string | null;
}

type LogLevel = "all" | "error" | "warning" | "notice";

const LEVEL_STYLES: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string; badge: string }> = {
  error: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    bg: "bg-red-500/5", border: "border-red-500/20", text: "text-red-400",
    badge: "bg-red-500/10 border-red-500/30 text-red-400",
  },
  warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    bg: "bg-yellow-500/5", border: "border-yellow-500/20", text: "text-yellow-400",
    badge: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  },
  notice: {
    icon: <Info className="w-3.5 h-3.5" />,
    bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-400",
    badge: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<TwilioAlert[]>([]);
  const [logLevel, setLogLevel] = useState<LogLevel>("all");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const url = logLevel === "all" ? `${BASE}/alerts` : `${BASE}/alerts?logLevel=${logLevel}`;
      const r = await fetch(url);
      if (r.ok) setAlerts(await r.json());
      else setError("Failed to load alerts");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [logLevel]);

  useEffect(() => { fetchAlerts(); }, [logLevel]);

  const counts = {
    error: alerts.filter(a => a.logLevel === "error").length,
    warning: alerts.filter(a => a.logLevel === "warning").length,
    notice: alerts.filter(a => a.logLevel === "notice").length,
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 shrink-0 flex-wrap">
        {(["all", "error", "warning", "notice"] as LogLevel[]).map(lvl => (
          <button key={lvl} onClick={() => setLogLevel(lvl)}
            className={cn(
              "px-2.5 py-1 rounded-md font-mono text-[10px] transition-colors capitalize",
              logLevel === lvl ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}>
            {lvl}
            {lvl !== "all" && counts[lvl] > 0 && (
              <span className="ml-1 text-[8px] bg-red-500/20 px-1 rounded">{counts[lvl]}</span>
            )}
          </button>
        ))}
        <button onClick={fetchAlerts} disabled={loading}
          className="ml-auto p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        </button>
      </div>

      {/* Summary badges */}
      {alerts.length > 0 && (
        <div className="flex gap-2 px-3 mb-2 shrink-0">
          {counts.error > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border bg-red-500/10 border-red-500/30 text-red-400">
              <AlertCircle className="w-2.5 h-2.5" />{counts.error} error{counts.error !== 1 ? "s" : ""}
            </span>
          )}
          {counts.warning > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
              <AlertTriangle className="w-2.5 h-2.5" />{counts.warning} warning{counts.warning !== 1 ? "s" : ""}
            </span>
          )}
          {counts.notice > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400">
              <Info className="w-2.5 h-2.5" />{counts.notice} notice{counts.notice !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-mono mb-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </div>
        )}

        {alerts.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <AlertTriangle className="w-7 h-7 mb-2 opacity-20" />
            <p className="text-[11px] font-medium">No alerts found</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Your Twilio account is clean</p>
          </div>
        )}

        <div className="space-y-2">
          {alerts.map(alert => {
            const style = LEVEL_STYLES[alert.logLevel] ?? LEVEL_STYLES.notice;
            const isExpanded = expanded === alert.sid;
            return (
              <div key={alert.sid} className={cn("rounded-lg border", style.bg, style.border)}>
                <div className="flex items-start gap-2.5 p-2.5">
                  <div className={cn("mt-0.5 shrink-0", style.text)}>{style.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border capitalize", style.badge)}>
                        {alert.logLevel}
                      </span>
                      {alert.errorCode && (
                        <span className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded bg-[#151518]">
                          #{alert.errorCode}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground ml-auto">
                        <Calendar className="w-2.5 h-2.5" />{fmtDate(alert.dateCreated)}
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground/90 leading-relaxed font-mono">
                      {alert.alertText?.slice(0, isExpanded ? undefined : 120)}{!isExpanded && alert.alertText?.length > 120 ? "…" : ""}
                    </p>
                    {alert.requestUrl && (
                      <div className="flex items-center gap-1 mt-1">
                        <Link className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0" />
                        <span className="text-[9px] font-mono text-muted-foreground/60 truncate">{alert.requestUrl}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setExpanded(e => e === alert.sid ? null : alert.sid)}
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-border/30 px-2.5 pb-2.5 pt-2 space-y-2">
                    {alert.requestMethod && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground/50 w-20 shrink-0">Method</span>
                        <span className="font-mono text-[9px] text-foreground">{alert.requestMethod}</span>
                      </div>
                    )}
                    {alert.responseStatusCode && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground/50 w-20 shrink-0">HTTP Status</span>
                        <span className={cn("font-mono text-[9px] px-1.5 py-0.5 rounded border",
                          alert.responseStatusCode >= 500 ? "text-red-400 border-red-500/30 bg-red-500/5" :
                          alert.responseStatusCode >= 400 ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/5" :
                          "text-green-400 border-green-500/30 bg-green-500/5")}>
                          {alert.responseStatusCode}
                        </span>
                      </div>
                    )}
                    {alert.resourceSid && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground/50 w-20 shrink-0">Resource</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{alert.resourceSid}</span>
                      </div>
                    )}
                    {alert.responseBody && (
                      <div>
                        <div className="text-[9px] font-mono text-muted-foreground/50 mb-1">Response Body</div>
                        <pre className="text-[9px] font-mono text-foreground/70 bg-[#0f0f12] border border-border/50 rounded p-2 overflow-x-auto max-h-24 leading-relaxed whitespace-pre-wrap">
                          {alert.responseBody.slice(0, 500)}
                        </pre>
                      </div>
                    )}
                    {alert.errorCode && (
                      <a href={`https://www.twilio.com/docs/errors/${alert.errorCode}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] font-mono text-blue-400 hover:text-blue-300 transition-colors">
                        <Globe className="w-2.5 h-2.5" />View error docs for #{alert.errorCode}
                      </a>
                    )}
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
