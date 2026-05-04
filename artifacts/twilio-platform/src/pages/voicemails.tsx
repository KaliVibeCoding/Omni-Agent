import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2, MessageSquare, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Voicemails() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyFrom, setReplyFrom] = useState("");

  const { data: voicemails, isLoading } = useQuery({
    queryKey: ["voicemails"],
    queryFn: () => fetch("/api/twilio/voicemails").then(res => res.json()),
  });

  const { data: recordings } = useQuery({
    queryKey: ["voicemail-calls"],
    queryFn: () => fetch("/api/twilio/voicemails/calls").then(res => res.json()),
  });

  const deleteVoicemail = useMutation({
    mutationFn: (sid: string) =>
      fetch(`/api/twilio/voicemails/${sid}?deleteRecording=true`, { method: "DELETE" }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "Voicemail deleted" });
      queryClient.invalidateQueries({ queryKey: ["voicemails"] });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const sendReply = useMutation({
    mutationFn: (data: { to: string; from: string; body: string }) =>
      fetch("/api/twilio/voicemails/sms-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); }),
    onSuccess: () => {
      toast({ title: "SMS reply sent" });
      setReplyTarget(null);
      setReplyBody("");
    },
    onError: (err: any) => toast({ title: "Reply failed", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voicemails</h1>
        <p className="text-muted-foreground mt-1">Transcriptions and recordings from your phone numbers.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Transcriptions</h2>
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : voicemails?.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No voicemail transcriptions found</CardContent></Card>
        ) : (
          voicemails?.map((vm: any) => (
            <Card key={vm.sid} className="border-border">
              <CardContent className="py-4 px-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Badge variant={vm.status === "completed" ? "default" : "outline"} className="capitalize">
                      {vm.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {vm.dateCreated ? format(new Date(vm.dateCreated), "MMM d, yyyy h:mm a") : ""}
                    </span>
                    {vm.duration && <span className="text-sm text-muted-foreground">{vm.duration}s</span>}
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={replyTarget?.sid === vm.sid} onOpenChange={(open) => !open && setReplyTarget(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setReplyTarget(vm)}>
                          <MessageSquare className="h-4 w-4 mr-1" /> SMS Reply
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Send SMS Reply</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label>To</Label>
                            <Input placeholder="+1234567890" />
                          </div>
                          <div className="space-y-2">
                            <Label>From (your number)</Label>
                            <Input value={replyFrom} onChange={e => setReplyFrom(e.target.value)} placeholder="+1234567890" />
                          </div>
                          <div className="space-y-2">
                            <Label>Message</Label>
                            <Textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Thanks for calling..." />
                          </div>
                          <Button
                            className="w-full"
                            disabled={sendReply.isPending}
                            onClick={() => sendReply.mutate({ to: "+1", from: replyFrom, body: replyBody })}
                          >
                            Send Reply
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteVoicemail.mutate(vm.sid)}
                      disabled={deleteVoicemail.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {vm.transcriptionText && (
                  <p className="text-sm bg-muted/50 rounded p-3 leading-relaxed">
                    {vm.transcriptionText}
                  </p>
                )}
                {vm.recording?.streamUrl && (
                  <audio controls src={vm.recording.streamUrl} className="w-full h-8" />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recordings</h2>
        {recordings?.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No recordings found</CardContent></Card>
        ) : (
          recordings?.map((rec: any) => (
            <Card key={rec.sid} className="border-border">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{rec.duration}s</span>
                      <span className="text-xs text-muted-foreground">
                        {rec.dateCreated ? format(new Date(rec.dateCreated), "MMM d, yyyy h:mm a") : ""}
                      </span>
                      <Badge variant="outline" className="capitalize text-xs">{rec.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">SID: {rec.sid}</div>
                  </div>
                  <audio controls src={rec.streamUrl} className="h-8 max-w-[240px]" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
