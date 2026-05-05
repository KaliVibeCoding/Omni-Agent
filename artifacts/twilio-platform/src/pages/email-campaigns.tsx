import React, { useState } from "react";
import { Mail, Send, Plus, FileText, Users, BarChart3, Clock, CheckCircle2, XCircle, Loader2, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL ?? "/";
const API = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

const TEMPLATES = [
  {
    id: "promo",
    name: "Promotional Blast",
    subject: "🔥 Special offer just for you",
    body: "Hi {{name}},\n\nWe have an exclusive offer for you today...\n\n[Your offer details here]\n\nShop now and save!\n\nBest,\nThe Team",
  },
  {
    id: "newsletter",
    name: "Monthly Newsletter",
    subject: "Your {{month}} update from {{company}}",
    body: "Hi {{name}},\n\nHere's what's new this month:\n\n• Update 1\n• Update 2\n• Update 3\n\nStay tuned for more!\n\nBest,\n{{company}}",
  },
  {
    id: "followup",
    name: "Follow-up",
    subject: "Following up — {{company}}",
    body: "Hi {{name}},\n\nJust following up on our last conversation. Did you get a chance to review our proposal?\n\nHappy to answer any questions.\n\nBest,\n{{company}}",
  },
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to {{company}}!",
    body: "Hi {{name}},\n\nWelcome aboard! We're thrilled to have you.\n\nHere's what to do next:\n1. Complete your profile\n2. Explore our features\n3. Reach out if you need help\n\nBest,\nThe {{company}} Team",
  },
];

interface Campaign {
  id: string;
  name: string;
  subject: string;
  recipients: number;
  status: "draft" | "sent" | "scheduled";
  sentAt?: string;
  opens?: number;
  clicks?: number;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "1", name: "June Newsletter", subject: "Your June update", recipients: 1240, status: "sent", sentAt: "Jun 1, 2026", opens: 342, clicks: 78 },
  { id: "2", name: "Summer Promo", subject: "🔥 Summer deals inside", recipients: 890, status: "sent", sentAt: "May 28, 2026", opens: 210, clicks: 55 },
  { id: "3", name: "Product Launch", subject: "Introducing our new feature", recipients: 500, status: "draft" },
];

