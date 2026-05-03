import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users, Plus, Search, Trash2, Edit3, Phone, Mail,
  Building2, Tag, Save, X, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

const BASE = "/api/twilio";

interface Contact {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  notes: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM = { name: "", phone: "", email: "", company: "", notes: "", tags: "" };

export function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchContacts = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const url = q ? `${BASE}/contacts?search=${encodeURIComponent(q)}` : `${BASE}/contacts`;
      const resp = await fetch(url);
      if (resp.ok) setContacts(await resp.json());
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchContacts(); }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchContacts(search), 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true); setError(""); };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", company: c.company ?? "", notes: c.notes ?? "", tags: c.tags ?? "" });
    setShowForm(true); setError("");
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setError(""); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `${BASE}/contacts/${editing.id}` : `${BASE}/contacts`;
      const method = editing ? "PUT" : "POST";
      const resp = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) { const d = await resp.json(); setError(d.error ?? "Save failed"); return; }
      closeForm();
      fetchContacts();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${BASE}/contacts/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchContacts();
    } catch {}
  };

  const tagList = (tags: string | null) => tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, email, company…"
            className="h-7 pl-7 text-xs bg-[#151518] border-border font-mono" />
        </div>
        <button onClick={fetchContacts} disabled={loading}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        </button>
        <button onClick={openCreate}
          className="flex items-center gap-1 px-2.5 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-mono hover:bg-blue-500/20 transition-colors">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      <div className="px-3 text-[9px] text-muted-foreground/50 font-mono shrink-0">
        {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {/* Form overlay */}
        {showForm && (
          <div className="bg-[#0f0f12] border border-blue-500/20 rounded-lg p-3 mb-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold font-mono text-blue-400 uppercase tracking-wide">
                {editing ? "Edit Contact" : "New Contact"}
              </span>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { field: "name", label: "Name *", icon: <Users className="w-3 h-3" />, placeholder: "Full name" },
                { field: "phone", label: "Phone", icon: <Phone className="w-3 h-3" />, placeholder: "+15550001111" },
                { field: "email", label: "Email", icon: <Mail className="w-3 h-3" />, placeholder: "user@example.com" },
                { field: "company", label: "Company", icon: <Building2 className="w-3 h-3" />, placeholder: "Company name" },
              ].map(({ field, label, icon, placeholder }) => (
                <div key={field}>
                  <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 flex items-center gap-1">
                    {icon}{label}
                  </label>
                  <Input
                    value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="h-7 text-xs bg-[#151518] border-border font-mono" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />Tags (comma-separated)
              </label>
              <Input
                value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="customer, vip, hot-lead"
                className="h-7 text-xs bg-[#151518] border-border font-mono" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Notes</label>
              <textarea
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Internal notes about this contact…" rows={2}
                className="w-full text-xs bg-[#151518] border border-input rounded-md px-3 py-1.5 font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}
                className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-mono gap-1">
                <Save className="w-3 h-3" />{saving ? "Saving…" : "Save Contact"}
              </Button>
              <Button size="sm" variant="outline" onClick={closeForm} className="h-7 text-xs border-border font-mono">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Contact list */}
        {contacts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Users className="w-7 h-7 mb-2 opacity-20" />
            <p className="text-[11px]">{search ? "No contacts found" : "No contacts yet"}</p>
            {!search && (
              <button onClick={openCreate}
                className="mt-2 text-[10px] font-mono text-blue-400 hover:text-blue-300 underline underline-offset-2">
                Add your first contact
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {contacts.map(c => (
              <div key={c.id} className="bg-[#151518] border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-blue-400 font-mono">{c.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-foreground truncate">{c.name}</span>
                      {c.company && <span className="text-[9px] text-muted-foreground/60 font-mono truncate">· {c.company}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.phone && <span className="text-[9px] font-mono text-muted-foreground">{c.phone}</span>}
                      {c.email && <span className="text-[9px] font-mono text-muted-foreground truncate">{c.email}</span>}
                    </div>
                    {tagList(c.tags).length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {tagList(c.tags).map((tag, i) => (
                          <span key={i} className="text-[8px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                      {expandedId === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button onClick={() => openEdit(c)}
                      className="p-1 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors">
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {deleteConfirm === c.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(c.id)}
                          className="px-1.5 py-0.5 text-[9px] font-mono text-red-400 border border-red-500/30 bg-red-500/10 rounded hover:bg-red-500/20 transition-colors">
                          Confirm
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(c.id)}
                        className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {expandedId === c.id && c.notes && (
                  <div className="px-2.5 pb-2 border-t border-border/50">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wide mt-1.5 mb-0.5">Notes</p>
                    <p className="text-[10px] text-foreground/70 font-mono leading-relaxed whitespace-pre-wrap">{c.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
