"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Send, UserSquare2 } from "lucide-react";

const STAGES = ["lead", "contacted", "qualified", "proposal", "onboarded", "lost"];

const STAGE_STYLES: Record<string, string> = {
  lead: "text-muted bg-mist border-rule",
  contacted: "text-blue-600 bg-blue-50 border-blue-200",
  qualified: "text-violet-600 bg-violet-50 border-violet-200",
  proposal: "text-amber-600 bg-amber-50 border-amber-200",
  onboarded: "text-gain bg-emerald-50 border-emerald-200",
  lost: "text-loss bg-red-50 border-red-200",
};

type Note = { _id?: string; text: string; authorName: string; createdAt: string };
type Staff = { _id: string; name?: string; email?: string };
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
  lastContactedAt?: string | null;
  tags: string[];
  createdAt: string;
};

function field(label: string, value: React.ReactNode) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">{label}</p>
      <p className="text-[13px] text-body">{value || <span className="text-faint">—</span>}</p>
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/clients/${id}`);
    const data = await res.json();
    setClient(data.client ?? null);
    setCanEdit(!!data.canEdit);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  useEffect(() => {
    fetch("/api/admin/staff").then(r => r.json()).then(d => setStaff(d.staff ?? [])).catch(() => {});
  }, []);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await fetchClient();
    setBusy(false);
  }

  async function addNote() {
    if (!noteText.trim()) return;
    await patch({ action: "addNote", text: noteText.trim() });
    setNoteText("");
  }

  async function removeClient() {
    if (!confirm(`Delete client "${client?.name}"? This cannot be undone.`)) return;
    setBusy(true);
    await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
    window.location.href = "/admin/clients";
  }

  if (loading) return <div className="p-8 text-center text-muted text-[13px]">Loading…</div>;
  if (!client) return (
    <div className="p-8">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-body mb-4">
        <ArrowLeft className="size-3.5" /> Back to clients
      </Link>
      <div className="text-center text-muted text-[13px] py-16">Client not found.</div>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-body mb-4">
        <ArrowLeft className="size-3.5" /> Back to clients
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-[10px] bg-brand-navy/5 border border-rule flex items-center justify-center shrink-0">
            <UserSquare2 className="size-5 text-brand-navy" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-heading tracking-[-0.3px]">{client.name}</h1>
            <p className="text-[13px] text-muted mt-0.5">{client.company || "No company"} · added {new Date(client.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
        </div>
        {canEdit && (
          <button onClick={removeClient} disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-loss hover:border-red-300 disabled:opacity-40">
            <Trash2 className="size-3.5" /> Delete
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: contact + details */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-[14px] border border-rule shadow-card p-5">
            <h2 className="text-[13px] font-semibold text-heading mb-4">Contact information</h2>
            <div className="grid grid-cols-2 gap-4">
              {field("Email", client.email)}
              {field("Phone", <span className="font-mono">{client.phone}</span>)}
              {field("Company", client.company)}
              {field("Source", client.source)}
              {field("Estimated AUM", client.estimatedAumLakhs != null ? `₹${client.estimatedAumLakhs.toLocaleString("en-IN")} L` : null)}
              {field("Risk profile", client.riskProfile)}
            </div>
            {client.investmentInterest.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5">Investment interest</p>
                <div className="flex flex-wrap gap-1.5">
                  {client.investmentInterest.map((t, i) => (
                    <span key={i} className="text-[11px] text-body bg-mist border border-rule px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity / notes */}
          <div className="bg-white rounded-[14px] border border-rule shadow-card p-5">
            <h2 className="text-[13px] font-semibold text-heading mb-4">Activity &amp; notes</h2>
            {canEdit && (
              <div className="flex items-start gap-2 mb-4">
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Log a call, meeting, or update…"
                  className="flex-1 h-20 px-3 py-2 rounded-[10px] border border-rule text-[13px] outline-none focus:border-primary resize-none" />
                <button onClick={addNote} disabled={busy || !noteText.trim()}
                  className="h-20 px-4 inline-flex items-center justify-center rounded-[10px] bg-brand-navy text-white text-[13px] font-medium hover:bg-brand-navy/90 disabled:opacity-40">
                  <Send className="size-4" />
                </button>
              </div>
            )}
            {client.notes.length === 0 ? (
              <p className="text-[13px] text-muted text-center py-6">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {[...client.notes].reverse().map((n, i) => (
                  <div key={n._id ?? i} className="border-l-2 border-rule pl-3.5">
                    <p className="text-[13px] text-body">{n.text}</p>
                    <p className="text-[11px] text-faint mt-1">{n.authorName} · {new Date(n.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: pipeline + assignment */}
        <div className="space-y-6">
          <div className="bg-white rounded-[14px] border border-rule shadow-card p-5">
            <h2 className="text-[13px] font-semibold text-heading mb-3">Pipeline stage</h2>
            <select value={client.stage} disabled={!canEdit || busy}
              onChange={e => patch({ action: "setStage", stage: e.target.value })}
              className={`w-full h-10 px-3 rounded-[10px] border text-[13px] outline-none focus:border-primary capitalize disabled:opacity-60 ${STAGE_STYLES[client.stage] ?? STAGE_STYLES.lead}`}>
              {STAGES.map(s => <option key={s} value={s} className="capitalize bg-white text-body">{s}</option>)}
            </select>
            {client.lastContactedAt && (
              <p className="text-[11px] text-muted mt-2.5">Last contacted {new Date(client.lastContactedAt).toLocaleDateString("en-IN")}</p>
            )}
          </div>

          <div className="bg-white rounded-[14px] border border-rule shadow-card p-5">
            <h2 className="text-[13px] font-semibold text-heading mb-3">Assigned to</h2>
            <select value={client.assignedTo?._id ?? ""} disabled={!canEdit || busy}
              onChange={e => patch({ action: "assign", assignedTo: e.target.value || null })}
              className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary disabled:opacity-60">
              <option value="">Unassigned</option>
              {staff.map(s => <option key={s._id} value={s._id}>{s.name || s.email}</option>)}
            </select>
          </div>

          {client.tags.length > 0 && (
            <div className="bg-white rounded-[14px] border border-rule shadow-card p-5">
              <h2 className="text-[13px] font-semibold text-heading mb-3">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {client.tags.map((t, i) => (
                  <span key={i} className="text-[11px] text-body bg-mist border border-rule px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
