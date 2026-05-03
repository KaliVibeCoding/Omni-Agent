import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Copy, Check, Trash2, ChevronUp, ChevronDown, Plus, MessageSquarePlus } from "lucide-react";

// ─── Verb Schema ───────────────────────────────────────────────────────────────

interface AttrDef {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  default?: string;
  options?: string[];
  placeholder?: string;
}

interface VerbDef {
  tag: string;
  color: string;
  icon: string;
  description: string;
  hasContent?: boolean; // text content between tags
  attrs: AttrDef[];
  nestable?: string[]; // child verb tags allowed
}

const VERB_DEFS: VerbDef[] = [
  {
    tag: "Say",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    icon: "🗣️",
    description: "Text-to-speech",
    hasContent: true,
    attrs: [
      { name: "voice", label: "Voice", type: "select", default: "Polly.Joanna-Neural", options: ["alice", "man", "woman", "Polly.Joanna-Neural", "Polly.Matthew-Neural", "Polly.Salli-Neural", "Polly.Joey-Neural", "Polly.Kendra-Neural", "Polly.Kimberly-Neural", "Google.en-US-Neural2-F", "Google.en-US-Neural2-J"] },
      { name: "language", label: "Language", type: "select", default: "en-US", options: ["en-US", "en-GB", "es-ES", "es-MX", "fr-FR", "de-DE", "it-IT", "pt-BR", "ja-JP", "ko-KR", "zh-CN"] },
      { name: "loop", label: "Loop", type: "number", default: "1", placeholder: "1" },
    ],
  },
  {
    tag: "Play",
    color: "text-purple-400 border-purple-500/30 bg-purple-500/5",
    icon: "▶️",
    description: "Play audio file",
    hasContent: true,
    attrs: [
      { name: "loop", label: "Loop", type: "number", default: "1", placeholder: "1" },
      { name: "digits", label: "DTMF Digits", type: "text", placeholder: "e.g. w1234" },
    ],
  },
  {
    tag: "Gather",
    color: "text-green-400 border-green-500/30 bg-green-500/5",
    icon: "🎯",
    description: "Collect DTMF/speech",
    nestable: ["Say", "Play", "Pause"],
    attrs: [
      { name: "action", label: "Action URL", type: "text", placeholder: "/gather-result" },
      { name: "method", label: "Method", type: "select", default: "POST", options: ["POST", "GET"] },
      { name: "input", label: "Input", type: "select", default: "dtmf", options: ["dtmf", "speech", "dtmf speech"] },
      { name: "timeout", label: "Timeout (s)", type: "number", default: "5", placeholder: "5" },
      { name: "numDigits", label: "Num Digits", type: "number", placeholder: "1" },
      { name: "speechModel", label: "Speech Model", type: "select", default: "", options: ["", "default", "numbers_and_commands", "phone_call", "experimental_conversations", "experimental_utterances"] },
      { name: "hints", label: "Hints", type: "text", placeholder: "yes, no, help" },
      { name: "language", label: "Language", type: "select", default: "en-US", options: ["en-US", "en-GB", "es-ES", "es-MX", "fr-FR", "de-DE", "pt-BR"] },
      { name: "finishOnKey", label: "Finish On Key", type: "text", default: "#", placeholder: "#" },
    ],
  },
  {
    tag: "Dial",
    color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
    icon: "📞",
    description: "Connect to number/queue/SIP",
    hasContent: true,
    attrs: [
      { name: "action", label: "Action URL", type: "text", placeholder: "/dial-status" },
      { name: "method", label: "Method", type: "select", default: "POST", options: ["POST", "GET"] },
      { name: "callerId", label: "Caller ID", type: "text", placeholder: "+15551234567" },
      { name: "timeout", label: "Timeout (s)", type: "number", default: "30", placeholder: "30" },
      { name: "record", label: "Record", type: "select", default: "", options: ["", "do-not-record", "record-from-answer", "record-from-ringing", "record-from-answer-dual", "record-from-ringing-dual"] },
      { name: "ringTone", label: "Ring Tone", type: "select", default: "", options: ["", "at", "au", "bg", "br", "be", "ch", "cl", "cn", "cz", "de", "dk", "ee", "es", "fi", "fr", "gb", "gr", "hu", "il", "in", "it", "lt", "jp", "mx", "my", "nl", "no", "nz", "ph", "pl", "pt", "ro", "se", "sg", "th", "uk", "us", "us-old", "tw", "ve", "za"] },
    ],
  },
  {
    tag: "Record",
    color: "text-red-400 border-red-500/30 bg-red-500/5",
    icon: "⏺️",
    description: "Record caller audio",
    attrs: [
      { name: "action", label: "Action URL", type: "text", placeholder: "/recording-done" },
      { name: "method", label: "Method", type: "select", default: "POST", options: ["POST", "GET"] },
      { name: "timeout", label: "Silence Timeout", type: "number", default: "5", placeholder: "5" },
      { name: "maxLength", label: "Max Length (s)", type: "number", default: "3600", placeholder: "3600" },
      { name: "transcribe", label: "Transcribe", type: "boolean", default: "false" },
      { name: "transcribeCallback", label: "Transcribe CB", type: "text", placeholder: "/transcription" },
      { name: "playBeep", label: "Play Beep", type: "boolean", default: "true" },
      { name: "recordingStatusCallback", label: "Status Callback", type: "text", placeholder: "/recording-status" },
    ],
  },
  {
    tag: "Pause",
    color: "text-gray-400 border-gray-500/30 bg-gray-500/5",
    icon: "⏸️",
    description: "Wait silently",
    attrs: [
      { name: "length", label: "Length (s)", type: "number", default: "2", placeholder: "2" },
    ],
  },
  {
    tag: "Redirect",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
    icon: "↩️",
    description: "Redirect to TwiML URL",
    hasContent: true,
    attrs: [
      { name: "method", label: "Method", type: "select", default: "POST", options: ["POST", "GET"] },
    ],
  },
  {
    tag: "Reject",
    color: "text-orange-400 border-orange-500/30 bg-orange-500/5",
    icon: "🚫",
    description: "Reject incoming call",
    attrs: [
      { name: "reason", label: "Reason", type: "select", default: "rejected", options: ["rejected", "busy"] },
    ],
  },
  {
    tag: "Hangup",
    color: "text-rose-400 border-rose-500/30 bg-rose-500/5",
    icon: "📵",
    description: "Hang up the call",
    attrs: [],
  },
  {
    tag: "Enqueue",
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/5",
    icon: "🔢",
    description: "Place caller in queue",
    hasContent: true,
    attrs: [
      { name: "action", label: "Action URL", type: "text", placeholder: "/queue-done" },
      { name: "method", label: "Method", type: "select", default: "POST", options: ["POST", "GET"] },
      { name: "waitUrl", label: "Wait URL", type: "text", placeholder: "/hold-music" },
      { name: "workflowSid", label: "Workflow SID", type: "text", placeholder: "WWxxx" },
    ],
  },
  {
    tag: "Leave",
    color: "text-pink-400 border-pink-500/30 bg-pink-500/5",
    icon: "🚪",
    description: "Leave a queue",
    attrs: [],
  },
];

