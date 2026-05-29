import { createFileRoute, Link } from "@tanstack/react-router";
import { FUNDS, type Fund } from "@/lib/data";
import { useMemo, useState } from "react";
import { RiskMeter } from "@/components/ui-bits/RiskMeter";
import { Sparkline } from "@/components/ui-bits/Sparkline";
import { Plus, X, Trophy, TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { CompareLab, COMPARE_PALETTE, COMPARE_BENCHMARKS, benchSpark } from "@/components/compare/CompareLab";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "Compare SIFs — SIFHub" }, { name: "description", content: "Compare up to four SIFs side-by-side against benchmarks across returns, risk, allocation, holdings overlap and strategy." }] }),
  component: Compare,
});

function Compare() {
  const defaults = useMemo(() => [...FUNDS].sort((a, b) => b.returns.y1 - a.returns.y1).slice(0, 3).map((f) => f.id), []);
  const [picked, setPicked] = useState<string[]>(defaults);
  const [benches, setBenches] = useState<string[]>(["_bench_bse500"]);
  const funds = picked.map((id) => FUNDS.find((f) => f.id === id)!).filter(Boolean);
  const benchFunds = benches.map((id) => COMPARE_BENCHMARKS.find((b) => b.id === id)!).filter(Boolean);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Compare Engine</div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Side-by-side, fund vs benchmark</h1>
          <p className="text-[13px] text-muted-foreground max-w-2xl">Stack up to five SIFs against multiple benchmarks. Inspect every layer — returns, risk, allocation, holdings overlap and strategy posture.</p>
        </div>
        <button className="h-9 px-4 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface text-[12px] hover:border-primary/40">
          <Download className="size-3.5" /> Export comparison
        </button>
      </header>

      {/* TOP: chart lab */}
      <CompareLab picked={picked} setPicked={setPicked} benches={benches} setBenches={setBenches} />

      {/* Fund header cards */}
      <FundHeader picked={picked} setPicked={setPicked} />

      {/* Snapshot scorecard */}
      <Scorecard funds={funds} />

      {/* Returns matrix incl. benchmarks */}
      <ReturnsMatrix funds={funds} benches={benchFunds} />

      {/* Risk metrics */}
      <RiskBlock funds={funds} />

      {/* Allocation side-by-side */}
      <AllocationBlock funds={funds} />

      {/* Holdings overlap */}
      <HoldingsOverlap funds={funds} />

      {/* Strategy regimes */}
      <RegimesBlock funds={funds} />

      {/* Pros & Cons */}
      <ProsConsBlock funds={funds} />

      {/* Fees & Profile */}
      <ProfileBlock funds={funds} />

      <div className="text-center pt-2">
        <Link to="/explore" className="inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">
          <Plus className="size-3.5" /> Add more funds from screener
        </Link>
      </div>
    </div>
  );
}

