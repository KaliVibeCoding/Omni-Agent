import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListConversations, 
  useCreateConversation, 
  useGetConversation, 
  useDeleteConversation,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
  getSendAnthropicMessageUrl
} from "@workspace/api-client-react";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import { SLASH_COMMANDS } from "@/lib/slash-commands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, MessageSquare, Plus, Send, Terminal, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function ChatPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { data: conversations, isLoading: loadingConversations } = useListConversations();
  const { data: activeConversation } = useGetConversation(activeId!, {
    query: {
      enabled: !!activeId,
      queryKey: getGetConversationQueryKey(activeId!)
    }
  });

  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognitionAPI);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, streamingMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setInput((prev) => (prev + " " + final).trimStart());
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = () => {
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [stopListening]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSlashCommands) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelectCommand(filteredCommands[slashIndex].command);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashCommands(false);
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const lastSlashIdx = val.lastIndexOf("/");
    if (lastSlashIdx !== -1 && !val.substring(lastSlashIdx).includes(" ")) {
      setShowSlashCommands(true);
      setSlashFilter(val.substring(lastSlashIdx + 1).toLowerCase());
      setSlashIndex(0);
    } else {
      setShowSlashCommands(false);
    }
  };

  const handleSelectCommand = (command: string) => {
    const lastSlashIdx = input.lastIndexOf("/");
    if (lastSlashIdx !== -1) {
      const newInput = input.substring(0, lastSlashIdx) + command + " ";
      setInput(newInput);
      setShowSlashCommands(false);
      inputRef.current?.focus();
    }
  };

  const filteredCommands = SLASH_COMMANDS.filter(c => 
    c.command.toLowerCase().includes(slashFilter) || 
    c.description.toLowerCase().includes(slashFilter)
  ).slice(0, 10);

  const handleSend = async () => {
    if (isListening) stopListening();
    if (!input.trim() || isStreaming) return;
    
    let conversationId = activeId;
    const content = input;
    setInput("");
    setShowSlashCommands(false);

    if (!conversationId) {
      try {
        const title = content.length > 40 ? content.substring(0, 40) + "..." : content;
        const newConv = await createConversation.mutateAsync({ data: { title } });
        conversationId = newConv.id;
        setActiveId(newConv.id);
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      } catch (err) {
        console.error("Failed to create conversation", err);
        return;
      }
    }

    if (conversationId) {
      const qKey = getGetConversationQueryKey(conversationId);
      queryClient.setQueryData(qKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...(old.messages || []),
            { id: Date.now(), role: "user", content, createdAt: new Date().toISOString() }
          ]
        };
      });
    }

    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch(getSendAnthropicMessageUrl(conversationId!), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let finalContent = "";

      while (!done && reader) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) { done = true; break; }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                done = true;
              } else if (data.content) {
                finalContent += data.content;
                setStreamingMessage(finalContent);
              }
            } catch (_e) {}
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId!) });

    } catch (err) {
      console.error("Stream error", err);
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation.mutateAsync({ conversationId: id });
    if (activeId === id) setActiveId(null);
    queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
  };

  const displayInput = isListening && interimTranscript
    ? (input ? input + " " : "") + interimTranscript
    : input;

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden font-sans dark">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-[#0d0d0f] flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img 
            src="https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg" 
            alt="RJ Business Solutions" 
            className="w-8 h-8 rounded"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-white">RJ Business</span>
            <span className="text-[10px] text-primary uppercase tracking-wider font-mono">Omni-Agent</span>
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
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : conversations?.length === 0 ? (
              <div className="text-xs text-muted-foreground px-2 py-4 text-center">No active deployments.</div>
            ) : (
              conversations?.map((conv) => (
                <div 
                  key={conv.id}
                  data-testid={`conversation-item-${conv.id}`}
                  onClick={() => setActiveId(conv.id)}
                  className={cn(
                    "group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors",
                    activeId === conv.id 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`button-delete-${conv.id}`}
                    className="w-6 h-6 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-opacity"
                    onClick={(e) => handleDelete(conv.id, e)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#080809]">
        {!activeId && !activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-[#1a1a1e] rounded-xl border border-border flex items-center justify-center mb-6 shadow-2xl">
              <Terminal className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Twilio Omni-Agent Command Center</h2>
            <p className="text-muted-foreground max-w-md">
              A high-stakes AI assistant for Twilio engineering. Powered by Anthropic. Built for RJ Business Solutions.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
              {["/twilio-voice-ivr", "/twilio-sms-2way", "/twilio-ai-assistant", "/twilio-conf-bridge"].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => { setInput(cmd + " "); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 bg-[#1a1a1e] border border-border rounded-md text-xs font-mono text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-8" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-8 pb-4">
              {activeConversation?.messages?.map((msg) => (
                <div 
                  key={msg.id}
                  data-testid={`message-${msg.role}-${msg.id}`}
                  className={cn(
                    "flex gap-4",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <Terminal className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div 
                    className={cn(
                      "px-4 py-3 rounded-lg max-w-[85%]",
                      msg.role === "user" 
                        ? "bg-[#1f1f23] text-foreground border border-border" 
                        : "bg-transparent text-foreground"
                    )}
                  >
                    {msg.role === "user" ? (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
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
        )}

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-[#080809] border-t border-border">
          <div className="max-w-3xl mx-auto relative">
            
            {showSlashCommands && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1f1f23] border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                <div className="px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider bg-[#151518]">
                  Available Commands
                </div>
                {filteredCommands.length > 0 ? (
                  <div className="p-1">
                    {filteredCommands.map((cmd, idx) => (
                      <div 
                        key={cmd.command}
                        className={cn(
                          "px-3 py-2 rounded flex flex-col gap-0.5 cursor-pointer text-sm",
                          idx === slashIndex ? "bg-primary/20 text-primary-foreground" : "hover:bg-accent text-foreground"
                        )}
                        onClick={() => handleSelectCommand(cmd.command)}
                      >
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

            {/* Voice status indicator */}
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
              <Input 
                ref={inputRef}
                value={displayInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Speak now..." : "Message Omni-Agent... (Type '/' for commands)"}
                className={cn(
                  "w-full bg-transparent border-0 focus-visible:ring-0 shadow-none px-4 py-6 text-sm resize-none",
                  isListening && interimTranscript ? "text-muted-foreground italic" : ""
                )}
                disabled={isStreaming}
                data-testid="input-message"
              />

              <div className="flex items-center gap-1 absolute right-2">
                {voiceSupported && (
                  <Button
                    type="button"
                    onClick={toggleVoice}
                    disabled={isStreaming}
                    size="icon"
                    data-testid="button-voice"
                    className={cn(
                      "h-8 w-8 rounded-md transition-colors",
                      isListening
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-transparent hover:bg-accent text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                    )}
                    title={isListening ? "Stop listening" : "Speak your message"}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  size="icon"
                  data-testid="button-send"
                  className="h-8 w-8 rounded-md bg-primary hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
            <div className="text-center mt-2 text-[10px] text-muted-foreground font-mono">
              Press Enter to execute, Shift+Enter for newline{voiceSupported ? ", Mic to speak" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
