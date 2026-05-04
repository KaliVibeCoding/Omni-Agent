import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useListTwilioPhoneNumbers } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Phone, MessageSquare, Image } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PhoneNumbers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: phoneNumbers, isLoading } = useListTwilioPhoneNumbers();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ friendlyName: "", voiceUrl: "", smsUrl: "", statusCallback: "" });

  const updateNumber = useMutation({
    mutationFn: ({ sid, data }: { sid: string; data: any }) =>
      fetch(`/api/twilio/phone-numbers/${sid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => { if (!res.ok) throw new Error("Update failed"); return res.json(); }),
    onSuccess: () => {
      toast({ title: "Phone number updated" });
      queryClient.invalidateQueries({ queryKey: ["listTwilioPhoneNumbers"] });
      setEditing(null);
    },
    onError: (err: any) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const openEdit = (num: any) => {
    setEditing(num);
    setForm({
      friendlyName: num.friendlyName || "",
      voiceUrl: num.voiceUrl || "",
      smsUrl: num.smsUrl || "",
      statusCallback: num.statusCallback || "",
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Phone Numbers</h1>
        <p className="text-muted-foreground mt-1">Manage your Twilio phone numbers and webhook URLs.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : phoneNumbers?.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No phone numbers found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {phoneNumbers?.map((num: any) => (
            <Card key={num.sid} className="border-border">
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold font-mono">{num.phoneNumber}</span>
                      <span className="text-sm text-muted-foreground">{num.friendlyName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {num.capabilities?.voice && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Voice
                        </Badge>
                      )}
                      {num.capabilities?.sms && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> SMS
                        </Badge>
                      )}
                      {num.capabilities?.mms && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Image className="h-3 w-3" /> MMS
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">SID: {num.sid}</div>
                  </div>
                  <Dialog open={editing?.sid === num.sid} onOpenChange={(open) => !open && setEditing(null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => openEdit(num)}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit {num.phoneNumber}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Friendly Name</Label>
                          <Input value={form.friendlyName} onChange={e => setForm(f => ({ ...f, friendlyName: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Voice URL</Label>
                          <Input placeholder="https://..." value={form.voiceUrl} onChange={e => setForm(f => ({ ...f, voiceUrl: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>SMS URL</Label>
                          <Input placeholder="https://..." value={form.smsUrl} onChange={e => setForm(f => ({ ...f, smsUrl: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Status Callback URL</Label>
                          <Input placeholder="https://..." value={form.statusCallback} onChange={e => setForm(f => ({ ...f, statusCallback: e.target.value }))} />
                        </div>
                        <Button
                          className="w-full"
                          disabled={updateNumber.isPending}
                          onClick={() => updateNumber.mutate({ sid: num.sid, data: form })}
                        >
                          {updateNumber.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
