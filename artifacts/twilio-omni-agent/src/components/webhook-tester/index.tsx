import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send, ChevronDown, RotateCcw, Copy, Check, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const BASE = "/api/webhook-tester";

interface WebhookTemplate {
  id: string;
  label: string;
  description: string;
  method: "POST" | "GET";
  params: Record<string, string>;
}

const TEMPLATES: WebhookTemplate[] = [
  {
    id: "inbound-voice",
    label: "Inbound Voice Call",
    description: "A call arrives on your Twilio number",
    method: "POST",
    params: {
      CallSid: "CA" + "a".repeat(32),
      AccountSid: "AC" + "b".repeat(32),
      From: "+15055551234",
      To: "+18333827093",
      Direction: "inbound",
      CallStatus: "ringing",
      ApiVersion: "2010-04-01",
      CallerName: "Test Caller",
      FromCity: "ALBUQUERQUE",
      FromState: "NM",
      FromZip: "87102",
      FromCountry: "US",
      ToCity: "TIJERAS",
      ToState: "NM",
      ToCountry: "US",
    },
  },
  {
    id: "inbound-sms",
    label: "Inbound SMS",
    description: "A text message arrives on your number",
    method: "POST",
    params: {
      MessageSid: "SM" + "c".repeat(32),
      AccountSid: "AC" + "b".repeat(32),
      MessagingServiceSid: "",
      From: "+15055551234",
      To: "+18333827093",
      Body: "Hello! I need help with my account.",
      NumMedia: "0",
      NumSegments: "1",
      FromCity: "ALBUQUERQUE",
      FromState: "NM",
      FromZip: "87102",
      FromCountry: "US",
    },
  },
  {
    id: "gather-dtmf",
    label: "Gather DTMF Result",
    description: "Caller pressed digits in a <Gather>",
    method: "POST",
    params: {
      CallSid: "CA" + "a".repeat(32),
      AccountSid: "AC" + "b".repeat(32),
      From: "+15055551234",
      To: "+18333827093",
      Digits: "1",
      FinishedOnKey: "",
      CallStatus: "in-progress",
      Direction: "inbound",
    },
  },
  {
    id: "gather-speech",
    label: "Gather Speech Result",
    description: "Caller spoke in a <Gather speech>",
    method: "POST",
    params: {
      CallSid: "CA" + "a".repeat(32),
      AccountSid: "AC" + "b".repeat(32),
      From: "+15055551234",
      To: "+18333827093",
      SpeechResult: "I want to check my balance",
      Confidence: "0.94",
      CallStatus: "in-progress",
    },
  },
  {
    id: "call-status",
    label: "Call Status Callback",
    description: "Call state changed (answered, completed, etc.)",
    method: "POST",
    params: {
      CallSid: "CA" + "a".repeat(32),
      AccountSid: "AC" + "b".repeat(32),
      From: "+15055551234",
      To: "+18333827093",
      CallStatus: "completed",
      Direction: "inbound",
      Duration: "47",
      CallDuration: "47",
      Timestamp: new Date().toUTCString(),
      ApiVersion: "2010-04-01",
    },
  },
  {
    id: "recording-status",
    label: "Recording Status",
    description: "Recording completed and is available",
    method: "POST",
    params: {
      AccountSid: "AC" + "b".repeat(32),
      CallSid: "CA" + "a".repeat(32),
      RecordingSid: "RE" + "d".repeat(32),
      RecordingUrl: "https://api.twilio.com/2010-04-01/Accounts/ACtest/Recordings/REtest",
      RecordingStatus: "completed",
      RecordingDuration: "47",
      RecordingChannels: "1",
      RecordingSource: "RecordVerb",
      RecordingStartTime: new Date().toUTCString(),
    },
  },
  {
    id: "conference-event",
    label: "Conference Event",
    description: "Participant joined / left conference",
    method: "POST",
    params: {
      AccountSid: "AC" + "b".repeat(32),
      ConferenceSid: "CF" + "e".repeat(32),
      FriendlyName: "SupportBridge",
      CallSid: "CA" + "a".repeat(32),
      Muted: "false",
      Hold: "false",
      EndConferenceOnExit: "false",
      StartConferenceOnEnter: "true",
      StatusCallbackEvent: "participant-join",
    },
  },
  {
    id: "verify-check",
    label: "Verify OTP Check",
    description: "Simulate a Verify check result webhook",
    method: "POST",
    params: {
      AccountSid: "AC" + "b".repeat(32),
      ServiceSid: "VA" + "f".repeat(32),
      To: "+15055551234",
      Channel: "sms",
      Status: "approved",
      Valid: "true",
    },
  },
  {
    id: "custom",
    label: "Custom",
    description: "Build your own payload from scratch",
    method: "POST",
    params: {},
  },
];

