import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListTwilioPhoneNumbers } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, MicOff, Volume2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Calls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [to, setTo] = useState("");
  const [twiml, setTwiml] = useState("");

  const { data: phoneNumbers } = useListTwilioPhoneNumbers();
  const defaultFrom = phoneNumbers?.[0]?.phoneNumber || "";
  const [from, setFrom] = useState(defaultFrom);

  React.useEffect(() => {
    if (phoneNumbers?.[0]?.phoneNumber && !from) {
      setFrom(phoneNumbers[0].phoneNumber);
    }
  }, [phoneNumbers, from]);

  const { data: activeCalls, isLoading: activeLoading } = useQuery({
    queryKey: ["active-calls"],
    queryFn: () => fetch("/api/twilio/calls/active").then(res => res.json()),
    refetchInterval: 5000,
  });

  const { data: recentCalls, isLoading: recentLoading } = useQuery({
    queryKey: ["recent-calls"],
    queryFn: () => fetch("/api/twilio/calls/recent").then(res => res.json()),
    refetchInterval: 15000,
  });

  const { data: recordings } = useQuery({
    queryKey: ["recordings"],
    queryFn: () => fetch("/api/twilio/recordings").then(res => res.json()),
  });

  const makeCall = useMutation({
    mutationFn: (data: { to: string, from: string, twiml?: string }) =>
      fetch("/api/twilio/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error("Failed to place call");
        return res.json();
      }),
    onSuccess: () => {
      toast({ title: "Call initiated" });
      queryClient.invalidateQueries({ queryKey: ["active-calls"] });
    },
    onError: (err) => {
      toast({ title: "Call failed", description: err.message, variant: "destructive" });
    }
  });

  const hangupCall = useMutation({
    mutationFn: (sid: string) => fetch(`/api/twilio/calls/${sid}/hangup`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["active-calls"] })
  });

  const handleCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !from) return;
    makeCall.mutate({ to, from, twiml: twiml || undefined });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "in-progress": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">In Progress</Badge>;
      case "ringing": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Ringing</Badge>;
      case "completed": return <Badge variant="outline">Completed</Badge>;
      case "failed":
      case "canceled": return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Call Manager</h1>
        <p className="text-muted-foreground mt-1">Initiate and monitor live calls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Make Call</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCall} className="space-y-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select caller ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneNumbers?.filter(n => n.capabilities.voice).map(num => (
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
                <Label>TwiML (Optional)</Label>
                <Input 
                  placeholder="<Response><Say>Hello</Say></Response>" 
                  value={twiml} 
                  onChange={(e) => setTwiml(e.target.value)} 
                />
              </div>

              <Button type="submit" className="w-full" disabled={makeCall.isPending || !to || !from}>
                <Phone className="mr-2 h-4 w-4" />
                {makeCall.isPending ? "Dialing..." : "Call"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="col-span-2 space-y-6">
          <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Calls ({activeCalls?.length || 0})</TabsTrigger>
              <TabsTrigger value="recent">Recent Calls</TabsTrigger>
              <TabsTrigger value="recordings">Recordings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Direction</TableHead>
                        <TableHead>To / From</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-4">Loading...</TableCell></TableRow>
                      ) : activeCalls?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No active calls</TableCell></TableRow>
                      ) : (
                        activeCalls?.map((call: any) => (
                          <TableRow key={call.sid}>
                            <TableCell className="capitalize">{call.direction}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {call.direction === 'inbound' ? `From: ${call.from}` : `To: ${call.to}`}
                            </TableCell>
                            <TableCell>{getStatusBadge(call.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="destructive" onClick={() => hangupCall.mutate(call.sid)}>
                                <PhoneOff className="h-4 w-4 mr-2" /> Hangup
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="recent" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-4">Loading...</TableCell></TableRow>
                      ) : recentCalls?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No recent calls</TableCell></TableRow>
                      ) : (
                        recentCalls?.map((call: any) => (
                          <TableRow key={call.sid}>
                            <TableCell className="text-sm">{call.startTime ? format(new Date(call.startTime), "MMM d, h:mm a") : '-'}</TableCell>
                            <TableCell className="capitalize text-sm">{call.direction}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {call.direction === 'inbound' ? call.from : call.to}
                            </TableCell>
                            <TableCell className="text-sm">{call.duration ? `${call.duration}s` : '-'}</TableCell>
                            <TableCell>{getStatusBadge(call.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="recordings" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Playback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!recordings ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-4">Loading...</TableCell></TableRow>
                      ) : recordings?.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No recordings</TableCell></TableRow>
                      ) : (
                        recordings?.slice(0, 10).map((rec: any) => (
                          <TableRow key={rec.sid}>
                            <TableCell className="text-sm">{rec.dateCreated ? format(new Date(rec.dateCreated), "MMM d, h:mm a") : '-'}</TableCell>
                            <TableCell className="text-sm">{rec.duration}s</TableCell>
                            <TableCell>
                              <audio controls src={`/api/twilio/recordings/${rec.sid}/stream`} className="h-8 max-w-[200px]" />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