/* ---------- Fund header chip row ---------- */
function FundHeader({ picked, setPicked }: { picked: string[]; setPicked: (ids: string[]) => void }) {
  const slots = [0, 1, 2, 3, 4];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {slots.map((slot) => {
        const id = picked[slot];
        const f = id ? FUNDS.find((x) => x.id === id) : null;
        if (!f) {
          const opts = FUNDS.filter((x) => !picked.includes(x.id));
          return (
            <div key={slot} className="bg-surface border border-dashed border-border rounded-xl p-4 flex items-center justify-center min-h-[150px]">
              <select onChange={(e) => e.target.value && setPicked([...picked, e.target.value])}
                className="bg-surface border border-border-strong rounded-md px-3 h-9 text-[12px]" defaultValue="">
                <option value="" disabled>＋ Add fund…</option>
                {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          );
        }
        return (
          <div key={slot} className="bg-surface border border-border rounded-xl p-4 relative">
            <span className="absolute top-3 left-3 size-2 rounded-full" style={{ background: COMPARE_PALETTE[slot % COMPARE_PALETTE.length] }} />
            <button onClick={() => setPicked(picked.filter((p) => p !== id))} className="absolute top-2.5 right-2.5 p-1 text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
            <div className="pl-4 text-[10px] font-mono uppercase tracking-widest text-primary">{f.amc}</div>
            <div className="pl-4 mt-1 text-[13px] font-semibold leading-snug line-clamp-2 min-h-[34px]">{f.name}</div>
            <div className="mt-3 h-10"><Sparkline data={f.spark} stroke={COMPARE_PALETTE[slot % COMPARE_PALETTE.length]} fill={COMPARE_PALETTE[slot % COMPARE_PALETTE.length]} /></div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>{f.strategy}</span>
              <span><RiskMeter level={f.risk} /></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Scorecard ---------- */
function Scorecard({ funds }: { funds: Fund[] }) {
  if (funds.length < 2) return null;
  const winners = {
    returns: funds.reduce((a, b) => (a.returns.y1 > b.returns.y1 ? a : b)).id,
    risk: funds.reduce((a, b) => (a.metrics.vol < b.metrics.vol ? a : b)).id,
    sharpe: funds.reduce((a, b) => (a.metrics.sharpe > b.metrics.sharpe ? a : b)).id,
    drawdown: funds.reduce((a, b) => (Math.abs(a.metrics.drawdown) < Math.abs(b.metrics.drawdown) ? a : b)).id,
    cost: funds.reduce((a, b) => (a.expense < b.expense ? a : b)).id,
  };
  const cards: { k: keyof typeof winners; label: string; sub: string; val: (f: Fund) => string }[] = [
    { k: "returns", label: "Best 1Y Return", sub: "Highest absolute", val: (f) => `${f.returns.y1.toFixed(2)}%` },
    { k: "risk", label: "Lowest Volatility", sub: "Smoothest ride", val: (f) => `${f.metrics.vol}%` },
    { k: "sharpe", label: "Best Sharpe", sub: "Risk-adjusted king", val: (f) => f.metrics.sharpe.toFixed(2) },
    { k: "drawdown", label: "Smallest Drawdown", sub: "Best downside", val: (f) => `${f.metrics.drawdown}%` },
    { k: "cost", label: "Lowest Cost", sub: "Expense ratio", val: (f) => `${f.expense}%` },
  ];
  return (
    <section>
      <SectionHeader title="Scorecard" hint="Category winners across the selected set" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {cards.map((c) => {
          const f = funds.find((x) => x.id === winners[c.k])!;
          const idx = funds.findIndex((x) => x.id === f.id);
          return (
            <div key={c.k} className="bg-surface p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Trophy className="size-3 text-gold" /> {c.label}
              </div>
              <div className="mt-2 text-[20px] font-semibold tabular font-mono">{c.val(f)}</div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                <span className="size-2 rounded-full" style={{ background: COMPARE_PALETTE[idx % COMPARE_PALETTE.length] }} />
                <span className="truncate">{f.name.replace(/\s*Fund\s*$/, "")}</span>
              </div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{c.sub}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Returns matrix ---------- */
function ReturnsMatrix({ funds, benches }: { funds: Fund[]; benches: { id: string; name: string; color: string }[] }) {
  const rows: Array<[string, keyof Fund["returns"]]> = [
    ["1M", "m1"], ["3M", "m3"], ["6M", "m6"], ["YTD", "ytd"], ["1Y", "y1"], ["SI", "si"],
  ];
  // approximate benchmark returns from spark
  const benchReturns = (id: string) => {
    const s = benchSpark(id);
    const calc = (w: number) => {
      const n = Math.min(w, s.length - 1);
      return ((s[s.length - 1] - s[s.length - 1 - n]) / s[s.length - 1 - n]) * 100;
    };
    return { m1: calc(2), m3: calc(4), m6: calc(8), ytd: calc(10), y1: calc(12), si: calc(s.length - 1) };
  };
  return (
    <section>
      <SectionHeader title="Returns matrix" hint="Heat-coded vs row median · benchmarks shown for context" />
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular">
            <thead className="bg-surface-2">
              <tr className="text-left">
                <th className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-24">Period</th>
                {funds.map((f, i) => (
                  <th key={f.id} className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <div className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} /><span className="truncate max-w-[140px]">{f.name.replace(/\s*Fund\s*$/, "")}</span></div>
                  </th>
                ))}
                {benches.map((b) => (
                  <th key={b.id} className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <div className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: b.color }} /><span className="truncate max-w-[120px]">{b.name}</span></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(([label, key]) => {
                const vals = funds.map((f) => f.returns[key]);
                const med = [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)] || 0;
                return (
                  <tr key={label} className="hover:bg-surface-2/60">
                    <td className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</td>
                    {funds.map((f) => {
                      const v = f.returns[key];
                      const d = v - med;
                      const isBest = v === Math.max(...vals);
                      return (
                        <td key={f.id} className="px-4 py-2.5 font-mono font-medium">
                          <Heat v={v} d={d} best={isBest} />
                        </td>
                      );
                    })}
                    {benches.map((b) => {
                      const v = (benchReturns(b.id) as Record<string, number>)[key as string];
                      return <td key={b.id} className="px-4 py-2.5 font-mono text-muted-foreground">{v >= 0 ? "+" : ""}{v.toFixed(2)}%</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Heat({ v, d, best }: { v: number; d: number; best: boolean }) {
  const intensity = Math.min(Math.abs(d) / 4, 1);
  const color = d >= 0 ? "var(--color-positive)" : "var(--color-negative)";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded"
      style={{ background: `color-mix(in oklab, ${color} ${intensity * 22}%, transparent)` }}>
      {best && <Trophy className="size-3 text-gold" />}
      <span>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>
    </span>
  );
}

/* ---------- Risk block ---------- */
function RiskBlock({ funds }: { funds: Fund[] }) {
  const metrics: Array<[string, (f: Fund) => number, string, "lower" | "higher"]> = [
    ["Sharpe", (f) => f.metrics.sharpe, "x", "higher"],
    ["Volatility", (f) => f.metrics.vol, "%", "lower"],
    ["Max Drawdown", (f) => Math.abs(f.metrics.drawdown), "%", "lower"],
    ["Alpha", (f) => f.metrics.alpha, "%", "higher"],
    ["Beta", (f) => f.metrics.beta, "x", "lower"],
  ];
  return (
    <section>
      <SectionHeader title="Risk & quality" hint="Bars normalized within each metric — longer is shown, winner is starred" />
      <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border">
        {metrics.map(([label, fn, unit, dir]) => {
          const vals = funds.map(fn);
          const max = Math.max(...vals);
          const winnerVal = dir === "higher" ? Math.max(...vals) : Math.min(...vals);
          return (
            <div key={label} className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{dir === "higher" ? "Higher = better" : "Lower = better"}</span>
              </div>
              <div className="space-y-1.5">
                {funds.map((f, i) => {
                  const v = fn(f);
                  const w = max > 0 ? (v / max) * 100 : 0;
                  const isWin = v === winnerVal;
                  return (
                    <div key={f.id} className="flex items-center gap-3">
                      <div className="w-44 text-[11px] truncate flex items-center gap-1.5">
                        <span className="size-2 rounded-full shrink-0" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} />
                        <span className="truncate">{f.name.replace(/\s*Fund\s*$/, "")}</span>
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${w}%`, background: isWin ? "var(--color-primary)" : COMPARE_PALETTE[i % COMPARE_PALETTE.length], opacity: isWin ? 1 : 0.55 }} />
                      </div>
                      <div className="w-20 text-right text-[12px] font-mono tabular flex items-center justify-end gap-1">
                        {isWin && <Trophy className="size-3 text-gold" />}{v.toFixed(2)}{unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Allocation ---------- */
function AllocationBlock({ funds }: { funds: Fund[] }) {
  const labels = Array.from(new Set(funds.flatMap((f) => f.allocation.map((a) => a.label))));
  const colors: Record<string, string> = {
    "Directional Equity": "#6aa6ff",
    "Hedged & Arbitrage": "#7ad9b4",
    "Fixed Income & Credit": "#f0b95a",
    "Real Assets & Alternatives": "#b48aff",
    "Cash & Liquidity": "#e98aab",
    "Other / Net Current Assets": "#737373",
  };
  return (
    <section>
      <SectionHeader title="Asset allocation" hint="Stacked composition by sleeve" />
      <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
        {funds.map((f, i) => (
          <div key={f.id}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[12px] flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} /><span className="font-medium">{f.name.replace(/\s*Fund\s*$/, "")}</span></div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">AUM ₹{f.aum} Cr</div>
            </div>
            <div className="flex h-6 rounded-md overflow-hidden border border-border">
              {f.allocation.filter((a) => a.pct > 0).map((a) => (
                <div key={a.label} className="h-full flex items-center justify-center text-[9px] font-mono uppercase tracking-widest text-foreground/80"
                  style={{ width: `${a.pct}%`, background: `color-mix(in oklab, ${colors[a.label] ?? "var(--color-primary)"} 60%, transparent)` }}
                  title={`${a.label} · ${a.pct}%`}>
                  {a.pct >= 10 ? `${a.pct.toFixed(0)}%` : ""}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="pt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono uppercase tracking-widest">
          {labels.map((l) => (
            <span key={l} className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm" style={{ background: colors[l] ?? "var(--color-primary)" }} /> {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Holdings overlap ---------- */
function HoldingsOverlap({ funds }: { funds: Fund[] }) {
  const issuers = new Map<string, { sector: string; counts: number; weights: Record<string, number> }>();
  funds.forEach((f) => {
    f.topHoldings.forEach((h) => {
      const e = issuers.get(h.issuer) ?? { sector: h.sector, counts: 0, weights: {} };
      e.counts = Object.keys({ ...e.weights, [f.id]: h.weight }).length;
      e.weights[f.id] = h.weight;
      issuers.set(h.issuer, e);
    });
  });
  const rows = Array.from(issuers.entries()).map(([issuer, v]) => ({ issuer, ...v, counts: Object.keys(v.weights).length }))
    .sort((a, b) => b.counts - a.counts || Object.values(b.weights).reduce((x, y) => x + y, 0) - Object.values(a.weights).reduce((x, y) => x + y, 0));
  const shared = rows.filter((r) => r.counts > 1);
  return (
    <section>
      <SectionHeader title="Holdings overlap" hint={`${shared.length} shared issuer${shared.length === 1 ? "" : "s"} across the set`} />
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-surface-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left">Issuer</th>
              <th className="px-4 py-2.5 text-left">Sector</th>
              {funds.map((f, i) => (
                <th key={f.id} className="px-4 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} />{f.name.split(" ")[0]}</span>
                </th>
              ))}
              <th className="px-4 py-2.5 text-right">Overlap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.slice(0, 12).map((r) => (
              <tr key={r.issuer} className="hover:bg-surface-2/60">
                <td className="px-4 py-2.5 font-medium">{r.issuer}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-[11px]">{r.sector}</td>
                {funds.map((f) => (
                  <td key={f.id} className="px-4 py-2.5 text-right font-mono tabular">
                    {r.weights[f.id] ? <span>{r.weights[f.id].toFixed(2)}%</span> : <span className="text-muted-foreground/40">—</span>}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono ${r.counts > 1 ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground"}`}>
                    {r.counts}/{funds.length}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Regimes ---------- */
function RegimesBlock({ funds }: { funds: Fund[] }) {
  const phases: Array<["bull" | "flat" | "bear", string, typeof TrendingUp]> = [
    ["bull", "Bull regime", TrendingUp],
    ["flat", "Flat regime", Minus],
    ["bear", "Bear regime", TrendingDown],
  ];
  return (
    <section>
      <SectionHeader title="Strategy playbook" hint="How each fund acts across market phases" />
      <div className="grid lg:grid-cols-3 gap-3">
        {phases.map(([key, label, Icon]) => (
          <div key={key} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-primary">
              <Icon className="size-3.5" /> {label}
            </div>
            <div className="mt-3 space-y-3">
              {funds.map((f, i) => (
                <div key={f.id}>
                  <div className="text-[11px] flex items-center gap-1.5 mb-1">
                    <span className="size-2 rounded-full" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} />
                    <span className="truncate font-medium">{f.name.replace(/\s*Fund\s*$/, "")}</span>
                  </div>
                  <ul className="pl-3.5 space-y-0.5 text-[11px] text-muted-foreground list-disc marker:text-primary/40">
                    {(f.strategy_regimes[key] ?? []).slice(0, 2).map((s, j) => <li key={j}>{s}</li>)}
                    {(f.strategy_regimes[key] ?? []).length === 0 && <li className="list-none text-muted-foreground/50">—</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Pros/Cons ---------- */
function ProsConsBlock({ funds }: { funds: Fund[] }) {
  return (
    <section>
      <SectionHeader title="Strengths vs caveats" hint="Manager-stated edge and risks" />
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-positive mb-2">Strengths</div>
          <div className="space-y-3">
            {funds.map((f, i) => (
              <div key={f.id}>
                <div className="text-[11px] flex items-center gap-1.5 mb-1"><span className="size-2 rounded-full" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} /><span className="font-medium truncate">{f.name.replace(/\s*Fund\s*$/, "")}</span></div>
                <ul className="pl-3.5 space-y-0.5 text-[11px] text-muted-foreground list-disc marker:text-positive/60">
                  {f.positives.slice(0, 3).map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-negative mb-2">Caveats</div>
          <div className="space-y-3">
            {funds.map((f, i) => (
              <div key={f.id}>
                <div className="text-[11px] flex items-center gap-1.5 mb-1"><span className="size-2 rounded-full" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} /><span className="font-medium truncate">{f.name.replace(/\s*Fund\s*$/, "")}</span></div>
                <ul className="pl-3.5 space-y-0.5 text-[11px] text-muted-foreground list-disc marker:text-negative/60">
                  {f.negatives.slice(0, 3).map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Profile ---------- */
function ProfileBlock({ funds }: { funds: Fund[] }) {
  const rows: Array<[string, (f: Fund) => string | number]> = [
    ["AUM (₹ Cr)", (f) => f.aum.toFixed(2)],
    ["NAV", (f) => `₹${f.nav.toFixed(3)}`],
    ["Expense Ratio", (f) => `${f.expense}%`],
    ["Strategy", (f) => f.strategy],
    ["Benchmark", (f) => f.benchmark],
    ["Launch", (f) => f.launch],
    ["Subscription", (f) => f.subscription],
    ["Redemption", (f) => f.redemption],
    ["Exit Load", (f) => f.exitLoad],
    ["Fund Manager", (f) => f.managers[0]?.name ?? "—"],
  ];
  return (
    <section>
      <SectionHeader title="Fund profile & terms" hint="The fine print, at a glance" />
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[12px] tabular">
          <thead className="bg-surface-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left w-44">Attribute</th>
              {funds.map((f, i) => (
                <th key={f.id} className="px-4 py-2.5 text-left">
                  <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} /><span className="truncate max-w-[150px]">{f.name.replace(/\s*Fund\s*$/, "")}</span></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(([k, fn]) => (
              <tr key={k} className="hover:bg-surface-2/60">
                <td className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{k}</td>
                {funds.map((f) => <td key={f.id} className="px-4 py-2.5">{fn(f)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{hint}</div>
    </div>
  );
}