interface TestResult {
  ok: boolean;
  status: number;
  statusText: string;
  responseTime: number;
  body: string;
  contentType: string;
  error: boolean;
}

function formatXml(xml: string): string {
  let formatted = "";
  let indent = 0;
  const lines = xml.replace(/>\s*</g, ">\n<").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("</")) indent = Math.max(0, indent - 1);
    formatted += "  ".repeat(indent) + trimmed + "\n";
    if (!trimmed.startsWith("</") && !trimmed.includes("</") && !trimmed.endsWith("/>") && trimmed.startsWith("<")) {
      indent++;
    }
  }
  return formatted.trim();
}

export function WebhookTester() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [method, setMethod] = useState<"POST" | "GET">("POST");
  const [params, setParams] = useState<Record<string, string>>(TEMPLATES[0].params);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"params" | "response">("params");

  const applyTemplate = (t: WebhookTemplate) => {
    setSelectedTemplate(t);
    setMethod(t.method);
    setParams({ ...t.params });
    setShowTemplateDropdown(false);
    setResult(null);
    setActiveTab("params");
  };

  const updateParam = (key: string, value: string) => {
    setParams(p => ({ ...p, [key]: value }));
  };

  const removeParam = (key: string) => {
    setParams(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const addParam = () => {
    if (!newKey.trim()) return;
    setParams(p => ({ ...p, [newKey.trim()]: newVal }));
    setNewKey(""); setNewVal("");
  };

  const handleSend = async () => {
    if (!webhookUrl.trim()) return;
    setIsSending(true);
    setResult(null);
    try {
      const resp = await fetch(`${BASE}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl.trim(), method, params }),
      });
      const data = await resp.json();
      setResult(data);
      setActiveTab("response");
    } catch (err: any) {
      setResult({ ok: false, status: 0, statusText: "Network Error", responseTime: 0, body: err?.message ?? String(err), contentType: "text/plain", error: true });
      setActiveTab("response");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyResponse = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isXml = result?.contentType?.includes("xml");
  const isJson = result?.contentType?.includes("json");
  const formattedBody = result
    ? isXml ? formatXml(result.body) : isJson ? (() => { try { return JSON.stringify(JSON.parse(result.body), null, 2); } catch { return result.body; } })() : result.body
    : "";

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Template selector */}
      <div className="px-4 py-2 border-b border-border/50">
        <div className="relative">
          <button
            onClick={() => setShowTemplateDropdown(p => !p)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#151518] border border-border rounded-md hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-primary font-mono text-[10px] uppercase tracking-wider shrink-0">Template</span>
              <span className="truncate font-medium text-foreground">{selectedTemplate.label}</span>
              <span className="text-muted-foreground truncate hidden sm:inline">— {selectedTemplate.description}</span>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform", showTemplateDropdown && "rotate-180")} />
          </button>
          {showTemplateDropdown && (
            <div className="absolute top-full left-0 w-full mt-1 bg-[#1f1f23] border border-border rounded-md shadow-xl z-50 max-h-64 overflow-y-auto">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)}
                  className={cn("w-full flex flex-col items-start px-3 py-2 text-left hover:bg-accent transition-colors", selectedTemplate.id === t.id && "bg-primary/10")}>
                  <span className={cn("font-medium", selectedTemplate.id === t.id ? "text-primary" : "text-foreground")}>{t.label}</span>
                  <span className="text-[10px] text-muted-foreground">{t.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* URL + Method */}
      <div className="px-4 py-2 border-b border-border/50 flex gap-2 items-center">
        <button
          onClick={() => setMethod(m => m === "POST" ? "GET" : "POST")}
          className={cn("shrink-0 px-2 py-1.5 rounded font-mono text-[10px] font-bold border transition-colors",
            method === "POST" ? "bg-primary/10 border-primary/30 text-primary" : "bg-blue-500/10 border-blue-500/30 text-blue-400")}
        >
          {method}
        </button>
        <Input
          value={webhookUrl}
          onChange={e => setWebhookUrl(e.target.value)}
          placeholder="https://your-app.com/webhook/voice"
          className="flex-1 h-8 text-xs bg-[#151518] border-border font-mono"
          onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
        />
        <Button
          onClick={handleSend}
          disabled={!webhookUrl.trim() || isSending}
          size="sm"
          className="h-8 gap-1.5 bg-primary hover:bg-primary/90 shrink-0"
        >
          <Send className="w-3 h-3" />
          {isSending ? "Sending…" : "Send"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-2 shrink-0">
        {(["params", "response"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-3 py-1.5 rounded-md font-mono capitalize transition-colors text-[10px]",
              activeTab === tab ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
            {tab === "params" ? `Payload (${Object.keys(params).length})` : "Response"}
            {tab === "response" && result && (
              <span className={cn("ml-1.5 px-1 rounded", result.ok ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                {result.status || "ERR"}
              </span>
            )}
          </button>
        ))}
        <button onClick={() => { setParams({ ...selectedTemplate.params }); setResult(null); setActiveTab("params"); }}
          className="ml-auto p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors" title="Reset to template defaults">
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
        {activeTab === "params" && (
          <div className="space-y-1">
            {Object.entries(params).map(([k, v]) => (
              <div key={k} className="flex gap-1.5 items-center group">
                <span className="w-36 shrink-0 font-mono text-[10px] text-primary/80 truncate" title={k}>{k}</span>
                <Input value={v} onChange={e => updateParam(k, e.target.value)}
                  className="flex-1 h-7 text-[11px] bg-[#151518] border-border font-mono" />
                <button onClick={() => removeParam(k)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0">
                  ×
                </button>
              </div>
            ))}
            {/* Add param row */}
            <div className="flex gap-1.5 items-center mt-2 pt-2 border-t border-border/50">
              <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Key"
                className="w-36 shrink-0 h-7 text-[11px] bg-[#151518] border-dashed border-border font-mono"
                onKeyDown={e => { if (e.key === "Enter") addParam(); }} />
              <Input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Value"
                className="flex-1 h-7 text-[11px] bg-[#151518] border-dashed border-border font-mono"
                onKeyDown={e => { if (e.key === "Enter") addParam(); }} />
              <button onClick={addParam}
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shrink-0 text-base font-bold">
                +
              </button>
            </div>
          </div>
        )}

        {activeTab === "response" && (
          <div className="space-y-2">
            {!result ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Send className="w-6 h-6 mb-2 opacity-30" />
                <p className="text-[11px]">Send a request to see the response</p>
              </div>
            ) : (
              <>
                {/* Status bar */}
                <div className="flex items-center gap-3 px-3 py-2 bg-[#151518] border border-border rounded-md">
                  {result.error || !result.ok ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  )}
                  <span className={cn("font-mono font-bold text-sm", result.ok ? "text-green-400" : "text-red-400")}>
                    {result.status || "ERR"}
                  </span>
                  <span className="text-muted-foreground">{result.statusText}</span>
                  <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">{result.responseTime}ms</span>
                  </div>
                  {result.contentType && (
                    <span className="px-1.5 py-0.5 bg-[#252529] border border-border rounded font-mono text-[9px] text-muted-foreground shrink-0">
                      {result.contentType.split(";")[0]}
                    </span>
                  )}
                  <button onClick={handleCopyResponse}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {/* TwiML hint */}
                {isXml && result.ok && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded text-[10px] text-primary/80">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    Valid TwiML response detected — Twilio will execute these verbs
                  </div>
                )}
                {!result.ok && !result.error && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/20 rounded text-[10px] text-red-400">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Non-2xx response — Twilio will use fallback URL or hang up
                  </div>
                )}

                {/* Body */}
                <div className="relative">
                  <pre className="bg-[#151518] border border-border rounded-md p-3 font-mono text-[11px] whitespace-pre-wrap break-all text-foreground leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
                    {formattedBody || <span className="text-muted-foreground italic">(empty body)</span>}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
