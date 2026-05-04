import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetTwilioAccount, useListTwilioPhoneNumbers } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, DollarSign, Activity, PhoneCall, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: account, isLoading: accountLoading } = useGetTwilioAccount();
  const { data: phoneNumbers } = useListTwilioPhoneNumbers();

  const { data: activeCalls } = useQuery({
    queryKey: ["activeCalls"],
    queryFn: () => fetch("/api/twilio/calls/active").then(res => res.json()),
    refetchInterval: 10000,
  });

  const { data: recentCalls } = useQuery({
    queryKey: ["recentCallsDashboard"],
    queryFn: () => fetch("/api/twilio/calls/recent").then(res => res.json()),
  });

  const { data: recentMessages } = useQuery({
    queryKey: ["recentMessagesDashboard"],
    queryFn: () => fetch("/api/twilio/sms/messages?limit=10").then(res => res.json()),
  });

  const { data: todayUsage } = useQuery({
    queryKey: ["todayUsage"],
    queryFn: () => fetch("/api/twilio/usage/today").then(res => res.json()),
  });

  const todayCost = todayUsage?.reduce((sum: number, r: any) => sum + parseFloat(r.price || "0"), 0).toFixed(4);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {account?.friendlyName || "Twilio Account"} — Live overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {accountLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${account?.status === "active" ? "bg-green-500" : "bg-yellow-500"}`} />
                  <div className="text-2xl font-bold capitalize">{account?.status || "Unknown"}</div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1" title={account?.sid}>{account?.sid}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {accountLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">
                  {account?.balance ? `$${parseFloat(account.balance).toFixed(2)}` : "$0.00"}
                </div>
                <p className="text-xs text-muted-foreground uppercase mt-1">{account?.currency || "USD"}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCalls?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCalls?.length > 0 ? "Currently in progress" : "No active calls"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todayCost || "0.0000"}</div>
            <p className="text-xs text-muted-foreground mt-1">{todayUsage?.length || 0} usage categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Recent Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!recentCalls ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : recentCalls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent calls</p>
              ) : (
                recentCalls.slice(0, 6).map((call: any) => (
                  <div key={call.sid} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      {call.direction === "inbound"
                        ? <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                        : <ArrowUpRight className="h-4 w-4 text-green-400" />}
                      <div>
                        <div className="text-sm font-medium font-mono">
                          {call.direction === "inbound" ? call.from : call.to}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {call.startTime ? format(new Date(call.startTime), "MMM d, h:mm a") : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.duration ? <span className="text-xs text-muted-foreground">{call.duration}s</span> : null}
                      <Badge variant="outline" className="text-xs capitalize">{call.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!recentMessages ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : recentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent messages</p>
              ) : (
                recentMessages.slice(0, 6).map((msg: any) => (
                  <div key={msg.sid} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      {msg.direction === "inbound"
                        ? <ArrowDownLeft className="h-4 w-4 text-blue-400" />
                        : <ArrowUpRight className="h-4 w-4 text-green-400" />}
                      <div>
                        <div className="text-sm font-mono">
                          {msg.direction?.startsWith("outbound") ? msg.to : msg.from}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{msg.body}</div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${msg.status === "delivered" ? "text-green-500 border-green-500/30" : ""}`}
                    >
                      {msg.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4" /> Phone Numbers ({phoneNumbers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {!phoneNumbers ? (
              <Skeleton className="h-8 w-40" />
            ) : phoneNumbers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No phone numbers found</p>
            ) : (
              phoneNumbers.map((num: any) => (
                <div key={num.sid} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-md">
                  <span className="font-mono text-sm font-medium">{num.phoneNumber}</span>
                  <div className="flex gap-1">
                    {num.capabilities?.voice && <Badge variant="outline" className="text-xs py-0">V</Badge>}
                    {num.capabilities?.sms && <Badge variant="outline" className="text-xs py-0">S</Badge>}
                    {num.capabilities?.mms && <Badge variant="outline" className="text-xs py-0">M</Badge>}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
