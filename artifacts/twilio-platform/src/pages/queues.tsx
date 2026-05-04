import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Plus, Trash2, Users, Clock, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Queues() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState("100");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: queues, isLoading, refetch } = useQuery({
    queryKey: ["call-queues"],
    queryFn: () => fetch("/api/twilio/queues").then(res => res.json()),
    refetchInterval: 15000,
  });

  const { data: members } = useQuery({
    queryKey: ["queue-members", expanded],
    queryFn: () => fetch(`/api/twilio/queues/${expanded}/members`).then(res => res.json()),
    enabled: !!expanded,
    refetchInterval: 5000,
  });

  const createQueue = useMutation({
    mutationFn: () =>
      fetch("/api/twilio/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendlyName: newName, maxSize: parseInt(newMax) }),
      }).then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); }),
    onSuccess: () => {
      toast({ title: "Queue created" });
      queryClient.invalidateQueries({ queryKey: ["call-queues"] });
      setCreateOpen(false);
      setNewName("");
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const deleteQueue = useMutation({
    mutationFn: (sid: string) =>
      fetch(`/api/twilio/queues/${sid}`, { method: "DELETE" }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "Queue deleted" });
      queryClient.invalidateQueries({ queryKey: ["call-queues"] });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Queues</h1>
          <p className="text-muted-foreground mt-1">Manage call queues and monitor live queue members.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Queue</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Queue</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Queue Name</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="support" />
                </div>
                <div className="space-y-2">
                  <Label>Max Size</Label>
                  <Input type="number" value={newMax} onChange={e => setNewMax(e.target.value)} min={1} max={1000} />
                </div>
                <Button className="w-full" disabled={!newName || createQueue.isPending} onClick={() => createQueue.mutate()}>
                  {createQueue.isPending ? "Creating..." : "Create Queue"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : queues?.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No queues found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {queues?.map((queue: any) => (
            <Card key={queue.sid} className="border-border">
              <CardContent className="py-4 px-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-semibold">{queue.friendlyName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{queue.sid}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{queue.currentSize}</span>
                      <span className="text-muted-foreground">/ {queue.maxSize}</span>
                    </div>
                    {queue.averageWaitTime > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {queue.averageWaitTime}s avg
                      </div>
                    )}
                    {queue.currentSize > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === queue.sid ? null : queue.sid)}>
                        {expanded === queue.sid ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Members
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteQueue.mutate(queue.sid)}
                      disabled={deleteQueue.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {expanded === queue.sid && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="text-sm font-medium">Queue Members</div>
                    {!members ? (
                      <Skeleton className="h-10 w-full" />
                    ) : members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No members in queue</p>
                    ) : (
                      <div className="space-y-2">
                        {members.map((m: any) => (
                          <div key={m.callSid} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span className="font-mono text-xs">{m.callSid}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">Position: {m.position}</span>
                              <span className="text-xs text-muted-foreground">Wait: {m.waitTime}s</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
