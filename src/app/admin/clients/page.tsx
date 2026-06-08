"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, RefreshCw, X, UserSquare2 } from "lucide-react";

type Client = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage: string;
  assignedTo?: { _id: string; name?: string; email?: string } | null;
  lastContactedAt?: string | null;
  createdAt: string;
};

type Staff = { _id: string; name?: string; email?: string };

const STAGES = ["lead", "contacted", "qualified", "proposal", "onboarded", "lost"];

const STAGE_STYLES: Record<string, string> = {
  lead: "text-muted bg-mist border-rule",
  contacted: "text-blue-600 bg-blue-50 border-blue-200",
  qualified: "text-violet-600 bg-violet-50 border-violet-200",
  proposal: "text-amber-600 bg-amber-50 border-amber-200",
  onboarded: "text-gain bg-emerald-50 border-emerald-200",
  lost: "text-loss bg-red-50 border-red-200",
};

function StageBadge({ stage }: { stage: string }) {
  const style = STAGE_STYLES[stage] ?? STAGE_STYLES.lead;
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${style}`}>
      {stage}
    </span>
  );
}

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", source: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q: search });
    if (stageFilter) params.set("stage", stageFilter);
    if (assignedFilter) params.set("assignedTo", assignedFilter);
    const res = await fetch(`/api/admin/clients?${params.toString()}`);
    const data = await res.json();
    setClients(data.clients ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setCanEdit(!!data.canEdit);
    setLoading(false);
  }, [page, search, stageFilter, assignedFilter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    fetch("/api/admin/staff").then(r => r.json()).then(d => setStaff(d.staff ?? [])).catch(() => {});
  }, []);

  function openCreate() {
    setForm({ name: "", email: "", phone: "", company: "", source: "" });
    setError(null);
    setCreating(true);
  }

  async function createClient() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to create client"); return; }
    setCreating(false);
    fetchClients();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">Clients</h1>
          <p className="text-[14px] text-muted mt-1">{total} client{total === 1 ? "" : "s"} · prospects and customers, separate from internal staff</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchClients} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
          {canEdit && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-brand-navy text-white text-[13px] font-medium hover:bg-brand-navy/90">
              <Plus className="size-3.5" /> New client
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-rule rounded-[10px] px-3 h-10 max-w-sm flex-1 shadow-card">
          <Search className="size-3.5 text-muted shrink-0" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, phone, company…"
            className="flex-1 text-[13px] bg-transparent outline-none" />
        </div>
        <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-[10px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary capitalize">
          <option value="">All stages</option>
          {STAGES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select value={assignedFilter} onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-[10px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary">
          <option value="">All assignees</option>
          {staff.map(s => <option key={s._id} value={s._id}>{s.name || s.email}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_120px_minmax(0,1fr)_120px] gap-4 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
          <div>Client</div><div>Contact</div><div>Company</div><div>Stage</div><div>Assigned to</div><div>Last contacted</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-muted text-[13px]">
            No clients found.{canEdit && " Use “New client” to add one."}
          </div>
        ) : clients.map((c) => (
          <Link key={c._id} href={`/admin/clients/${c._id}`}
            className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_120px_minmax(0,1fr)_120px] gap-4 px-5 py-3.5 border-b border-rule last:border-0 items-center hover:bg-surface transition-colors">
            <div className="min-w-0 flex items-center gap-2">
              <UserSquare2 className="size-3.5 text-muted shrink-0" />
              <p className="text-[13px] font-semibold text-heading truncate">{c.name}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-body truncate">{c.email ?? <span className="text-faint">—</span>}</p>
              <p className="text-[11px] font-mono text-faint truncate mt-0.5">{c.phone ?? "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-body truncate">{c.company || <span className="text-faint">—</span>}</p>
            </div>
            <div><StageBadge stage={c.stage} /></div>
            <div className="min-w-0">
              <p className="text-[12px] text-body truncate">{c.assignedTo?.name || c.assignedTo?.email || <span className="text-faint">Unassigned</span>}</p>
            </div>
            <div className="text-[12px] text-muted">
              {c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString("en-IN") : <span className="text-faint">—</span>}
            </div>
          </Link>
        ))}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-rule flex items-center justify-between">
            <span className="text-[12px] text-muted">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-[8px] border border-rule text-[12px] text-muted hover:text-body disabled:opacity-40">Prev</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3 py-1.5 rounded-[8px] border border-rule text-[12px] text-muted hover:text-body disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create panel */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-[14px] border border-rule shadow-xl w-full max-w-lg max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-white">
              <h2 className="text-[16px] font-bold text-heading">New client</h2>
              <button onClick={() => setCreating(false)} className="size-8 inline-flex items-center justify-center rounded-[8px] text-muted hover:text-body hover:bg-surface">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="text-[12px] text-loss bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">{error}</div>}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full h-10 px-3 rounded-[10px] border border-rule text-[13px] outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Email</label>
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="name@example.com"
                    className="w-full h-10 px-3 rounded-[10px] border border-rule text-[13px] outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91…"
                    className="w-full h-10 px-3 rounded-[10px] border border-rule text-[13px] outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Company</label>
                  <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="Optional"
                    className="w-full h-10 px-3 rounded-[10px] border border-rule text-[13px] outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Source</label>
                  <input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                    placeholder="Referral, Website…"
                    className="w-full h-10 px-3 rounded-[10px] border border-rule text-[13px] outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-rule sticky bottom-0 bg-white">
              <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">Cancel</button>
              <button onClick={createClient} disabled={saving}
                className="px-4 py-2 rounded-[10px] bg-brand-navy text-white text-[13px] font-medium hover:bg-brand-navy/90 disabled:opacity-50">
                {saving ? "Creating…" : "Create client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
