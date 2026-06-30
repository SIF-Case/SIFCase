"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, RefreshCw, Play, Loader2, CheckCircle, XCircle, X, ExternalLink, TrendingUp, Download } from "lucide-react";

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

type NavRecord = { nav: number; navDate: string; source: string };
type FundDetail = {
  scheme: Scheme & { isinGrowth?: string; companyName?: string; isActive?: boolean };
  navRecords: NavRecord[];
};

type TriggerResult = { ok: boolean; updated?: number; duration?: number; error?: string } | null;

function NavChart({ records }: { records: NavRecord[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 380, H = 110, PL = 8, PR = 8, PT = 12, PB = 22;
  const sorted = [...records].sort((a, b) => new Date(a.navDate).getTime() - new Date(b.navDate).getTime());
  const navs = sorted.map((r) => r.nav);
  const min = Math.min(...navs), max = Math.max(...navs);
  const range = max - min || 0.01;
  const isPos = sorted[sorted.length - 1].nav >= sorted[0].nav;
  const color = isPos ? "#16A34A" : "#DC2626";

  const pts = sorted.map((_, i) => ({
    x: PL + (i / (sorted.length - 1)) * (W - PL - PR),
    y: PT + ((max - sorted[i].nav) / range) * (H - PT - PB),
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PB} L ${pts[0].x.toFixed(1)} ${H - PB} Z`;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * W;
    const frac = (rawX - PL) / (W - PL - PR);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(frac * (sorted.length - 1))));
    setTip({ x: pts[idx].x, y: pts[idx].y, idx });
  }

  const anchorRight = tip ? tip.x > W * 0.6 : false;

  return (
    <div className="px-5 py-3 border-b border-rule relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair"
        style={{ height: H }}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTip(null)}
      >
        <defs>
          <linearGradient id="admin-nav-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#admin-nav-grad)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x={PL} y={PT + 5} fontSize="8" fill="#94A3B8">₹{max.toFixed(4)}</text>
        <text x={PL} y={H - PB - 2} fontSize="8" fill="#94A3B8">₹{min.toFixed(4)}</text>
        <text x={PL} y={H - 4} fontSize="8" fill="#94A3B8">{new Date(sorted[0].navDate).toLocaleDateString("en-IN")}</text>
        <text x={W - PR} y={H - 4} fontSize="8" fill="#94A3B8" textAnchor="end">{new Date(sorted[sorted.length - 1].navDate).toLocaleDateString("en-IN")}</text>
        {tip && (
          <>
            <line x1={tip.x} y1={PT} x2={tip.x} y2={H - PB} stroke={color} strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.5" />
            <circle cx={tip.x} cy={tip.y} r="3.5" fill="white" stroke={color} strokeWidth="1.5" />
          </>
        )}
      </svg>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 bg-[#1a1a1a] text-white text-[11px] font-semibold rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap"
          style={{
            bottom: `${H - tip.y + 10}px`,
            ...(anchorRight
              ? { right: `${(1 - tip.x / W) * 100}%` }
              : { left: `${(tip.x / W) * 100}%` }),
            transform: anchorRight ? "translateX(8px)" : "translateX(-50%)",
          }}
        >
          <p className="font-mono">₹{sorted[tip.idx].nav.toFixed(4)}</p>
          <p className="text-[9px] font-normal opacity-60 mt-0.5">{new Date(sorted[tip.idx].navDate).toLocaleDateString("en-IN")}</p>
        </div>
      )}
    </div>
  );
}

function FundPanel({ code, onClose }: { code: string; onClose: () => void }) {
  const [detail, setDetail] = useState<FundDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/funds/${code}`)
      .then((r) => r.json())
      .then((d) => { setDetail(d); setLoading(false); });
  }, [code]);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-rule shadow-premium z-40 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-rule flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-0.5">{code}</p>
            <p className="text-[14px] font-bold text-heading leading-snug">{detail?.scheme.schemeName ?? "Loading…"}</p>
            {detail && <p className="text-[11px] text-muted mt-0.5">{detail.scheme.amc}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={`/sifs/${code.toLowerCase()}`} target="_blank" rel="noopener"
              className="size-8 inline-flex items-center justify-center rounded-full border border-rule text-muted hover:text-body transition">
              <ExternalLink className="size-3.5" />
            </a>
            <button onClick={onClose}
              className="size-8 inline-flex items-center justify-center rounded-full border border-rule text-muted hover:text-body transition">
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted text-[13px]">
            <Loader2 className="size-5 animate-spin mr-2" /> Loading…
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto">
            {/* Scheme details */}
            <div className="px-5 py-4 border-b border-rule">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Scheme Info</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  { label: "Strategy", value: detail.scheme.strategy },
                  { label: "Plan", value: detail.scheme.plan },
                  { label: "Option", value: detail.scheme.option },
                  { label: "ISIN", value: detail.scheme.isinGrowth || "—" },
                  { label: "Company", value: detail.scheme.companyName || "—" },
                  { label: "Status", value: detail.scheme.isActive !== false ? "Active" : "Inactive" },
                ].map((row) => (
                  <div key={row.label}>
                    <p className="text-[9.5px] font-mono uppercase tracking-widest text-faint">{row.label}</p>
                    <p className="text-[12.5px] font-medium text-body mt-0.5 truncate">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* NAV stats */}
            {detail.navRecords.length > 0 && (() => {
              const sorted = [...detail.navRecords].sort((a, b) => new Date(a.navDate).getTime() - new Date(b.navDate).getTime());
              const latest = sorted[sorted.length - 1];
              const first = sorted[0];
              const totalReturn = ((latest.nav - first.nav) / first.nav * 100).toFixed(2);
              const isPos = parseFloat(totalReturn) >= 0;

              return (
                <div className="px-5 py-4 border-b border-rule">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">NAV Summary</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface rounded-[10px] p-3">
                      <p className="text-[9.5px] font-mono uppercase tracking-widest text-faint">Latest NAV</p>
                      <p className="text-[16px] font-bold text-heading nums mt-0.5">₹{latest.nav.toFixed(4)}</p>
                      <p className="text-[10px] text-muted">{new Date(latest.navDate).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="bg-surface rounded-[10px] p-3">
                      <p className="text-[9.5px] font-mono uppercase tracking-widest text-faint">First NAV</p>
                      <p className="text-[16px] font-bold text-heading nums mt-0.5">₹{first.nav.toFixed(4)}</p>
                      <p className="text-[10px] text-muted">{new Date(first.navDate).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="bg-surface rounded-[10px] p-3">
                      <p className="text-[9.5px] font-mono uppercase tracking-widest text-faint">Total Return</p>
                      <p className={`text-[16px] font-bold nums mt-0.5 ${isPos ? "text-gain" : "text-loss"}`}>
                        {isPos ? "+" : ""}{totalReturn}%
                      </p>
                      <p className="text-[10px] text-muted">{detail.navRecords.length} records</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* NAV Chart */}
            {detail.navRecords.length >= 2 && <NavChart records={detail.navRecords} />}

            {/* NAV history table */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="size-3.5 text-muted" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Recent NAV History (last 60)</p>
              </div>
              <div className="rounded-[10px] border border-rule overflow-hidden">
                <div className="grid grid-cols-3 px-3 py-2 bg-mist text-[9.5px] font-mono uppercase tracking-widest text-muted border-b border-rule">
                  <div>Date</div><div className="text-right">NAV</div><div className="text-right">Source</div>
                </div>
                <div className="divide-y divide-rule max-h-[360px] overflow-y-auto">
                  {detail.navRecords.map((r, i) => (
                    <div key={i} className="grid grid-cols-3 px-3 py-2 text-[11.5px] hover:bg-surface">
                      <div className="text-muted">{new Date(r.navDate).toLocaleDateString("en-IN")}</div>
                      <div className="text-right font-semibold nums text-body">₹{r.nav.toFixed(4)}</div>
                      <div className="text-right text-[10px] font-mono text-faint truncate">{r.source?.replace("_", " ") ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted text-[13px]">Failed to load.</div>
        )}
      </div>
    </>
  );
}

export default function AdminFunds() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<TriggerResult>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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

  async function downloadCSV() {
    setExporting(true);
    try {
      // Fetch all schemes (no pagination)
      const res = await fetch(`/api/admin/funds?page=1&limit=9999&q=${encodeURIComponent(search)}`);
      const data = await res.json();
      const all: Scheme[] = data.schemes ?? [];

      const headers = ["Scheme Code", "Scheme Name", "AMC", "Strategy", "Plan", "Option", "NAV Records", "Last NAV Date"];
      const rows = all.map((s) => [
        s.schemeCode,
        `"${s.schemeName.replace(/"/g, '""')}"`,
        `"${s.amc.replace(/"/g, '""')}"`,
        `"${s.strategy.replace(/"/g, '""')}"`,
        s.plan,
        s.option,
        s.navCount,
        s.lastNav ? new Date(s.lastNav).toLocaleDateString("en-IN") : "—",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sifcase-funds-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
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
          <button onClick={downloadCSV} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body disabled:opacity-60">
            {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            {exporting ? "Exporting…" : "Download CSV"}
          </button>
          <button onClick={triggerNav} disabled={triggering}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover disabled:opacity-60 shadow-btn">
            {triggering ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {triggering ? "Fetching…" : "Trigger NAV Fetch"}
          </button>
        </div>
      </div>

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
          <div key={s.schemeCode}
            onClick={() => setSelectedCode(s.schemeCode)}
            className={`grid grid-cols-[minmax(0,2.5fr)_120px_100px_70px_100px] gap-4 px-5 py-3.5 border-b border-rule last:border-0 items-center cursor-pointer transition-colors ${selectedCode === s.schemeCode ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-surface"}`}>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-heading truncate">{s.schemeName}</p>
              <p className="text-[11px] text-muted">{s.amc} · <span className="font-mono text-[10px]">{s.schemeCode}</span></p>
            </div>
            <div className="text-[11px] text-muted truncate">{s.strategy.replace(" Long-Short", "")}</div>
            <div className="text-[11px] text-muted">{s.plan} / {s.option}</div>
            <div className={`text-[13px] font-semibold nums ${s.navCount <= 2 ? "text-loss" : "text-body"}`}>{s.navCount}</div>
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

      {selectedCode && <FundPanel code={selectedCode} onClose={() => setSelectedCode(null)} />}
    </div>
  );
}
