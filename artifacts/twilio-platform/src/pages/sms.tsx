import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListTwilioPhoneNumbers } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function SmsCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [filterNumber, setFilterNumber] = useState("");

  const { data: phoneNumbers } = useListTwilioPhoneNumbers();
  const defaultFrom = phoneNumbers?.[0]?.phoneNumber || "";
  const [from, setFrom] = useState(defaultFrom);

  // Sync default from when numbers load
  React.useEffect(() => {
    if (phoneNumbers?.[0]?.phoneNumber && !from) {
      setFrom(phoneNumbers[0].phoneNumber);
    }
  }, [phoneNumbers, from]);

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["sms-messages", filterNumber],
    queryFn: () => {
      const url = new URL("/api/twilio/sms/messages", window.location.origin);
      url.searchParams.set("limit", "50");
      if (filterNumber) url.searchParams.set("to", filterNumber);
      return fetch(url.toString()).then(res => res.json());
    },
    refetchInterval: 15000,
  });

  const sendSms = useMutation({
    mutationFn: (data: { to: string, from: string, body: string }) => 
      fetch("/api/twilio/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error("Failed to send SMS");
        return res.json();
      }),
    onSuccess: () => {
      toast({ title: "SMS Sent successfully" });
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["sms-messages"] });
    },
    onError: (err) => {
      toast({ title: "Error sending SMS", description: err.message, variant: "destructive" });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !from || !body) return;
    sendSms.mutate({ to, from, body });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Delivered</Badge>;
      case "sent": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sent</Badge>;
      case "failed":
      case "undelivered": return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SMS Center</h1>
        <p className="text-muted-foreground mt-1">Compose and monitor outbound messages.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Compose SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sender number" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneNumbers?.filter(n => n.capabilities.sms).map(num => (
                      <SelectItem key={num.sid} value={num.phoneNumber}>
                        {num.friendlyName || num.phoneNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To</Label>
                <Input 
                  placeholder="+1234567890" 
                  value={to} 
                  onChange={(e) => setTo(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea 
                  placeholder="Enter message body..." 
                  className="min-h-[100px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {body.length} chars ({(body.length / 160 | 0) + 1} segment)
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={sendSms.isPending || !to || !body || !from}>
                {sendSms.isPending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Message History</CardTitle>
              <Input 
                placeholder="Filter by To number..." 
                className="max-w-[200px] h-8"
                value={filterNumber}
                onChange={(e) => setFilterNumber(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messagesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center p-3 border rounded-lg animate-pulse">
                    <div className="h-4 w-1/4 bg-muted rounded"></div>
                    <div className="h-4 w-1/2 bg-muted rounded"></div>
                    <div className="h-4 w-16 bg-muted rounded ml-auto"></div>
                  </div>
                ))
              ) : messages?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No messages found</div>
              ) : (
                <div className="space-y-3">
                  {messages?.map((msg: any) => (
                    <div key={msg.sid} className="flex flex-col gap-2 p-3 border rounded-lg bg-card/50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{msg.direction === 'outbound-api' ? 'To: ' : 'From: '}</span>
                          <span className="text-sm font-mono">{msg.direction === 'outbound-api' ? msg.to : msg.from}</span>
                          {getStatusBadge(msg.status)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {msg.dateSent ? format(new Date(msg.dateSent), "MMM d, h:mm a") : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm bg-muted/50 p-2 rounded">{msg.body}</p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span title={msg.sid} className="truncate max-w-[200px]">SID: {msg.sid}</span>
                        {msg.price && <span>{msg.price}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
