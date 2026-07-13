"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, Rocket } from "lucide-react";

type AllocationBand = { name: string; range: string; percent: number; color: string };
type StrategyPoint = { title: string; desc: string; icon: "pulse" | "clock" | "shield" | "chart" | "lock" };
type NfoManager = { name: string; role: string; cred: string; avatar: string };
type NfoDoc = { title: string; href: string };

type Nfo = {
  _id: string;
  slug: string;
  amc: string;
  amcShort: string;
  avatar: string;
  name: string;
  category: "Equity" | "Hybrid";
  structure: "Open-ended" | "Close-ended";
  openDate: string;
  closeDate: string;
  allotmentDate: string;
  reopenDate: string | null;
  minInvestment: number;
  subscriptionPrice: number;
  exitLoad: string;
  benchmark: string;
  riskLevel: string;
  riskColor: string;
  published: boolean;
  allocationBands: AllocationBand[];
  strategyPoints: StrategyPoint[];
  managers: NfoManager[];
  docs: NfoDoc[];
};

const ICON_OPTIONS: StrategyPoint["icon"][] = ["pulse", "clock", "shield", "chart", "lock"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function amcShortFor(amc: string): string {
  const stripped = amc.replace(/\bmutual fund\b/i, "").trim();
  const first = stripped.split(/\s+/)[0] ?? "";
  return first.toLowerCase();
}

function avatarFor(amc: string): string {
  const stripped = amc.replace(/\bmutual fund\b/i, "").trim();
  return (stripped[0] ?? "").toUpperCase();
}

function toDateInput(v: string | null | undefined): string {
  if (!v) return "";
  return new Date(v).toISOString().slice(0, 10);
}

function emptyForm() {
  return {
    slug: "", amc: "", amcShort: "", avatar: "", name: "",
    category: "Equity" as const, structure: "Open-ended" as const,
    openDate: "", closeDate: "", allotmentDate: "", reopenDate: "",
    minInvestment: 1000000, subscriptionPrice: 10,
    exitLoad: "1% ≤ 30 days", benchmark: "", riskLevel: "", riskColor: "var(--danger)",
    published: true,
    allocationBands: [] as AllocationBand[],
    strategyPoints: [] as StrategyPoint[],
    managers: [] as NfoManager[],
    docs: [] as NfoDoc[],
  };
}

type FormState = ReturnType<typeof emptyForm>;

function fromNfo(n: Nfo): FormState {
  return {
    slug: n.slug, amc: n.amc, amcShort: n.amcShort, avatar: n.avatar, name: n.name,
    category: n.category as "Equity", structure: n.structure as "Open-ended",
    openDate: toDateInput(n.openDate), closeDate: toDateInput(n.closeDate),
    allotmentDate: toDateInput(n.allotmentDate), reopenDate: toDateInput(n.reopenDate),
    minInvestment: n.minInvestment, subscriptionPrice: n.subscriptionPrice,
    exitLoad: n.exitLoad, benchmark: n.benchmark, riskLevel: n.riskLevel, riskColor: n.riskColor,
    published: n.published,
    allocationBands: n.allocationBands ?? [],
    strategyPoints: n.strategyPoints ?? [],
    managers: n.managers ?? [],
    docs: n.docs ?? [],
  };
}

function NfoModal({ nfo, onClose, onSaved }: { nfo: Nfo | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(nfo ? fromNfo(nfo) : emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!nfo);
  const [amcShortTouched, setAmcShortTouched] = useState(!!nfo);
  const [avatarTouched, setAvatarTouched] = useState(!!nfo);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function save() {
    if (!form.name.trim() || !form.amc.trim() || !form.openDate || !form.closeDate) {
      setError("Name, AMC, open date, and close date are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(nfo ? `/api/admin/nfos/${nfo._id}` : "/api/admin/nfos", {
        method: nfo ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const raw = await res.text();
      let data: { error?: string } | null = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { /* non-JSON response (e.g. server crash page) */ }
      if (!res.ok) { setError(data?.error || `Save failed (${res.status})`); return; }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={onClose}>
      <div className="bg-white rounded-[14px] border border-rule shadow-card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-white z-10">
          <h2 className="text-[16px] font-bold text-heading">{nfo ? "Edit NFO" : "New NFO"}</h2>
          <button onClick={onClose} className="size-7 inline-flex items-center justify-center rounded-[6px] text-muted hover:text-body">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="text-[12px] text-loss bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fund name">
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((p) => ({ ...p, name, slug: slugTouched ? p.slug : slugify(name) }));
                }}
                className={inputCls}
                placeholder="Kotak Infinity Hybrid Long-Short Fund"
              />
            </Field>
            <Field label="Slug (blank = auto)">
              <input
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
                className={inputCls}
                placeholder="kotak-infinity-hybrid"
              />
            </Field>
            <Field label="AMC (fund house)">
              <input
                value={form.amc}
                onChange={(e) => {
                  const amc = e.target.value;
                  setForm((p) => ({
                    ...p,
                    amc,
                    amcShort: amcShortTouched ? p.amcShort : amcShortFor(amc),
                    avatar: avatarTouched ? p.avatar : avatarFor(amc),
                  }));
                }}
                className={inputCls}
                placeholder="Kotak Mahindra Mutual Fund"
              />
            </Field>
            <Field label="AMC short code">
              <input
                value={form.amcShort}
                onChange={(e) => { setAmcShortTouched(true); set("amcShort", e.target.value); }}
                className={inputCls}
                placeholder="kotak"
              />
            </Field>
            <Field label="Avatar letter(s)">
              <input
                value={form.avatar}
                onChange={(e) => { setAvatarTouched(true); set("avatar", e.target.value); }}
                className={inputCls}
                placeholder="K"
                maxLength={3}
              />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value as FormState["category"])} className={inputCls}>
                <option value="Equity">Equity</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </Field>
            <Field label="Structure">
              <select value={form.structure} onChange={(e) => set("structure", e.target.value as FormState["structure"])} className={inputCls}>
                <option value="Open-ended">Open-ended</option>
                <option value="Close-ended">Close-ended</option>
              </select>
            </Field>
            <Field label="Published">
              <label className="flex items-center gap-2 h-9 text-[13px] text-body cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="size-4" />
                Visible on /nfos
              </label>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="NFO opened"><input type="date" value={form.openDate} onChange={(e) => set("openDate", e.target.value)} className={inputCls} /></Field>
            <Field label="Closes"><input type="date" value={form.closeDate} onChange={(e) => set("closeDate", e.target.value)} className={inputCls} /></Field>
            <Field label="Allotment date (optional)"><input type="date" value={form.allotmentDate} onChange={(e) => set("allotmentDate", e.target.value)} className={inputCls} /></Field>
            <Field label="Reopens (optional)"><input type="date" value={form.reopenDate} onChange={(e) => set("reopenDate", e.target.value)} className={inputCls} /></Field>
            <Field label="Min. investment (₹)"><input type="number" value={form.minInvestment} onChange={(e) => set("minInvestment", Number(e.target.value))} className={inputCls} /></Field>
            <Field label="Subscription price (₹/unit)"><input type="number" step="0.01" value={form.subscriptionPrice} onChange={(e) => set("subscriptionPrice", Number(e.target.value))} className={inputCls} /></Field>
            <Field label="Exit load"><input value={form.exitLoad} onChange={(e) => set("exitLoad", e.target.value)} className={inputCls} placeholder="1% ≤ 30 days" /></Field>
            <Field label="Benchmark"><input value={form.benchmark} onChange={(e) => set("benchmark", e.target.value)} className={inputCls} placeholder="CRISIL Hybrid 50+50" /></Field>
            <Field label="Risk level"><input value={form.riskLevel} onChange={(e) => set("riskLevel", e.target.value)} className={inputCls} placeholder="Level 5 — High" /></Field>
          </div>

          <ArraySection
            title="Asset allocation bands"
            rows={form.allocationBands}
            onChange={(rows) => set("allocationBands", rows)}
            empty={{ name: "", range: "", percent: 0, color: "var(--accent)" }}
            renderRow={(row, update) => (
              <>
                <input value={row.name} onChange={(e) => update({ ...row, name: e.target.value })} placeholder="Equity & equity-related instruments" className={rowInputCls + " col-span-2"} />
                <input value={row.range} onChange={(e) => update({ ...row, range: e.target.value })} placeholder="25% – 65%" className={rowInputCls} />
                <input type="number" value={row.percent} onChange={(e) => update({ ...row, percent: Number(e.target.value) })} placeholder="65" className={rowInputCls} />
              </>
            )}
          />

          <ArraySection
            title="Strategy points"
            rows={form.strategyPoints}
            onChange={(rows) => set("strategyPoints", rows)}
            empty={{ title: "", desc: "", icon: "pulse" } as StrategyPoint}
            renderRow={(row, update) => (
              <>
                <input value={row.title} onChange={(e) => update({ ...row, title: e.target.value })} placeholder="Title" className={rowInputCls + " col-span-2"} />
                <select value={row.icon} onChange={(e) => update({ ...row, icon: e.target.value as StrategyPoint["icon"] })} className={rowInputCls}>
                  {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
                <textarea value={row.desc} onChange={(e) => update({ ...row, desc: e.target.value })} placeholder="Description" rows={2} className={rowInputCls + " col-span-4 resize-y"} />
              </>
            )}
          />

          <ArraySection
            title="Fund managers"
            rows={form.managers}
            onChange={(rows) => set("managers", rows)}
            empty={{ name: "", role: "", cred: "", avatar: "" }}
            renderRow={(row, update) => (
              <>
                <input value={row.name} onChange={(e) => update({ ...row, name: e.target.value })} placeholder="Name" className={rowInputCls} />
                <input value={row.role} onChange={(e) => update({ ...row, role: e.target.value })} placeholder="Role" className={rowInputCls} />
                <input value={row.avatar} onChange={(e) => update({ ...row, avatar: e.target.value })} placeholder="RS" maxLength={3} className={rowInputCls} />
                <textarea value={row.cred} onChange={(e) => update({ ...row, cred: e.target.value })} placeholder="Credentials" rows={2} className={rowInputCls + " col-span-4 resize-y"} />
              </>
            )}
          />

          <ArraySection
            title="Documents"
            rows={form.docs}
            onChange={(rows) => set("docs", rows)}
            empty={{ title: "", href: "#" }}
            renderRow={(row, update) => (
              <>
                <input value={row.title} onChange={(e) => update({ ...row, title: e.target.value })} placeholder="Investment Strategy Information Document (ISID)" className={rowInputCls + " col-span-3"} />
                <input value={row.href} onChange={(e) => update({ ...row, href: e.target.value })} placeholder="https://…" className={rowInputCls} />
              </>
            )}
          />

          <div className="flex items-center gap-2 pt-1">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null} {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-rule text-[13px] text-muted hover:text-body">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full h-9 px-3 rounded-[8px] border border-rule text-[13px] outline-none focus:border-primary bg-white";
const rowInputCls = "px-2.5 py-1.5 rounded-[6px] border border-rule text-[12.5px] outline-none focus:border-primary bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-widest text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}

function ArraySection<T>({ title, rows, onChange, empty, renderRow }: {
  title: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  empty: T;
  renderRow: (row: T, update: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold text-heading uppercase tracking-wide">{title}</h3>
        <button onClick={() => onChange([...rows, empty])} className="text-[11px] text-primary font-semibold hover:opacity-70">
          + Add row
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-[12px] text-faint italic">None yet</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-4 gap-1.5 items-start bg-surface border border-rule rounded-[8px] p-2">
              {renderRow(row, (next) => onChange(rows.map((r, j) => (j === i ? next : r))))}
              <button onClick={() => onChange(rows.filter((_, j) => j !== i))} className="text-loss hover:opacity-70 justify-self-end col-span-4 text-[11px] font-medium">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminNfos() {
  const [nfos, setNfos] = useState<Nfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNfo, setModalNfo] = useState<Nfo | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/nfos");
    const data = await res.json();
    setNfos(data.nfos ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function del(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`/api/admin/nfos/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublished(n: Nfo) {
    await fetch(`/api/admin/nfos/${n._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !n.published }),
    });
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">NFOs</h1>
          <p className="text-[14px] text-muted mt-1">{nfos.length} NFO{nfos.length === 1 ? "" : "s"} · powers /nfos</p>
        </div>
        <button onClick={() => setModalNfo(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover shadow-btn">
          <Plus className="size-4" /> New NFO
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
      ) : nfos.length === 0 ? (
        <div className="py-16 text-center text-muted text-[13px] flex flex-col items-center gap-2">
          <Rocket className="size-6 text-faint" />
          No NFOs yet.
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_100px_110px_110px_90px_120px] gap-4 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
            <div>Fund</div><div>AMC</div><div>Category</div><div>Closes</div><div>Min. investment</div><div>Status</div><div>Actions</div>
          </div>
          {nfos.map((n) => (
            <div key={n._id} className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_100px_110px_110px_90px_120px] gap-4 px-5 py-3 border-b border-rule last:border-0 items-center hover:bg-surface">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-heading truncate">{n.name}</p>
                <p className="text-[11px] text-faint truncate">/nfos/{n.slug}</p>
              </div>
              <div className="text-[12.5px] text-body truncate">{n.amc}</div>
              <div className="text-[12px] text-muted">{n.category}</div>
              <div className="text-[12px] text-muted">{new Date(n.closeDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
              <div className="text-[12px] text-muted">₹{n.minInvestment.toLocaleString("en-IN")}</div>
              <div>
                {n.published ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Live</span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rule bg-surface text-muted">Hidden</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => togglePublished(n)} className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-body transition" title={n.published ? "Hide from site" : "Publish to site"}>
                  {n.published ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <button onClick={() => setModalNfo(n)} className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-primary hover:border-primary transition" title="Edit">
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => del(n._id, n.name)} className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 transition" title="Delete">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNfo !== undefined && (
        <NfoModal nfo={modalNfo} onClose={() => setModalNfo(undefined)} onSaved={load} />
      )}
    </div>
  );
}
