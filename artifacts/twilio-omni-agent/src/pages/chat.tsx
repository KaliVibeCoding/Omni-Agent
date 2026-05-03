import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListConversations,
  useCreateConversation,
  useGetConversation,
  useDeleteConversation,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
  getSendAnthropicMessageUrl,
  useListOpenrouterConversations,
  useCreateOpenrouterConversation,
  useGetOpenrouterConversation,
  useDeleteOpenrouterConversation,
  getListOpenrouterConversationsQueryKey,
  getGetOpenrouterConversationQueryKey,
  getSendOpenrouterMessageUrl,
  useGetTwilioAccount,
  useListTwilioPhoneNumbers,
  useSendTwilioSms,
  useMakeTwilioCall,
  useTwilioLookup,
} from "@workspace/api-client-react";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { WebhookTester } from "@/components/webhook-tester";
import { TwiMLBuilder } from "@/components/twiml-builder";
import { LiveCallMonitor } from "@/components/live-call-monitor";
import { SmsCenter } from "@/components/sms-center";
import { ContactsPanel } from "@/components/contacts-panel";
import { NumberManager } from "@/components/number-manager";
import { VoicemailPanel } from "@/components/voicemail-panel";
import { QueuePanel } from "@/components/queue-panel";
import { UsagePanel } from "@/components/usage-panel";
import { AlertsPanel } from "@/components/alerts-panel";
import { VerifyPanel } from "@/components/verify-panel";
import { MessagingServicesPanel } from "@/components/messaging-services-panel";
import { StudioPanel } from "@/components/studio-panel";
import { SLASH_COMMANDS } from "@/lib/slash-commands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trash2, MessageSquare, Plus, Send, Terminal, Mic, MicOff,
  Volume2, VolumeX, ChevronDown, Phone, MessageCircle, Search,
  Zap, Activity, X, Download, FileCode, Webhook, Code2, Radio,
  MessageSquareDashed, Users, Hash, Voicemail, Layers, DollarSign,
  AlertTriangle, ShieldCheck, Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const MODELS = [
  { id: "claude", label: "Claude Sonnet 4", provider: "Anthropic", color: "text-orange-400" },
  { id: "moonshotai/kimi-k2.6", label: "Kimi K2.6", provider: "Moonshot AI", color: "text-blue-400" },
  { id: "minimax/minimax-m2.7", label: "MiniMax M2.7", provider: "MiniMax", color: "text-purple-400" },
  { id: "moonshotai/kimi-k2-thinking", label: "Kimi K2 Thinking", provider: "Moonshot AI", color: "text-cyan-400" },
  { id: "minimax/minimax-m2.5", label: "MiniMax M2.5", provider: "MiniMax", color: "text-violet-400" },
];

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/---+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Panel = "none" | "twilio" | "webhook" | "twiml" | "calls" | "sms" | "contacts" | "numbers" | "voicemail" | "queues" | "usage" | "alerts" | "verify" | "messaging" | "studio";

