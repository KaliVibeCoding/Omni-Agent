import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetTwilioAccount, useListTwilioPhoneNumbers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const { data: account, isLoading: accountLoading } = useGetTwilioAccount();
  const { data: phoneNumbers, isLoading: numbersLoading } = useListTwilioPhoneNumbers();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const mainNumber = phoneNumbers?.[0]?.phoneNumber || "";
  const webhookBase = `${window.location.origin}/api/twilio`;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Account details and webhook configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your Twilio account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account SID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input readOnly value={account?.sid || ""} className="font-mono text-sm" />
                  <Button size="sm" variant="ghost" onClick={() => copy(account?.sid || "", "Account SID")}>
                    {copied === "Account SID" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Friendly Name</Label>
                <Input readOnly value={account?.friendlyName || ""} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                <div className="mt-1">
                  <Badge className={account?.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                    variant={account?.status === "active" ? "default" : "secondary"}>
                    {account?.status || "—"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Balance</Label>
                <div className="text-xl font-bold mt-1">
                  {account?.balance ? `$${parseFloat(account.balance).toFixed(2)}` : "$—"} <span className="text-xs font-normal text-muted-foreground uppercase">{account?.currency}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phone Numbers</CardTitle>
          <CardDescription>Numbers on your account</CardDescription>
        </CardHeader>
        <CardContent>
          {numbersLoading ? <Skeleton className="h-16 w-full" /> : (
            <div className="space-y-3">
              {phoneNumbers?.map((num: any) => (
                <div key={num.sid} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div>
                    <div className="font-mono font-medium">{num.phoneNumber}</div>
                    <div className="text-xs text-muted-foreground">{num.friendlyName}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copy(num.phoneNumber, num.phoneNumber)}>
                    {copied === num.phoneNumber ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URLs</CardTitle>
          <CardDescription>Use these URLs in your Twilio console to receive callbacks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Call Status Callback", url: `${webhookBase}/calls/status-callback` },
            { label: "SMS Status Callback", url: `${webhookBase}/sms/status-callback` },
            { label: "Inbound Voice (TwiML)", url: `${webhookBase}/voice/incoming` },
            { label: "Inbound SMS", url: `${webhookBase}/sms/incoming` },
          ].map(({ label, url }) => (
            <div key={label}>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input readOnly value={url} className="font-mono text-sm text-muted-foreground" />
                <Button size="sm" variant="ghost" onClick={() => copy(url, label)}>
                  {copied === label ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
