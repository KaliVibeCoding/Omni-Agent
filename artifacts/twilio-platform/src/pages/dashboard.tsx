import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetTwilioAccount, useListTwilioPhoneNumbers } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, MessageSquare, DollarSign, Activity, PhoneCall,
  ArrowUpRight, ArrowDownLeft, Video, MessageCircle, HeartPulse,
  Brain, Mail, ShieldCheck, Users, Voicemail, Search,
  Workflow, ListOrdered, Users2, Webhook, ChevronRight,
  TrendingUp, Zap, Globe, BarChart3, Bell, CreditCard, Shield,
} from "lucide-react";
import { format } from "date-fns";

const FEATURE_CARDS = [
  {
    title: "SMS Center",
    desc: "Send & track messages in real time",
    href: "/sms",
    icon: MessageSquare,
    color: "from-blue-600/20 to-blue-500/5",
    iconColor: "text-blue-400",
    border: "hover:border-blue-500/40",
    badge: "Live",
    badgeColor: "bg-blue-500/20 text-blue-300",
  },
  {
    title: "Calls",
    desc: "Outbound calling with live monitoring",
    href: "/calls",
    icon: PhoneCall,
    color: "from-green-600/20 to-green-500/5",
    iconColor: "text-green-400",
    border: "hover:border-green-500/40",
    badge: "Live",
    badgeColor: "bg-green-500/20 text-green-300",
  },
  {
    title: "Video Rooms",
    desc: "HD video conferencing & recordings",
    href: "/video",
    icon: Video,
    color: "from-purple-600/20 to-purple-500/5",
    iconColor: "text-purple-400",
    border: "hover:border-purple-500/40",
    badge: "HD",
    badgeColor: "bg-purple-500/20 text-purple-300",
  },
  {
    title: "Telehealth",
    desc: "HIPAA-aware appointment workflows",
    href: "/telehealth",
    icon: HeartPulse,
    color: "from-rose-600/20 to-rose-500/5",
    iconColor: "text-rose-400",
    border: "hover:border-rose-500/40",
    badge: "HIPAA",
    badgeColor: "bg-rose-500/20 text-rose-300",
  },
  {
    title: "AGI Framework",
    desc: "Multi-agent AI orchestration hub",
    href: "/agi-framework",
    icon: Brain,
    color: "from-amber-600/20 to-amber-500/5",
    iconColor: "text-amber-400",
    border: "hover:border-amber-500/40",
    badge: "AI",
    badgeColor: "bg-amber-500/20 text-amber-300",
  },
  {
    title: "Email Campaigns",
    desc: "Broadcast & drip email automation",
    href: "/email-campaigns",
    icon: Mail,
    color: "from-cyan-600/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
    border: "hover:border-cyan-500/40",
    badge: "NEW",
    badgeColor: "bg-cyan-500/20 text-cyan-300",
  },
  {
    title: "Conversations",
    desc: "Omnichannel messaging threads",
    href: "/conversations",
    icon: MessageCircle,
    color: "from-indigo-600/20 to-indigo-500/5",
    iconColor: "text-indigo-400",
    border: "hover:border-indigo-500/40",
    badge: null,
    badgeColor: "",
  },
  {
    title: "Verify / 2FA",
    desc: "One-time passwords & identity checks",
    href: "/verify",
    icon: ShieldCheck,
    color: "from-teal-600/20 to-teal-500/5",
    iconColor: "text-teal-400",
    border: "hover:border-teal-500/40",
    badge: "OTP",
    badgeColor: "bg-teal-500/20 text-teal-300",
  },
  {
    title: "Contacts",
    desc: "CRM-lite contact management",
    href: "/contacts",
    icon: Users,
    color: "from-orange-600/20 to-orange-500/5",
    iconColor: "text-orange-400",
    border: "hover:border-orange-500/40",
    badge: null,
    badgeColor: "",
  },
];

