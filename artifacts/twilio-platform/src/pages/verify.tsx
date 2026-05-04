import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function Verify() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [channel, setChannel] = useState("sms");
  const [checkTo, setCheckTo] = useState("");
  const [checkCode, setCheckCode] = useState("");
  const [checkResult, setCheckResult] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ["verify-services"],
    queryFn: () => fetch("/api/twilio/verify/services").then(res => res.json()),
  });

  const createService = useMutation({
    mutationFn: (data: { friendlyName: string }) =>
      fetch("/api/twilio/verify/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); }),
    onSuccess: () => {
      toast({ title: "Verify service created" });
      queryClient.invalidateQueries({ queryKey: ["verify-services"] });
      setCreateOpen(false);
      setNewName("");
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const sendVerification = useMutation({
    mutationFn: () =>
      fetch("/api/twilio/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceSid: selectedService, to: sendTo, channel }),
      }).then(res => { if (!res.ok) throw new Error("Failed to send"); return res.json(); }),
    onSuccess: () => toast({ title: "Verification code sent" }),
    onError: (err: any) => toast({ title: "Send failed", description: err.message, variant: "destructive" }),
  });

  const checkVerification = useMutation({
    mutationFn: () =>
      fetch("/api/twilio/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceSid: selectedService, to: checkTo, code: checkCode }),
      }).then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); }),
    onSuccess: (data) => setCheckResult(data),
    onError: (err: any) => toast({ title: "Check failed", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verify (2FA)</h1>
          <p className="text-muted-foreground mt-1">Manage Twilio Verify services and send verification codes.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Verify Service</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="My App Verify" />
              </div>
              <Button className="w-full" disabled={!newName || createService.isPending} onClick={() => createService.mutate({ friendlyName: newName })}>
                {createService.isPending ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Verify Services</h2>
        {isLoading ? (
          [...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : services?.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No verify services. Create one above.</CardContent></Card>
        ) : (
          services?.map((svc: any) => (
            <Card key={svc.sid} className="border-border">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{svc.friendlyName}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{svc.sid}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{svc.codeLength}-digit code</Badge>
                    <span className="text-xs text-muted-foreground">
                      {svc.dateCreated ? format(new Date(svc.dateCreated), "MMM d, yyyy") : ""}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Send Verification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {services?.map((svc: any) => (
                    <SelectItem key={svc.sid} value={svc.sid}>{svc.friendlyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="+1234567890" />
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!selectedService || !sendTo || sendVerification.isPending} onClick={() => sendVerification.mutate()}>
              {sendVerification.isPending ? "Sending..." : "Send Code"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Check Code</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={checkTo} onChange={e => setCheckTo(e.target.value)} placeholder="+1234567890" />
            </div>
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input value={checkCode} onChange={e => setCheckCode(e.target.value)} placeholder="123456" maxLength={8} />
            </div>
            <Button className="w-full" disabled={!selectedService || !checkTo || !checkCode || checkVerification.isPending} onClick={() => checkVerification.mutate()}>
              {checkVerification.isPending ? "Checking..." : "Verify Code"}
            </Button>
            {checkResult && (
              <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${checkResult.valid ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
                {checkResult.valid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {checkResult.valid ? "Code verified successfully!" : `Verification failed: ${checkResult.status}`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
