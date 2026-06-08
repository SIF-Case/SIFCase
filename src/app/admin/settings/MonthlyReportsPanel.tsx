"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FileText, Plus, Pencil, Trash2, RefreshCw, X, Upload, Loader2 } from "lucide-react";

type Report = {
  _id: string;
  monthKey: string;
  slug: string;
  label: string;
  summary: string;
  niftyReturn: number | null;
  pdfUrl: string;
  pdfFilename: string;
  published: boolean;
  updatedAt: string;
};

type FormState = {
  monthKey: string;
  summary: string;
  niftyReturn: string;
  pdfUrl: string;
  pdfFilename: string;
  published: boolean;
};

function emptyForm(): FormState {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return { monthKey, summary: "", niftyReturn: "", pdfUrl: "", pdfFilename: "", published: false };
}

function toFormState(r: Report): FormState {
  return {
    monthKey: r.monthKey,
    summary: r.summary,
    niftyReturn: r.niftyReturn != null ? String(r.niftyReturn) : "",
    pdfUrl: r.pdfUrl,
    pdfFilename: r.pdfFilename,
    published: r.published,
  };
}

const inputCls = "w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary";
const labelCls = "block text-[11px] font-semibold text-muted mb-1";

export default function MonthlyReportsPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Report | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/reports");
    const d = await r.json();
    setReports(d.reports || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  function openCreate() {
    setForm(emptyForm());
    setError("");
    setEditing("new");
  }

  function openEdit(r: Report) {
    setForm(toFormState(r));
    setError("");
    setEditing(r);
  }

  function closeForm() {
    setEditing(null);
    setError("");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/reports/upload-pdf", { method: "POST", body: fd });
      const d = await r.json().catch(() => null);
      if (!r.ok) { setError(d?.error || "Upload failed"); return; }
      setForm(f => ({ ...f, pdfUrl: d.url, pdfFilename: d.filename }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    if (!/^\d{4}-\d{2}$/.test(form.monthKey)) return setError("Month must be in YYYY-MM format");
    if (!form.pdfUrl) return setError("Please upload a PDF for this report");
    const isNew = editing === "new";

    setSaving(true);
    setError("");
    try {
      const url = isNew ? "/api/admin/reports" : `/api/admin/reports/${(editing as Report)._id}`;
      const body: Record<string, unknown> = {
        summary: form.summary.trim(),
        niftyReturn: form.niftyReturn.trim() === "" ? null : Number(form.niftyReturn),
        pdfUrl: form.pdfUrl,
        pdfFilename: form.pdfFilename,
        published: form.published,
      };
      if (isNew) body.monthKey = form.monthKey;

      const r = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) { setError(d?.error || `Save failed (${r.status})`); return; }
      closeForm();
      await fetchReports();
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: Report) {
    if (!confirm(`Delete the "${r.label}" report? This cannot be undone.`)) return;
    setActionLoading(r._id);
    await fetch(`/api/admin/reports/${r._id}`, { method: "DELETE" });
    await fetchReports();
    setActionLoading(null);
  }

  async function togglePublished(r: Report) {
    setActionLoading(r._id);
    await fetch(`/api/admin/reports/${r._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !r.published }),
    });
    await fetchReports();
    setActionLoading(null);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[17px] font-bold text-heading">Monthly Performance Reports</h2>
          <p className="text-[12px] text-muted mt-0.5">Upload the monthly SIF performance PDF shown on the homepage. Published reports are visible to logged-in users.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90">
            <Plus className="size-3.5" /> New report
          </button>
          <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_0.8fr_1.6fr_0.9fr_110px] gap-3 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
          <div>Month</div><div>Slug</div><div>Nifty</div><div>PDF</div><div>Status</div><div>Actions</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-muted text-[13px]">No reports yet — add one to get started.</div>
        ) : reports.map(r => (
          <div key={r._id} className="grid grid-cols-[1fr_1fr_0.8fr_1.6fr_0.9fr_110px] gap-3 px-5 py-3.5 border-b border-rule last:border-0 items-center">
            <div className="min-w-0 text-[13px] font-semibold text-heading truncate">{r.label}</div>
            <div className="text-[12px] font-mono text-muted truncate">/{r.slug}</div>
            <div className="text-[12px] nums text-body">{r.niftyReturn != null ? `${r.niftyReturn >= 0 ? "+" : ""}${r.niftyReturn.toFixed(2)}%` : "—"}</div>
            <div className="min-w-0">
              {r.pdfUrl ? (
                <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline truncate">
                  <FileText className="size-3.5 shrink-0" /> <span className="truncate">{r.pdfFilename || "report.pdf"}</span>
                </a>
              ) : <span className="text-[11px] text-faint italic">No PDF uploaded</span>}
            </div>
            <div>
              <button onClick={() => togglePublished(r)} disabled={actionLoading === r._id}
                className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full border ${r.published ? "text-gain bg-emerald-50 border-emerald-200" : "text-faint bg-mist border-rule"}`}>
                {r.published ? "Published" : "Draft"}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => openEdit(r)} title="Edit"
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-primary hover:border-primary/30">
                <Pencil className="size-3.5" />
              </button>
              <button onClick={() => remove(r)} title="Delete" disabled={actionLoading === r._id}
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 disabled:opacity-40">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={closeForm}>
          <div className="bg-white rounded-[14px] border border-rule shadow-card w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-white">
              <h2 className="text-[16px] font-bold text-heading">{editing === "new" ? "New monthly report" : `Edit "${(editing as Report).label}"`}</h2>
              <button onClick={closeForm} className="size-7 inline-flex items-center justify-center rounded-[6px] text-muted hover:text-body">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className={labelCls}>Month</label>
                <input type="month" value={form.monthKey} disabled={editing !== "new"}
                  onChange={e => setForm(f => ({ ...f, monthKey: e.target.value }))}
                  className={`${inputCls} disabled:opacity-60 disabled:cursor-not-allowed`} />
                {editing !== "new" && <p className="text-[11px] text-faint mt-1">Month can&apos;t be changed after creation.</p>}
              </div>

              <div className="mb-4">
                <label className={labelCls}>Summary (shown on homepage banner &amp; report page)</label>
                <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  rows={3} placeholder="A brief overview of how SIFs performed this month…"
                  className="w-full px-3 py-2 rounded-[8px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary resize-none" />
              </div>

              <div className="mb-4">
                <label className={labelCls}>Nifty 50 return for the month (%)</label>
                <input type="number" step="0.01" value={form.niftyReturn}
                  onChange={e => setForm(f => ({ ...f, niftyReturn: e.target.value }))}
                  placeholder="e.g. 1.85" className={inputCls} />
              </div>

              <div className="mb-5">
                <label className={labelCls}>Report PDF</label>
                {form.pdfUrl ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-[8px] border border-rule bg-surface">
                    <a href={form.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 min-w-0 text-[12.5px] text-primary hover:underline">
                      <FileText className="size-4 shrink-0" /> <span className="truncate">{form.pdfFilename || "report.pdf"}</span>
                    </a>
                    <button type="button" onClick={() => setForm(f => ({ ...f, pdfUrl: "", pdfFilename: "" }))}
                      className="text-[11.5px] font-semibold text-loss hover:underline shrink-0">Remove</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-[8px] border border-dashed border-rule text-[13px] text-muted hover:border-primary hover:text-primary disabled:opacity-60">
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {uploading ? "Uploading…" : "Upload PDF (max 25MB)"}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFile} className="hidden" />
              </div>

              <label className="flex items-center gap-2.5 mb-5 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                  className="size-4 accent-primary cursor-pointer" />
                <span className="text-[12.5px] font-medium text-body">Published — visible on the homepage and at /performance/{form.monthKey ? "" : "…"}</span>
              </label>

              {error && <p className="text-[12px] text-loss mb-3">{error}</p>}

              <div className="flex items-center gap-2">
                <button onClick={save} disabled={saving}
                  className="px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : "Save report"}
                </button>
                <button onClick={closeForm} className="px-4 py-2 rounded-[8px] border border-rule text-[13px] text-muted hover:text-body">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
