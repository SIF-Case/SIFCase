"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FundRow, PeriodKey } from "@/lib/sifData";
import { getCategoryAverages } from "@/lib/categoryAverages";
import { fundHref } from "@/lib/slugify";
import { Sparkline } from "@/components/ui/Sparkline";
import { useCompareTray } from "@/components/ui/CompareTray";
import { useWatchlist, rememberPendingWatchlistAdd } from "@/hooks/useWatchlist";
import { AuthModal } from "@/components/auth/AuthModal";
import { Plus, Check, Bookmark } from "lucide-react";
import { HelpTip } from "@/components/ui/HelpTip";
import { RETURN_PERIOD_HELP, METRIC_HELP, CATEGORY_FILTER_HELP } from "@/lib/controlHelp";

const PERIODS: PeriodKey[] = ["1M", "3M", "6M", "1Y", "SI"];
const CATEGORIES = ["All", "Equity", "Hybrid", "Debt"] as const;
type SortKey = "return1m" | "return3m" | "return1y" | "sharpe" | "drawdown" | "nav" | "name";

function shortName(name: string) {
  return name
    .replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "")
    .replace(/\s*-\s*Growth\s*Option.*/i, "")
    .replace(/\s*(SIF|Fund)\s*$/i, "")
    .trim();
}

function ReturnBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[12px] text-muted">—</span>;
  const pos = value >= 0;
  return (
    <span className={`text-[13px] font-semibold nums ${pos ? "text-gain" : "text-loss"}`}>
      {pos ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function FundRow({ fund, period, onRequireAuth }: { fund: FundRow; period: PeriodKey; onRequireAuth: (reason: string) => void }) {
  const router = useRouter();
  const { has, toggle } = useCompareTray();
  const inTray = has(fund.schemeCode);
  const { watching, toggle: toggleWatch, loading: watchLoading, loggedIn } = useWatchlist(fund.schemeCode);

  function handleWatchClick() {
    if (!loggedIn) {
      rememberPendingWatchlistAdd(fund.schemeCode);
      onRequireAuth("save to your watchlist");
      return;
    }
    toggleWatch();
  }
  const href = fundHref(fund.fundName, fund.schemeCode);

  return (
    <div
      onClick={() => router.push(href)}
      className="group relative grid items-center gap-4 px-5 py-3.5 border-b border-rule last:border-0 hover:bg-blue-50/30 transition-colors min-w-[888px] cursor-pointer"
      style={{ gridTemplateColumns: "minmax(0,1.2fr) 90px 72px 72px 72px 72px 88px 148px" }}>

      {/* Name */}
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-heading group-hover:text-primary truncate block leading-snug transition-colors">
          {fund.fundName || shortName(fund.name)}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted truncate">{fund.amc}</span>
          <span className="text-rule">·</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary">{fund.strategy.replace(" Long-Short", "")}</span>
        </div>
      </div>

      {/* NAV */}
      <div className="text-right">
        <p className="text-[13.5px] font-bold text-heading nums">₹{fund.nav.toFixed(4)}</p>
        <p className="text-[10px] text-muted">{fund.navDate}</p>
      </div>

      {/* 1M return */}
      <div className="text-right"><ReturnBadge value={fund.returns["1M"]} /></div>
      
      {/* 3M return */}
      <div className="text-right"><ReturnBadge value={fund.returns["3M"]} /></div>
      
      {/* 1Y return */}
      <div className="text-right"><ReturnBadge value={fund.returns["1Y"]} /></div>

      {/* Sharpe */}
      <div className="text-right">
        {(() => {
          const s = fund.sharpes[period];
          return <span className={`text-[13px] font-semibold nums ${s === null ? "text-muted" : s >= 1 ? "text-gain" : s >= 0 ? "text-amber-500" : "text-loss"}`}>
            {s !== null ? s.toFixed(2) : "—"}
          </span>;
        })()}
      </div>

      {/* Drawdown */}
      <div className="text-right">
        {(() => {
          const dd = fund.drawdowns[period];
          return <span className={`text-[13px] font-semibold nums ${dd === null ? "text-muted" : dd < 0 ? "text-loss" : "text-muted"}`}>
            {dd !== null ? `${dd.toFixed(2)}%` : "—"}
          </span>;
        })()}
      </div>

      {/* Compare + Watchlist buttons — stopPropagation so row click doesn't fire */}
      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleWatchClick}
          disabled={watchLoading}
          title={watching ? "Remove from watchlist" : "Add to watchlist"}
          aria-pressed={watching}
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border transition shrink-0 disabled:opacity-50 ${
            watching ? "border-primary bg-primary/10 text-primary" : "border-rule hover:border-rule-strong text-muted hover:text-body"
          }`}>
          <Bookmark className="size-3.5" fill={watching ? "currentColor" : "none"} />
        </button>
        <button
          onClick={() => toggle(fund.schemeCode)}
          title={inTray ? "Remove from compare" : "Add to compare"}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition shrink-0 ${
            inTray ? "border-primary bg-primary/10 text-primary" : "border-rule hover:border-rule-strong text-muted hover:text-body"
          }`}>
          {inTray ? <><Check className="size-3" /><span>Added</span></> : <><Plus className="size-3" /><span>Compare</span></>}
        </button>
      </div>
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50];

export function SIFsClient({ funds }: { funds: FundRow[] }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [period, setPeriod] = useState<PeriodKey>("SI");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>(() => {
    const c = searchParams.get("category") as typeof CATEGORIES[number] | null;
    return c && CATEGORIES.includes(c) ? c : "All";
  });
  const [sortKey, setSortKey] = useState<SortKey>("return1m");
  const [sortAsc, setSortAsc] = useState(false);
  const [showFilters, setShowFilters] = useState(() => searchParams.get("amc") !== null);
  const [strategyFilter, setStrategyFilter] = useState("All");
  const [amcFilter, setAmcFilter] = useState(() => searchParams.get("amc") ?? "All");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState("");

  function requireAuth(reason: string) {
    setAuthReason(reason);
    setAuthOpen(true);
  }

  const strategies = useMemo(() =>
    ["All", ...Array.from(new Set(funds.map((f) => f.strategy))).sort()],
    [funds]);

  const amcs = useMemo(() =>
    ["All", ...Array.from(new Set(funds.map((f) => f.amc).filter(Boolean))).sort()],
    [funds]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = funds.filter((f) => {
      if (category !== "All" && f.category !== category) return false;
      if (strategyFilter !== "All" && f.strategy !== strategyFilter) return false;
      if (amcFilter !== "All" && f.amc !== amcFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.amc.toLowerCase().includes(q) || f.strategy.toLowerCase().includes(q);
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case "return1m": va = a.returns["1M"] ?? -Infinity; vb = b.returns["1M"] ?? -Infinity; break;
        case "return3m": va = a.returns["3M"] ?? -Infinity; vb = b.returns["3M"] ?? -Infinity; break;
        case "return1y": va = a.returns["1Y"] ?? -Infinity; vb = b.returns["1Y"] ?? -Infinity; break;
        case "sharpe":   va = a.sharpes[period] ?? -Infinity;  vb = b.sharpes[period] ?? -Infinity; break;
        case "drawdown": va = a.drawdowns[period] ?? Infinity; vb = b.drawdowns[period] ?? Infinity; break;
        case "nav":      va = a.nav; vb = b.nav; break;
        case "name":     return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return sortAsc ? va - vb : vb - va;
    });

    return list;
  }, [funds, search, period, category, strategyFilter, amcFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => {
    const withRet = filtered.filter((f) => f.returns[period] !== null);
    const avg = withRet.length ? withRet.reduce((s, f) => s + f.returns[period]!, 0) / withRet.length : null;
    const best = withRet.length ? Math.max(...withRet.map((f) => f.returns[period]!)) : null;
    const worst = withRet.length ? Math.min(...withRet.map((f) => f.returns[period]!)) : null;
    return { avg, best, worst, count: filtered.length };
  }, [filtered, period]);

  const categoryAverages = useMemo(() =>
    getCategoryAverages(category === "All" ? funds : funds.filter((f) => f.category === category)),
    [funds, category]);

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    const btn = (
      <button onClick={() => toggleSort(col)}
        className={`flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest transition-colors ${active ? "text-primary" : "text-muted hover:text-body"}`}>
        {label}
        <ArrowUpDown className={`size-3 ${active ? "opacity-100" : "opacity-40"}`} />
      </button>
    );
    const help = METRIC_HELP[label] ?? RETURN_PERIOD_HELP[label];
    return help ? <HelpTip {...help} side="bottom">{btn}</HelpTip> : btn;
  }

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-10 w-full">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Universe</p>
        <h1 className="text-[32px] font-bold text-heading tracking-[-0.3px] mb-1">{category === "All" ? "All SIFs" : `All ${category} SIFs`}</h1>
        <p className="text-[15px] text-muted">
          {category === "All"
            ? "Every Specialised Investment Fund — verified NAV, returns, and risk from AMFI."
            : `Every ${category} Specialised Investment Fund — verified NAV, returns, and risk from AMFI.`}
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Funds shown", value: stats.count.toString() },
          { label: `Best ${period}`, value: stats.best !== null ? `+${stats.best.toFixed(2)}%` : "—", cls: "text-gain" },
          { label: `Worst ${period}`, value: stats.worst !== null ? `${stats.worst.toFixed(2)}%` : "—", cls: "text-loss" },
          { label: `Avg ${period}`, value: stats.avg !== null ? `${stats.avg >= 0 ? "+" : ""}${stats.avg.toFixed(2)}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[14px] border border-rule px-4 py-3 shadow-card">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{s.label}</p>
            <p className={`text-[20px] font-bold nums mt-0.5 ${s.cls ?? "text-heading"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Category averages */}
      <div className="bg-white border border-rule rounded-[16px] shadow-card mb-6">
        <div className="px-4 py-3 border-b border-rule">
          <p className="text-[11px] font-mono uppercase tracking-widest text-primary">Category Averages</p>
          <p className="text-[12px] text-muted mt-0.5">Average {period} return across funds in each strategy</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 divide-rule">
          {categoryAverages.map((c, i) => {
            const avg = c.avgReturns[period];
            return (
              <div key={c.category} className={`px-4 py-3 ${i > 0 ? "sm:border-l border-rule" : ""}`}>
                <p className="text-[12px] font-semibold text-heading truncate">{c.category}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted mt-0.5">{c.fundCount} fund{c.fundCount !== 1 ? "s" : ""}</p>
                <p className={`text-[18px] font-bold nums mt-1 ${avg === null ? "text-muted" : avg >= 0 ? "text-gain" : "text-loss"}`}>
                  {avg !== null ? `${avg >= 0 ? "+" : ""}${avg.toFixed(2)}%` : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-rule rounded-[16px] shadow-card mb-4">
        <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-rule">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-rule rounded-[10px] px-3 h-9 bg-surface">
            <Search className="size-3.5 text-muted shrink-0" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search fund, AMC, strategy…"
              className="flex-1 text-[13px] bg-transparent outline-none text-body placeholder:text-faint" />
            {search && <button onClick={() => { setSearch(""); setPage(1); }}><X className="size-3.5 text-muted" /></button>}
          </div>

          {/* Period */}
          <div className="flex items-center gap-0.5 bg-surface border border-rule rounded-full p-0.5">
            {PERIODS.map((p) => {
              const btn = (
                <button onClick={() => { setPeriod(p); setPage(1); }}
                  className={`h-7 px-3 text-[11.5px] font-semibold rounded-full transition-all ${period === p ? "bg-primary text-white shadow-sm" : "text-muted hover:text-body"}`}>
                  {p}
                </button>
              );
              return <HelpTip key={p} {...RETURN_PERIOD_HELP[p]}>{btn}</HelpTip>;
            })}
          </div>

          {/* Category */}
          <div className="flex items-center gap-0.5 bg-surface border border-rule rounded-full p-0.5">
            {CATEGORIES.map((c) => (
              <HelpTip key={c} {...CATEGORY_FILTER_HELP[c]}>
                <button onClick={() => { setCategory(c); setPage(1); }}
                  className={`h-7 px-3 text-[11.5px] font-semibold rounded-full transition-all ${category === c ? "bg-primary text-white shadow-sm" : "text-muted hover:text-body"}`}>
                  {c}
                </button>
              </HelpTip>
            ))}
          </div>

          {/* More filters */}
          <button onClick={() => setShowFilters((v) => !v)}
            className={`h-9 px-3.5 rounded-[10px] border text-[12.5px] font-semibold flex items-center gap-2 transition-colors ${showFilters ? "border-primary text-primary bg-primary/5" : "border-rule text-muted hover:text-body"}`}>
            <SlidersHorizontal className="size-3.5" />
            Filters
          </button>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-rule flex flex-wrap items-start gap-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5">Strategy</p>
              <div className="flex flex-wrap gap-1.5">
                {strategies.map((s) => (
                  <button key={s} onClick={() => { setStrategyFilter(s); setPage(1); }}
                    className={`h-7 px-3 text-[11px] font-medium rounded-full border transition-colors ${strategyFilter === s ? "border-primary bg-primary/10 text-primary" : "border-rule text-muted hover:text-body"}`}>
                    {s === "All" ? "All strategies" : s.replace(" Long-Short", "")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1.5">Fund House</p>
              <select 
                value={amcFilter}
                onChange={(e) => { setAmcFilter(e.target.value); setPage(1); }}
                className="h-8 px-2.5 text-[12px] font-medium rounded-[6px] border border-rule bg-surface text-heading outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {amcs.map(a => (
                  <option key={a} value={a}>{a === "All" ? "All Fund Houses" : a}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Table — scrollable on small screens */}
        <div className="overflow-x-auto">
          {/* Table header */}
          <div className="grid items-center gap-4 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted min-w-[888px]"
            style={{ gridTemplateColumns: "minmax(0,1.2fr) 90px 72px 72px 72px 72px 88px 148px" }}>
            <SortBtn col="name" label="Fund" />
            <div className="flex justify-end"><SortBtn col="nav" label="NAV" /></div>
            <div className="flex justify-end"><SortBtn col="return1m" label="1M" /></div>
            <div className="flex justify-end"><SortBtn col="return3m" label="3M" /></div>
            <div className="flex justify-end"><SortBtn col="return1y" label="1Y" /></div>
            <div className="flex justify-end"><SortBtn col="sharpe" label="Sharpe" /></div>
            <div className="flex justify-end"><SortBtn col="drawdown" label="Drawdown" /></div>
            <div />
          </div>

          {/* Rows */}
          <div className="min-w-[888px]">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-muted text-[14px]">No funds match your filters.</div>
            ) : (
              paginated.map((fund) => <FundRow key={fund.schemeCode} fund={fund} period={period} onRequireAuth={requireAuth} />)
            )}
          </div>
        </div>

        {/* Pagination footer */}
        <div className="px-5 py-3 border-t border-rule flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-muted">
            {filtered.length === 0 ? "0 funds" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} fund${filtered.length !== 1 ? "s" : ""}`}
            {" · "}Source: AMFI
          </span>
          <div className="flex items-center gap-3">
            {/* Rows per page */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-muted">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="h-7 px-2 text-[12px] font-medium text-body border border-rule rounded-[8px] bg-white outline-none cursor-pointer hover:border-rule-strong"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            {/* Prev / page indicator / Next */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="size-7 inline-flex items-center justify-center rounded-[8px] border border-rule text-muted hover:text-body hover:border-rule-strong disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="text-[12px] font-mono text-muted px-2">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="size-7 inline-flex items-center justify-center rounded-[8px] border border-rule text-muted hover:text-body hover:border-rule-strong disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} reason={authReason} />
    </div>
  );
}