const TOOL_LINKS = [
  { name: "Number Lookup", href: "/lookup", icon: Search },
  { name: "Voicemails", href: "/voicemails", icon: Voicemail },
  { name: "Conferences", href: "/conferences", icon: Users2 },
  { name: "Messaging Services", href: "/messaging-services", icon: Webhook },
  { name: "Studio Flows", href: "/studio", icon: Workflow },
  { name: "Call Queues", href: "/queues", icon: ListOrdered },
  { name: "Phone Numbers", href: "/phone-numbers", icon: Phone },
  { name: "Usage & Stats", href: "/usage", icon: BarChart3 },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Admin Panel", href: "/admin", icon: Shield },
  { name: "Industry Pages", href: "/niches", icon: Globe },
];

export default function Dashboard() {
  const { data: account, isLoading: accountLoading } = useGetTwilioAccount();
  const { data: phoneNumbers } = useListTwilioPhoneNumbers();

  const { data: activeCalls } = useQuery({
    queryKey: ["activeCalls"],
    queryFn: () => fetch("/api/twilio/calls/active").then(r => r.json()),
    refetchInterval: 10000,
  });

  const { data: recentCalls } = useQuery({
    queryKey: ["recentCallsDashboard"],
    queryFn: () => fetch("/api/twilio/calls/recent").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: recentMessages } = useQuery({
    queryKey: ["recentMessagesDashboard"],
    queryFn: () => fetch("/api/twilio/sms/messages?limit=8").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: todayUsage } = useQuery({
    queryKey: ["todayUsage"],
    queryFn: () => fetch("/api/twilio/usage/today").then(r => r.json()),
  });

  const todayCost = todayUsage?.reduce((sum: number, r: any) => sum + parseFloat(r.price || "0"), 0).toFixed(4);
  const isActive = account?.status === "active";

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
            {!accountLoading && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${isActive ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                <div className={`size-1.5 rounded-full animate-pulse ${isActive ? "bg-green-400" : "bg-yellow-400"}`} />
                {account?.status?.toUpperCase() ?? "CHECKING"}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {account?.friendlyName || "RJ Business Solutions"} — All systems operational
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/niches">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Globe className="size-3.5" /> Industry Pages
            </Button>
          </Link>
          <Link href="/agi-framework">
            <Button size="sm" className="gap-1.5 text-xs bg-primary hover:bg-primary/90">
              <Brain className="size-3.5" /> AGI Framework
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Balance",
            value: account?.balance ? `$${parseFloat(account.balance).toFixed(2)}` : "$0.00",
            sub: account?.currency ?? "USD",
            icon: DollarSign,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            loading: accountLoading,
          },
          {
            label: "Active Calls",
            value: activeCalls?.length ?? 0,
            sub: activeCalls?.length > 0 ? "in progress" : "idle",
            icon: PhoneCall,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            loading: false,
          },
          {
            label: "Phone Numbers",
            value: phoneNumbers?.length ?? "—",
            sub: "registered",
            icon: Phone,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            loading: !phoneNumbers,
          },
          {
            label: "Today's Cost",
            value: `$${todayCost || "0.0000"}`,
            sub: `${todayUsage?.length || 0} categories`,
            icon: TrendingUp,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            loading: !todayUsage,
          },
          {
            label: "Account SID",
            value: account?.sid ? account.sid.slice(0, 8) + "…" : "—",
            sub: "Twilio",
            icon: Zap,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
            loading: accountLoading,
          },
          {
            label: "Platform",
            value: "v3.1.0",
            sub: "All services live",
            icon: Activity,
            color: "text-teal-400",
            bg: "bg-teal-500/10",
            loading: false,
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <div className={`size-6 rounded-md ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`size-3.5 ${kpi.color}`} />
                </div>
              </div>
              {kpi.loading ? (
                <Skeleton className="h-6 w-20 mb-1" />
              ) : (
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-foreground">Platform Features</h2>
          <div className="h-px flex-1 bg-border/50" />
          <Badge variant="outline" className="text-[10px] text-muted-foreground">{FEATURE_CARDS.length} modules</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURE_CARDS.map((f) => (
            <Link key={f.href} href={f.href}>
              <div className={`group relative rounded-xl border border-border/50 bg-gradient-to-br ${f.color} p-4 cursor-pointer transition-all duration-200 ${f.border} hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`size-10 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center`}>
                    <f.icon className={`size-5 ${f.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {f.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${f.badgeColor}`}>{f.badge}</span>
                    )}
                    <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground mb-0.5">{f.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="size-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <PhoneCall className="size-3 text-blue-400" />
                </div>
                Recent Calls
              </CardTitle>
              <Link href="/calls">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground gap-1 hover:text-foreground px-2">
                  View all <ArrowUpRight className="size-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1">
              {!recentCalls ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
              ) : recentCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PhoneCall className="size-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No recent calls</p>
                </div>
              ) : (
                recentCalls.slice(0, 6).map((call: any) => (
                  <div key={call.sid} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className={`size-7 rounded-full flex items-center justify-center flex-shrink-0 ${call.direction === "inbound" ? "bg-blue-500/15" : "bg-green-500/15"}`}>
                      {call.direction === "inbound"
                        ? <ArrowDownLeft className="size-3.5 text-blue-400" />
                        : <ArrowUpRight className="size-3.5 text-green-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium font-mono truncate">
                        {call.direction === "inbound" ? call.from : call.to}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {call.startTime ? format(new Date(call.startTime), "MMM d, h:mm a") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {call.duration ? <span className="text-[10px] text-muted-foreground">{call.duration}s</span> : null}
                      <Badge variant="outline" className={`text-[10px] capitalize px-1.5 py-0 ${
                        call.status === "completed" ? "border-green-500/30 text-green-400" :
                        call.status === "failed" ? "border-red-500/30 text-red-400" :
                        "border-border text-muted-foreground"
                      }`}>
                        {call.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="size-5 rounded-md bg-purple-500/10 flex items-center justify-center">
                  <MessageSquare className="size-3 text-purple-400" />
                </div>
                Recent Messages
              </CardTitle>
              <Link href="/sms">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground gap-1 hover:text-foreground px-2">
                  View all <ArrowUpRight className="size-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1">
              {!recentMessages ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
              ) : recentMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="size-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No recent messages</p>
                </div>
              ) : (
                recentMessages.slice(0, 6).map((msg: any) => (
                  <div key={msg.sid} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className={`size-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.direction?.startsWith("outbound") ? "bg-purple-500/15" : "bg-indigo-500/15"}`}>
                      {msg.direction?.startsWith("outbound")
                        ? <ArrowUpRight className="size-3.5 text-purple-400" />
                        : <ArrowDownLeft className="size-3.5 text-indigo-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium font-mono truncate">
                        {msg.direction?.startsWith("outbound") ? msg.to : msg.from}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{msg.body}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] capitalize px-1.5 py-0 flex-shrink-0 ${
                      msg.status === "delivered" ? "border-green-500/30 text-green-400" :
                      msg.status === "sent" ? "border-blue-500/30 text-blue-400" :
                      msg.status === "failed" ? "border-red-500/30 text-red-400" :
                      "border-border text-muted-foreground"
                    }`}>
                      {msg.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phone Numbers */}
      {phoneNumbers && phoneNumbers.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="size-5 rounded-md bg-green-500/10 flex items-center justify-center">
                  <Phone className="size-3 text-green-400" />
                </div>
                Phone Numbers ({phoneNumbers.length})
              </CardTitle>
              <Link href="/phone-numbers">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground gap-1 hover:text-foreground px-2">
                  Manage <ArrowUpRight className="size-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {phoneNumbers.map((num: any) => (
                <div key={num.sid} className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border/50 rounded-lg">
                  <div className="size-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="font-mono text-xs font-medium">{num.phoneNumber}</span>
                  <div className="flex gap-1">
                    {num.capabilities?.voice && <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1 rounded">V</span>}
                    {num.capabilities?.sms && <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1 rounded">S</span>}
                    {num.capabilities?.mms && <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 rounded">M</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools & Admin Quick Links */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-foreground">Tools & Admin</h2>
          <div className="h-px flex-1 bg-border/50" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {TOOL_LINKS.map((t) => (
            <Link key={t.href} href={t.href}>
              <div className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border/40 bg-card/50 hover:bg-muted/50 hover:border-border transition-all cursor-pointer">
                <t.icon className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">{t.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
