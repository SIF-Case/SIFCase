"use client";

import { useState, useMemo } from "react";
import { X, Plus } from "lucide-react";
import type { FundRow, PeriodKey } from "@/lib/sifData";
import { HelpTip } from "@/components/ui/HelpTip";
import { RETURN_PERIOD_HELP, METRIC_HELP } from "@/lib/controlHelp";

const PERIODS: PeriodKey[] = ["1M", "3M", "6M", "1Y", "SI"];

const ROWS: { label: string; key: (f: FundRow, p: PeriodKey) => string | number | null }[] = [
  { label: "NAV",          key: (f) => `₹${f.nav.toFixed(4)}` },
  { label: "NAV Date",     key: (f) => f.navDate },
  { label: "AMC",          key: (f) => f.amc },
  { label: "Category",     key: (f) => f.category },
  { label: "Return",       key: (f, p) => f.returns?.[p] ?? null },
  { label: "Sharpe",       key: (f, p) => f.sharpes?.[p] ?? null },
];

function fmtVal(v: string | number | null, label: string): { text: string; numeric: number | null } {
  if (v === null || v === undefined) return { text: "—", numeric: null };
  if (typeof v === "string") return { text: v, numeric: null };
  if (label === "Return") return { text: `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, numeric: v };
  if (label === "Sharpe")  return { text: v.toFixed(2), numeric: v };
  return { text: String(v), numeric: v };
}

function FundPicker({
  funds,
  selected,
  onSelect,
  onClear,
}: {
  funds: FundRow[];
  selected: FundRow | null;
  onSelect: (f: FundRow) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      query.length < 1
        ? funds.slice(0, 8)
        : funds.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()) || f.amc.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
    [funds, query]
  );

  if (selected) {
    return (
      <div className="flex items-start justify-between gap-2 bg-surface rounded-[18px] p-3 border border-rule">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-heading leading-tight truncate">{selected.name}</p>
          <p className="text-[11px] text-muted mt-0.5">{selected.amc}</p>
        </div>
        <button onClick={onClear} className="flex-shrink-0 text-muted hover:text-loss mt-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 border border-dashed border-rule rounded-[18px] px-3 py-2.5 cursor-text hover:border-brand-navy transition-colors"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-3.5 h-3.5 text-muted flex-shrink-0" />
        <input
          className="flex-1 text-[12.5px] text-body bg-transparent outline-none placeholder:text-faint min-w-0"
          placeholder="Search fund…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-rule rounded-[18px] shadow-premium py-1 max-h-52 overflow-y-auto">
          {filtered.map((f) => (
            <button
              key={f.schemeCode}
              onMouseDown={() => { onSelect(f); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-surface transition-colors"
            >
              <p className="text-[12px] font-semibold text-heading leading-tight">{f.name}</p>
              <p className="text-[11px] text-muted">{f.amc}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompareFunds({ funds }: { funds: FundRow[] }) {
  const [slots, setSlots] = useState<(FundRow | null)[]>([null, null, null]);
  const [period, setPeriod] = useState<PeriodKey>("1M");

  const selected = slots.filter(Boolean) as FundRow[];

  const setSlot = (i: number, f: FundRow | null) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? f : s)));

  // For numeric rows, find the best value to highlight
  const bestFor = (label: string): number | null => {
    if (label !== "Return" && label !== "Sharpe") return null;
    const vals = selected
      .map((f) => {
        const raw = label === "Return" ? f.returns?.[period] : f.sharpes?.[period];
        return typeof raw === "number" ? raw : null;
      })
      .filter((v): v is number => v !== null);
    return vals.length > 0 ? Math.max(...vals) : null;
  };

  return (
    <section className="bg-white border-b border-rule">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Quick Compare</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">
              Compare funds
            </h2>
            <p className="text-[15px] text-muted">Select up to 3 SIFs to compare side by side</p>
          </div>
          <div className="flex items-center gap-1 bg-surface rounded-full border border-rule p-1">
            {PERIODS.map((p) => {
              const btn = (
                <button
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${period === p ? "bg-primary text-white shadow-btn" : "text-muted hover:text-heading"}`}
                >
                  {p}
                </button>
              );
              return <HelpTip key={p} {...RETURN_PERIOD_HELP[p]}>{btn}</HelpTip>;
            })}
          </div>
        </div>

        {/* Fund pickers */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {slots.map((slot, i) => (
            <FundPicker
              key={i}
              funds={funds.filter((f) => !slots.some((s, si) => si !== i && s?.schemeCode === f.schemeCode))}
              selected={slot}
              onSelect={(f) => setSlot(i, f)}
              onClear={() => setSlot(i, null)}
            />
          ))}
        </div>

        {/* Comparison table */}
        {selected.length > 0 && (
          <div className="rounded-[18px] border border-rule overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface border-b border-rule">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted w-32">Metric</th>
                  {selected.map((f) => (
                    <th key={f.schemeCode} className="px-5 py-3 text-left">
                      <p className="text-[12.5px] font-bold text-heading leading-tight">{f.name}</p>
                      <p className="text-[11px] text-muted font-normal mt-0.5">{f.amc}</p>
                    </th>
                  ))}
                  {/* Empty cols for unused slots */}
                  {Array.from({ length: 3 - selected.length }).map((_, i) => (
                    <th key={`empty-${i}`} className="px-5 py-3" />
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(({ label, key }, ri) => {
                  const best = bestFor(label);
                  return (
                    <tr key={label} className={ri % 2 === 0 ? "bg-white" : "bg-surface/50"}>
                      <td className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap">
                        {METRIC_HELP[label] ? <HelpTip {...METRIC_HELP[label]} align="left" side="bottom">{label}</HelpTip> : label}
                      </td>
                      {selected.map((f) => {
                        const raw = key(f, period);
                        const { text, numeric } = fmtVal(raw, label);
                        const isBest = best !== null && numeric === best && selected.length > 1;
                        return (
                          <td key={f.schemeCode} className="px-5 py-3">
                            <span className={`text-[13.5px] nums font-semibold ${
                              isBest
                                ? "text-gain"
                                : label === "Return" || label === "Sharpe"
                                  ? numeric !== null
                                    ? numeric >= 0 ? "text-body" : "text-loss"
                                    : "text-muted"
                                  : "text-body"
                            }`}>
                              {text}
                            </span>
                            {isBest && (
                              <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-gain bg-green-50 px-1.5 py-0.5 rounded-full">Best</span>
                            )}
                          </td>
                        );
                      })}
                      {Array.from({ length: 3 - selected.length }).map((_, i) => (
                        <td key={`empty-${i}`} className="px-5 py-3 text-[13px] text-faint">—</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selected.length === 0 && (
          <div className="rounded-[18px] border border-dashed border-rule py-14 text-center">
            <p className="text-[14px] text-muted">Search and select funds above to start comparing</p>
          </div>
        )}
      </div>
    </section>
  );
}
