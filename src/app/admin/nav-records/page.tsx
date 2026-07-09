"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Download,
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";

// ── types ──────────────────────────────────────────────────────────────────
type NavRecord = {
  schemeCode: string;
  schemeName: string;
  amc: string;
  nav: number;
  repurchasePrice: number | null;
  salePrice: number | null;
  navDate: string;
  source: string;
  fetchedAt: string;
};

type ApiResponse = {
  records: NavRecord[];
  total: number;
  page: number;
  pages: number;
  fromDate: string | null;
  toDate: string;
};

const PERIODS = [
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
] as const;

type PeriodValue = (typeof PERIODS)[number]["value"] | "";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtNum(n: number) {
  return n.toLocaleString("en-IN");
}

// Format today's date as YYYY-MM-DD for the date input default value
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── component ──────────────────────────────────────────────────────────────
export default function NavRecordsPage() {
  const [toDate, setToDate] = useState(todayStr());
  const [period, setPeriod] = useState<PeriodValue>("1m");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [exporting, setExporting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── fetch ───────────────────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        toDate,
        page: String(page),
        limit: "100",
      });
      if (period) params.set("period", period);
      if (search) params.set("q", search);

      const res = await fetch(`/api/admin/nav-records?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json: ApiResponse = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [toDate, period, search, page]);

  useEffect(() => {
    setPage(1);
  }, [toDate, period, search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Debounce search input
  function handleSearchInput(val: string) {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 400);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }

  // ── CSV export ─────────────────────────────────────────────────────────
  async function downloadCSV() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ toDate, export: "1" });
      if (period) params.set("period", period);
      if (search) params.set("q", search);

      const res = await fetch(`/api/admin/nav-records?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const json: ApiResponse = await res.json();
      const rows = json.records;

      const headers = [
        "Scheme Code",
        "Scheme Name",
        "AMC",
        "NAV Date",
        "NAV (₹)",
        "Repurchase Price",
        "Sale Price",
        "Source",
        "Fetched At",
      ];
      const csvRows = rows.map((r) => [
        r.schemeCode,
        `"${r.schemeName.replace(/"/g, '""')}"`,
        `"${r.amc.replace(/"/g, '""')}"`,
        fmtDate(r.navDate),
        r.nav.toFixed(4),
        r.repurchasePrice !== null ? r.repurchasePrice.toFixed(4) : "",
        r.salePrice !== null ? r.salePrice.toFixed(4) : "",
        r.source,
        new Date(r.fetchedAt).toISOString(),
      ]);

      const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const periodLabel = period ? `-${period}` : "";
      a.download = `sifcase-nav-records-${toDate}${periodLabel}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────
  const records = data?.records ?? [];
  const total   = data?.total ?? 0;
  const pages   = data?.pages ?? 1;

  // Human-readable range label
  const rangeLabel = (() => {
    if (!data) return null;
    const to = fmtDate(data.toDate);
    if (data.fromDate) {
      return `${fmtDate(data.fromDate)} — ${to}`;
    }
    return `Up to ${to}`;
  })();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px] flex items-center gap-2.5">
            <TrendingUp className="size-6 text-primary" />
            NAV Records
          </h1>
          <p className="text-[14px] text-muted mt-1">
            Browse and export historical NAV data with date &amp; period filters
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRecords}
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
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {exporting ? "Exporting…" : "Download CSV"}
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-[14px] border border-rule shadow-card p-5 mb-5 flex flex-wrap items-end gap-5">
        {/* Date picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted">
            To Date
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
        </div>

        {/* Period chips */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted">
            Period (from date)
          </label>
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(period === p.value ? "" : p.value)}
                className={`h-10 px-4 rounded-[10px] text-[13px] font-semibold border transition-all ${
                  period === p.value
                    ? "bg-primary text-white border-primary shadow-btn"
                    : "border-rule text-muted hover:border-primary hover:text-primary bg-white"
                }`}
              >
                {p.label}
              </button>
            ))}
            {period && (
              <button
                onClick={() => setPeriod("")}
                className="h-10 px-3 rounded-[10px] border border-rule text-[11px] text-muted hover:text-body bg-white transition-colors"
                title="Clear period"
              >
                All time
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted">
            Search Scheme
          </label>
          <div className="flex items-center gap-2 h-10 px-3 rounded-[10px] border border-rule bg-surface">
            <Search className="size-3.5 text-muted shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Scheme name, code, AMC, ISIN…"
              className="flex-1 text-[13px] bg-transparent outline-none"
            />
            {searchInput && (
              <button onClick={clearSearch} className="text-muted hover:text-body transition-colors">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {rangeLabel && (
            <span className="text-[12px] text-muted font-mono bg-white border border-rule rounded-full px-3 py-1">
              📅 {rangeLabel}
            </span>
          )}
          {!loading && (
            <span className="text-[12px] text-muted">
              {fmtNum(total)} record{total !== 1 ? "s" : ""} found
            </span>
          )}
        </div>
        {pages > 1 && (
          <span className="text-[12px] text-muted">
            Page {page} of {pages}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,2.2fr)_110px_90px_90px_90px_120px] gap-3 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
          <div>Scheme Code</div>
          <div>Scheme Name</div>
          <div className="text-right">NAV Date</div>
          <div className="text-right">NAV (₹)</div>
          <div className="text-right">Repurchase</div>
          <div className="text-right">Sale</div>
          <div className="text-right">Source</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted text-[13px]">
            <Loader2 className="size-6 animate-spin" />
            Loading NAV records…
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center text-muted text-[13px]">
            No NAV records found for the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {records.map((r, i) => (
              <div
                key={`${r.schemeCode}-${r.navDate}-${i}`}
                className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,2.2fr)_110px_90px_90px_90px_120px] gap-3 px-5 py-3 items-center hover:bg-surface/60 transition-colors"
              >
                {/* Scheme code + AMC */}
                <div className="min-w-0">
                  <p className="text-[12px] font-mono font-semibold text-primary truncate">
                    {r.schemeCode}
                  </p>
                  <p className="text-[10.5px] text-faint truncate mt-0.5">{r.amc}</p>
                </div>

                {/* Scheme name */}
                <div className="min-w-0">
                  <p className="text-[12.5px] text-body truncate">{r.schemeName}</p>
                </div>

                {/* NAV date */}
                <div className="text-right text-[12px] text-muted font-mono">
                  {fmtDate(r.navDate)}
                </div>

                {/* NAV */}
                <div className="text-right text-[13px] font-bold text-heading nums">
                  ₹{r.nav.toFixed(4)}
                </div>

                {/* Repurchase */}
                <div className="text-right text-[12px] text-muted nums">
                  {r.repurchasePrice !== null ? `₹${r.repurchasePrice.toFixed(4)}` : "—"}
                </div>

                {/* Sale */}
                <div className="text-right text-[12px] text-muted nums">
                  {r.salePrice !== null ? `₹${r.salePrice.toFixed(4)}` : "—"}
                </div>

                {/* Source */}
                <div className="text-right">
                  <span className="text-[10px] font-mono text-faint bg-mist border border-rule px-2 py-0.5 rounded-full truncate block max-w-full">
                    {r.source?.replace(/_/g, " ") ?? "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination footer */}
        {pages > 1 && !loading && (
          <div className="px-5 py-3 border-t border-rule flex items-center justify-between bg-mist/40">
            <span className="text-[12px] text-muted">
              Showing {(page - 1) * 100 + 1}–{Math.min(page * 100, total)} of {fmtNum(total)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-8 inline-flex items-center justify-center rounded-[8px] border border-rule text-muted hover:text-body disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              {/* Page number pills — show at most 5 around current */}
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`size-8 inline-flex items-center justify-center rounded-[8px] text-[12px] font-semibold border transition-colors ${
                      p === page
                        ? "bg-primary text-white border-primary"
                        : "border-rule text-muted hover:text-body"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="size-8 inline-flex items-center justify-center rounded-[8px] border border-rule text-muted hover:text-body disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
