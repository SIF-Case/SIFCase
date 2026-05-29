"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Play, Loader2, CheckCircle, XCircle } from "lucide-react";

type Scheme = {
  schemeCode: string;
  schemeName: string;
  amc: string;
  strategy: string;
  plan: string;
  option: string;
  navCount: number;
  lastNav: string | null;
};

type TriggerResult = { ok: boolean; updated?: number; duration?: number; error?: string } | null;

export default function AdminFunds() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<TriggerResult>(null);

  const fetchFunds = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/funds?page=${page}&q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setSchemes(data.schemes ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchFunds(); }, [fetchFunds]);

  async function triggerNav() {
    setTriggering(true);
    setTriggerResult(null);
    const res = await fetch("/api/admin/nav-trigger", { method: "POST" });
    const data = await res.json();
    setTriggerResult(data);
    setTriggering(false);
    fetchFunds();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">Funds & NAV</h1>
          <p className="text-[14px] text-muted mt-1">{total} schemes in database</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchFunds} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
          <button onClick={triggerNav} disabled={triggering}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover disabled:opacity-60 shadow-btn">
            {triggering ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {triggering ? "Fetching…" : "Trigger NAV Fetch"}
          </button>
        </div>
      </div>

      {/* Trigger result */}
      {triggerResult && (
        <div className={`mb-4 px-4 py-3 rounded-[10px] border flex items-center gap-3 text-[13px] ${triggerResult.ok ? "bg-green-50 border-green-200 text-gain" : "bg-red-50 border-red-200 text-loss"}`}>
          {triggerResult.ok ? <CheckCircle className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
          {triggerResult.ok
            ? `NAV fetch complete — ${triggerResult.updated ?? 0} funds updated in ${((triggerResult.duration ?? 0) / 1000).toFixed(1)}s`
            : `Error: ${triggerResult.error}`}
        </div>
      )}

      <div className="flex items-center gap-2 bg-white border border-rule rounded-[10px] px-3 h-10 mb-4 max-w-sm shadow-card">
        <Search className="size-3.5 text-muted shrink-0" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search scheme name…"
          className="flex-1 text-[13px] bg-transparent outline-none" />
      </div>

      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2.5fr)_120px_100px_70px_100px] gap-4 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
          <div>Scheme</div><div>Strategy</div><div>Plan / Option</div><div>NAV Records</div><div>Last NAV</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
        ) : schemes.map((s) => (
          <div key={s.schemeCode} className="grid grid-cols-[minmax(0,2.5fr)_120px_100px_70px_100px] gap-4 px-5 py-3.5 border-b border-rule last:border-0 items-center hover:bg-surface">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-heading truncate">{s.schemeName}</p>
              <p className="text-[11px] text-muted">{s.amc} · <span className="font-mono text-[10px]">{s.schemeCode}</span></p>
            </div>
            <div className="text-[11px] text-muted truncate">{s.strategy.replace(" Long-Short", "")}</div>
            <div className="text-[11px] text-muted">{s.plan} / {s.option}</div>
            <div className="text-[13px] font-semibold nums text-body">{s.navCount}</div>
            <div className="text-[11px] text-muted">{s.lastNav ? new Date(s.lastNav).toLocaleDateString("en-IN") : "—"}</div>
          </div>
        ))}

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
    </div>
  );
}