export default function EmailCampaigns() {
  const [tab, setTab] = useState<"campaigns" | "compose">("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [form, setForm] = useState({
    name: "",
    fromName: "",
    fromEmail: "",
    toList: "",
    subject: TEMPLATES[0].subject,
    body: TEMPLATES[0].body,
    scheduleAt: "",
  });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setSelectedTemplate(t);
    setForm((f) => ({ ...f, subject: t.subject, body: t.body }));
  }

  async function handleSend(isDraft = false) {
    if (!form.name || !form.subject || !form.body || (!isDraft && !form.toList)) {
      showToast("Please fill in all required fields.");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1500));

    const recipientCount = form.toList.split(/[\n,]+/).filter((e) => e.trim().includes("@")).length;

    const newCampaign: Campaign = {
      id: String(Date.now()),
      name: form.name,
      subject: form.subject,
      recipients: recipientCount || 0,
      status: isDraft ? "draft" : "sent",
      sentAt: isDraft ? undefined : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    setCampaigns((c) => [newCampaign, ...c]);
    setForm({ name: "", fromName: "", fromEmail: "", toList: "", subject: TEMPLATES[0].subject, body: TEMPLATES[0].body, scheduleAt: "" });
    setSending(false);
    setTab("campaigns");
    showToast(isDraft ? "Campaign saved as draft." : `Campaign sent to ${recipientCount} recipient(s)!`);
  }

  const openRate = (c: Campaign) => c.opens && c.recipients ? Math.round((c.opens / c.recipients) * 100) : null;
  const clickRate = (c: Campaign) => c.clicks && c.recipients ? Math.round((c.clicks / c.recipients) * 100) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl border bg-green-950 border-green-800 text-green-300">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Campaigns</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create and send email campaigns to your contacts</p>
        </div>
        <Button onClick={() => setTab("compose")} className="gap-2">
          <Plus className="size-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sent", value: campaigns.filter((c) => c.status === "sent").reduce((s, c) => s + c.recipients, 0).toLocaleString(), icon: Send },
          { label: "Avg Open Rate", value: "27%", icon: Eye },
          { label: "Campaigns", value: campaigns.length, icon: Mail },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className="size-4 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {(["campaigns", "compose"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "campaigns" ? "All Campaigns" : "Compose"}
          </button>
        ))}
      </div>

      {tab === "campaigns" && (
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Mail className="size-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No campaigns yet</p>
              <p className="text-sm mt-1">Create your first email campaign above.</p>
            </div>
          ) : (
            campaigns.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-border/80 transition-colors">
                <div className={cn(
                  "size-9 rounded-lg flex items-center justify-center flex-shrink-0",
                  c.status === "sent" ? "bg-green-500/10" : c.status === "scheduled" ? "bg-yellow-500/10" : "bg-muted",
                )}>
                  {c.status === "sent" ? (
                    <CheckCircle2 className="size-4 text-green-400" />
                  ) : c.status === "scheduled" ? (
                    <Clock className="size-4 text-yellow-400" />
                  ) : (
                    <FileText className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">{c.name}</p>
                    <Badge variant={c.status === "sent" ? "default" : "secondary"} className="text-xs capitalize flex-shrink-0">
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.subject}</p>
                </div>
                <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{c.recipients.toLocaleString()}</div>
                    <div>Recipients</div>
                  </div>
                  {c.status === "sent" && (
                    <>
                      <div className="text-center">
                        <div className="font-semibold text-foreground">{openRate(c) ?? "—"}%</div>
                        <div>Opens</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-foreground">{clickRate(c) ?? "—"}%</div>
                        <div>Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-foreground">{c.sentAt}</div>
                        <div>Sent</div>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-red-400 flex-shrink-0"
                  onClick={() => setCampaigns((prev) => prev.filter((x) => x.id !== c.id))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Templates</h3>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all text-sm",
                  selectedTemplate.id === t.id
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground",
                )}
              >
                <div className="font-medium">{t.name}</div>
                <div className="text-xs mt-0.5 truncate opacity-70">{t.subject}</div>
              </button>
            ))}
          </div>

          {/* Compose form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Campaign Name *
                </label>
                <input
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g. June Newsletter"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">From Name</label>
                <input
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="RJ Business Solutions"
                  value={form.fromName}
                  onChange={(e) => setForm((f) => ({ ...f, fromName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">From Email</label>
                <input
                  type="email"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="campaigns@yourdomain.com"
                  value={form.fromEmail}
                  onChange={(e) => setForm((f) => ({ ...f, fromEmail: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Recipients * <span className="text-muted-foreground normal-case font-normal">(one email per line or comma-separated)</span>
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary font-mono resize-none"
                  placeholder="john@example.com&#10;jane@example.com"
                  value={form.toList}
                  onChange={(e) => setForm((f) => ({ ...f, toList: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Subject *</label>
                <input
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="Your email subject"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Body *</label>
                  <button
                    onClick={() => setPreview(!preview)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Eye className="size-3" />
                    {preview ? "Edit" : "Preview"}
                  </button>
                </div>
                {preview ? (
                  <div className="w-full bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground min-h-[200px] whitespace-pre-wrap font-mono">
                    {form.body}
                  </div>
                ) : (
                  <textarea
                    rows={10}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary font-mono resize-none"
                    placeholder="Email body... Use {{name}}, {{company}} as variables."
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => handleSend(true)} disabled={sending}>
                Save Draft
              </Button>
              <Button onClick={() => handleSend(false)} disabled={sending} className="gap-2">
                {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                {sending ? "Sending..." : "Send Campaign"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
