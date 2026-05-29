'use client';

import { useState, useMemo } from "react";
import { X, Plus, Search, GitCompare } from "lucide-react";
import Link from "next/link";
import type { FundRow, PeriodKey } from "@/lib/sifData";
import { CompareLab } from "@/components/sections/CompareLab";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { Sparkline } from "@/components/ui/Sparkline";

const PERIODS: PeriodKey[] = ["1M", "3M", "6M", "1Y", "SI"];

const SECTION_ROWS: {
  section: string;
  rows: { label: string; key: (f: FundRow, p: PeriodKey) => { text: string; tone?: "gain" | "loss" | "muted" | null } }[];
}[] = [
  {
    section: "Basic",
    rows: [
      { label: "Scheme Code",   key: (f) => ({ text: f.schemeCode }) },
      { label: "AMC",           key: (f) => ({ text: f.amc }) },
      { label: "Strategy",      key: (f) => ({ text: f.strategy }) },
      { label: "Category",      key: (f) => ({ text: f.category }) },
      { label: "Plan",          key: (f) => ({ text: f.plan }) },
      { label: "Option",        key: (f) => ({ text: (f as any).option ?? "—" }) },
    ],
  },
  {
    section: "NAV & Returns",
    rows: [
      { label: "Latest NAV",      key: (f) => ({ text: `₹${f.nav.toFixed(4)}` }) },
      { label: "NAV Date",        key: (f) => ({ text: f.navDate }) },
      { label: "1M Return",       key: (f) => retCell(f.returns["1M"]) },
      { label: "3M Return",       key: (f) => retCell(f.returns["3M"]) },
      { label: "6M Return",       key: (f) => retCell(f.returns["6M"]) },
      { label: "1Y Return",       key: (f) => retCell(f.returns["1Y"]) },
      { label: "Since Inception", key: (f) => retCell(f.returns["SI"]) },
    ],
  },
  {
    section: "Risk",
    rows: [
      { label: "Sharpe (SI)",      key: (f) => numCell(f.sharpes["SI"]) },
      { label: "Sharpe (3M)",      key: (f) => numCell(f.sharpes["3M"]) },
      { label: "Max Drawdown (SI)", key: (f) => drawdownCell(f.drawdowns["SI"]) },
      { label: "Max Drawdown (3M)", key: (f) => drawdownCell(f.drawdowns["3M"]) },
      { label: "Riskometer",        key: () => ({ text: "Pending source verification", tone: "muted" as const }) },
    ],
  },
  {
    section: "Cost",
    rows: [
      { label: "Expense Ratio (TER)", key: () => ({ text: "Pending source verification", tone: "muted" as const }) },
      { label: "Exit Load",           key: () => ({ text: "Pending source verification", tone: "muted" as const }) },
      { label: "Min Investment",      key: () => ({ text: "₹10 Lakhs (SEBI rule)", tone: null }) },
    ],
  },
  {
    section: "Documents",
    rows: [
      { label: "Scheme Info Document",  key: () => ({ text: "Pending source verification", tone: "muted" as const }) },
      { label: "Factsheet",             key: () => ({ text: "Pending source verification", tone: "muted" as const }) },
      { label: "Portfolio Disclosure",  key: () => ({ text: "Pending source verification", tone: "muted" as const }) },
    ],
  },
  {
    section: "Data Confidence",
    rows: [
      { label: "NAV Source",      key: () => ({ text: "AMFI Verified" }) },
      { label: "Returns Source",  key: () => ({ text: "Calculated from NAV" }) },
      { label: "Risk Metrics",    key: () => ({ text: "Calculated from NAV" }) },
      { label: "TER Source",      key: () => ({ text: "Pending AMC/ISID", tone: "muted" as const }) },
    ],
  },
];

