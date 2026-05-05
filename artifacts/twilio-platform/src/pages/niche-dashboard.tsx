import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getNicheDashboardConfig } from "@/data/niche-dashboard-configs";
import {
  Plus, MessageSquare, Phone, RefreshCw, Send, CheckCircle,
  AlertCircle, ChevronRight, Trash2, Bell, ArrowUpRight,
  Search, Mail, BarChart3,
} from "lucide-react";
import { format } from "date-fns";

type NicheRecord = {
  id: number;
  slug: string;
  entity_name: string;
  entity_phone: string;
  entity_email: string | null;
  record_type: string;
  status: string;
  notes: string | null;
  assigned_to: string | null;
  scheduled_at: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
};

type Stats = { total: number; active: number; today: number; thisWeek: number; byStatus: { status: string; count: string }[] };

const emptyForm = {
  entity_name: "", entity_phone: "", entity_email: "",
  record_type: "", notes: "", assigned_to: "", scheduled_at: "",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  "no-show": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  lapsed: "bg-red-500/20 text-red-400 border-red-500/30",
  "in-progress": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  prospect: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  placed: "bg-green-500/20 text-green-400 border-green-500/30",
  offered: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  enrolled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  withdrawn: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? "bg-muted/50 text-muted-foreground border-border";
}

