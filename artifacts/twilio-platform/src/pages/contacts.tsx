import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, Phone, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const emptyForm = { name: "", phone: "", email: "", company: "", notes: "", tags: "" };

export default function Contacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts", search],
    queryFn: () => {
      const url = new URL("/api/twilio/contacts", window.location.origin);
      if (search) url.searchParams.set("search", search);
      return fetch(url.toString()).then(res => res.json());
    },
    refetchInterval: 30000,
  });

  const createContact = useMutation({
    mutationFn: (data: typeof form) =>
      fetch("/api/twilio/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); }),
    onSuccess: () => {
      toast({ title: "Contact created" });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setFormOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const updateContact = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) =>
      fetch(`/api/twilio/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); }),
    onSuccess: () => {
      toast({ title: "Contact updated" });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setEditing(null);
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const deleteContact = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/twilio/contacts/${id}`, { method: "DELETE" }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "Contact deleted" });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const openCreate = () => { setForm(emptyForm); setFormOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name || "", phone: c.phone || "", email: c.email || "", company: c.company || "", notes: c.notes || "", tags: c.tags || "" });
  };

  const ContactForm = ({ onSave, isPending }: { onSave: () => void; isPending: boolean }) => (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Name *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1234567890" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Company</Label>
          <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes..." />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Tags (comma separated)</Label>
          <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="customer, vip, prospect" />
        </div>
      </div>
      <Button className="w-full" disabled={!form.name || isPending} onClick={onSave}>
        {isPending ? "Saving..." : "Save Contact"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage your contact list and quick-dial.</p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
            <ContactForm onSave={() => createContact.mutate(form)} isPending={createContact.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, phone, email, or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : contacts?.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No contacts found</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {contacts?.map((c: any) => (
            <Card key={c.id} className="border-border hover:border-border/80 transition-colors">
              <CardContent className="py-3 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                      {c.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {c.phone && <span className="font-mono">{c.phone}</span>}
                        {c.email && <span>{c.email}</span>}
                        {c.company && <span>{c.company}</span>}
                      </div>
                      {c.tags && (
                        <div className="flex gap-1 mt-1">
                          {c.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.phone && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`/calls?to=${c.phone}`}><Phone className="h-4 w-4" /></a>
                      </Button>
                    )}
                    {c.phone && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`/sms?to=${c.phone}`}><MessageSquare className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Dialog open={editing?.id === c.id} onOpenChange={(open) => !open && setEditing(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit {c.name}</DialogTitle></DialogHeader>
                        <ContactForm onSave={() => updateContact.mutate({ id: c.id, data: form })} isPending={updateContact.isPending} />
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteContact.mutate(c.id)}
                      disabled={deleteContact.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
