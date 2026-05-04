import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Users2, MicOff, Mic, PhoneOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Conferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conferences, isLoading, refetch } = useQuery({
    queryKey: ["active-conferences"],
    queryFn: () => fetch("/api/twilio/conferences/active").then(res => res.json()),
    refetchInterval: 10000,
  });

  const endConference = useMutation({
    mutationFn: (sid: string) =>
      fetch(`/api/twilio/conferences/${sid}/end`, { method: "POST" }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "Conference ended" });
      queryClient.invalidateQueries({ queryKey: ["active-conferences"] });
    },
    onError: () => toast({ title: "Failed to end conference", variant: "destructive" }),
  });

  const muteParticipant = useMutation({
    mutationFn: ({ confSid, callSid, muted }: { confSid: string; callSid: string; muted: boolean }) =>
      fetch(`/api/twilio/conferences/${confSid}/participants/${callSid}/mute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ muted }),
      }).then(res => res.json()),
    onSuccess: (_, vars) => {
      toast({ title: vars.muted ? "Participant muted" : "Participant unmuted" });
      queryClient.invalidateQueries({ queryKey: ["active-conferences"] });
    },
    onError: () => toast({ title: "Mute action failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Conferences</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage live conference calls. Auto-refreshes every 10s.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : conferences?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active conferences right now</p>
            <p className="text-xs text-muted-foreground mt-1">Conferences will appear here automatically</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conferences?.map((conf: any) => (
            <Card key={conf.sid} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{conf.friendlyName}</CardTitle>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{conf.sid}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                      Live
                    </Badge>
                    <Badge variant="outline">{conf.participants?.length || 0} participants</Badge>
                    {conf.dateCreated && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conf.dateCreated), "h:mm a")}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => endConference.mutate(conf.sid)}
                      disabled={endConference.isPending}
                    >
                      <PhoneOff className="h-4 w-4 mr-1" /> End
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Participants</div>
                  {conf.participants?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No participants</p>
                  ) : (
                    conf.participants?.map((p: any) => (
                      <div key={p.callSid} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${p.muted ? "bg-muted-foreground" : "bg-green-500"}`} />
                          <span className="font-mono text-sm">{p.callSid}</span>
                          <div className="flex gap-1">
                            {p.muted && <Badge variant="secondary" className="text-xs">Muted</Badge>}
                            {p.hold && <Badge variant="secondary" className="text-xs">On Hold</Badge>}
                            {p.coaching && <Badge variant="outline" className="text-xs">Coaching</Badge>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => muteParticipant.mutate({ confSid: conf.sid, callSid: p.callSid, muted: !p.muted })}
                          disabled={muteParticipant.isPending}
                        >
                          {p.muted ? <Mic className="h-4 w-4 mr-1" /> : <MicOff className="h-4 w-4 mr-1" />}
                          {p.muted ? "Unmute" : "Mute"}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
