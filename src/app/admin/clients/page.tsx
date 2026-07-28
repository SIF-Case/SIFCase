"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, RefreshCw, X, UserSquare2, Trash2, Send, Activity, Eye, Settings, Pencil, Check, ArrowUp, ArrowDown, ArrowUpDown, CalendarDays } from "lucide-react";

type Client = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage: string;
  assignedTo?: { _id: string; name?: string; email?: string } | null;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
  source?: string;
  _isRawUser?: boolean;
};

type Note = { _id?: string; text: string; authorName: string; createdAt: string; nextFollowUpAt?: string | null };
type PageVisit = { path: string; visitedAt: string };
type UserActivity = { action: string; description: string; createdAt: string };
type ClientDetail = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage: string;
  source?: string;
  assignedTo?: { _id: string; name?: string; email?: string } | null;
  investmentInterest: string[];
  estimatedAumLakhs?: number | null;
  riskProfile?: string | null;
  notes: Note[];
  pageVisits?: PageVisit[];
  activities?: UserActivity[];
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  tags: string[];
  createdAt: string;
};

type Staff = { _id: string; name?: string; email?: string };

const ACTIVITY_STYLES: Record<string, { badge: string; text: string }> = {
  "Create User": { badge: "bg-blue-50 text-blue-600 border border-blue-200", text: "Create User" },
  "Wishlist": { badge: "bg-violet-50 text-violet-600 border border-violet-200", text: "Wishlist" },
  "Invest": { badge: "bg-emerald-50 text-gain border border-emerald-200", text: "Invest" },
  "Booklet": { badge: "bg-amber-50 text-amber-700 border border-amber-200", text: "Booklet" },
};

function isOverdue(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
}

function field(label: string, value: React.ReactNode) {
  return (
    <div>
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted mb-0.5">{label}</p>
      <p className="text-[12px] text-body">{value || <span className="text-faint">—</span>}</p>
    </div>
  );
}

type PipelineStage = { key: string; label: string };

// Cycled by stage position so newly added stages still get a distinct color.
const STAGE_STYLE_PALETTE = [
  "text-muted bg-mist border-rule",
  "text-blue-600 bg-blue-50 border-blue-200",
  "text-violet-600 bg-violet-50 border-violet-200",
  "text-amber-600 bg-amber-50 border-amber-200",
  "text-gain bg-emerald-50 border-emerald-200",
  "text-loss bg-red-50 border-red-200",
];

function stageStyle(stages: PipelineStage[], key: string) {
  if (key === "call_req") {
    return "text-amber-700 bg-amber-50 border-amber-300";
  }
  const idx = stages.findIndex(s => s.key === key);
  return STAGE_STYLE_PALETTE[idx >= 0 ? idx % STAGE_STYLE_PALETTE.length : 0];
}

function stageLabel(stages: PipelineStage[], key: string) {
  const label = stages.find(s => s.key === key)?.label;
  if (label) return label;
  if (key === "call_req") return "Call Req";
  return key;
}