export default function NicheDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const config = getNicheDashboardConfig(slug ?? "");
  const { toast } = useToast();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [smsRecordId, setSmsRecordId] = useState<number | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: stats, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ["niche-stats", slug],
    queryFn: () => fetch(`/api/niche/${slug}/stats`).then(r => r.json()),
    refetchInterval: 30000,
    enabled: !!slug,
  });

  const { data: records = [], isLoading, refetch } = useQuery<NicheRecord[]>({
    queryKey: ["niche-records", slug, filterStatus],
    queryFn: () => fetch(`/api/niche/${slug}/records${filterStatus !== "all" ? `?status=${filterStatus}` : ""}`).then(r => r.json()),
    refetchInterval: 15000,
    enabled: !!slug,
  });

  const createRecord = useMutation({
    mutationFn: () => fetch(`/api/niche/${slug}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        record_type: form.record_type || (config?.typeOptions[0]?.value ?? "general"),
      }),
    }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => {
      toast({ title: `${config?.entityName ?? "Record"} created` });
      setCreateOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["niche-records", slug] });
      qc.invalidateQueries({ queryKey: ["niche-stats", slug] });
    },
    onError: () => toast({ title: "Failed to create record", variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/niche/${slug}/records/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["niche-records", slug] });
      qc.invalidateQueries({ queryKey: ["niche-stats", slug] });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: (id: number) => fetch(`/api/niche/${slug}/records/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Record deleted" });
      qc.invalidateQueries({ queryKey: ["niche-records", slug] });
      qc.invalidateQueries({ queryKey: ["niche-stats", slug] });
    },
  });

  const sendSms = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      fetch(`/api/niche/${slug}/records/${id}/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: (data) => {
      toast({ title: `SMS sent to ${data.to}` });
      setSmsRecordId(null);
      setSmsMessage("");
      qc.invalidateQueries({ queryKey: ["niche-records", slug] });
    },
    onError: () => toast({ title: "Failed to send SMS", variant: "destructive" }),
  });

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="size-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Industry Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">The industry dashboard for "{slug}" doesn't exist.</p>
        <Link href="/dashboard"><Button size="sm">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const Icon = config.icon;
  const filteredRecords = records.filter(r =>
    !search || r.entity_name.toLowerCase().includes(search.toLowerCase()) ||
    r.entity_phone.includes(search) || r.entity_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`size-8 rounded-lg bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} border border-white/10 flex items-center justify-center`}>
              <Icon className="size-4 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{config.name}</h1>
            <Badge variant="outline" className="text-[10px] font-semibold px-2">
              {config.complianceTags[0]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            {config.recordPlural} · SMS automation · Compliance workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetch(); refetchStats(); }} className="gap-1.5 text-xs">
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Link href="/sms"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><MessageSquare className="size-3.5" /> SMS Center</Button></Link>
          <Link href="/calls"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><Phone className="size-3.5" /> Calls</Button></Link>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="size-3.5" /> Add {config.entityName}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New {config.entityName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{config.nameLabel} *</Label>
                    <Input value={form.entity_name} onChange={e => setForm(f => ({ ...f, entity_name: e.target.value }))} placeholder="Full Name" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">{config.phoneLabel} *</Label>
                    <Input value={form.entity_phone} onChange={e => setForm(f => ({ ...f, entity_phone: e.target.value }))} placeholder="+15551234567" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" value={form.entity_email} onChange={e => setForm(f => ({ ...f, entity_email: e.target.value }))} placeholder="email@example.com" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">{config.secondaryLabel}</Label>
                    <Input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder={config.secondaryLabel} className="mt-1 h-8 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={form.record_type || config.typeOptions[0]?.value} onValueChange={v => setForm(f => ({ ...f, record_type: v }))}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {config.typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {config.showScheduled && (
                    <div>
                      <Label className="text-xs">{config.scheduledLabel}</Label>
                      <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="mt-1 h-8 text-sm" />
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any relevant notes..." className="mt-1 h-16 text-sm" />
                </div>
                <Button className="w-full h-9 text-sm" onClick={() => createRecord.mutate()}
                  disabled={createRecord.isPending || !form.entity_name || !form.entity_phone}>
                  {createRecord.isPending ? "Creating..." : `Add ${config.entityName}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {config.kpis.map(kpi => {
          const val = stats?.[kpi.valueKey] ?? 0;
          return (
            <Card key={kpi.label} className="border-border/50">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <kpi.icon className={`size-4 ${kpi.color}`} />
                </div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{val}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="records">
        <TabsList className="mb-4">
          <TabsTrigger value="records">{config.recordPlural}</TabsTrigger>
          <TabsTrigger value="sms-hub">SMS Templates</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Records Tab */}
        <TabsContent value="records">
          <Card className="border-border/50">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${config.entityPlural.toLowerCase()}...`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {config.statusOptions.map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/-/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground ml-auto">{filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}</p>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-14">
                  <Icon className="size-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground mb-3">No {config.recordPlural.toLowerCase()} yet. Add your first one!</p>
                  <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-3.5 mr-1" /> Add {config.entityName}</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-xs">{config.entityName}</TableHead>
                        <TableHead className="text-xs">Phone</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        {config.secondaryLabel && <TableHead className="text-xs">{config.secondaryLabel}</TableHead>}
                        {config.showScheduled && <TableHead className="text-xs">{config.scheduledLabel}</TableHead>}
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Added</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map(record => (
                        <TableRow key={record.id} className="border-border/50 hover:bg-muted/20">
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{record.entity_name}</p>
                              {record.entity_email && <p className="text-[10px] text-muted-foreground">{record.entity_email}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{record.entity_phone}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">
                              {config.typeOptions.find(t => t.value === record.record_type)?.label ?? record.record_type}
                            </Badge>
                          </TableCell>
                          {config.secondaryLabel && (
                            <TableCell className="text-xs text-muted-foreground">{record.assigned_to || "—"}</TableCell>
                          )}
                          {config.showScheduled && (
                            <TableCell className="text-xs text-muted-foreground">
                              {record.scheduled_at ? format(new Date(record.scheduled_at), "MMM d, h:mm a") : "—"}
                            </TableCell>
                          )}
                          <TableCell>
                            <Select
                              value={record.status}
                              onValueChange={v => updateStatus.mutate({ id: record.id, status: v })}
                            >
                              <SelectTrigger className={`h-6 text-[10px] w-32 border px-2 ${getStatusColor(record.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {config.statusOptions.map(s => (
                                  <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/-/g, " ")}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">
                            {format(new Date(record.created_at), "MMM d")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm" variant="outline"
                                className="h-6 w-6 p-0"
                                title="Send SMS"
                                onClick={() => { setSmsRecordId(record.id); setSmsMessage(""); }}
                              >
                                <MessageSquare className="size-3" />
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                title="Delete"
                                onClick={() => deleteRecord.mutate(record.id)}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Templates Tab */}
        <TabsContent value="sms-hub">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" /> SMS Templates
                </CardTitle>
                <CardDescription className="text-xs">Click any template to open it in SMS Center, pre-filled.</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {config.smsTemplates.map((tmpl, i) => (
                  <div key={i} className="group rounded-lg border border-border/50 bg-muted/20 p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => { setSmsMessage(tmpl.template); }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground">{tmpl.label}</p>
                      <ChevronRight className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{tmpl.template}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Send className="size-4 text-primary" /> Quick SMS Composer
                </CardTitle>
                <CardDescription className="text-xs">
                  {smsRecordId ? `Sending to record #${smsRecordId}` : "Select a record from the table to send, or use the template below."}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <Textarea
                  value={smsMessage}
                  onChange={e => setSmsMessage(e.target.value)}
                  placeholder="Type your message or click a template on the left..."
                  className="h-32 text-sm resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{smsMessage.length} chars</span>
                  {smsRecordId && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSmsRecordId(null); setSmsMessage(""); }}>
                        Cancel
                      </Button>
                      <Button size="sm" className="h-7 text-xs gap-1.5" disabled={!smsMessage || sendSms.isPending}
                        onClick={() => smsRecordId && sendSms.mutate({ id: smsRecordId, message: smsMessage })}>
                        <Send className="size-3" /> Send SMS
                      </Button>
                    </div>
                  )}
                </div>
                {!smsRecordId && (
                  <p className="text-[11px] text-muted-foreground text-center bg-muted/30 rounded-lg py-3">
                    Select a record from the <strong>Records tab</strong> and click the <MessageSquare className="size-3 inline" /> icon to send this message.
                  </p>
                )}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Links</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/sms"><div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/40 bg-card/50 hover:bg-muted/50 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"><MessageSquare className="size-3" /> SMS Center</div></Link>
                    <Link href="/email-campaigns"><div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/40 bg-card/50 hover:bg-muted/50 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"><Mail className="size-3" /> Email Campaigns</div></Link>
                    <Link href="/calls"><div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/40 bg-card/50 hover:bg-muted/50 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"><Phone className="size-3" /> Calls</div></Link>
                    <Link href="/usage"><div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/40 bg-card/50 hover:bg-muted/50 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"><BarChart3 className="size-3" /> Usage & Stats</div></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-400" /> Compliance Checklist
                </CardTitle>
                <CardDescription className="text-xs">
                  Industry-specific requirements for {config.name} communications.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {config.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
                    {item.done
                      ? <CheckCircle className="size-4 text-green-400 flex-shrink-0 mt-0.5" />
                      : <AlertCircle className="size-4 text-yellow-400 flex-shrink-0 mt-0.5" />}
                    <p className={`text-xs leading-relaxed ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item.item}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bell className="size-4 text-primary" /> Applicable Regulations
                </CardTitle>
                <CardDescription className="text-xs">
                  All regulations relevant to {config.shortName} communications.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {config.complianceTags.map(tag => (
                    <Badge key={tag} className="text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[11px] text-blue-300 leading-relaxed">
                      <strong>TCPA:</strong> Always obtain express written consent before sending any marketing SMS. Include opt-out instructions ("Reply STOP") in every message. Never send between 9PM–8AM local time.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[11px] text-amber-300 leading-relaxed">
                      <strong>Best Practice:</strong> Keep SMS messages under 160 characters when possible. Use the recipient's name for personalization. Always identify your business in the first message.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-[11px] text-green-300 leading-relaxed">
                      <strong>Audit Trail:</strong> All messages sent through this platform are logged with timestamps, recipient numbers, delivery status, and opt-out records — ready for regulatory review.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50">
                  <Link href={`/niches/${slug}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                      <ArrowUpRight className="size-3.5" /> View Full Compliance Section for {config.shortName}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* SMS Send Dialog */}
      <Dialog open={!!smsRecordId} onOpenChange={open => { if (!open) { setSmsRecordId(null); setSmsMessage(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS to {records.find(r => r.id === smsRecordId)?.entity_name ?? "Contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs">Quick Templates</Label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {config.smsTemplates.map((tmpl, i) => (
                  <button key={i} onClick={() => setSmsMessage(tmpl.template)}
                    className="w-full text-left text-[11px] px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
                    <span className="font-semibold text-foreground">{tmpl.label}:</span> {tmpl.template.slice(0, 60)}…
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message</Label>
              <Textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} className="h-24 text-sm resize-none" placeholder="Your message..." />
              <p className="text-[10px] text-muted-foreground">{smsMessage.length} chars · "Reply STOP to opt out." appended automatically</p>
            </div>
            <Button className="w-full" disabled={!smsMessage || sendSms.isPending}
              onClick={() => smsRecordId && sendSms.mutate({ id: smsRecordId, message: smsMessage })}>
              <Send className="size-4 mr-2" /> {sendSms.isPending ? "Sending..." : "Send SMS"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
