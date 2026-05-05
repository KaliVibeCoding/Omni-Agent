import { useState, useRef, useEffect, useCallback } from "react";

const BASE = import.meta.env.BASE_URL ?? "/";
const API = (BASE.endsWith("/") ? BASE.slice(0, -1) : BASE);

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const QUICK_CHIPS = [
  "How does pricing work?",
  "Is it HIPAA compliant?",
  "Do I need coding skills?",
  "What makes you different from plain Twilio?",
  "Can I try it free?",
];

const GREETING: Message = {
  role: "assistant",
  content: "Hi! I'm Alex from RJ Business Solutions 👋\n\nI can answer any question about our platform — features, pricing, telehealth, AI agents, or anything else. What would you like to know?",
};

export default function LandingChatWidget({ onSignUp }: { onSignUp: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Stop the pulse badge after 8 seconds
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setPulse(false);
    }
  }, [open]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    // Placeholder for streaming assistant response
    const assistantIdx = nextMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${API}/api/sales-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) => {
                const copy = [...prev];
                copy[assistantIdx] = { role: "assistant", content: accumulated, streaming: true };
                return copy;
              });
            }
          } catch {}
        }
      }

      setMessages((prev) => {
        const copy = [...prev];
        copy[assistantIdx] = { role: "assistant", content: accumulated, streaming: false };
        return copy;
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          copy[assistantIdx] = {
            role: "assistant",
            content: "Sorry, I ran into an issue. Please try again or email support@rjbusinesssolutions.org",
            streaming: false,
          };
          return copy;
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [messages, loading]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const showChips = messages.length <= 1;

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
        {/* Teaser bubble */}
        {!open && (
          <div
            className="bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm shadow-xl max-w-[220px] text-right animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <span className="text-zinc-300">Have a question?</span>
            <br />
            <span className="font-semibold">Ask our AI agent 👋</span>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 relative"
          style={{ background: "hsl(348 83% 47%)" }}
          aria-label="Open chat"
        >
          {open ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
          {pulse && !open && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="animate-ping absolute w-full h-full rounded-full bg-green-400 opacity-75" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-green-500" />
            </span>
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[9998] w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
          style={{ background: "hsl(222 47% 8%)", height: "520px" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: "hsl(348 83% 47%)" }}
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-none">Alex</p>
              <p className="text-red-200 text-xs mt-0.5">RJ Business Solutions · AI Agent</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-red-100 text-xs">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 mr-2"
                    style={{ background: "hsl(348 83% 47%)" }}>
                    A
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "text-white rounded-br-sm"
                      : "text-zinc-100 rounded-bl-sm"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "hsl(348 83% 47%)" }
                      : { background: "hsl(222 47% 14%)" }
                  }
                >
                  {msg.content}
                  {msg.streaming && (
                    <span className="inline-flex gap-0.5 ml-1 align-middle">
                      {[0, 1, 2].map((j) => (
                        <span
                          key={j}
                          className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce"
                          style={{ animationDelay: `${j * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          {showChips && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => send(chip)}
                  disabled={loading}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:border-red-500/60 hover:text-white transition-colors disabled:opacity-50"
                  style={{ background: "hsl(222 47% 12%)" }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* CTA strip */}
          <div
            className="px-4 py-2 flex-shrink-0 flex items-center justify-between border-t border-zinc-800/50"
            style={{ background: "hsl(222 47% 10%)" }}
          >
            <span className="text-xs text-zinc-500">Ready to get started?</span>
            <button
              onClick={onSignUp}
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-white transition-opacity hover:opacity-80"
              style={{ background: "hsl(348 83% 47%)" }}
            >
              Sign Up Free →
            </button>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 flex-shrink-0 flex gap-2 items-center border-t border-zinc-800">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              disabled={loading}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-opacity"
              style={{ background: "hsl(348 83% 47%)" }}
              aria-label="Send"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
