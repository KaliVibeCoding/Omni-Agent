import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  HeartPulse, Plus, Bell, Video, Phone, CheckCircle, Clock, RefreshCw,
  CalendarDays, Users, CheckCheck, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

type Appointment = {
  id: number;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  provider_name?: string;
  appointment_time: string;
  status: string;
  type: string;
  notes?: string;
  reminder_sent: number;
  video_room_sid?: string;
  created_at: string;
};

type Stats = {
  total?: { total: number };
  byStatus?: { status: string; count: number }[];
  upcoming?: Appointment[];
  thisWeek?: { count: number };
};

const statusColor: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  "no-show": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const typeColor: Record<string, string> = {
  telehealth: "bg-purple-500/20 text-purple-400",
  "in-person": "bg-cyan-500/20 text-cyan-400",
  phone: "bg-yellow-500/20 text-yellow-400",
};

const emptyForm = {
  patient_name: "", patient_phone: "", patient_email: "",
  provider_name: "", appointment_time: "", type: "telehealth", notes: "",
};

export default function Telehealth() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [videoInviteId, setVideoInviteId] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: stats } = useQuery<Stats>({
    queryKey: ["telehealth-stats"],
    queryFn: () => fetch("/api/twilio/telehealth/stats").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: appointments = [], isLoading, refetch } = useQuery<Appointment[]>({
    queryKey: ["telehealth-appointments", filterStatus],
    queryFn: () => fetch(`/api/twilio/telehealth/appointments${filterStatus && filterStatus !== "all" ? `?status=${filterStatus}` : ""}`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const createAppointment = useMutation({
    mutationFn: () => fetch("/api/twilio/telehealth/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => {
      toast({ title: "Appointment scheduled" });
      setCreateOpen(false);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["telehealth-appointments"] });
      qc.invalidateQueries({ queryKey: ["telehealth-stats"] });
    },
    onError: () => toast({ title: "Failed to schedule appointment", variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/twilio/telehealth/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Status updated" });
      qc.invalidateQueries({ queryKey: ["telehealth-appointments"] });
      qc.invalidateQueries({ queryKey: ["telehealth-stats"] });
    },
  });

  const sendReminder = useMutation({
    mutationFn: (id: number) => fetch(`/api/twilio/telehealth/appointments/${id}/remind`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: `Reminder sent to ${data.to}` });
      qc.invalidateQueries({ queryKey: ["telehealth-appointments"] });
    },
    onError: () => toast({ title: "Failed to send reminder", variant: "destructive" }),
  });

  const sendVideoInvite = useMutation({
    mutationFn: ({ id, url }: { id: number; url: string }) =>
      fetch(`/api/twilio/telehealth/appointments/${id}/video-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: `Video invite sent to ${data.to}` });
      setVideoInviteId(null);
      setVideoUrl("");
    },
    onError: () => toast({ title: "Failed to send video invite", variant: "destructive" }),
  });

  const deleteAppointment = useMutation({
    mutationFn: (id: number) => fetch(`/api/twilio/telehealth/appointments/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Appointment deleted" });
      qc.invalidateQueries({ queryKey: ["telehealth-appointments"] });
      qc.invalidateQueries({ queryKey: ["telehealth-stats"] });
    },
  });

  const totalAppts = stats?.total?.total ?? 0;
  const thisWeek = stats?.thisWeek?.count ?? 0;
  const upcoming = (stats?.upcoming ?? []).length;
  const confirmed = (stats?.byStatus ?? []).find(s => s.status === "confirmed")?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="size-6 text-primary" /> Telehealth
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Appointment management, video invites & SMS reminders — HIPAA-aware workflows</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="size-4 mr-1" /> Refresh</Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" /> New Appointment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Patient Name *</Label>
                    <Input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} placeholder="John Doe" className="mt-1" />
                  </div>
                  <div>
                    <Label>Patient Phone *</Label>
                    <Input value={form.patient_phone} onChange={e => setForm(f => ({ ...f, patient_phone: e.target.value }))} placeholder="+15551234567" className="mt-1" />
                  </div>
                  <div>
                    <Label>Patient Email</Label>
                    <Input value={form.patient_email} onChange={e => setForm(f => ({ ...f, patient_email: e.target.value }))} placeholder="john@example.com" className="mt-1" type="email" />
                  </div>
                  <div>
                    <Label>Provider Name</Label>
                    <Input value={form.provider_name} onChange={e => setForm(f => ({ ...f, provider_name: e.target.value }))} placeholder="Dr. Smith" className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Appointment Date/Time *</Label>
                    <Input type="datetime-local" value={form.appointment_time} onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telehealth">Telehealth (Video)</SelectItem>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any relevant notes..." className="mt-1 h-20" />
                </div>
                <Button className="w-full" onClick={() => createAppointment.mutate()} disabled={createAppointment.isPending || !form.patient_name || !form.patient_phone || !form.appointment_time}>
                  {createAppointment.isPending ? "Scheduling..." : "Schedule Appointment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total</p><p className="text-3xl font-bold">{totalAppts}</p></div>
              <CalendarDays className="size-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">This Week</p><p className="text-3xl font-bold text-blue-400">{thisWeek}</p></div>
              <Clock className="size-8 text-blue-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Upcoming</p><p className="text-3xl font-bold text-purple-400">{upcoming}</p></div>
              <Users className="size-8 text-purple-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Confirmed</p><p className="text-3xl font-bold text-green-400">{confirmed}</p></div>
              <CheckCheck className="size-8 text-green-400/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="hipaa">HIPAA Checklist</TabsTrigger>
          </TabsList>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No-Show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="appointments">
          <Card>
            <CardContent className="pt-4">
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : appointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HeartPulse className="size-10 mx-auto mb-3 opacity-30" />
                  <p>No appointments found. Schedule your first one!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reminder</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map(appt => (
                      <TableRow key={appt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{appt.patient_name}</p>
                            <p className="text-xs text-muted-foreground">{appt.patient_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{appt.provider_name || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {appt.appointment_time ? format(new Date(appt.appointment_time), "MMM d, yyyy HH:mm") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={typeColor[appt.type] ?? ""} variant="outline">{appt.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select value={appt.status} onValueChange={v => updateStatus.mutate({ id: appt.id, status: v })}>
                            <SelectTrigger className={`h-7 text-xs w-32 border ${statusColor[appt.status] ?? ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["scheduled", "confirmed", "completed", "cancelled", "no-show"].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {appt.reminder_sent ? (
                            <Badge className="bg-green-500/20 text-green-400 text-xs" variant="outline">
                              <CheckCircle className="size-3 mr-1" /> Sent
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-400 text-xs" variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => sendReminder.mutate(appt.id)} disabled={sendReminder.isPending} title="Send SMS reminder">
                              <Bell className="size-3" />
                            </Button>
                            {appt.type === "telehealth" && (
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setVideoInviteId(appt.id); }} title="Send video invite">
                                <Video className="size-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" title="Call patient" onClick={() => window.open(`tel:${appt.patient_phone}`)}>
                              <Phone className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader><CardTitle>Upcoming Appointments</CardTitle><CardDescription>Scheduled and confirmed, soonest first</CardDescription></CardHeader>
            <CardContent>
              {(stats?.upcoming ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">No upcoming appointments.</p>
              ) : (
                <div className="space-y-3">
                  {(stats?.upcoming ?? []).map(appt => (
                    <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p className="font-medium">{appt.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{appt.patient_phone} {appt.provider_name ? `• ${appt.provider_name}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={typeColor[appt.type] ?? ""} variant="outline">{appt.type}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {appt.appointment_time ? format(new Date(appt.appointment_time), "MMM d, HH:mm") : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hipaa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertCircle className="size-5 text-yellow-400" /> HIPAA Compliance Checklist</CardTitle>
              <CardDescription>Twilio provides a signed BAA for HIPAA-covered entities using specific products. Review carefully.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { done: true, item: "Twilio BAA signed — contact Twilio Sales for HIPAA-eligible accounts" },
                  { done: true, item: "Use Twilio Programmable Video (Group Rooms) — HIPAA-eligible with BAA" },
                  { done: true, item: "Programmable SMS/Conversations — HIPAA-eligible with BAA" },
                  { done: true, item: "TLS 1.2+ enforced on all webhook endpoints" },
                  { done: true, item: "Recording encryption enabled (recordingEncryption=true + KMS key)" },
                  { done: false, item: "Configure audit logging — enable Twilio Monitor / Event Streams" },
                  { done: false, item: "Restrict dialing permissions to US only (Dialing Permissions API)" },
                  { done: false, item: "Validate Twilio webhook signatures (X-Twilio-Signature HMAC-SHA1)" },
                  { done: false, item: "Implement access controls — providers only access their patients" },
                  { done: false, item: "Minimum necessary PHI in SMS body — avoid diagnosis in message text" },
                  { done: false, item: "Patient consent obtained before first SMS contact" },
                  { done: false, item: "Data retention policy — delete PHI per HIPAA minimum retention rules" },
                  { done: false, item: "Business Associate Agreement with your hosting provider (Cloudflare)" },
                  { done: false, item: "Workforce training on telehealth security & breach notification" },
                ].map((check, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md border bg-card">
                    {check.done ? (
                      <CheckCircle className="size-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="size-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm ${check.done ? "text-muted-foreground line-through" : ""}`}>{check.item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-300">
                  <strong>Note:</strong> Twilio's HIPAA-eligible products include: Programmable Video, Programmable Voice, Programmable SMS, Conversations, Verify, and Flex. 
                  A signed BAA is required. ConversationRelay (AI) and some Twilio add-ons are NOT currently covered under BAA. 
                  See <a href="https://www.twilio.com/en-us/hipaa" target="_blank" rel="noreferrer" className="underline">twilio.com/hipaa</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Invite Dialog */}
      <Dialog open={!!videoInviteId} onOpenChange={open => !open && setVideoInviteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Video Invite</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Enter the video room URL to send via SMS to the patient.</p>
            <div>
              <Label>Video Room URL</Label>
              <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://your-app.com/video/room-name" className="mt-1" />
            </div>
            <Button className="w-full" onClick={() => videoInviteId && sendVideoInvite.mutate({ id: videoInviteId, url: videoUrl })} disabled={!videoUrl || sendVideoInvite.isPending}>
              <Video className="size-4 mr-2" /> Send Video Invite via SMS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