function StageBadge({ stage, stages, source }: { stage: string; stages: PipelineStage[]; source?: string }) {
  if (stage === "call_req" || (source === "callback_popup" && stage === "lead")) {
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border text-amber-700 bg-amber-50 border-amber-300">
        Call Req
      </span>
    );
  }
  const style = stageStyle(stages, stage);
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style}`}>
      {stageLabel(stages, stage)}
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
  const [sortBy, setSortBy] = useState<"createdAt" | "lastContactedAt" | "nextFollowUpAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [lastContactedFrom, setLastContactedFrom] = useState("");
  const [lastContactedTo, setLastContactedTo] = useState("");
  const [nextFollowUpFrom, setNextFollowUpFrom] = useState("");
  const [nextFollowUpTo, setNextFollowUpTo] = useState("");

  function toggleSort(field: "lastContactedAt" | "nextFollowUpAt") {
    if (sortBy === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", source: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sidebar states
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const [isDragging, setIsDragging] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    estimatedAumLakhs: "",
    riskProfile: "",
    tags: "",
  });
  const [noteText, setNoteText] = useState("");
  const [noteNextDate, setNoteNextDate] = useState("");
  const [sidebarBusy, setSidebarBusy] = useState(false);

  // Pipeline stage configuration
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [showStageManager, setShowStageManager] = useState(false);
  const [newStageLabel, setNewStageLabel] = useState("");
  const [editingStageKey, setEditingStageKey] = useState<string | null>(null);
  const [editingStageLabel, setEditingStageLabel] = useState("");
  const [stageBusy, setStageBusy] = useState(false);

  const fetchStages = useCallback(async () => {
    const res = await fetch("/api/admin/pipeline-stages");
    const data = await res.json();
    setStages(data.stages ?? []);
  }, []);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  async function addStage() {
    const label = newStageLabel.trim();
    if (!label) return;
    setStageBusy(true);
    await fetch("/api/admin/pipeline-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", label }),
    });
    setNewStageLabel("");
    await fetchStages();
    setStageBusy(false);
  }

  async function renameStage(key: string) {
    const label = editingStageLabel.trim();
    if (!label) { setEditingStageKey(null); return; }
    setStageBusy(true);
    await fetch("/api/admin/pipeline-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", key, label }),
    });
    setEditingStageKey(null);
    await fetchStages();
    fetchClients();
    if (selectedClientId) fetchSelectedClient(selectedClientId);
    setStageBusy(false);
  }

  async function deleteStage(key: string) {
    if (!confirm("Delete this stage? Clients currently in this stage will keep it as a label until reassigned.")) return;
    setStageBusy(true);
    await fetch("/api/admin/pipeline-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", key }),
    });
    await fetchStages();
    setStageBusy(false);
  }

  const fetchSelectedClient = useCallback(async (id: string) => {
    setSidebarLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}`);
      const data = await res.json();
      if (res.ok && data.client) {
        setSelectedClient(data.client);
        setEditForm({
          name: data.client.name || "",
          email: data.client.email || "",
          phone: data.client.phone || "",
          company: data.client.company || "",
          source: data.client.source || "",
          estimatedAumLakhs: data.client.estimatedAumLakhs != null ? String(data.client.estimatedAumLakhs) : "",
          riskProfile: data.client.riskProfile || "",
          tags: (data.client.tags || []).join(", "),
        });
      } else {
        setSelectedClient(null);
      }
    } catch (err) {
      console.error(err);
      setSelectedClient(null);
    } finally {
      setSidebarLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchSelectedClient(selectedClientId);
      setIsEditing(false);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, fetchSelectedClient]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("client-sidebar-width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 360 && parsed <= window.innerWidth - 80) {
          setSidebarWidth(parsed);
        }
      }
    }
  }, []);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDragging(true);

    const startWidth = sidebarWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const maxW = typeof window !== 'undefined' ? window.innerWidth - 80 : 800;
      const newWidth = Math.max(360, Math.min(maxW, startWidth - deltaX));
      setSidebarWidth(newWidth);
    };

    const stopDrag = (mouseUpEvent: MouseEvent) => {
      setIsDragging(false);
      window.removeEventListener("mousemove", doDrag);
      window.removeEventListener("mouseup", stopDrag);

      const deltaX = mouseUpEvent.clientX - startX;
      const maxW = typeof window !== 'undefined' ? window.innerWidth - 80 : 800;
      const finalWidth = Math.max(360, Math.min(maxW, startWidth - deltaX));
      localStorage.setItem("client-sidebar-width", String(finalWidth));

      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);
  }, [sidebarWidth]);

  async function patchSidebar(body: Record<string, unknown>) {
    if (!selectedClientId) return;
    setSidebarBusy(true);
    await fetch(`/api/admin/clients/${selectedClientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await fetchSelectedClient(selectedClientId);
    fetchClients();
    setSidebarBusy(false);
  }

  async function addSidebarNote() {
    if (!noteText.trim()) return;
    await patchSidebar({ action: "addNote", text: noteText.trim(), nextFollowUpAt: noteNextDate || null });
    setNoteText("");
    setNoteNextDate("");
  }

  async function saveClientDetails() {
    if (!editForm.name.trim()) return;
    await patchSidebar({
      name: editForm.name.trim(),
      email: editForm.email || undefined,
      phone: editForm.phone || undefined,
      company: editForm.company || "",
      source: editForm.source || "",
      estimatedAumLakhs: editForm.estimatedAumLakhs !== "" ? Number(editForm.estimatedAumLakhs) : null,
      riskProfile: editForm.riskProfile || null,
      tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean),
    });
    setIsEditing(false);
  }

  async function deleteSidebarClient() {
    if (!selectedClient) return;
    if (!confirm(`Delete client "${selectedClient.name}"? This cannot be undone.`)) return;
    setSidebarBusy(true);
    await fetch(`/api/admin/clients/${selectedClientId}`, { method: "DELETE" });
    setSelectedClientId(null);
    fetchClients();
    setSidebarBusy(false);
  }

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), q: search, sortBy, sortDir });
    if (stageFilter) params.set("stage", stageFilter);
    if (assignedFilter) params.set("assignedTo", assignedFilter);
    if (lastContactedFrom) params.set("lastContactedFrom", lastContactedFrom);
    if (lastContactedTo) params.set("lastContactedTo", lastContactedTo);
    if (nextFollowUpFrom) params.set("nextFollowUpFrom", nextFollowUpFrom);
    if (nextFollowUpTo) params.set("nextFollowUpTo", nextFollowUpTo);
    const res = await fetch(`/api/admin/clients?${params.toString()}`);
    const data = await res.json();
    setClients(data.clients ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setCanEdit(!!data.canEdit);
    setLoading(false);
  }, [page, search, stageFilter, assignedFilter, sortBy, sortDir, lastContactedFrom, lastContactedTo, nextFollowUpFrom, nextFollowUpTo]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    fetch("/api/admin/staff").then(r => r.json()).then(d => setStaff(d.staff ?? [])).catch(() => { });
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
          className="h-10 px-3 rounded-[10px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary">
          <option value="">All stages</option>
          {stages.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={assignedFilter} onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-[10px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary">
          <option value="">All assignees</option>
          {staff.map(s => <option key={s._id} value={s._id}>{s.name || s.email}</option>)}
        </select>
        {canEdit && (
          <button onClick={() => setShowStageManager(true)}
            className="flex items-center gap-2 h-10 px-3 rounded-[10px] border border-rule bg-white text-[13px] text-muted hover:text-body">
            <Settings className="size-3.5" /> Edit stages
          </button>
        )}
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-rule rounded-[10px] px-3 h-10 shadow-card">
          <CalendarDays className="size-3.5 text-muted shrink-0" />
          <span className="text-[12px] text-muted whitespace-nowrap">Last contacted</span>
          <input type="date" value={lastContactedFrom} onChange={(e) => { setLastContactedFrom(e.target.value); setPage(1); }}
            className="text-[13px] bg-transparent outline-none text-body" />
          <span className="text-[12px] text-faint">–</span>
          <input type="date" value={lastContactedTo} onChange={(e) => { setLastContactedTo(e.target.value); setPage(1); }}
            className="text-[13px] bg-transparent outline-none text-body" />
        </div>
        <div className="flex items-center gap-2 bg-white border border-rule rounded-[10px] px-3 h-10 shadow-card">
          <CalendarDays className="size-3.5 text-muted shrink-0" />
          <span className="text-[12px] text-muted whitespace-nowrap">Next follow-up</span>
          <input type="date" value={nextFollowUpFrom} onChange={(e) => { setNextFollowUpFrom(e.target.value); setPage(1); }}
            className="text-[13px] bg-transparent outline-none text-body" />
          <span className="text-[12px] text-faint">–</span>
          <input type="date" value={nextFollowUpTo} onChange={(e) => { setNextFollowUpTo(e.target.value); setPage(1); }}
            className="text-[13px] bg-transparent outline-none text-body" />
        </div>
        {(lastContactedFrom || lastContactedTo || nextFollowUpFrom || nextFollowUpTo) && (
          <button
            onClick={() => { setLastContactedFrom(""); setLastContactedTo(""); setNextFollowUpFrom(""); setNextFollowUpTo(""); setPage(1); }}
            className="flex items-center gap-1.5 h-10 px-3 rounded-[10px] border border-rule text-[12px] text-muted hover:text-loss"
          >
            <X className="size-3.5" /> Clear dates
          </button>
        )}
      </div>

      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_120px_minmax(0,1fr)_120px_120px] gap-4 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
          <div>Client</div><div>Contact</div><div>Company</div><div>Stage</div><div>Assigned to</div>
          <button onClick={() => toggleSort("lastContactedAt")} className="flex items-center gap-1 hover:text-body">
            Last contacted
            {sortBy === "lastContactedAt" ? (sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
          </button>
          <button onClick={() => toggleSort("nextFollowUpAt")} className="flex items-center gap-1 hover:text-body">
            Next follow-up
            {sortBy === "nextFollowUpAt" ? (sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-muted text-[13px]">
            No clients found.{canEdit && " Use “New client” to add one."}
          </div>
        ) : clients.map((c) => (
          <div key={c._id} onClick={() => setSelectedClientId(c._id)}
            className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_120px_minmax(0,1fr)_120px_120px] gap-4 px-5 py-3.5 border-b border-rule last:border-0 items-center hover:bg-surface transition-colors cursor-pointer ${selectedClientId === c._id ? "bg-slate-50 border-l-2 border-l-brand-navy" : ""}`}>
            <div className="min-w-0 flex items-center gap-2">
              <UserSquare2 className="size-3.5 text-muted shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-heading truncate">{c.name}</p>
                {c._isRawUser && <span className="text-[9px] font-mono uppercase tracking-wider text-primary">App user</span>}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-body truncate">{c.email ?? <span className="text-faint">—</span>}</p>
              <p className="text-[11px] font-mono text-faint truncate mt-0.5">{c.phone ?? "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-body truncate">{c.company || <span className="text-faint">—</span>}</p>
            </div>
            <div><StageBadge stage={c.stage} stages={stages} source={c.source} /></div>
            <div className="min-w-0">
              <p className="text-[12px] text-body truncate">{c.assignedTo?.name || c.assignedTo?.email || <span className="text-faint">Unassigned</span>}</p>
            </div>
            <div className="text-[12px] text-muted">
              {c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString("en-IN") : <span className="text-faint">—</span>}
            </div>
            <div className="text-[12px]">
              {c.nextFollowUpAt
                ? <span className={isOverdue(c.nextFollowUpAt) ? "text-loss font-semibold" : "text-body"}>
                  {new Date(c.nextFollowUpAt).toLocaleDateString("en-IN")}
                </span>
                : <span className="text-faint">—</span>}
            </div>
          </div>
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

      {showStageManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-[14px] border border-rule shadow-xl w-full max-w-md max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-white">
              <h2 className="text-[16px] font-bold text-heading">Pipeline stages</h2>
              <button onClick={() => setShowStageManager(false)} className="size-8 inline-flex items-center justify-center rounded-[8px] text-muted hover:text-body hover:bg-surface">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-2">
              {stages.map(s => (
                <div key={s.key} className="flex items-center gap-2">
                  {editingStageKey === s.key ? (
                    <>
                      <input value={editingStageLabel} autoFocus
                        onChange={e => setEditingStageLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") renameStage(s.key); if (e.key === "Escape") setEditingStageKey(null); }}
                        className="flex-1 h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary" />
                      <button onClick={() => renameStage(s.key)} disabled={stageBusy}
                        className="size-9 inline-flex items-center justify-center rounded-[8px] text-gain hover:bg-emerald-50">
                        <Check className="size-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`flex-1 h-9 px-3 inline-flex items-center rounded-[8px] border text-[13px] ${stageStyle(stages, s.key)}`}>
                        {s.label}
                      </span>
                      <button onClick={() => { setEditingStageKey(s.key); setEditingStageLabel(s.label); }}
                        className="size-9 inline-flex items-center justify-center rounded-[8px] text-muted hover:text-body hover:bg-surface">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => deleteStage(s.key)} disabled={stageBusy || stages.length <= 1}
                        className="size-9 inline-flex items-center justify-center rounded-[8px] text-loss hover:bg-red-50 disabled:opacity-30">
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <input value={newStageLabel} onChange={e => setNewStageLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addStage(); }}
                  placeholder="New stage name…"
                  className="flex-1 h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary" />
                <button onClick={addStage} disabled={stageBusy || !newStageLabel.trim()}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-[8px] bg-brand-navy text-white text-[13px] font-medium hover:bg-brand-navy/90 disabled:opacity-50">
                  <Plus className="size-3.5" /> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Detail View */}
      {selectedClientId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/35 backdrop-blur-[1.5px] transition-opacity"
            onClick={() => setSelectedClientId(null)}
          />

          {/* Panel */}
          <div
            className={`relative w-full md:w-[var(--sidebar-width)] h-full bg-white shadow-premium border-l border-rule flex flex-col z-10 ${isDragging ? "" : "transition-[width] duration-300"
              }`}
            style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}
          >
            {/* Drag Resize Handle */}
            <div
              onMouseDown={startResizing}
              className="absolute left-0 top-0 bottom-0 w-3 -translate-x-1/2 cursor-ew-resize group z-50 flex items-center justify-center"
              title="Drag to resize panel"
            >
              {/* Draggable visual indicator line */}
              <div
                className={`w-[2.5px] rounded-full transition-all duration-150 ${isDragging
                  ? "bg-primary h-24 w-[3.5px]"
                  : "bg-slate-200 group-hover:bg-primary/70 group-hover:h-16 h-10"
                  }`}
              />
            </div>
            {sidebarLoading ? (
              <div className="flex-1 flex items-center justify-center text-muted text-[13px]">
                Loading details…
              </div>
            ) : !selectedClient ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted">
                <p className="text-[13px] mb-4">Client not found.</p>
                <button onClick={() => setSelectedClientId(null)} className="px-4 py-2 rounded-[10px] border border-rule text-[13px] hover:text-body">
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-rule bg-white sticky top-0 z-20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-[8px] bg-brand-navy/5 border border-rule flex items-center justify-center shrink-0">
                      <UserSquare2 className="size-4 text-brand-navy" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[14px] font-bold text-heading truncate">{selectedClient.name}</h2>
                      <p className="text-[11px] text-muted">
                        {selectedClient.company || "No company"} · added {new Date(selectedClient.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/admin/users?q=${encodeURIComponent(selectedClient.email || selectedClient.phone || selectedClient.name)}`}
                      className="px-2.5 py-1 rounded-[6px] border border-rule text-[11px] font-medium text-muted hover:text-body whitespace-nowrap"
                      title="Assign a role to make this person an internal user"
                    >
                      Move to Internal User
                    </Link>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-2.5 py-1 rounded-[6px] border border-rule text-[11px] font-medium text-muted hover:text-body"
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </button>
                    {canEdit && (
                      <button
                        onClick={deleteSidebarClient}
                        className="p-1 rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-200"
                        title="Delete client"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedClientId(null)}
                      className="p-1 rounded-[6px] border border-rule text-muted hover:text-body"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {isEditing ? (
                    /* Edit Form */
                    <div className="space-y-4">
                      <h3 className="text-[12px] font-bold text-heading uppercase tracking-wide border-b border-rule pb-1.5">Edit details</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Name</label>
                          <input
                            value={editForm.name}
                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Email</label>
                          <input
                            value={editForm.email}
                            onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                            className="w-full h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Phone</label>
                          <input
                            value={editForm.phone}
                            onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                            className="w-full h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Company</label>
                          <input
                            value={editForm.company}
                            onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))}
                            className="w-full h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Source</label>
                          <input
                            value={editForm.source}
                            onChange={e => setEditForm(p => ({ ...p, source: e.target.value }))}
                            className="w-full h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Estimated AUM (Lakhs)</label>
                          <input
                            type="number"
                            value={editForm.estimatedAumLakhs}
                            onChange={e => setEditForm(p => ({ ...p, estimatedAumLakhs: e.target.value }))}
                            className="w-full h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Risk Profile</label>
                          <select
                            value={editForm.riskProfile}
                            onChange={e => setEditForm(p => ({ ...p, riskProfile: e.target.value }))}
                            className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] outline-none focus:border-primary"
                          >
                            <option value="">Select risk profile</option>
                            <option value="Conservative">Conservative</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Aggressive">Aggressive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Tags (comma separated)</label>
                          <input
                            value={editForm.tags}
                            onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))}
                            placeholder="e.g. active, high-priority"
                            className="w-full h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3.5 py-1.5 rounded-[8px] border border-rule text-[12px] text-muted hover:text-body"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveClientDetails}
                          disabled={sidebarBusy || !editForm.name.trim()}
                          className="px-3.5 py-1.5 rounded-[8px] bg-brand-navy text-white text-[12px] font-medium hover:bg-brand-navy/90 disabled:opacity-50"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode Details */
                    <div className="space-y-5">
                      {/* Pipeline Stage & Assigned To */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-mist/30 border border-rule/50 rounded-[10px] p-3">
                          <label className="block text-[9px] font-mono uppercase tracking-widest text-muted mb-1">Pipeline Stage</label>
                          <select
                            value={selectedClient.stage}
                            disabled={!canEdit || sidebarBusy}
                            onChange={e => patchSidebar({ action: "setStage", stage: e.target.value })}
                            className={`w-full h-8 px-2 rounded-[6px] border text-[12px] outline-none disabled:opacity-60 bg-white ${selectedClient.source === "callback_popup" && selectedClient.stage === "lead" ? "text-amber-700 bg-amber-50 border-amber-300" : stageStyle(stages, selectedClient.stage)}`}
                          >
                            {stages.map(s => <option key={s.key} value={s.key} className="bg-white text-body">{s.label}</option>)}
                          </select>
                        </div>
                        <div className="bg-mist/30 border border-rule/50 rounded-[10px] p-3">
                          <label className="block text-[9px] font-mono uppercase tracking-widest text-muted mb-1">Assigned To</label>
                          <select
                            value={selectedClient.assignedTo?._id ?? ""}
                            disabled={!canEdit || sidebarBusy}
                            onChange={e => patchSidebar({ action: "assign", assignedTo: e.target.value || null })}
                            className="w-full h-8 px-2 rounded-[6px] border border-rule bg-white text-[12px] text-body outline-none"
                          >
                            <option value="">Unassigned</option>
                            {staff.map(s => <option key={s._id} value={s._id}>{s.name || s.email}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Contact & Personal details */}
                      <div className="border border-rule/60 rounded-[12px] p-4 bg-slate-50/50 space-y-3">
                        <h3 className="text-[12px] font-bold text-heading uppercase tracking-wide border-b border-rule/50 pb-1.5">Client Information</h3>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                          {field("Email", selectedClient.email)}
                          {field("Phone", <span className="font-mono">{selectedClient.phone}</span>)}
                          {field("Company", selectedClient.company)}
                          {field("Source", selectedClient.source)}
                          {field("Estimated AUM", selectedClient.estimatedAumLakhs != null ? `₹${selectedClient.estimatedAumLakhs.toLocaleString("en-IN")} L` : null)}
                          {field("Risk profile", selectedClient.riskProfile)}
                        </div>
                        {selectedClient.tags && selectedClient.tags.length > 0 && (
                          <div className="pt-2">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Tags</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedClient.tags.map((t, idx) => (
                                <span key={idx} className="text-[10px] text-body bg-mist border border-rule/70 px-2 py-0.5 rounded-full">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Activity & notes */}
                      <div className="border border-rule/60 rounded-[12px] p-4 bg-white space-y-4">
                        <h3 className="text-[12px] font-bold text-heading uppercase tracking-wide border-b border-rule/50 pb-1">Notes & History</h3>
                        {canEdit && (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Log updates, call details..."
                                className="flex-1 h-14 px-2.5 py-1.5 rounded-[8px] border border-rule text-[12px] outline-none focus:border-primary resize-none"
                              />
                              <button
                                onClick={addSidebarNote}
                                disabled={sidebarBusy || !noteText.trim()}
                                className="h-14 px-3 inline-flex items-center justify-center rounded-[8px] bg-brand-navy text-white text-[12px] font-medium hover:bg-brand-navy/90 disabled:opacity-40"
                              >
                                <Send className="size-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-mono uppercase tracking-widest text-muted">Next date</label>
                              <input
                                type="date"
                                value={noteNextDate}
                                onChange={e => setNoteNextDate(e.target.value)}
                                className="h-8 px-2 rounded-[6px] border border-rule text-[12px] outline-none focus:border-primary"
                              />
                              {noteNextDate && (
                                <button onClick={() => setNoteNextDate("")} className="text-[11px] text-muted hover:text-body">Clear</button>
                              )}
                            </div>
                          </div>
                        )}
                        {!selectedClient.notes || selectedClient.notes.length === 0 ? (
                          <p className="text-[12px] text-muted text-center py-4">No notes yet.</p>
                        ) : (
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                            {[...selectedClient.notes].reverse().map((n, idx) => (
                              <div key={n._id ?? idx} className="border-l border-rule pl-3">
                                <p className="text-[12px] text-body whitespace-pre-line">{n.text}</p>
                                <p className="text-[10px] text-faint mt-0.5">{n.authorName} · {new Date(n.createdAt).toLocaleString("en-IN")}</p>
                                {n.nextFollowUpAt && (
                                  <p className={`text-[10px] mt-0.5 font-medium ${isOverdue(n.nextFollowUpAt) ? "text-loss" : "text-primary"}`}>
                                    Next: {new Date(n.nextFollowUpAt).toLocaleDateString("en-IN")}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* User Action Log */}
                      <div className="border border-rule/60 rounded-[12px] p-4 bg-white space-y-3">
                        <h3 className="text-[12px] font-bold text-heading uppercase tracking-wide border-b border-rule/50 pb-1">User Action Log</h3>
                        {!selectedClient.activities || selectedClient.activities.length === 0 ? (
                          <p className="text-[12px] text-muted text-center py-4">No activities logged.</p>
                        ) : (
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                            {[...selectedClient.activities].reverse().map((act, idx) => {
                              const style = ACTIVITY_STYLES[act.action] || {
                                badge: "bg-mist text-muted border border-rule",
                                text: act.action,
                              };
                              return (
                                <div key={idx} className="flex items-start justify-between gap-3 border-b border-rule/30 pb-2 last:border-b-0 last:pb-0">
                                  <div className="min-w-0">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase ${style.badge}`}>
                                      {style.text}
                                    </span>
                                    <p className="text-[12px] text-body mt-0.5">{act.description}</p>
                                  </div>
                                  <span className="text-[10px] text-muted font-mono pt-1 whitespace-nowrap">
                                    {new Date(act.createdAt).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Page Navigation History */}
                      <div className="border border-rule/60 rounded-[12px] p-4 bg-white space-y-3">
                        <h3 className="text-[12px] font-bold text-heading uppercase tracking-wide border-b border-rule/50 pb-1">Page Navigation History</h3>
                        {!selectedClient.pageVisits || selectedClient.pageVisits.length === 0 ? (
                          <p className="text-[12px] text-muted text-center py-4">No page visits logged.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {[...selectedClient.pageVisits].reverse().map((visit, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 py-1 border-b border-rule/20 last:border-b-0">
                                <span className="font-mono text-[11px] bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 text-body truncate max-w-[220px]">
                                  {visit.path}
                                </span>
                                <span className="text-[10px] text-muted font-mono whitespace-nowrap">
                                  {new Date(visit.visitedAt).toLocaleString("en-IN")}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
