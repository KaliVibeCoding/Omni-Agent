import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  RefreshCw, Users, Clock, Layers, Trash2, Plus, ChevronRight,
  ChevronDown, AlertCircle, CheckCircle2, X,
} from "lucide-react";

const BASE = "/api/twilio";

interface Queue {
  sid: string;
  friendlyName: string;
  currentSize: number;
  maxSize: number;
  averageWaitTime: number;
  dateCreated: string;
}

interface QueueMember {
  callSid: string;
  dateEnqueued: string;
  position: number;
  waitTime: number;
}

function fmtWait(secs: number) {
  if (!secs) return "0s";
  const m = Math.floor(secs / 60), s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function QueuePanel() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [members, setMembers] = useState<Record<string, QueueMember[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState("100");
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchQueues = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/queues`);
      if (r.ok) setQueues(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQueues(); }, []);

  const toggleExpand = async (sid: string) => {
    if (expanded === sid) { setExpanded(null); return; }
    setExpanded(sid);
    if (!members[sid]) {
      setMembersLoading(sid);
      try {
        const r = await fetch(`${BASE}/queues/${sid}/members`);
        if (r.ok) {
          const data = await r.json();
          setMembers(m => ({ ...m, [sid]: data }));
        }
      } finally { setMembersLoading(null); }
    }
  };

  const createQueue = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`${BASE}/queues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendlyName: newName, maxSize: parseInt(newMax) }),
      });
      if (r.ok) {
        showToast("Queue created");
        setNewName(""); setShowCreate(false);
        fetchQueues();
      } else {
        const d = await r.json(); showToast(d.error ?? "Failed");
      }
    } finally { setCreating(false); }
  };

  const deleteQueue = async (sid: string) => {
    setDeleting(sid);
    try {
      await fetch(`${BASE}/queues/${sid}`, { method: "DELETE" });
      setDeleteConfirm(null);
      setQueues(q => q.filter(x => x.sid !== sid));
      showToast("Queue deleted");
    } finally { setDeleting(null); }
  };

  const fillPercent = (q: Queue) => Math.round((q.currentSize / Math.max(q.maxSize, 1)) * 100);

  return (
    <div className="flex flex-col h-full text-xs relative">
      {toast && (
        <div className="absolute top-2 right-2 z-50 bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-[10px] px-3 py-1.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 shrink-0">
        <button onClick={fetchQueues} disabled={loading}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        </button>
        <span className="text-[10px] font-mono text-muted-foreground">{queues.length} queue{queues.length !== 1 ? "s" : ""}</span>
        <button onClick={() => setShowCreate(c => !c)}
          className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border border-sky-500/30 bg-sky-500/5 text-sky-400 hover:bg-sky-500/10 transition-colors">
          <Plus className="w-3 h-3" />New Queue
        </button>
      </div>

      {showCreate && (
        <div className="mx-3 mb-2 p-2.5 bg-[#151518] border border-sky-500/20 rounded-lg space-y-2 shrink-0">
          <div className="text-[10px] font-mono text-sky-400 font-semibold">Create Queue</div>
          <div className="flex gap-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Friendly name" className="h-6 text-[10px] font-mono flex-1" />
            <Input value={newMax} onChange={e => setNewMax(e.target.value)}
              placeholder="Max" type="number" className="h-6 text-[10px] font-mono w-16" />
            <Button size="sm" onClick={createQueue} disabled={creating || !newName.trim()}
              className="h-6 px-2 text-[10px] bg-sky-600 hover:bg-sky-700 text-white">
              {creating ? "…" : "Create"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}
              className="h-6 px-2 text-[10px] border-border">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {queues.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Layers className="w-7 h-7 mb-2 opacity-20" />
            <p className="text-[11px]">No call queues found</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Create a queue above or via TwiML &lt;Enqueue&gt;</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queues.map(q => {
              const pct = fillPercent(q);
              const isExpanded = expanded === q.sid;
              return (
                <div key={q.sid} className="bg-[#151518] border border-border rounded-lg overflow-hidden">
                  <div className="p-2.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleExpand(q.sid)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[11px] text-foreground truncate">{q.friendlyName}</div>
                        <div className="font-mono text-[9px] text-muted-foreground/50">{q.sid.slice(0, 18)}…</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <div className="text-[10px] font-mono font-bold text-sky-400">{q.currentSize}</div>
                          <div className="text-[8px] font-mono text-muted-foreground">callers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-mono font-bold text-yellow-400">{fmtWait(q.averageWaitTime)}</div>
                          <div className="text-[8px] font-mono text-muted-foreground">avg wait</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-mono text-muted-foreground">{q.maxSize}</div>
                          <div className="text-[8px] font-mono text-muted-foreground">max</div>
                        </div>
                      </div>
                      {deleteConfirm === q.sid ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteQueue(q.sid)} disabled={deleting === q.sid}
                            className="px-1.5 py-0.5 text-[9px] font-mono text-white bg-red-600 rounded border border-red-600">
                            {deleting === q.sid ? "…" : "Del"}
                          </button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground border border-border rounded">
                            No
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(q.sid)}
                          className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/5 rounded transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Fill bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-sky-500")}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground shrink-0">{pct}% full</span>
                    </div>
                  </div>

                  {/* Expanded members */}
                  {isExpanded && (
                    <div className="border-t border-border/50 bg-[#0f0f12]">
                      {membersLoading === q.sid ? (
                        <div className="flex items-center gap-2 p-2.5 text-[10px] font-mono text-muted-foreground">
                          <RefreshCw className="w-3 h-3 animate-spin" />Loading members…
                        </div>
                      ) : (members[q.sid] ?? []).length === 0 ? (
                        <div className="p-2.5 text-[10px] font-mono text-muted-foreground/60 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-500/50" />Queue is empty
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          <div className="text-[9px] font-mono text-muted-foreground/50 mb-1 px-0.5">CALLERS IN QUEUE</div>
                          {(members[q.sid] ?? []).map(m => (
                            <div key={m.callSid} className="flex items-center gap-2 bg-[#1a1a1e] border border-border/50 rounded p-1.5">
                              <div className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-mono text-sky-400 font-bold">#{m.position}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-[9px] text-foreground truncate">{m.callSid.slice(0, 16)}…</div>
                                <div className="font-mono text-[8px] text-muted-foreground">Wait: {fmtWait(m.waitTime)}</div>
                              </div>
                              <div className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground shrink-0">
                                <Clock className="w-2.5 h-2.5" />{fmtDate(m.dateEnqueued)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