export default function ChatPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>("none");

  // Twilio tools state
  const [smsTo, setSmsTo] = useState("");
  const [smsFrom, setSmsFrom] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [smsResult, setSmsResult] = useState("");
  const [callTo, setCallTo] = useState("");
  const [callFrom, setCallFrom] = useState("");
  const [callTwiml, setCallTwiml] = useState('<Response><Say voice="Polly.Joanna-Neural">Hello from RJ Business Solutions.</Say></Response>');
  const [callResult, setCallResult] = useState("");
  const [lookupNumber, setLookupNumber] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [twilioTab, setTwilioTab] = useState<"account" | "sms" | "call" | "lookup">("account");

  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isOpenRouter = selectedModel.id !== "claude";

  // Anthropic hooks
  const { data: anthropicConvs, isLoading: loadingAnthropic } = useListConversations({
    query: { enabled: !isOpenRouter }
  });
  const { data: anthropicActive } = useGetConversation(activeId!, {
    query: { enabled: !isOpenRouter && !!activeId, queryKey: getGetConversationQueryKey(activeId!) }
  });
  const createAnthropicConv = useCreateConversation();
  const deleteAnthropicConv = useDeleteConversation();

  // OpenRouter hooks
  const { data: openrouterConvs, isLoading: loadingOpenRouter } = useListOpenrouterConversations({
    query: { enabled: isOpenRouter }
  });
  const { data: openrouterActive } = useGetOpenrouterConversation(activeId!, {
    query: { enabled: isOpenRouter && !!activeId, queryKey: getGetOpenrouterConversationQueryKey(activeId!) }
  });
  const createOpenRouterConv = useCreateOpenrouterConversation();
  const deleteOpenRouterConv = useDeleteOpenrouterConversation();

  // Twilio hooks
  const { data: twilioAccount } = useGetTwilioAccount({ query: { enabled: activePanel === "twilio" } });
  const { data: phoneNumbers } = useListTwilioPhoneNumbers({ query: { enabled: activePanel === "twilio" } });
  const sendSms = useSendTwilioSms();
  const makeCall = useMakeTwilioCall();
  const lookupPhone = useTwilioLookup();

  const conversations = isOpenRouter ? openrouterConvs : anthropicConvs;
  const activeConversation = isOpenRouter ? openrouterActive : anthropicActive;
  const loadingConversations = isOpenRouter ? loadingOpenRouter : loadingAnthropic;

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeConversation?.messages, streamingMessage]);
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
  }, [activeId, selectedModel]);

  // Reset active conversation when switching model providers
  useEffect(() => { setActiveId(null); }, [isOpenRouter]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onstart = () => { setIsListening(true); setInterimTranscript(""); };
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      if (final) { setInput(p => (p + " " + final).trimStart()); setInterimTranscript(""); }
      else setInterimTranscript(interim);
    };
    rec.onerror = () => stopListening();
    rec.onend = () => { setIsListening(false); setInterimTranscript(""); recognitionRef.current = null; };
    recognitionRef.current = rec;
    rec.start();
  }, [stopListening]);

  const toggleVoice = useCallback(() => {
    isListening ? stopListening() : startListening();
  }, [isListening, startListening, stopListening]);

  const handleSpeak = useCallback((msgId: number, content: string) => {
    if (!window.speechSynthesis) return;
    if (speakingMsgId === msgId) { window.speechSynthesis.cancel(); setSpeakingMsgId(null); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(stripMarkdown(content));
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v =>
      v.name.includes("Google US English") || v.name.includes("Samantha") ||
      v.name.includes("Alex") || (v.lang === "en-US" && !v.name.includes("("))
    );
    if (pref) utt.voice = pref;
    setSpeakingMsgId(msgId);
    utt.onend = () => setSpeakingMsgId(null);
    utt.onerror = () => setSpeakingMsgId(null);
    window.speechSynthesis.speak(utt);
  }, [speakingMsgId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSlashCommands) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex(p => Math.min(p + 1, filteredCommands.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlashIndex(p => Math.max(p - 1, 0)); return; }
      if (e.key === "Enter") { e.preventDefault(); handleSelectCommand(filteredCommands[slashIndex].command); return; }
      if (e.key === "Escape") { e.preventDefault(); setShowSlashCommands(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const idx = val.lastIndexOf("/");
    if (idx !== -1 && !val.substring(idx).includes(" ")) {
      setShowSlashCommands(true); setSlashFilter(val.substring(idx + 1).toLowerCase()); setSlashIndex(0);
    } else setShowSlashCommands(false);
  };

  const handleSelectCommand = (command: string) => {
    const idx = input.lastIndexOf("/");
    if (idx !== -1) { setInput(input.substring(0, idx) + command + " "); setShowSlashCommands(false); inputRef.current?.focus(); }
  };

  const filteredCommands = SLASH_COMMANDS.filter(c =>
    c.command.toLowerCase().includes(slashFilter) || c.description.toLowerCase().includes(slashFilter)
  ).slice(0, 10);

  const handleSend = async () => {
    if (isListening) stopListening();
    if (!input.trim() || isStreaming) return;
    let conversationId = activeId;
    const content = input;
    setInput(""); setShowSlashCommands(false);
    window.speechSynthesis?.cancel(); setSpeakingMsgId(null);

    if (!conversationId) {
      try {
        const title = content.length > 40 ? content.substring(0, 40) + "..." : content;
        if (isOpenRouter) {
          const c = await createOpenRouterConv.mutateAsync({ data: { title } });
          conversationId = c.id; setActiveId(c.id);
          queryClient.invalidateQueries({ queryKey: getListOpenrouterConversationsQueryKey() });
        } else {
          const c = await createAnthropicConv.mutateAsync({ data: { title } });
          conversationId = c.id; setActiveId(c.id);
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        }
      } catch (err) { console.error("Failed to create conversation", err); return; }
    }

    if (conversationId) {
      const qKey = isOpenRouter ? getGetOpenrouterConversationQueryKey(conversationId) : getGetConversationQueryKey(conversationId);
      queryClient.setQueryData(qKey, (old: any) => old ? {
        ...old,
        messages: [...(old.messages || []), { id: Date.now(), role: "user", content, createdAt: new Date().toISOString() }]
      } : old);
    }

    setIsStreaming(true); setStreamingMessage("");

    try {
      const url = isOpenRouter
        ? getSendOpenrouterMessageUrl(conversationId!)
        : getSendAnthropicMessageUrl(conversationId!);

      const body = isOpenRouter
        ? JSON.stringify({ content, model: selectedModel.id })
        : JSON.stringify({ content });

      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false, finalContent = "";

      while (!done && reader) {
        const { value, done: rd } = await reader.read();
        if (rd) { done = true; break; }
        const lines = decoder.decode(value, { stream: true }).split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.done) done = true;
              else if (data.content) { finalContent += data.content; setStreamingMessage(finalContent); }
            } catch (_e) {}
          }
        }
      }

      if (isOpenRouter) {
        queryClient.invalidateQueries({ queryKey: getListOpenrouterConversationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOpenrouterConversationQueryKey(conversationId!) });
      } else {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId!) });
      }
    } catch (err) { console.error("Stream error", err); }
    finally { setIsStreaming(false); setStreamingMessage(""); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpenRouter) {
      await deleteOpenRouterConv.mutateAsync({ conversationId: id });
      queryClient.invalidateQueries({ queryKey: getListOpenrouterConversationsQueryKey() });
    } else {
      await deleteAnthropicConv.mutateAsync({ conversationId: id });
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    }
    if (activeId === id) setActiveId(null);
  };

  const handleSendSms = async () => {
    if (!smsTo || !smsFrom || !smsBody) return;
    try {
      const result = await sendSms.mutateAsync({ data: { to: smsTo, from: smsFrom, body: smsBody } });
      setSmsResult(`✓ Sent! SID: ${result.sid} — Status: ${result.status}`);
    } catch (err: any) { setSmsResult(`✗ Error: ${err?.message || "Failed"}`); }
  };

  const handleMakeCall = async () => {
    if (!callTo || !callFrom) return;
    try {
      const result = await makeCall.mutateAsync({ data: { to: callTo, from: callFrom, twiml: callTwiml } });
      setCallResult(`✓ Call initiated! SID: ${result.sid} — Status: ${result.status}`);
    } catch (err: any) { setCallResult(`✗ Error: ${err?.message || "Failed"}`); }
  };

  const handleLookup = async () => {
    if (!lookupNumber) return;
    try {
      const result = await lookupPhone.mutateAsync({ data: { phoneNumber: lookupNumber, fields: ["line_type_intelligence", "caller_name"] } });
      setLookupResult(result);
    } catch (err: any) { setLookupResult({ error: err?.message || "Failed" }); }
  };

  const handleExportMarkdown = () => {
    if (!activeConversation) return;
    const title = activeConversation.title ?? "conversation";
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const date = new Date().toISOString().slice(0, 10);
    const modelLabel = currentModel.label;
    let md = `# ${title}\n\n`;
    md += `**Model:** ${modelLabel}  \n`;
    md += `**Date:** ${date}  \n`;
    md += `**Provider:** ${currentModel.provider}  \n\n`;
    md += `---\n\n`;
    for (const msg of activeConversation.messages ?? []) {
      if (msg.role === "user") {
        md += `## You\n\n${msg.content}\n\n`;
      } else {
        md += `## Omni-Agent\n\n${msg.content}\n\n`;
      }
      md += `---\n\n`;
    }
    md += `*Generated by Twilio Omni-Agent · RJ Business Solutions · ${date}*\n`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `twilio-omni-agent-${slug}-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const displayInput = isListening && interimTranscript ? (input ? input + " " : "") + interimTranscript : input;
  const ttsSupported = typeof window !== "undefined" && !!window.speechSynthesis;
  const currentModel = MODELS.find(m => m.id === selectedModel.id) ?? MODELS[0];

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden font-sans dark">
      {/* Sidebar */}
      <div className="w-60 border-r border-border bg-[#0d0d0f] flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img src="https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg"
            alt="RJ Business Solutions" className="w-8 h-8 rounded" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-white">RJ Business</span>
            <span className="text-[10px] text-primary uppercase tracking-wider font-mono">Omni-Agent</span>
          </div>
        </div>

        {/* Model selector */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(p => !p)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#151518] border border-border rounded-lg text-xs hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Zap className={cn("w-3 h-3 flex-shrink-0", currentModel.color)} />
                <span className="truncate font-medium text-foreground">{currentModel.label}</span>
              </div>
              <ChevronDown className={cn("w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform", showModelDropdown && "rotate-180")} />
            </button>
            {showModelDropdown && (
              <div className="absolute top-full left-0 w-full mt-1 bg-[#1f1f23] border border-border rounded-lg shadow-xl overflow-hidden z-50">
                {MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m); setShowModelDropdown(false); }}
                    className={cn(
                      "w-full flex flex-col items-start px-3 py-2 text-left hover:bg-accent transition-colors",
                      selectedModel.id === m.id ? "bg-primary/10" : ""
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className={cn("w-3 h-3", m.color)} />
                      <span className="text-xs font-medium text-foreground">{m.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-5">{m.provider}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3">
          <Button
            onClick={() => setActiveId(null)}
            className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            New deployment
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-4">
            {loadingConversations ? (
              [1, 2, 3].map(i => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)
            ) : !conversations?.length ? (
              <div className="text-xs text-muted-foreground px-2 py-4 text-center">No active deployments.</div>
            ) : conversations.map((conv) => (
              <div key={conv.id} onClick={() => setActiveId(conv.id)}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors",
                  activeId === conv.id ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <Button variant="ghost" size="icon"
                  className="w-6 h-6 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-opacity"
                  onClick={(e) => handleDelete(conv.id, e)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom Buttons */}
        <div className="p-3 border-t border-border space-y-1.5">
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "twilio" ? "none" : "twilio")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "twilio"
                ? "bg-primary/10 border-primary/40 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            Twilio Live Tools
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "webhook" ? "none" : "webhook")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "webhook"
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Webhook className="w-3.5 h-3.5" />
            Webhook Tester
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "twiml" ? "none" : "twiml")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "twiml"
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            TwiML Builder
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "calls" ? "none" : "calls")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "calls"
                ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Radio className="w-3.5 h-3.5" />
            Live Call Monitor
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "sms" ? "none" : "sms")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "sms"
                ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquareDashed className="w-3.5 h-3.5" />
            SMS Center
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "contacts" ? "none" : "contacts")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "contacts"
                ? "bg-violet-500/10 border-violet-500/40 text-violet-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            Contacts
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "numbers" ? "none" : "numbers")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "numbers"
                ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Hash className="w-3.5 h-3.5" />
            Number Manager
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "voicemail" ? "none" : "voicemail")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "voicemail"
                ? "bg-teal-500/10 border-teal-500/40 text-teal-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Voicemail className="w-3.5 h-3.5" />
            Voicemail
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "queues" ? "none" : "queues")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "queues"
                ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Call Queues
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "usage" ? "none" : "usage")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "usage"
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Usage & Billing
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "alerts" ? "none" : "alerts")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "alerts"
                ? "bg-red-500/10 border-red-500/40 text-red-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Alerts
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "verify" ? "none" : "verify")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "verify"
                ? "bg-violet-500/10 border-violet-500/40 text-violet-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verify / 2FA
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "messaging" ? "none" : "messaging")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "messaging"
                ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquareDashed className="w-3.5 h-3.5" />
            Messaging Services
          </Button>
          <Button
            variant="outline"
            onClick={() => setActivePanel(p => p === "studio" ? "none" : "studio")}
            className={cn(
              "w-full justify-start gap-2 text-xs transition-colors",
              activePanel === "studio"
                ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Workflow className="w-3.5 h-3.5" />
            Studio Flows
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-[#080809] min-w-0">

        {/* Twilio Panel */}
        {activePanel === "twilio" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary font-mono">Twilio Live Tools</span>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1 px-4 pt-2">
              {(["account", "sms", "call", "lookup"] as const).map(tab => (
                <button key={tab} onClick={() => setTwilioTab(tab)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-md font-mono capitalize transition-colors",
                    twilioTab === tab ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="px-4 py-3 space-y-2 max-h-56 overflow-y-auto">
              {twilioTab === "account" && (
                <div className="space-y-2">
                  {twilioAccount ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["Account", twilioAccount.friendlyName],
                        ["SID", twilioAccount.sid?.slice(0, 20) + "..."],
                        ["Status", twilioAccount.status],
                        ["Balance", `${twilioAccount.balance} ${twilioAccount.currency}`],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-[#151518] border border-border rounded px-3 py-2">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
                          <div className="text-xs font-mono text-foreground mt-0.5 truncate">{value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground font-mono">Loading account info...</div>
                  )}
                  {phoneNumbers && phoneNumbers.length > 0 && (
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Phone Numbers</div>
                      <div className="space-y-1">
                        {phoneNumbers.map(n => (
                          <div key={n.sid} className="flex items-center gap-3 bg-[#151518] border border-border rounded px-3 py-1.5">
                            <span className="text-xs font-mono text-primary">{n.phoneNumber}</span>
                            <span className="text-[10px] text-muted-foreground">{n.friendlyName}</span>
                            <div className="ml-auto flex gap-1">
                              {n.capabilities.sms && <span className="text-[9px] px-1 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono">SMS</span>}
                              {n.capabilities.voice && <span className="text-[9px] px-1 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono">VOICE</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {twilioTab === "sms" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">To (E.164)</label>
                      <Input value={smsTo} onChange={e => setSmsTo(e.target.value)} placeholder="+15551234567"
                        className="mt-1 h-8 text-xs bg-[#151518] border-border" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">From (Twilio #)</label>
                      <Input value={smsFrom} onChange={e => setSmsFrom(e.target.value)}
                        placeholder={phoneNumbers?.[0]?.phoneNumber || "+15551234567"}
                        className="mt-1 h-8 text-xs bg-[#151518] border-border" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Message</label>
                    <Input value={smsBody} onChange={e => setSmsBody(e.target.value)} placeholder="Your message..."
                      className="mt-1 h-8 text-xs bg-[#151518] border-border" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleSendSms} disabled={sendSms.isPending} size="sm"
                      className="h-7 text-xs bg-primary hover:bg-primary/90 gap-1.5">
                      <MessageCircle className="w-3 h-3" /> {sendSms.isPending ? "Sending..." : "Send SMS"}
                    </Button>
                    {smsResult && <span className={cn("text-xs font-mono", smsResult.startsWith("✓") ? "text-green-400" : "text-red-400")}>{smsResult}</span>}
                  </div>
                </div>
              )}

              {twilioTab === "call" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">To (E.164)</label>
                      <Input value={callTo} onChange={e => setCallTo(e.target.value)} placeholder="+15551234567"
                        className="mt-1 h-8 text-xs bg-[#151518] border-border" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">From (Twilio #)</label>
                      <Input value={callFrom} onChange={e => setCallFrom(e.target.value)}
                        placeholder={phoneNumbers?.[0]?.phoneNumber || "+15551234567"}
                        className="mt-1 h-8 text-xs bg-[#151518] border-border" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">TwiML</label>
                    <Input value={callTwiml} onChange={e => setCallTwiml(e.target.value)}
                      className="mt-1 h-8 text-xs bg-[#151518] border-border font-mono" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleMakeCall} disabled={makeCall.isPending} size="sm"
                      className="h-7 text-xs bg-primary hover:bg-primary/90 gap-1.5">
                      <Phone className="w-3 h-3" /> {makeCall.isPending ? "Calling..." : "Make Call"}
                    </Button>
                    {callResult && <span className={cn("text-xs font-mono", callResult.startsWith("✓") ? "text-green-400" : "text-red-400")}>{callResult}</span>}
                  </div>
                </div>
              )}

              {twilioTab === "lookup" && (
                <div className="space-y-2">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone Number (E.164)</label>
                      <Input value={lookupNumber} onChange={e => setLookupNumber(e.target.value)} placeholder="+15551234567"
                        className="mt-1 h-8 text-xs bg-[#151518] border-border" />
                    </div>
                    <Button onClick={handleLookup} disabled={lookupPhone.isPending} size="sm"
                      className="h-8 text-xs bg-primary hover:bg-primary/90 gap-1.5">
                      <Search className="w-3 h-3" /> {lookupPhone.isPending ? "..." : "Lookup"}
                    </Button>
                  </div>
                  {lookupResult && (
                    <div className="bg-[#151518] border border-border rounded p-2 font-mono text-xs whitespace-pre-wrap break-all text-foreground">
                      {lookupResult.error ? (
                        <span className="text-red-400">{lookupResult.error}</span>
                      ) : (
                        JSON.stringify(lookupResult, null, 2)
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Webhook Tester Panel */}
        {activePanel === "webhook" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "22rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Webhook className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">Webhook Tester</span>
                <span className="text-[10px] text-muted-foreground">— simulate Twilio webhooks to any URL</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <WebhookTester />
            </div>
          </div>
        )}

        {/* Live Call Monitor Panel */}
        {activePanel === "calls" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "24rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 font-mono">Live Call Monitor</span>
                <span className="text-[10px] text-muted-foreground">— whisper, transfer, hang up · D1 call logs</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <LiveCallMonitor />
            </div>
          </div>
        )}

        {/* SMS Center Panel */}
        {activePanel === "sms" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquareDashed className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">SMS Center</span>
                <span className="text-[10px] text-muted-foreground">— compose, inbox, D1 logs &amp; analytics</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SmsCenter />
            </div>
          </div>
        )}

        {/* Voicemail Panel */}
        {activePanel === "voicemail" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Voicemail className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">Voicemail</span>
                <span className="text-[10px] text-muted-foreground">— transcriptions, audio playback &amp; SMS reply</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <VoicemailPanel />
            </div>
          </div>
        )}

        {/* Call Queues Panel */}
        {activePanel === "queues" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 font-mono">Call Queues</span>
                <span className="text-[10px] text-muted-foreground">— queue depth, wait times &amp; member list</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <QueuePanel />
            </div>
          </div>
        )}

        {/* Usage & Billing Panel */}
        {activePanel === "usage" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">Usage & Billing</span>
                <span className="text-[10px] text-muted-foreground">— costs by resource · today / month / all time</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <UsagePanel />
            </div>
          </div>
        )}

        {/* Alerts Panel */}
        {activePanel === "alerts" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400 font-mono">Alerts</span>
                <span className="text-[10px] text-muted-foreground">— errors, warnings &amp; webhook failures</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AlertsPanel />
            </div>
          </div>
        )}

        {/* Verify / 2FA Panel */}
        {activePanel === "verify" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 font-mono">Verify / 2FA</span>
                <span className="text-[10px] text-muted-foreground">— send &amp; check verification codes via SMS / call / email</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <VerifyPanel />
            </div>
          </div>
        )}

        {/* Messaging Services Panel */}
        {activePanel === "messaging" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquareDashed className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">Messaging Services</span>
                <span className="text-[10px] text-muted-foreground">— sender pools, webhooks &amp; smart encoding</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MessagingServicesPanel />
            </div>
          </div>
        )}

        {/* Studio Flows Panel */}
        {activePanel === "studio" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Workflow className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 font-mono">Studio Flows</span>
                <span className="text-[10px] text-muted-foreground">— view flows, executions &amp; trigger runs</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <StudioPanel />
            </div>
          </div>
        )}

        {/* Number Manager Panel */}
        {activePanel === "numbers" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-400 font-mono">Number Manager</span>
                <span className="text-[10px] text-muted-foreground">— configure webhooks, capabilities &amp; friendly names</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <NumberManager />
            </div>
          </div>
        )}

        {/* Contacts Panel */}
        {activePanel === "contacts" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "32rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 font-mono">Contacts</span>
                <span className="text-[10px] text-muted-foreground">— search, add, edit &amp; tag contacts in D1</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ContactsPanel />
            </div>
          </div>
        )}

        {/* TwiML Builder Panel */}
        {activePanel === "twiml" && (
          <div className="border-b border-border bg-[#0d0d0f] flex-shrink-0 flex flex-col" style={{ maxHeight: "26rem" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">TwiML Builder</span>
                <span className="text-[10px] text-muted-foreground">— visually compose TwiML, preview XML, insert into chat</span>
              </div>
              <button onClick={() => setActivePanel("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <TwiMLBuilder onInsertToChat={(twiml) => {
                setInput(prev => prev ? prev + "\n\n" + twiml : twiml);
                setActivePanel("none");
                setTimeout(() => inputRef.current?.focus(), 50);
              }} />
            </div>
          </div>
        )}

        {/* Chat area */}
        {!activeId && !activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-[#1a1a1e] rounded-xl border border-border flex items-center justify-center mb-6 shadow-2xl">
              <Terminal className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Twilio Omni-Agent Command Center</h2>
            <p className="text-muted-foreground max-w-md text-sm">
              Powered by <span className={cn("font-semibold", currentModel.color)}>{currentModel.label}</span> ({currentModel.provider}).
              Full-stack Twilio builder for RJ Business Solutions.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-xl">
              {[
                { cmd: "/build-nodejs-app", label: "Build Node.js App", icon: "⚡" },
                { cmd: "/build-ai-voice-agent", label: "AI Voice Agent", icon: "🤖" },
                { cmd: "/build-sms-platform", label: "SMS Platform", icon: "💬" },
                { cmd: "/build-call-center", label: "Call Center System", icon: "📞" },
                { cmd: "/integrate-gohighlevel", label: "GoHighLevel Integration", icon: "🔗" },
                { cmd: "/build-2fa-system", label: "2FA / Verify System", icon: "🔐" },
                { cmd: "/build-whatsapp-bot", label: "WhatsApp Bot", icon: "💚" },
                { cmd: "/build-react-voip", label: "React VoIP Client", icon: "🎙️" },
              ].map(({ cmd, label, icon }) => (
                <button key={cmd} onClick={() => { setInput(cmd + " "); inputRef.current?.focus(); }}
                  className="flex items-center gap-2.5 px-4 py-3 bg-[#1a1a1e] border border-border rounded-lg text-left hover:border-primary/40 hover:bg-[#1f1f24] transition-all group">
                  <span className="text-base">{icon}</span>
                  <div>
                    <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{cmd}</div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-6 font-mono">Type <span className="text-primary">/</span> to see all 60+ commands</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat toolbar */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-border/50 bg-[#0a0a0c] flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileCode className="w-3.5 h-3.5 text-primary/60" />
                <span className="font-mono truncate max-w-xs">{activeConversation?.title ?? "..."}</span>
              </div>
              {activeConversation && (
                <Button
                  variant="ghost" size="sm"
                  onClick={handleExportMarkdown}
                  className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent font-mono"
                  title="Download conversation as Markdown"
                >
                  <Download className="w-3 h-3" />
                  Export .md
                </Button>
              )}
            </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-8" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-8 pb-4">
              {activeConversation?.messages?.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <Terminal className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={cn("px-4 py-3 rounded-lg max-w-[85%]",
                    msg.role === "user" ? "bg-[#1f1f23] text-foreground border border-border" : "bg-transparent text-foreground")}>
                    {msg.role === "user" ? (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    ) : (
                      <>
                        <MarkdownRenderer content={msg.content} />
                        {ttsSupported && (
                          <div className="mt-2">
                            <button onClick={() => handleSpeak(msg.id, msg.content)}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono transition-colors",
                                speakingMsgId === msg.id
                                  ? "text-primary bg-primary/10 border border-primary/30"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                              )}>
                              {speakingMsgId === msg.id ? <><VolumeX className="w-3 h-3" /><span>Stop</span></> : <><Volume2 className="w-3 h-3" /><span>Read aloud</span></>}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && streamingMessage && (
                <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <Terminal className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="px-4 py-3 rounded-lg max-w-[85%] bg-transparent text-foreground">
                    <MarkdownRenderer content={streamingMessage + " ▍"} />
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-[#080809] border-t border-border flex-shrink-0">
          <div className="max-w-3xl mx-auto relative">
            {showSlashCommands && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1f1f23] border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[280px] overflow-y-auto">
                <div className="px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider bg-[#151518]">
                  Available Commands
                </div>
                {filteredCommands.length > 0 ? (
                  <div className="p-1">
                    {filteredCommands.map((cmd, idx) => (
                      <div key={cmd.command} onClick={() => handleSelectCommand(cmd.command)}
                        className={cn("px-3 py-2 rounded flex flex-col gap-0.5 cursor-pointer text-sm",
                          idx === slashIndex ? "bg-primary/20" : "hover:bg-accent text-foreground")}>
                        <span className={cn("font-mono font-medium", idx === slashIndex ? "text-primary" : "text-foreground")}>{cmd.command}</span>
                        <span className="text-xs text-muted-foreground truncate">{cmd.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-center text-muted-foreground">No commands found</div>
                )}
              </div>
            )}

            {isListening && (
              <div className="absolute bottom-full left-0 mb-2 flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Listening{interimTranscript ? `: ${interimTranscript}` : "..."}
              </div>
            )}

            <div className={cn(
              "relative flex items-center bg-[#151518] rounded-xl border shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all",
              isListening ? "border-red-500/50 ring-1 ring-red-500/30" : "border-border"
            )}>
              <Input ref={inputRef} value={displayInput} onChange={handleInputChange} onKeyDown={handleKeyDown}
                placeholder={isListening ? "Speak now..." : `Message ${currentModel.label}... (Type '/' for commands)`}
                className={cn("w-full bg-transparent border-0 focus-visible:ring-0 shadow-none px-4 py-6 text-sm",
                  isListening && interimTranscript ? "text-muted-foreground italic" : "")}
                disabled={isStreaming} />
              <div className="flex items-center gap-1 absolute right-2">
                {voiceSupported && (
                  <Button type="button" onClick={toggleVoice} disabled={isStreaming} size="icon"
                    className={cn("h-8 w-8 rounded-md transition-colors",
                      isListening ? "bg-red-500 hover:bg-red-600 text-white" : "bg-transparent hover:bg-accent text-muted-foreground hover:text-foreground border border-transparent hover:border-border")}
                    title={isListening ? "Stop listening" : "Speak your message"}>
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
                <Button onClick={handleSend} disabled={!input.trim() || isStreaming} size="icon"
                  className="h-8 w-8 rounded-md bg-primary hover:bg-primary/90 transition-colors">
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
            <div className="text-center mt-2 text-[10px] text-muted-foreground font-mono">
              <span className={cn("font-semibold", currentModel.color)}>{currentModel.label}</span>
              {" · "}Press Enter to send{voiceSupported ? " · Mic to speak" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
