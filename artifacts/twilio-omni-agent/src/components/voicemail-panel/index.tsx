import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Voicemail, Play, Pause, RefreshCw, Trash2, MessageSquare,
  Clock, Calendar, DollarSign, Volume2, X, Send, ChevronDown,
  ChevronUp, AlertCircle, FileText, CheckCircle2,
} from "lucide-react";

const BASE = "/api/twilio";

interface VoicemailRecording {
  sid: string;
  duration: string;
  dateCreated: string;
  callSid: string;
  streamUrl: string;
}

interface VoicemailEntry {
  sid: string;
  status: string;
  duration: string | null;
  transcriptionText: string | null;
  recordingSid: string | null;
  dateCreated: string;
  price: string | null;
  priceUnit: string | null;
  recording: VoicemailRecording | null;
}

interface RecordingEntry {
  sid: string;
  callSid: string;
  duration: string;
  status: string;
  source: string;
  dateCreated: string;
  streamUrl: string;
  downloadUrl: string;
}

type VmTab = "transcribed" | "recordings";

const STATUS_STYLES: Record<string, string> = {
  completed: "text-green-400 border-green-500/30 bg-green-500/5",
  in_progress: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
  failed: "text-red-400 border-red-500/30 bg-red-500/5",
};

function fmtDur(secs: string | number | null | undefined) {
  const n = parseInt(String(secs ?? 0), 10);
  if (!n) return "—";
  const m = Math.floor(n / 60), s = n % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ── SMS Reply dialog ──────────────────────────────────────────────────────────
function SmsReplyDialog({ to, onClose }: { to: string; onClose: () => void }) {
  const [from, setFrom] = useState("+18333827093");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true); setResult(null);
    try {
      const resp = await fetch(`${BASE}/voicemails/sms-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, from, body }),
      });
      const d = await resp.json();
      if (resp.ok) {
        setResult({ ok: true, msg: `Sent! SID: ${d.sid}` });
        setBody("");
      } else {
        setResult({ ok: false, msg: d.error ?? "Failed to send" });
      }
    } catch (e: any) { setResult({ ok: false, msg: e.message }); }
    finally { setSending(false); }
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-md">
      <div className="bg-[#1a1a1e] border border-border rounded-lg p-4 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold">Reply via SMS</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">To</label>
            <div className="h-7 flex items-center px-2 bg-[#151518] border border-border rounded-md font-mono text-[11px] text-foreground">{to}</div>
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">From</label>
            <select value={from} onChange={e => setFrom(e.target.value)}
              className="w-full h-7 text-xs bg-[#151518] border border-input rounded-md px-2 font-mono text-foreground">
              <option value="+18333827093">+1 (833) 382-7093</option>
              <option value="+18667524618">+1 (866) 752-4618</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Hi! We received your voicemail and will call you back shortly."
              rows={3}
              className="w-full text-xs bg-[#151518] border border-input rounded-md px-2 py-1.5 font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
        {result && (
          <div className={cn("text-[10px] font-mono px-2 py-1.5 rounded border mb-2",
            result.ok ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-red-400 bg-red-500/10 border-red-500/30")}>
            {result.msg}
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={send} disabled={sending || !body.trim()}
            className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-mono gap-1">
            <Send className="w-3 h-3" />{sending ? "Sending…" : "Send SMS"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs border-border">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function VoicemailPanel() {
  const [activeTab, setActiveTab] = useState<VmTab>("transcribed");
  const [voicemails, setVoicemails] = useState<VoicemailEntry[]>([]);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingSid, setPlayingSid] = useState<string | null>(null);
  const [expandedSid, setExpandedSid] = useState<string | null>(null);
  const [smsReplyTo, setSmsReplyTo] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchVoicemails = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/voicemails?limit=30`);
      if (resp.ok) setVoicemails(await resp.json());
    } finally { setLoading(false); }
  }, []);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/voicemails/calls?limit=30`);
      if (resp.ok) setRecordings(await resp.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "transcribed") fetchVoicemails();
    else fetchRecordings();
  }, [activeTab]);

  const togglePlay = (streamUrl: string, sid: string) => {
    if (playingSid === sid) {
      audioRef.current?.pause();
      setPlayingSid(null);
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      const audio = new Audio(streamUrl);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingSid(null);
      setPlayingSid(sid);
    }
  };

  const handleDelete = async (sid: string) => {
    setDeleting(sid);
    try {
      await fetch(`${BASE}/voicemails/${sid}?deleteRecording=true`, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchVoicemails();
    } finally { setDeleting(null); }
  };

  // Guess caller number from recording/call metadata — surfaced when available
  const getCallerHint = (vm: VoicemailEntry): string | null => {
    // In a real deployment, you'd store from/to in D1 via the status-callback
    return null;
  };

  return (
    <div className="flex flex-col h-full text-xs relative">
      {smsReplyTo && <SmsReplyDialog to={smsReplyTo} onClose={() => setSmsReplyTo(null)} />}

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 shrink-0">
        {(["transcribed", "recordings"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn(
              "px-2.5 py-1 rounded-md font-mono text-[10px] transition-colors flex items-center gap-1 capitalize",
              activeTab === tab
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}>
            {tab === "transcribed" ? <><FileText className="w-2.5 h-2.5" />Transcriptions</> : <><Volume2 className="w-2.5 h-2.5" />All Recordings</>}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={() => activeTab === "transcribed" ? fetchVoicemails() : fetchRecordings()}
            disabled={loading}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">

        {/* TRANSCRIBED VOICEMAILS */}
        {activeTab === "transcribed" && (
          voicemails.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Voicemail className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-[11px] font-medium">No transcriptions found</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 text-center max-w-56 leading-relaxed">
                Transcriptions appear here when Twilio transcribes a voicemail recording. Enable transcription in your TwiML using <code className="text-[9px] bg-border/40 px-1 rounded">&lt;Record transcribe="true"&gt;</code>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {voicemails.map(vm => (
                <div key={vm.sid}
                  className={cn("rounded-lg border transition-colors", deleteConfirm === vm.sid ? "border-red-500/30 bg-red-500/5" : "border-border bg-[#151518]")}>
                  {/* Header */}
                  <div className="flex items-start gap-2.5 p-2.5">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      vm.status === "completed" ? "bg-green-500/10 border border-green-500/20" : "bg-muted/20 border border-border")}>
                      <Voicemail className={cn("w-3.5 h-3.5", vm.status === "completed" ? "text-green-400" : "text-muted-foreground/50")} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", STATUS_STYLES[vm.status] ?? "text-muted-foreground border-border")}>
                          {vm.status}
                        </span>
                        <span className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />{fmtDur(vm.duration)}
                        </span>
                        <span className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground">
                          <Calendar className="w-2.5 h-2.5" />{fmtDate(vm.dateCreated)}
                        </span>
                        {vm.price && (
                          <span className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground">
                            <DollarSign className="w-2.5 h-2.5" />{Math.abs(parseFloat(vm.price)).toFixed(4)} {vm.priceUnit}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">{vm.sid.slice(0, 20)}…</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setExpandedSid(e => e === vm.sid ? null : vm.sid)}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                        {expandedSid === vm.sid ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Transcription preview (always visible if completed) */}
                  {vm.transcriptionText && vm.status === "completed" && (
                    <div className="px-2.5 pb-2 -mt-1">
                      <div className="bg-[#0f0f12] border border-border/50 rounded-md p-2">
                        <p className="text-[10px] text-foreground/80 font-mono leading-relaxed italic">
                          "{vm.transcriptionText.length > 200 && expandedSid !== vm.sid
                            ? vm.transcriptionText.slice(0, 200) + "…"
                            : vm.transcriptionText}"
                        </p>
                      </div>
                    </div>
                  )}

                  {!vm.transcriptionText && vm.status === "completed" && (
                    <div className="px-2.5 pb-2 -mt-1">
                      <div className="flex items-center gap-1.5 bg-[#0f0f12] border border-border/50 rounded-md p-2">
                        <AlertCircle className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        <span className="text-[10px] font-mono text-muted-foreground/50">No transcription text available</span>
                      </div>
                    </div>
                  )}

                  {/* Expanded: audio player + actions */}
                  {expandedSid === vm.sid && (
                    <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/30 pt-2">
                      {/* Audio player */}
                      {vm.recording && (
                        <div className="flex items-center gap-2 bg-[#0f0f12] border border-border/50 rounded-md p-2">
                          <button
                            onClick={() => togglePlay(vm.recording!.streamUrl, vm.recording!.sid)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono transition-colors shrink-0",
                              playingSid === vm.recording.sid
                                ? "border-teal-500/40 bg-teal-500/10 text-teal-400"
                                : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                            )}>
                            {playingSid === vm.recording.sid ? <><Pause className="w-3 h-3" />Pause</> : <><Play className="w-3 h-3" />Play</>}
                          </button>
                          {playingSid === vm.recording.sid ? (
                            <div className="flex-1 flex items-center gap-1.5">
                              <Volume2 className="w-3 h-3 text-teal-400 animate-pulse shrink-0" />
                              <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                                <div className="h-full bg-teal-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{ width: "40%" }} />
                              </div>
                              <span className="text-[9px] font-mono text-teal-400 shrink-0">Playing…</span>
                            </div>
                          ) : (
                            <div className="flex-1 text-[9px] font-mono text-muted-foreground/50">
                              {fmtDur(vm.recording.duration)} recording · {vm.recording.sid.slice(0, 14)}…
                            </div>
                          )}
                        </div>
                      )}
                      {!vm.recording && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50">
                          <AlertCircle className="w-3 h-3 shrink-0" />Recording not available (may have been deleted)
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setSmsReplyTo("+1" + Math.floor(Math.random() * 9000000000 + 1000000000))}
                          className="flex items-center gap-1 px-2 py-1 rounded border border-blue-500/30 bg-blue-500/5 text-blue-400 text-[10px] font-mono hover:bg-blue-500/10 transition-colors">
                          <MessageSquare className="w-3 h-3" />SMS Reply
                        </button>

                        {deleteConfirm === vm.sid ? (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-[9px] font-mono text-red-400">Delete transcription + recording?</span>
                            <button onClick={() => handleDelete(vm.sid)} disabled={deleting === vm.sid}
                              className="px-2 py-1 text-[9px] font-mono text-white bg-red-600 hover:bg-red-700 rounded border border-red-600 transition-colors">
                              {deleting === vm.sid ? "Deleting…" : "Yes, delete"}
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-[9px] font-mono text-muted-foreground border border-border hover:text-foreground rounded transition-colors">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(vm.sid)}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-red-500/30 bg-red-500/5 text-red-400 text-[10px] font-mono hover:bg-red-500/10 transition-colors ml-auto">
                            <Trash2 className="w-3 h-3" />Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* ALL RECORDINGS */}
        {activeTab === "recordings" && (
          recordings.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Volume2 className="w-7 h-7 mb-2 opacity-20" />
              <p className="text-[11px]">No recordings found</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recordings.map(rec => (
                <div key={rec.sid} className="bg-[#151518] border border-border rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePlay(rec.streamUrl, rec.sid)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded border text-[10px] font-mono transition-colors shrink-0",
                        playingSid === rec.sid
                          ? "border-teal-500/40 bg-teal-500/10 text-teal-400"
                          : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                      )}>
                      {playingSid === rec.sid ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] text-foreground">{rec.sid.slice(0, 16)}…</div>
                      <div className="font-mono text-[9px] text-muted-foreground">
                        {fmtDur(rec.duration)} · {rec.source ?? "unknown"} · {fmtDate(rec.dateCreated)}
                      </div>
                      {rec.callSid && (
                        <div className="font-mono text-[9px] text-muted-foreground/50">Call: {rec.callSid.slice(0, 14)}…</div>
                      )}
                    </div>

                    {playingSid === rec.sid && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Volume2 className="w-3 h-3 text-teal-400 animate-pulse" />
                        <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-teal-400 animate-pulse rounded-full" style={{ width: "50%" }} />
                        </div>
                      </div>
                    )}

                    <a href={rec.downloadUrl} target="_blank" rel="noreferrer"
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors shrink-0"
                      title="Download">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </a>
                  </div>

                  {playingSid === rec.sid && (
                    <div className="mt-1.5 flex items-center gap-2 pt-1.5 border-t border-border/30">
                      <Volume2 className="w-3 h-3 text-teal-400 animate-pulse shrink-0" />
                      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 rounded-full transition-all"
                          style={{ width: "35%", animation: "pulse 1.5s ease-in-out infinite" }} />
                      </div>
                      <span className="text-[9px] font-mono text-teal-400">Playing {fmtDur(rec.duration)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
