import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Workflow, Play, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Studio() {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [triggerFlow, setTriggerFlow] = useState<string | null>(null);
  const [triggerTo, setTriggerTo] = useState("");
  const [triggerFrom, setTriggerFrom] = useState("");

  const { data: flows, isLoading, refetch } = useQuery({
    queryKey: ["studio-flows"],
    queryFn: () => fetch("/api/twilio/studio/flows").then(res => res.json()),
  });

  const { data: executions } = useQuery({
    queryKey: ["studio-executions", expanded],
    queryFn: () => fetch(`/api/twilio/studio/flows/${expanded}/executions`).then(res => res.json()),
    enabled: !!expanded,
  });

  const triggerExecution = useMutation({
    mutationFn: ({ sid, to, from }: { sid: string; to: string; from: string }) =>
      fetch(`/api/twilio/studio/flows/${sid}/executions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, from }),
      }).then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); }),
    onSuccess: () => {
      toast({ title: "Flow execution triggered" });
      setTriggerFlow(null);
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case "draft": return <Badge variant="outline">Draft</Badge>;
      case "archived": return <Badge variant="secondary">Archived</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studio Flows</h1>
          <p className="text-muted-foreground mt-1">View and trigger your Twilio Studio flows.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : flows?.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No Studio flows found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {flows?.map((flow: any) => (
            <Card key={flow.sid} className="border-border">
              <CardContent className="py-4 px-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Workflow className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">{flow.friendlyName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{flow.sid}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(flow.status)}
                    <Badge variant="outline" className="text-xs">Rev. {flow.revision}</Badge>
                    <Dialog open={triggerFlow === flow.sid} onOpenChange={(open) => !open && setTriggerFlow(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setTriggerFlow(flow.sid)}>
                          <Play className="h-4 w-4 mr-1" /> Trigger
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Trigger Flow: {flow.friendlyName}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label>To Number</Label>
                            <Input value={triggerTo} onChange={e => setTriggerTo(e.target.value)} placeholder="+1234567890" />
                          </div>
                          <div className="space-y-2">
                            <Label>From Number</Label>
                            <Input value={triggerFrom} onChange={e => setTriggerFrom(e.target.value)} placeholder="+1234567890" />
                          </div>
                          <Button
                            className="w-full"
                            disabled={!triggerTo || !triggerFrom || triggerExecution.isPending}
                            onClick={() => triggerExecution.mutate({ sid: flow.sid, to: triggerTo, from: triggerFrom })}
                          >
                            {triggerExecution.isPending ? "Triggering..." : "Start Execution"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpanded(expanded === flow.sid ? null : flow.sid)}
                    >
                      {expanded === flow.sid ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {flow.dateUpdated && (
                  <div className="text-xs text-muted-foreground">
                    Updated {format(new Date(flow.dateUpdated), "MMM d, yyyy h:mm a")}
                    {flow.commitMessage && <span className="ml-2 italic">"{flow.commitMessage}"</span>}
                  </div>
                )}
                {expanded === flow.sid && (
                  <div className="pt-2 space-y-2 border-t border-border mt-2">
                    <div className="text-sm font-medium">Recent Executions</div>
                    {!executions ? <Skeleton className="h-10 w-full" /> : executions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No executions found</p>
                    ) : (
                      <div className="space-y-2">
                        {executions.slice(0, 5).map((exec: any) => (
                          <div key={exec.sid} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span className="font-mono text-xs">{exec.sid}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">{exec.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {exec.dateCreated ? format(new Date(exec.dateCreated), "MMM d, h:mm a") : ""}
                              </span>
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