function retCell(v: number | null): { text: string; tone?: "gain" | "loss" | "muted" | null } {
  if (v === null) return { text: "Insufficient history", tone: "muted" };
  return { text: `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, tone: v >= 0 ? "gain" : "loss" };
}
function numCell(v: number | null): { text: string; tone?: "gain" | "loss" | "muted" | null } {
  if (v === null) return { text: "Insufficient history", tone: "muted" };
  return { text: v.toFixed(2), tone: v >= 1 ? "gain" : v < 0 ? "loss" : null };
}
function drawdownCell(v: number | null): { text: string; tone?: "gain" | "loss" | "muted" | null } {
  if (v === null) return { text: "Insufficient history", tone: "muted" };
  return { text: `${v.toFixed(2)}%`, tone: v < 0 ? "loss" : "muted" };
}

function shortName(name: string) {
  return name.replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "").replace(/\s*(SIF|Fund)\s*$/i, "").trim();
}

function FundPicker({
  funds, selected, onSelect, onClear,
}: {
  funds: FundRow[];
  selected: FundRow | null;
  onSelect: (f: FundRow) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => query.length < 1
      ? funds.slice(0, 10)
      : funds.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()) || f.amc.toLowerCase().includes(query.toLowerCase())).slice(0, 10),
    [funds, query],
  );

  if (selected) {
    const spark = selected.sparklines["SI"];
    const si = selected.returns["SI"];
    return (
      <div className="bg-white border border-rule rounded-[18px] p-4 shadow-card">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-heading leading-tight truncate">{shortName(selected.name)}</p>
            <p className="text-[11px] text-muted mt-0.5">{selected.amc}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mt-0.5">{selected.strategy}</p>
          </div>
          <button onClick={onClear} className="shrink-0 p-1 rounded hover:bg-surface text-muted hover:text-loss transition-colors mt-0.5">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono text-muted uppercase tracking-widest">NAV</div>
            <div className="text-[15px] font-bold tabular text-heading">₹{selected.nav.toFixed(4)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-muted uppercase tracking-widest">SI</div>
            <div className={`text-[14px] font-bold tabular ${si === null ? "text-muted" : si >= 0 ? "text-gain" : "text-loss"}`}>
              {si === null ? "—" : `${si >= 0 ? "+" : ""}${si.toFixed(2)}%`}
            </div>
          </div>
          {spark.length > 1 && (
            <div className="w-16 h-8 shrink-0">
              <Sparkline data={spark} stroke={si !== null && si >= 0 ? "var(--color-gain)" : "var(--color-loss)"} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 border border-dashed border-rule rounded-[18px] px-4 py-3 cursor-text hover:border-primary transition-colors bg-white"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4 text-muted shrink-0" />
        <input
          className="flex-1 text-[13px] text-body bg-transparent outline-none placeholder:text-faint min-w-0"
          placeholder="Search by fund name or AMC…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-rule rounded-[18px] shadow-premium py-1 max-h-64 overflow-y-auto">
          {filtered.map((f) => (
            <button
              key={f.schemeCode}
              onMouseDown={() => { onSelect(f); setQuery(""); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-surface transition-colors"
            >
              <p className="text-[13px] font-medium text-heading leading-tight">{shortName(f.name)}</p>
              <p className="text-[11px] text-muted mt-0.5">{f.amc} · {f.strategy}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PALETTE = ["#1E4ED8", "#0FAF75", "#F59E0B", "#DC2626"];

export function ComparePageClient({ funds, initialCodes }: { funds: FundRow[]; initialCodes: string[] }) {
  const [slots, setSlots] = useState<(FundRow | null)[]>(() => {
    const initial = initialCodes
      .slice(0, 4)
      .map((code) => funds.find((f) => f.schemeCode === code.toUpperCase()) ?? null);
    while (initial.length < 4) initial.push(null);
    return initial;
  });
  const [period, setPeriod] = useState<PeriodKey>("SI");

  const selected = slots.filter(Boolean) as FundRow[];
  const setSlot = (i: number, f: FundRow | null) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? f : s)));

  const availableForSlot = (slotIdx: number) =>
    funds.filter((f) => !slots.some((s, si) => si !== slotIdx && s?.schemeCode === f.schemeCode));

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-section space-y-10">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Compare</p>
        <h1 className="text-[32px] font-bold text-heading tracking-[-0.3px] mb-2">SIF Comparison</h1>
        <p className="text-[15px] text-muted max-w-2xl">
          Compare up to 4 SIFs side by side across NAV, returns, risk metrics, and strategy. All figures are source-verified or calculated from AMFI NAV data.
        </p>
      </div>

      {/* ── Fund Selectors ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {slots.map((slot, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full" style={{ background: PALETTE[i] }} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Fund {i + 1}</span>
            </div>
            <FundPicker
              funds={availableForSlot(i)}
              selected={slot}
              onSelect={(f) => setSlot(i, f)}
              onClear={() => setSlot(i, null)}
            />
          </div>
        ))}
      </div>

      {selected.length === 0 && (
        <div className="rounded-[18px] border border-dashed border-rule py-16 text-center bg-surface">
          <GitCompare className="size-8 text-muted mx-auto mb-3" />
          <p className="text-[14px] text-muted">Search and select funds above to start comparing.</p>
          <p className="text-[12px] text-faint mt-1">You can also add funds using the + buttons on the homepage.</p>
        </div>
      )}

      {/* ── Performance Lab ──────────────────────────────────────────────── */}
      {selected.length >= 1 && (
        <section>
          <div className="mb-4">
            <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Performance Lab</div>
            <h2 className="text-[24px] font-bold text-heading tracking-[-0.3px]">NAV chart comparison</h2>
          </div>
          <CompareLab funds={selected} initialPicked={selected.map((f) => f.schemeCode)} controlled />
        </section>
      )}

      {/* ── Full Comparison Matrix ───────────────────────────────────────── */}
      {selected.length >= 1 && (
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Side-by-Side</div>
              <h2 className="text-[24px] font-bold text-heading tracking-[-0.3px]">Full comparison</h2>
            </div>
            <div className="flex items-center gap-1 bg-white border border-rule rounded-full p-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${period === p ? "bg-primary text-white" : "text-muted hover:text-heading"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-rule overflow-hidden shadow-card">
            {/* Fund header row */}
            <div className="grid bg-brand-navy text-white border-b border-white/10" style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
              <div className="px-5 py-4 text-[10px] font-mono uppercase tracking-widest text-white/40">Metric</div>
              {selected.map((f, i) => (
                <div key={f.schemeCode} className="px-5 py-4 border-l border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="size-2 rounded-full shrink-0" style={{ background: PALETTE[i] }} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{f.schemeCode}</span>
                  </div>
                  <Link href={`/sifs/${f.schemeCode.toLowerCase()}`} className="text-[13px] font-semibold text-white leading-tight hover:text-primary-tint transition-colors block">
                    {shortName(f.name)}
                  </Link>
                  <p className="text-[11px] text-white/50 mt-0.5">{f.amc}</p>
                </div>
              ))}
            </div>

            {/* Sections */}
            {SECTION_ROWS.map(({ section, rows }) => (
              <div key={section}>
                {/* Section header */}
                <div className="grid bg-mist border-y border-rule" style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
                  <div className="px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest text-primary font-semibold col-span-full">
                    {section}
                  </div>
                </div>

                {/* Section rows */}
                {rows.map(({ label, key }, ri) => {
                  const cells = selected.map((f) => key(f, period));
                  return (
                    <div key={label} className={`grid border-b border-rule last:border-0 ${ri % 2 === 0 ? "bg-white" : "bg-surface/40"}`} style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
                      <div className="px-5 py-3.5 text-[12px] text-muted font-medium self-center">{label}</div>
                      {cells.map((cell, ci) => (
                        <div key={ci} className="px-5 py-3.5 border-l border-rule self-center">
                          {section === "Data Confidence" ? (
                            <SourceBadge
                              variant={cell.text === "AMFI Verified" ? "amfi" : cell.text === "Calculated from NAV" ? "calculated" : "review"}
                              className="text-[9.5px]"
                            />
                          ) : (
                            <span className={`text-[13px] font-semibold tabular ${
                              cell.tone === "gain" ? "text-gain" : cell.tone === "loss" ? "text-loss" : cell.tone === "muted" ? "text-muted" : "text-body"
                            }`}>
                              {cell.text}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <div className="border border-rule rounded-[18px] p-5 bg-surface text-[12px] text-muted leading-relaxed">
        <strong className="text-body">Note:</strong> Returns, Sharpe ratio, volatility, and drawdown figures are calculated by SIFcase from AMFI NAV data.
        Figures marked "Insufficient history" require more trading days of data. Never use "best" or "worst" figures here as investment advice —
        past performance does not guarantee future results. Expense ratios, exit loads, and document links will be added once verified from AMC/ISID sources.
      </div>
    </div>
  );
}