const VERB_MAP = Object.fromEntries(VERB_DEFS.map(v => [v.tag, v]));

// ─── Verb Instance ─────────────────────────────────────────────────────────────

interface VerbInstance {
  id: string;
  tag: string;
  attrs: Record<string, string>;
  content: string;
  children: VerbInstance[]; // for Gather nested verbs
}

let idCounter = 0;
function makeVerb(tag: string): VerbInstance {
  const def = VERB_MAP[tag];
  const attrs: Record<string, string> = {};
  def.attrs.forEach(a => { if (a.default) attrs[a.name] = a.default; });
  return { id: `v${++idCounter}`, tag, attrs, content: "", children: [] };
}

// ─── XML generation ────────────────────────────────────────────────────────────

function verbToXml(v: VerbInstance, indent = 2): string {
  const def = VERB_MAP[v.tag];
  const pad = " ".repeat(indent);

  const attrStr = Object.entries(v.attrs)
    .filter(([, val]) => val !== "" && val !== undefined)
    .map(([k, val]) => `${k}="${escapeXml(val)}"`)
    .join(" ");

  const openTag = attrStr ? `<${v.tag} ${attrStr}>` : `<${v.tag}>`;

  if (!def.hasContent && v.children.length === 0 && v.attrs["length"] !== undefined && v.tag === "Pause") {
    const len = v.attrs["length"] || "2";
    return `${pad}<Pause length="${len}"/>`;
  }

  if (v.children.length > 0) {
    const childXml = v.children.map(c => verbToXml(c, indent + 2)).join("\n");
    if (v.content.trim()) {
      return `${pad}${openTag}\n${childXml}\n${pad}</${v.tag}>`;
    }
    return `${pad}${openTag}\n${childXml}\n${pad}</${v.tag}>`;
  }

  if (def.hasContent || v.content.trim()) {
    if (v.content.trim()) {
      return `${pad}${openTag}${escapeXml(v.content)}</${v.tag}>`;
    }
    return `${pad}${openTag}</${v.tag}>`;
  }

  // Self-close if no content
  if (attrStr) return `${pad}<${v.tag} ${attrStr}/>`;
  return `${pad}<${v.tag}/>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateTwiML(verbs: VerbInstance[]): string {
  if (verbs.length === 0) return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <!-- Add TwiML verbs above -->\n</Response>`;
  const inner = verbs.map(v => verbToXml(v, 2)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${inner}\n</Response>`;
}

// ─── Attr Editor ───────────────────────────────────────────────────────────────

function AttrEditor({ def, value, onChange }: { def: AttrDef; value: string; onChange: (v: string) => void }) {
  if (def.type === "select") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 h-6 text-[11px] bg-[#151518] border border-border rounded px-1.5 font-mono text-foreground focus:outline-none focus:border-primary/50">
        {def.options?.map(o => <option key={o} value={o}>{o || "(default)"}</option>)}
      </select>
    );
  }
  if (def.type === "boolean") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 h-6 text-[11px] bg-[#151518] border border-border rounded px-1.5 font-mono text-foreground focus:outline-none focus:border-primary/50">
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  return (
    <Input value={value} onChange={e => onChange(e.target.value)}
      placeholder={def.placeholder}
      className="flex-1 h-6 text-[11px] bg-[#151518] border-border font-mono" />
  );
}

// ─── Verb Card ─────────────────────────────────────────────────────────────────

interface VerbCardProps {
  verb: VerbInstance;
  index: number;
  total: number;
  onUpdate: (id: string, updates: Partial<VerbInstance>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onAddChild?: (parentId: string, tag: string) => void;
  onRemoveChild?: (parentId: string, childId: string) => void;
  onUpdateChild?: (parentId: string, childId: string, updates: Partial<VerbInstance>) => void;
  isChild?: boolean;
}

function VerbCard({ verb, index, total, onUpdate, onRemove, onMove, onAddChild, onRemoveChild, onUpdateChild, isChild }: VerbCardProps) {
  const def = VERB_MAP[verb.tag];
  const [expanded, setExpanded] = useState(true);

  const updateAttr = (name: string, value: string) => {
    onUpdate(verb.id, { attrs: { ...verb.attrs, [name]: value } });
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", def.color, isChild ? "ml-4" : "")}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}>
        <span className="text-[12px]">{def.icon}</span>
        <span className="font-mono font-bold text-[11px]">&lt;{verb.tag}&gt;</span>
        <span className="text-[10px] text-muted-foreground">{def.description}</span>
        <div className="ml-auto flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          {!isChild && (
            <>
              <button onClick={() => onMove(verb.id, -1)} disabled={index === 0}
                className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors">
                <ChevronUp className="w-3 h-3" />
              </button>
              <button onClick={() => onMove(verb.id, 1)} disabled={index === total - 1}
                className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors">
                <ChevronDown className="w-3 h-3" />
              </button>
            </>
          )}
          <button onClick={() => onRemove(verb.id)}
            className="p-0.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-3 pb-2 space-y-1.5 border-t border-white/10">
          {/* Content field */}
          {def.hasContent && (
            <div className="flex items-center gap-2 pt-1.5">
              <span className="w-20 shrink-0 text-[10px] text-muted-foreground font-mono">content</span>
              <Input value={verb.content} onChange={e => onUpdate(verb.id, { content: e.target.value })}
                placeholder={verb.tag === "Say" ? "Hello, welcome to RJ Business Solutions!" : verb.tag === "Play" ? "https://example.com/audio.mp3" : "https://your-twiml-url.com"}
                className="flex-1 h-6 text-[11px] bg-[#151518] border-border font-mono" />
            </div>
          )}

          {/* Attributes */}
          {def.attrs.map(attrDef => (
            <div key={attrDef.name} className="flex items-center gap-2 pt-1">
              <span className="w-20 shrink-0 text-[10px] text-muted-foreground font-mono truncate" title={attrDef.label}>{attrDef.label}</span>
              <AttrEditor def={attrDef} value={verb.attrs[attrDef.name] ?? attrDef.default ?? ""} onChange={v => updateAttr(attrDef.name, v)} />
            </div>
          ))}

          {/* Nested verbs (Gather) */}
          {def.nestable && (
            <div className="pt-1.5 space-y-1.5">
              {verb.children.map((child, ci) => (
                <VerbCard key={child.id} verb={child} index={ci} total={verb.children.length} isChild
                  onUpdate={(cid, updates) => onUpdateChild?.(verb.id, cid, updates)}
                  onRemove={(cid) => onRemoveChild?.(verb.id, cid)}
                  onMove={() => {}}
                />
              ))}
              <div className="flex gap-1 flex-wrap">
                {def.nestable.map(childTag => {
                  const childDef = VERB_MAP[childTag];
                  return (
                    <button key={childTag} onClick={() => onAddChild?.(verb.id, childTag)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors font-mono">
                      <Plus className="w-2.5 h-2.5" /> {childDef.icon} {childTag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface TwiMLBuilderProps {
  onInsertToChat?: (twiml: string) => void;
}

export function TwiMLBuilder({ onInsertToChat }: TwiMLBuilderProps) {
  const [verbs, setVerbs] = useState<VerbInstance[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");

  const xml = useMemo(() => generateTwiML(verbs), [verbs]);

  const addVerb = useCallback((tag: string) => {
    setVerbs(v => [...v, makeVerb(tag)]);
    setActiveTab("builder");
  }, []);

  const updateVerb = useCallback((id: string, updates: Partial<VerbInstance>) => {
    setVerbs(vs => vs.map(v => v.id === id ? { ...v, ...updates } : v));
  }, []);

  const removeVerb = useCallback((id: string) => {
    setVerbs(vs => vs.filter(v => v.id !== id));
  }, []);

  const moveVerb = useCallback((id: string, dir: -1 | 1) => {
    setVerbs(vs => {
      const idx = vs.findIndex(v => v.id === id);
      if (idx < 0) return vs;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= vs.length) return vs;
      const arr = [...vs];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }, []);

  const addChild = useCallback((parentId: string, tag: string) => {
    setVerbs(vs => vs.map(v => v.id === parentId ? { ...v, children: [...v.children, makeVerb(tag)] } : v));
  }, []);

  const removeChild = useCallback((parentId: string, childId: string) => {
    setVerbs(vs => vs.map(v => v.id === parentId ? { ...v, children: v.children.filter(c => c.id !== childId) } : v));
  }, []);

  const updateChild = useCallback((parentId: string, childId: string, updates: Partial<VerbInstance>) => {
    setVerbs(vs => vs.map(v => v.id === parentId
      ? { ...v, children: v.children.map(c => c.id === childId ? { ...c, ...updates } : c) }
      : v
    ));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    onInsertToChat?.(xml);
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Verb Palette */}
      <div className="px-3 py-2 border-b border-border/50 shrink-0">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 font-mono">Add TwiML Verb</div>
        <div className="flex flex-wrap gap-1">
          {VERB_DEFS.map(def => (
            <button key={def.tag} onClick={() => addVerb(def.tag)}
              className={cn("flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono font-semibold hover:scale-105 transition-transform cursor-pointer", def.color)}>
              <span>{def.icon}</span>
              <span>{def.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-1.5 shrink-0">
        {(["builder", "preview"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-3 py-1 rounded-md font-mono capitalize transition-colors text-[10px]",
              activeTab === tab ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
            {tab === "builder" ? `Builder (${verbs.length} verb${verbs.length !== 1 ? "s" : ""})` : "XML Preview"}
          </button>
        ))}
        {verbs.length > 0 && (
          <div className="ml-auto flex gap-1">
            {onInsertToChat && (
              <button onClick={handleInsert}
                className="flex items-center gap-1 px-2 py-1 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors">
                <MessageSquarePlus className="w-3 h-3" />
                Insert to Chat
              </button>
            )}
            <button onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded border border-border text-muted-foreground text-[10px] font-mono hover:text-foreground hover:bg-accent transition-colors">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy XML"}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {activeTab === "builder" ? (
          verbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <span className="text-3xl mb-2">📋</span>
              <p className="text-[11px]">Click a verb above to start building TwiML</p>
              <p className="text-[10px] mt-1 text-muted-foreground/60">Start with Say for a greeting or Gather for IVR input</p>
            </div>
          ) : (
            <div className="space-y-2">
              {verbs.map((verb, i) => (
                <VerbCard key={verb.id} verb={verb} index={i} total={verbs.length}
                  onUpdate={updateVerb} onRemove={removeVerb} onMove={moveVerb}
                  onAddChild={addChild} onRemoveChild={removeChild} onUpdateChild={updateChild}
                />
              ))}
            </div>
          )
        ) : (
          <div className="relative">
            <pre className="bg-[#151518] border border-border rounded-md p-3 font-mono text-[11px] whitespace-pre leading-relaxed text-foreground overflow-x-auto">
              <code>
                {xml.split("\n").map((line, i) => {
                  const trimmed = line.trimStart();
                  let color = "text-foreground";
                  if (trimmed.startsWith("<?") || trimmed.startsWith("<!--")) color = "text-muted-foreground";
                  else if (trimmed.startsWith("</")) color = "text-blue-300";
                  else if (trimmed.startsWith("<Response")) color = "text-yellow-300";
                  else if (trimmed.startsWith("<Say")) color = "text-blue-400";
                  else if (trimmed.startsWith("<Play")) color = "text-purple-400";
                  else if (trimmed.startsWith("<Gather")) color = "text-green-400";
                  else if (trimmed.startsWith("<Dial")) color = "text-yellow-400";
                  else if (trimmed.startsWith("<Record")) color = "text-red-400";
                  else if (trimmed.startsWith("<Redirect")) color = "text-cyan-400";
                  else if (trimmed.startsWith("<Reject")) color = "text-orange-400";
                  else if (trimmed.startsWith("<Hangup")) color = "text-rose-400";
                  else if (trimmed.startsWith("<Pause")) color = "text-gray-400";
                  else if (trimmed.startsWith("<Enqueue")) color = "text-indigo-400";
                  else if (trimmed.startsWith("<Leave")) color = "text-pink-400";
                  return <span key={i} className={color}>{line + "\n"}</span>;
                })}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
