import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Plus, Send, Trash2, UserPlus, RefreshCw } from "lucide-react";
import { format } from "date-fns";

type Conversation = {
  sid: string;
  friendlyName: string;
  state: string;
  dateCreated: string;
  dateUpdated: string;
  messagesCount: number;
};

type Message = {
  sid: string;
  author: string;
  body: string;
  dateCreated: string;
  index: number;
};

type Participant = {
  sid: string;
  identity: string | null;
  messagingBinding: Record<string, string> | null;
  dateCreated: string;
};

const stateColor: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  closed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ConversationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedSid, setSelectedSid] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [newConvName, setNewConvName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageAuthor, setMessageAuthor] = useState("system");
  const [participant, setParticipant] = useState({ identity: "", phoneNumber: "", proxyAddress: "" });

  const { data: conversations = [], isLoading, refetch } = useQuery<Conversation[]>({
    queryKey: ["twilio-conversations"],
    queryFn: () => fetch("/api/twilio/conv/").then(r => r.json()),
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["twilio-conv-messages", selectedSid],
    queryFn: () => selectedSid
      ? fetch(`/api/twilio/conv/${selectedSid}/messages?limit=50`).then(r => r.json())
      : Promise.resolve([]),
    enabled: !!selectedSid,
    refetchInterval: selectedSid ? 5000 : false,
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ["twilio-conv-participants", selectedSid],
    queryFn: () => selectedSid
      ? fetch(`/api/twilio/conv/${selectedSid}/participants`).then(r => r.json())
      : Promise.resolve([]),
    enabled: !!selectedSid,
  });

  const selectedConv = conversations.find(c => c.sid === selectedSid);

  const createConversation = useMutation({
    mutationFn: () => fetch("/api/twilio/conv/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendlyName: newConvName || undefined }),
    }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Conversation created" });
      setCreateOpen(false);
      setNewConvName("");
      qc.invalidateQueries({ queryKey: ["twilio-conversations"] });
    },
    onError: () => toast({ title: "Failed to create conversation", variant: "destructive" }),
  });

  const deleteConversation = useMutation({
    mutationFn: (sid: string) => fetch(`/api/twilio/conv/${sid}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Conversation deleted" });
      setSelectedSid(null);
      qc.invalidateQueries({ queryKey: ["twilio-conversations"] });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const sendMessage = useMutation({
    mutationFn: () => fetch(`/api/twilio/conv/${selectedSid}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: messageAuthor, body: messageBody }),
    }).then(r => r.json()),
    onSuccess: () => {
      setMessageBody("");
      qc.invalidateQueries({ queryKey: ["twilio-conv-messages", selectedSid] });
    },
    onError: () => toast({ title: "Failed to send message", variant: "destructive" }),
  });

  const addParticipant = useMutation({
    mutationFn: () => fetch(`/api/twilio/conv/${selectedSid}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(participant.identity
        ? { identity: participant.identity }
        : { phoneNumber: participant.phoneNumber, proxyAddress: participant.proxyAddress }),
    }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Participant added" });
      setAddParticipantOpen(false);
      setParticipant({ identity: "", phoneNumber: "", proxyAddress: "" });
      qc.invalidateQueries({ queryKey: ["twilio-conv-participants", selectedSid] });
    },
    onError: () => toast({ title: "Failed to add participant", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="size-6 text-primary" /> Conversations
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Twilio Conversations API — omni-channel messaging threads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="size-4 mr-1" /> Refresh</Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" /> New Conversation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Conversation</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Friendly Name (optional)</Label>
                  <Input value={newConvName} onChange={e => setNewConvName(e.target.value)} placeholder="Patient John Doe" className="mt-1" />
                </div>
                <Button className="w-full" onClick={() => createConversation.mutate()} disabled={createConversation.isPending}>
                  {createConversation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Conversation List */}
        <Card className="col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-sm">Conversations ({conversations.length})</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <p className="text-muted-foreground text-xs p-4">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="text-muted-foreground text-xs p-4">No conversations. Create one above.</p>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map(conv => (
                  <button
                    key={conv.sid}
                    onClick={() => setSelectedSid(conv.sid)}
                    className={`w-full text-left p-3 rounded-md transition-colors text-sm ${selectedSid === conv.sid ? "bg-accent" : "hover:bg-accent/50"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">{conv.friendlyName || conv.sid.slice(0, 20)}</span>
                      <Badge className={stateColor[conv.state] ?? ""} variant="outline">{conv.state}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>{conv.messagesCount} msg{conv.messagesCount !== 1 ? "s" : ""}</span>
                      <span>{conv.dateUpdated ? format(new Date(conv.dateUpdated), "MMM d, HH:mm") : ""}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Messages & Details */}
        <Card className="col-span-2 flex flex-col overflow-hidden">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="size-12 mx-auto mb-3 opacity-30" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="flex-shrink-0 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedConv.friendlyName || "Untitled"}</CardTitle>
                    <CardDescription className="font-mono text-xs">{selectedConv.sid}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><UserPlus className="size-4 mr-1" /> Add Participant</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <Tabs defaultValue="identity">
                            <TabsList className="w-full"><TabsTrigger value="identity" className="flex-1">Chat Identity</TabsTrigger><TabsTrigger value="sms" className="flex-1">SMS</TabsTrigger></TabsList>
                            <TabsContent value="identity" className="space-y-3 pt-2">
                              <div>
                                <Label>Identity</Label>
                                <Input value={participant.identity} onChange={e => setParticipant(p => ({ ...p, identity: e.target.value, phoneNumber: "", proxyAddress: "" }))} placeholder="patient_123" className="mt-1" />
                              </div>
                            </TabsContent>
                            <TabsContent value="sms" className="space-y-3 pt-2">
                              <div>
                                <Label>Phone Number (E.164)</Label>
                                <Input value={participant.phoneNumber} onChange={e => setParticipant(p => ({ ...p, phoneNumber: e.target.value, identity: "" }))} placeholder="+15551234567" className="mt-1" />
                              </div>
                              <div>
                                <Label>Proxy (Twilio) Number</Label>
                                <Input value={participant.proxyAddress} onChange={e => setParticipant(p => ({ ...p, proxyAddress: e.target.value }))} placeholder="+15559876543" className="mt-1" />
                              </div>
                            </TabsContent>
                          </Tabs>
                          <Button className="w-full" onClick={() => addParticipant.mutate()} disabled={addParticipant.isPending}>
                            Add
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="destructive" onClick={() => deleteConversation.mutate(selectedConv.sid)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {participants.length > 0 && (
                  <div className="flex gap-1 flex-wrap pt-1">
                    {participants.map(p => (
                      <Badge key={p.sid} variant="outline" className="text-xs">
                        {p.identity ?? p.messagingBinding?.address ?? p.sid}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center mt-8">No messages yet. Send one below.</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div key={msg.sid} className={`flex ${msg.author === messageAuthor ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${msg.author === messageAuthor ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <p className="text-xs font-medium mb-1 opacity-70">{msg.author}</p>
                          <p>{msg.body}</p>
                          <p className="text-xs opacity-50 mt-1">{msg.dateCreated ? format(new Date(msg.dateCreated), "HH:mm") : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Author (your identity)"
                    value={messageAuthor}
                    onChange={e => setMessageAuthor(e.target.value)}
                    className="w-32 flex-shrink-0"
                  />
                  <Input
                    placeholder="Type a message..."
                    value={messageBody}
                    onChange={e => setMessageBody(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && messageBody.trim()) sendMessage.mutate(); }}
                    className="flex-1"
                  />
                  <Button onClick={() => sendMessage.mutate()} disabled={!messageBody.trim() || sendMessage.isPending} size="sm">
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
