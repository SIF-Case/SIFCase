"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Download,
  Loader2,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  X,
  Trophy,
  AlertTriangle,
} from "lucide-react";

// ── types ──────────────────────────────────────────────────────────────────
type Returns = {
  "1m": number | null;
  "3m": number | null;
  "6m": number | null;
  "1y": number | null;
  si: number | null;
};

type SchemeRow = {
  schemeCode: string;
  schemeName: string;
  amc: string;
  strategy: string;
  plan: string;
  option: string;
  currentNav: number | null;
  currentNavDate: string | null;
  inceptionDate: string | null;
  returns: Returns;
};

type ApiResponse = {
  schemes: SchemeRow[];
  categoryAverages: Record<string, Record<string, number | null>>;
  top3: SchemeRow[];
  bottom3: SchemeRow[];
  total: number;
  toDate: string;
};

// ── helpers ────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtSince(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

function fmtPct(val: number | null): string {
  if (val === null) return "N/A";
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

// Color class for a return value (matches the legend)
function retColor(val: number | null): string {
  if (val === null) return "text-faint";
  if (val > 3)   return "text-[#15803d]";   // strong green
  if (val >= 0)  return "text-[#16a34a]";   // positive green
  if (val >= -2) return "text-[#d97706]";   // mild negative amber
  return "text-[#dc2626]";                   // negative red
}

// Background for table cell (subtle tint)
function retBg(val: number | null): string {
  if (val === null) return "";
  if (val > 3)   return "bg-[#f0fdf4]";
  if (val >= 0)  return "bg-[#f0fdf4]/60";
  if (val >= -2) return "bg-[#fffbeb]/80";
  return "bg-[#fef2f2]/80";
}

// ── sub-components ─────────────────────────────────────────────────────────

function RetCell({ val }: { val: number | null }) {
  return (
    <td className={`px-3 py-2.5 text-center text-[12.5px] font-bold nums ${retColor(val)} ${retBg(val)}`}>
      {fmtPct(val)}
    </td>
  );
}

function PerformerTable({
  title,
  schemes,
  catAvg,
  type,
}: {
  title: string;
  schemes: SchemeRow[];
  catAvg: Record<string, Record<string, number | null>>;
  type: "top" | "bottom";
}) {
  const isTop = type === "top";
  const headerBg = isTop ? "bg-[#15803d]" : "bg-[#dc2626]";
  const rowBg = isTop ? "bg-[#f0fdf4]" : "bg-[#fef2f2]";
  const Icon = isTop ? Trophy : AlertTriangle;

  return (
    <div className="flex-1 min-w-[300px]">
      <div className={`flex items-center gap-2 mb-3`}>
        <Icon className={`size-4 ${isTop ? "text-[#15803d]" : "text-[#dc2626]"}`} />
        <h3 className={`text-[14px] font-bold ${isTop ? "text-[#15803d]" : "text-[#dc2626]"}`}>
          {title}
        </h3>
      </div>
      <div className="rounded-[12px] overflow-hidden border border-rule shadow-card">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className={headerBg}>
              <th className="text-left px-4 py-2.5 text-white font-semibold">Scheme Name</th>
              <th className="text-left px-3 py-2.5 text-white font-semibold">Category</th>
              <th className="text-left px-3 py-2.5 text-white font-semibold">AMC</th>
              <th className="text-center px-3 py-2.5 text-white font-semibold">1M Return</th>
              <th className="text-center px-3 py-2.5 text-white font-semibold">Since Inception</th>
            </tr>
          </thead>
          <tbody>
            {schemes.map((s, i) => {
              const catAvgVal = catAvg[s.strategy]?.["1m"] ?? null;
              return (
                <tr key={s.schemeCode} className={`${rowBg} border-t border-rule`}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-heading truncate max-w-[180px]">{s.schemeName}</p>
                    <p className="text-[10px] text-faint font-mono">{s.schemeCode}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted text-[11px]">
                    {s.strategy?.replace(" Long-Short", "") ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-muted text-[11px] truncate max-w-[100px]">{s.amc}</td>
                  <td className="px-3 py-2.5 text-center">
                    <p className={`font-bold text-[13px] nums ${retColor(s.returns["1m"])}`}>
                      {fmtPct(s.returns["1m"])}
                    </p>
                    {catAvgVal !== null && (
                      <p className="text-[9.5px] text-muted mt-0.5">
                        cat avg {fmtPct(catAvgVal)}
                      </p>
                    )}
                  </td>
                  <td className={`px-3 py-2.5 text-center font-bold text-[13px] nums ${retColor(s.returns.si)}`}>
                    {fmtPct(s.returns.si)}
                    {s.inceptionDate && (
                      <p className="text-[9.5px] text-muted font-normal mt-0.5">
                        since {fmtSince(s.inceptionDate)}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
            {schemes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted text-[12px]">
                  Insufficient data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────
export default function NavRecordsPage() {
  const [toDate, setToDate]         = useState(todayStr());
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading]       = useState(false);
  const [data, setData]             = useState<ApiResponse | null>(null);
  const [exporting, setExporting]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── fetch ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ toDate });
      if (search) params.set("q", search);
      const res = await fetch(`/api/admin/nav-records?${params}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [toDate, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearchInput(val: string) {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 400);
  }

  // ── CSV export ─────────────────────────────────────────────────────────
  async function downloadCSV() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ toDate });
      if (search) params.set("q", search);
      const res  = await fetch(`/api/admin/nav-records?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const json: ApiResponse = await res.json();

      const headers = [
        "Scheme Code", "Scheme Name", "AMC", "Strategy", "Plan", "Option",
        "Current NAV", "As Of Date", "Inception Date",
        "1M %", "3M %", "6M %", "1Y %", "SI %",
        "Cat Avg 1M %",
      ];

      const catAvg = json.categoryAverages;
      const rows = json.schemes.map((s) => [
        s.schemeCode,
        `"${s.schemeName.replace(/"/g, '""')}"`,
        `"${s.amc.replace(/"/g, '""')}"`,
        `"${(s.strategy ?? "").replace(/"/g, '""')}"`,
        s.plan, s.option,
        s.currentNav !== null ? s.currentNav.toFixed(4) : "",
        s.currentNavDate ? fmtDate(s.currentNavDate) : "",
        s.inceptionDate  ? fmtDate(s.inceptionDate)  : "",
        s.returns["1m"] !== null ? s.returns["1m"]!.toFixed(2) : "N/A",
        s.returns["3m"] !== null ? s.returns["3m"]!.toFixed(2) : "N/A",
        s.returns["6m"] !== null ? s.returns["6m"]!.toFixed(2) : "N/A",
        s.returns["1y"] !== null ? s.returns["1y"]!.toFixed(2) : "N/A",
        s.returns.si    !== null ? s.returns.si!.toFixed(2)    : "N/A",
        catAvg[s.strategy]?.["1m"] !== null && catAvg[s.strategy]?.["1m"] !== undefined
          ? (catAvg[s.strategy]["1m"]! as number).toFixed(2)
          : "N/A",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `sifcase-nav-performance-${toDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────
  const schemes  = data?.schemes ?? [];
  const catAvg   = data?.categoryAverages ?? {};
  const top3     = data?.top3 ?? [];
  const bottom3  = data?.bottom3 ?? [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px] flex items-center gap-2.5">
            <TrendingUp className="size-6 text-primary" />
            NAV Performance
          </h1>
          <p className="text-[14px] text-muted mt-1">
            Scheme-level % returns for 1M · 3M · 6M · 1Y · Since Inception · as of{" "}
            <span className="font-semibold text-body">{fmtDate(toDate)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={downloadCSV}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover disabled:opacity-60 shadow-btn transition-colors"
          >
            {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            {exporting ? "Exporting…" : "Download CSV"}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-[14px] border border-rule shadow-card p-5 mb-6 flex flex-wrap items-end gap-5">
        {/* To Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted">
            As Of Date
          </label>
          <div className="flex items-center gap-2 h-10 px-3 rounded-[10px] border border-rule bg-surface">
            <CalendarDays className="size-3.5 text-muted shrink-0" />
            <input
              type="date"
              value={toDate}
              max={todayStr()}
              onChange={(e) => setToDate(e.target.value)}
              className="text-[13px] bg-transparent outline-none text-body w-[130px]"
            />
          </div>
          <p className="text-[10px] text-faint">Returns computed relative to this date</p>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted">
            Filter Schemes
          </label>
          <div className="flex items-center gap-2 h-10 px-3 rounded-[10px] border border-rule bg-surface">
            <Search className="size-3.5 text-muted shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Name, code, AMC, ISIN…"
              className="flex-1 text-[13px] bg-transparent outline-none"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(""); setSearch(""); }} className="text-muted hover:text-body transition-colors">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats pills */}
        {data && !loading && (
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1 items-center bg-surface border border-rule rounded-[10px] px-4 py-2">
              <p className="text-[22px] font-bold text-heading nums">{data.total}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Schemes</p>
            </div>
            <div className="flex flex-col gap-1 items-center bg-surface border border-rule rounded-[10px] px-4 py-2">
              <p className="text-[22px] font-bold text-[#15803d] nums">
                {schemes.filter((s) => (s.returns["1m"] ?? -Infinity) > 0).length}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Positive 1M</p>
            </div>
            <div className="flex flex-col gap-1 items-center bg-surface border border-rule rounded-[10px] px-4 py-2">
              <p className="text-[22px] font-bold text-[#dc2626] nums">
                {schemes.filter((s) => s.returns["1m"] !== null && s.returns["1m"]! < 0).length}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Negative 1M</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted text-[13px]">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p>Computing performance returns…</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── Top / Bottom 3 ─────────────────────────────────────────── */}
          {(top3.length > 0 || bottom3.length > 0) && (
            <div className="flex gap-6 mb-8 flex-wrap">
              <PerformerTable
                title="Top 3 Performers — 1-Month Return"
                schemes={top3}
                catAvg={catAvg}
                type="top"
              />
              <PerformerTable
                title="Bottom 3 Performers — 1-Month Return"
                schemes={bottom3}
                catAvg={catAvg}
                type="bottom"
              />
            </div>
          )}

          {/* ── Comprehensive Performance Table ───────────────────────── */}
          <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-rule flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-heading">
                  Comprehensive Performance Table — All Schemes
                </h2>
                <p className="text-[11px] text-muted mt-0.5">
                  Returns: Absolute. N/A = insufficient history. As of{" "}
                  <span className="font-semibold">{fmtDate(toDate)}</span>
                </p>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 text-[10.5px] shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#16a34a] inline-block" />
                  <span className="text-muted">Positive (0–+3%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#15803d] inline-block" />
                  <span className="text-muted">Strong (&gt;+3%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#d97706] inline-block" />
                  <span className="text-muted">Mild neg (−2% to 0)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#dc2626] inline-block" />
                  <span className="text-muted">Negative (&lt;−2%)</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[900px]">
                <thead>
                  <tr className="bg-[#1e3a5f] text-white">
                    <th className="text-left px-4 py-3 font-semibold text-[11.5px]">Scheme Name</th>
                    <th className="text-left px-3 py-3 font-semibold text-[11.5px]">Category</th>
                    <th className="text-left px-3 py-3 font-semibold text-[11.5px]">AMC</th>
                    <th className="text-center px-3 py-3 font-semibold text-[11.5px]">1M %</th>
                    <th className="text-center px-3 py-3 font-semibold text-[11.5px]">3M %</th>
                    <th className="text-center px-3 py-3 font-semibold text-[11.5px]">6M %</th>
                    <th className="text-center px-3 py-3 font-semibold text-[11.5px]">1Y %</th>
                    <th className="text-center px-3 py-3 font-semibold text-[11.5px]">SI %</th>
                    <th className="text-center px-3 py-3 font-semibold text-[11.5px]">Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {schemes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-muted text-[13px]">
                        No schemes found.
                      </td>
                    </tr>
                  ) : (
                    schemes.map((s, i) => {
                      const catA = catAvg[s.strategy] ?? {};
                      return (
                        <tr
                          key={s.schemeCode}
                          className={`transition-colors hover:bg-surface/60 ${i % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"}`}
                        >
                          {/* Scheme name */}
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-heading text-[12.5px] leading-tight">
                              {s.schemeName}
                            </p>
                            <p className="text-[10px] font-mono text-faint mt-0.5">
                              {s.schemeCode} · {s.plan} · {s.option}
                            </p>
                          </td>

                          {/* Category */}
                          <td className="px-3 py-2.5 text-muted text-[11px]">
                            {s.strategy?.replace(" Long-Short", "") ?? "—"}
                          </td>

                          {/* AMC */}
                          <td className="px-3 py-2.5 text-muted text-[11px] max-w-[130px] truncate">
                            {s.amc}
                          </td>

                          {/* 1M */}
                          <td className={`px-3 py-2.5 text-center ${retBg(s.returns["1m"])}`}>
                            <p className={`font-bold text-[13px] nums ${retColor(s.returns["1m"])}`}>
                              {fmtPct(s.returns["1m"])}
                            </p>
                            {catA["1m"] !== null && catA["1m"] !== undefined && (
                              <p className="text-[9px] text-muted mt-0.5 whitespace-nowrap">
                                vs cat avg {fmtPct(catA["1m"] as number)}
                              </p>
                            )}
                          </td>

                          {/* 3M */}
                          <td className={`px-3 py-2.5 text-center ${retBg(s.returns["3m"])}`}>
                            <p className={`font-bold text-[13px] nums ${retColor(s.returns["3m"])}`}>
                              {fmtPct(s.returns["3m"])}
                            </p>
                            {catA["3m"] !== null && catA["3m"] !== undefined && (
                              <p className="text-[9px] text-muted mt-0.5 whitespace-nowrap">
                                vs cat avg {fmtPct(catA["3m"] as number)}
                              </p>
                            )}
                          </td>

                          {/* 6M */}
                          <td className={`px-3 py-2.5 text-center ${retBg(s.returns["6m"])}`}>
                            <p className={`font-bold text-[13px] nums ${retColor(s.returns["6m"])}`}>
                              {fmtPct(s.returns["6m"])}
                            </p>
                            {catA["6m"] !== null && catA["6m"] !== undefined && (
                              <p className="text-[9px] text-muted mt-0.5 whitespace-nowrap">
                                vs cat avg {fmtPct(catA["6m"] as number)}
                              </p>
                            )}
                          </td>

                          {/* 1Y */}
                          <td className={`px-3 py-2.5 text-center ${retBg(s.returns["1y"])}`}>
                            <p className={`font-bold text-[13px] nums ${retColor(s.returns["1y"])}`}>
                              {fmtPct(s.returns["1y"])}
                            </p>
                            {catA["1y"] !== null && catA["1y"] !== undefined && (
                              <p className="text-[9px] text-muted mt-0.5 whitespace-nowrap">
                                vs cat avg {fmtPct(catA["1y"] as number)}
                              </p>
                            )}
                          </td>

                          {/* SI */}
                          <td className={`px-3 py-2.5 text-center ${retBg(s.returns.si)}`}>
                            <p className={`font-bold text-[13px] nums ${retColor(s.returns.si)}`}>
                              {fmtPct(s.returns.si)}
                            </p>
                          </td>

                          {/* Since (inception date) */}
                          <td className="px-3 py-2.5 text-center text-[11px] text-muted font-mono">
                            {fmtSince(s.inceptionDate)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table legend footer */}
            <div className="px-5 py-3 border-t border-rule bg-mist/40 flex flex-wrap items-center gap-5 text-[10.5px] text-muted">
              <span>
                <span className="inline-block size-2.5 rounded-full bg-[#16a34a] mr-1.5 align-middle" />
                Positive (0 to +3%)
              </span>
              <span>
                <span className="inline-block size-2.5 rounded-full bg-[#15803d] mr-1.5 align-middle" />
                Strong (&gt;+3%)
              </span>
              <span>
                <span className="inline-block size-2.5 rounded-full bg-[#d97706] mr-1.5 align-middle" />
                Mild negative (−2% to 0)
              </span>
              <span>
                <span className="inline-block size-2.5 rounded-full bg-[#dc2626] mr-1.5 align-middle" />
                Negative (&lt;−2%)
              </span>
              <span className="ml-auto">
                N/A = insufficient history for that period
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
