import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetTwilioAccount, useListTwilioPhoneNumbers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Unplug, RefreshCw, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "wouter";

const BASE = import.meta.env.BASE_URL ?? "/";
const API = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;

function useNavigateHook() {
  const [, setLocation] = React.useState("");
  return setLocation;
}

function useTenantCredentials() {
  return useQuery({
    queryKey: ["tenant-credentials"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/tenant/credentials`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch credentials");
      return res.json() as Promise<{
        connected: boolean;
        accountSid?: string;
        accountName?: string;
        plan?: string;
        hasApiKey?: boolean;
        createdAt?: string;
      }>;
    },
  });
}

export default function Settings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: account, isLoading: accountLoading } = useGetTwilioAccount();
  const { data: phoneNumbers, isLoading: numbersLoading } = useListTwilioPhoneNumbers();
  const { data: tenantCreds, isLoading: credsLoading } = useTenantCredentials();
  const [copied, setCopied] = useState<string | null>(null);

  // Re-connect form
  const [showReconnect, setShowReconnect] = useState(false);
  const [newSid, setNewSid] = useState("");
  const [newToken, setNewToken] = useState("");
  const [newApiKeySid, setNewApiKeySid] = useState("");
  const [newApiKeySecret, setNewApiKeySecret] = useState("");
  const [reconnecting, setReconnecting] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/tenant/credentials`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Twilio account disconnected" });
      qc.invalidateQueries({ queryKey: ["tenant-credentials"] });
      qc.clear();
      window.location.href = `${BASE}connect`;
    },
    onError: () => toast({ title: "Failed to disconnect", variant: "destructive" }),
  });

  async function handleReconnect(e: React.FormEvent) {
    e.preventDefault();
    setReconnecting(true);
    try {
      const res = await fetch(`${API}/api/tenant/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          accountSid: newSid.trim(),
          authToken: newToken.trim(),
          apiKeySid: newApiKeySid.trim() || undefined,
          apiKeySecret: newApiKeySecret.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed to update credentials", variant: "destructive" });
      } else {
        toast({ title: `Connected to ${data.accountName}` });
        qc.invalidateQueries({ queryKey: ["tenant-credentials"] });
        qc.invalidateQueries({ queryKey: ["twilio-account"] });
        setShowReconnect(false);
        setNewSid(""); setNewToken(""); setNewApiKeySid(""); setNewApiKeySecret("");
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setReconnecting(false);
    }
  }

  const mainNumber = phoneNumbers?.[0]?.phoneNumber || "";
  const webhookBase = `${window.location.origin}/api/twilio`;

  const planColors: Record<string, string> = {
    starter: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    growth: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    business: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    enterprise: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Account details, Twilio credentials, and webhook configuration.</p>
      </div>

      {/* ── Connected Twilio Account ─────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Twilio Account</CardTitle>
              <CardDescription>Your linked Twilio credentials</CardDescription>
            </div>
            {tenantCreds?.plan && (
              <Badge className={planColors[tenantCreds.plan] ?? ""} variant="outline">
                {tenantCreds.plan.charAt(0).toUpperCase() + tenantCreds.plan.slice(1)} Plan
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {credsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : tenantCreds?.connected ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account SID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input readOnly value={tenantCreds.accountSid ?? ""} className="font-mono text-sm" />
                    <Button size="sm" variant="ghost" onClick={() => copy(tenantCreds.accountSid ?? "", "Account SID")}>
                      {copied === "Account SID" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account Name</Label>
                  <Input readOnly value={tenantCreds.accountName ?? ""} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Auth Token</Label>
                  <Input readOnly value="••••••••••••••••••••••••••••••••" className="font-mono text-sm mt-1 text-muted-foreground" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">API Key</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input readOnly value={tenantCreds.hasApiKey ? "Configured" : "Not configured"} className="text-sm" />
                    {tenantCreds.hasApiKey && <Key className="h-4 w-4 text-green-500 flex-shrink-0" />}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReconnect(v => !v)}
                  className="gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Update Credentials
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Disconnect your Twilio account? All features will stop working.")) {
                      disconnectMutation.mutate();
                    }
                  }}
                  disabled={disconnectMutation.isPending}
                  className="gap-2"
                >
                  <Unplug className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </div>

              {showReconnect && (
                <form onSubmit={handleReconnect} className="space-y-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Enter new credentials to replace the current ones:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Account SID</Label>
                      <Input
                        required
                        value={newSid}
                        onChange={e => setNewSid(e.target.value)}
                        placeholder="ACxxxxxxxxxxxx"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label>Auth Token</Label>
                      <Input
                        required
                        type="password"
                        value={newToken}
                        onChange={e => setNewToken(e.target.value)}
                        placeholder="Auth Token"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label>API Key SID <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        value={newApiKeySid}
                        onChange={e => setNewApiKeySid(e.target.value)}
                        placeholder="SKxxxxxxxxxxxx"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label>API Key Secret <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        type="password"
                        value={newApiKeySecret}
                        onChange={e => setNewApiKeySecret(e.target.value)}
                        placeholder="API Key Secret"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={reconnecting}>
                      {reconnecting ? "Saving..." : "Save New Credentials"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowReconnect(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-3">No Twilio account connected.</p>
              <Button asChild>
                <a href={`${BASE}connect`}>Connect Twilio Account</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Twilio Account Info ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Live details from your Twilio account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
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

      {/* ── Phone Numbers ─────────────────────────────────────── */}
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
              {(!phoneNumbers || phoneNumbers.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No phone numbers found on this account.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Webhook URLs ──────────────────────────────────────── */}
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
