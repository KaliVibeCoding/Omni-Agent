import React, { useState, useRef, useEffect } from "react";
import { Brain, Plus, Play, Pause, Trash2, ChevronRight, Loader2, Zap, Network, Bot, MessageSquare, Phone, Mail, Database, Globe, ArrowRight, Activity, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL ?? "/";
const API = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

type AgentStatus = "idle" | "running" | "completed" | "error";
type AgentType = "orchestrator" | "sms" | "voice" | "email" | "data" | "web" | "custom";

interface AgentNode {
  id: string;
  name: string;
  type: AgentType;
  role: string;
  status: AgentStatus;
  model: string;
  tools: string[];
  lastOutput?: string;
  tokensUsed?: number;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  agents: AgentNode[];
  status: AgentStatus;
  createdAt: string;
  runs: number;
}

const AGENT_TYPE_META: Record<AgentType, { label: string; icon: React.ReactNode; color: string }> = {
  orchestrator: { label: "Orchestrator", icon: <Brain className="size-3.5" />, color: "hsl(262 80% 60%)" },
  sms: { label: "SMS Agent", icon: <MessageSquare className="size-3.5" />, color: "hsl(210 80% 55%)" },
  voice: { label: "Voice Agent", icon: <Phone className="size-3.5" />, color: "hsl(142 71% 45%)" },
  email: { label: "Email Agent", icon: <Mail className="size-3.5" />, color: "hsl(30 90% 55%)" },
  data: { label: "Data Agent", icon: <Database className="size-3.5" />, color: "hsl(348 83% 55%)" },
  web: { label: "Web Agent", icon: <Globe className="size-3.5" />, color: "hsl(180 60% 50%)" },
  custom: { label: "Custom Agent", icon: <Bot className="size-3.5" />, color: "hsl(45 90% 55%)" },
};

const STARTER_PIPELINE: Pipeline = {
  id: "p1",
  name: "Customer Support AGI",
  description: "Multi-agent system that routes and handles customer inquiries across SMS, voice, and email using shared memory.",
  status: "idle",
  createdAt: "May 1, 2026",
  runs: 12,
  agents: [
    {
      id: "a1",
      name: "Router",
      type: "orchestrator",
      role: "Analyzes incoming messages and routes them to the right specialist agent based on intent, urgency, and channel.",
      status: "idle",
      model: "claude-3-7-sonnet",
      tools: ["Intent classifier", "Priority scorer", "Agent dispatcher"],
    },
    {
      id: "a2",
      name: "SMS Handler",
      type: "sms",
      role: "Handles all SMS-based customer interactions, sends automated replies, and escalates complex issues.",
      status: "idle",
      model: "claude-3-5-haiku",
      tools: ["Twilio SMS", "Contact lookup", "Template engine"],
    },
    {
      id: "a3",
      name: "Voice Handler",
      type: "voice",
      role: "Manages inbound/outbound voice calls using AI TTS and STT, handles transfers and voicemail.",
      status: "idle",
      model: "claude-3-5-haiku",
      tools: ["Twilio Voice", "TTS/STT", "Call transfer"],
    },
    {
      id: "a4",
      name: "Email Responder",
      type: "email",
      role: "Drafts and sends personalized email responses with context from previous interactions.",
      status: "idle",
      model: "claude-3-7-sonnet",
      tools: ["Resend API", "Template engine", "Sentiment analysis"],
    },
  ],
};

const DEMO_LOGS = [
  { agent: "Router", msg: "Received customer inquiry via SMS: 'I need help with my bill'", t: 0 },
  { agent: "Router", msg: "Intent classified: billing_support (confidence: 0.94)", t: 400 },
  { agent: "Router", msg: "Routing to SMS Handler — high urgency, billing context", t: 800 },
  { agent: "SMS Handler", msg: "Fetching customer record for +1 (555) 234-5678", t: 1200 },
  { agent: "SMS Handler", msg: "Customer found: John D. — active subscriber since Jan 2025", t: 1600 },
  { agent: "SMS Handler", msg: "Generating personalized billing response...", t: 2000 },
  { agent: "SMS Handler", msg: "Response sent: 'Hi John! Your current bill is $79/mo. Your next payment of $79 is due June 15...'", t: 2500 },
  { agent: "Router", msg: "Checking if escalation needed — sentiment: neutral, resolved", t: 3000 },
  { agent: "Router", msg: "✓ Pipeline completed successfully in 3.2s", t: 3200 },
];

export default function AGIFramework() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([STARTER_PIPELINE]);
  const [activePipeline, setActivePipeline] = useState<Pipeline>(STARTER_PIPELINE);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<typeof DEMO_LOGS>([]);
  const [logIndex, setLogIndex] = useState(0);
  const [tab, setTab] = useState<"pipeline" | "logs" | "build">("pipeline");
  const [testInput, setTestInput] = useState("I need help with my bill");
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  async function runPipeline() {
    if (running) return;
    setRunning(true);
    setLogs([]);
    setLogIndex(0);
    setTab("logs");

    // Update all agents to running
    setActivePipeline((p) => ({
      ...p,
      status: "running",
      agents: p.agents.map((a) => ({ ...a, status: "running" as AgentStatus })),
    }));

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= DEMO_LOGS.length) {
        clearInterval(interval);
        setRunning(false);
        setActivePipeline((p) => ({
          ...p,
          status: "completed",
          runs: p.runs + 1,
          agents: p.agents.map((a) => ({ ...a, status: "completed" as AgentStatus })),
        }));
        return;
      }
      setLogs((prev) => [...prev, DEMO_LOGS[idx]]);
      idx++;
    }, 400);
  }

  const AgentCard = ({ agent }: { agent: AgentNode }) => {
    const meta = AGENT_TYPE_META[agent.type];
    return (
      <div className={cn(
        "bg-card border rounded-xl p-4 transition-all",
        agent.status === "running" ? "border-primary/60 shadow-lg shadow-primary/10" :
        agent.status === "completed" ? "border-green-800/60" : "border-border",
      )}>
        <div className="flex items-start gap-3">
          <div
            className="size-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: meta.color + "22", color: meta.color }}
          >
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm text-foreground">{agent.name}</span>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 font-medium"
                style={{ color: meta.color }}
              >
                {meta.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{agent.role}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {agent.tools.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            {agent.status === "idle" && <div className="size-2 rounded-full bg-muted-foreground/40" />}
            {agent.status === "running" && <Loader2 className="size-3.5 animate-spin text-primary" />}
            {agent.status === "completed" && <CheckCircle2 className="size-3.5 text-green-400" />}
            {agent.status === "error" && <AlertCircle className="size-3.5 text-red-400" />}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="font-mono">{agent.model}</span>
          <span className={cn(
            "font-semibold capitalize",
            agent.status === "running" ? "text-primary" :
            agent.status === "completed" ? "text-green-400" :
            agent.status === "error" ? "text-red-400" : ""
          )}>
            {agent.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="size-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Multi-Agent AGI Framework</h1>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Business Plan</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Build, orchestrate, and deploy autonomous multi-agent pipelines across all communication channels.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTab("build")}>
            <Plus className="size-3.5 mr-1.5" />
            New Pipeline
          </Button>
          <Button
            size="sm"
            onClick={runPipeline}
            disabled={running}
            className="gap-1.5"
          >
            {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {running ? "Running..." : "Run Pipeline"}
          </Button>
        </div>
      </div>

      {/* Pipeline selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pipelines.map((p) => (
          <button
            key={p.id}
            onClick={() => { setActivePipeline(p); setLogs([]); setTab("pipeline"); }}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
              activePipeline.id === p.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80",
            )}
          >
            <div className="flex items-center gap-2">
              <Network className="size-3.5" />
              {p.name}
              <span className={cn(
                "size-1.5 rounded-full flex-shrink-0",
                p.status === "running" ? "bg-primary animate-pulse" :
                p.status === "completed" ? "bg-green-400" : "bg-muted-foreground/40",
              )} />
            </div>
          </button>
        ))}
      </div>

      {/* Content tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {(["pipeline", "logs", "build"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "pipeline" ? "Agents" : t === "logs" ? `Logs ${logs.length > 0 ? `(${logs.length})` : ""}` : "Build"}
          </button>
        ))}
      </div>

      {tab === "pipeline" && (
        <div className="space-y-6">
          {/* Pipeline info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-foreground">{activePipeline.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{activePipeline.description}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-1">
                <div>Created {activePipeline.createdAt}</div>
                <div>{activePipeline.runs} total runs</div>
              </div>
            </div>

            {/* Visual flow */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
              {activePipeline.agents.map((a, i) => (
                <React.Fragment key={a.id}>
                  <div className="flex-shrink-0 text-center">
                    <div
                      className={cn(
                        "size-10 rounded-xl flex items-center justify-center mx-auto mb-1 text-white transition-all",
                        a.status === "running" ? "animate-pulse" : "",
                      )}
                      style={{ background: AGENT_TYPE_META[a.type].color }}
                    >
                      {AGENT_TYPE_META[a.type].icon}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{a.name}</span>
                  </div>
                  {i < activePipeline.agents.length - 1 && (
                    <ArrowRight className="size-4 text-muted-foreground/40 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Agent cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePipeline.agents.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>

          {/* Test input */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm text-foreground mb-3">Test Pipeline Input</h3>
            <div className="flex gap-3">
              <input
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="Enter a test message or trigger..."
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
              />
              <Button onClick={runPipeline} disabled={running} className="gap-1.5 flex-shrink-0">
                {running ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                Run
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Execution Logs</span>
              {running && <span className="text-xs text-primary animate-pulse">● Live</span>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLogs([])}>Clear</Button>
          </div>
          <div className="p-4 font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="size-6 mx-auto mb-2 opacity-30" />
                <p>Run the pipeline to see execution logs here.</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-muted-foreground/50 flex-shrink-0 w-6">{String(i + 1).padStart(2, "0")}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: AGENT_TYPE_META[
                        activePipeline.agents.find((a) => a.name === log.agent)?.type || "custom"
                      ].color + "22",
                      color: AGENT_TYPE_META[
                        activePipeline.agents.find((a) => a.name === log.agent)?.type || "custom"
                      ].color,
                    }}
                  >
                    {log.agent}
                  </span>
                  <span className="text-muted-foreground leading-relaxed">{log.msg}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {tab === "build" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h3 className="font-bold text-foreground">Create New Pipeline</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Pipeline Name</label>
              <input
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. Lead Qualification AGI"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Description</label>
              <textarea
                rows={2}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                placeholder="Describe what this pipeline does..."
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Types</label>
              <span className="text-xs text-muted-foreground">Select agents to include</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(AGENT_TYPE_META).map(([type, meta]) => (
                <button
                  key={type}
                  className="flex items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/50 bg-background text-left transition-all group"
                >
                  <div
                    className="size-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: meta.color + "33", color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="gap-2">
              <Plus className="size-4" />
              Create Pipeline
            </Button>
            <Button variant="outline" onClick={() => setTab("pipeline")}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
