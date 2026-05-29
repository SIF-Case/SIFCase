import { useMemo, useRef, useState } from "react";
import { Plus, X, Calendar, Sparkles, Shield, Layers, Activity, Zap, Target } from "lucide-react";
import { FUNDS } from "@/lib/data";

type Period = "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL";
type View = "Cumulative" | "Drawdown" | "Rolling 12M" | "Volatility";

export const COMPARE_PALETTE = ["#6aa6ff", "#7ad9b4", "#f0b95a", "#e98aab", "#b48aff"];

export const COMPARE_BENCHMARKS = [
  { id: "_bench_bse500", name: "BSE 500 TRI", color: "#9ca3af" },
  { id: "_bench_nifty50", name: "NIFTY 50 TRI", color: "#a3a3a3" },
  { id: "_bench_crisil", name: "CRISIL Hybrid 50+50", color: "#737373" },
];

const PHASES = [
  { start: 0.00, end: 0.18, label: "Bull", color: "var(--color-positive)" },
  { start: 0.18, end: 0.34, label: "Correction", color: "var(--color-negative)" },
  { start: 0.34, end: 0.58, label: "Recovery", color: "var(--color-gold)" },
  { start: 0.58, end: 0.82, label: "Bull", color: "var(--color-positive)" },
  { start: 0.82, end: 1.00, label: "Volatile", color: "var(--color-primary)" },
];

const EVENTS = [
  { at: 0.08, label: "SEBI SIF Framework" },
  { at: 0.26, label: "Union Budget" },
  { at: 0.42, label: "Fed Rate Cut" },
  { at: 0.60, label: "Correction" },
  { at: 0.88, label: "Elections" },
];

const PRESETS = [
  { id: "top", label: "Top Performers", icon: Sparkles, pick: () => [...FUNDS].sort((a, b) => b.returns.y1 - a.returns.y1).slice(0, 3).map((f) => f.id) },
  { id: "low-risk", label: "Lowest Risk", icon: Shield, pick: () => [...FUNDS].sort((a, b) => a.metrics.vol - b.metrics.vol).slice(0, 3).map((f) => f.id) },
  { id: "ls", label: "Long-Short", icon: Activity, pick: () => FUNDS.filter((f) => f.strategy === "Long-Short").slice(0, 3).map((f) => f.id) },
  { id: "mn", label: "Market Neutral", icon: Target, pick: () => FUNDS.filter((f) => f.strategy === "Market Neutral" || f.strategy === "Arbitrage").slice(0, 3).map((f) => f.id) },
  { id: "ma", label: "Multi-Asset", icon: Layers, pick: () => FUNDS.filter((f) => f.strategy === "Multi-Asset").slice(0, 3).map((f) => f.id) },
  { id: "consistent", label: "Most Consistent", icon: Zap, pick: () => [...FUNDS].sort((a, b) => b.metrics.sharpe - a.metrics.sharpe).slice(0, 3).map((f) => f.id) },
];

function slice(arr: number[], p: Period) {
  const map: Record<Period, number> = { "1M": 6, "3M": 12, "6M": 18, "YTD": 20, "1Y": 24, "ALL": arr.length };
  return arr.slice(-Math.min(map[p], arr.length));
}
function toCumulative(s: number[]) { const b = s[0]; return s.map((v) => ((v - b) / b) * 100); }
function toDrawdown(s: number[]) { let p = s[0]; return s.map((v) => { p = Math.max(p, v); return ((v - p) / p) * 100; }); }
function toRolling(s: number[]) { const w = Math.min(12, Math.max(2, Math.floor(s.length / 3))); return s.map((_, i) => i < w ? 0 : ((s[i] - s[i - w]) / s[i - w]) * 100); }
function toVolatility(s: number[]) {
  const w = Math.min(6, Math.max(2, Math.floor(s.length / 4)));
  const r = s.map((v, i) => i === 0 ? 0 : (v - s[i - 1]) / s[i - 1]);
  return r.map((_, i) => {
    if (i < w) return 0;
    const win = r.slice(i - w, i);
    const m = win.reduce((a, b) => a + b, 0) / win.length;
    const v = win.reduce((a, b) => a + (b - m) ** 2, 0) / win.length;
    return Math.sqrt(v) * Math.sqrt(252) * 100;
  });
}
function bench(n: number, seed = 1) {
  const out: number[] = []; let v = 100;
  for (let i = 0; i < n; i++) { v += 0.10 + Math.sin(i * 0.6 + seed) * 0.32; out.push(+v.toFixed(2)); }
  return out;
}
export function benchSpark(id: string) {
  if (id === "_bench_bse500") return bench(36, 1);
  if (id === "_bench_nifty50") return bench(36, 2);
  return bench(36, 3);
}

type Props = {
  picked: string[];
  setPicked: (ids: string[]) => void;
  benches: string[];
  setBenches: (ids: string[]) => void;
};

export function CompareLab({ picked, setPicked, benches, setBenches }: Props) {
  const [period, setPeriod] = useState<Period>("1Y");
  const [view, setView] = useState<View>("Cumulative");
  const [hoverI, setHoverI] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const selected = picked.map((id) => FUNDS.find((f) => f.id === id)!).filter(Boolean);
  const selBench = benches.map((id) => COMPARE_BENCHMARKS.find((b) => b.id === id)!).filter(Boolean);

  const series = useMemo(() => {
    const transform = (arr: number[]) => {
      const s = slice(arr, period);
      switch (view) {
        case "Cumulative": return toCumulative(s);
        case "Drawdown": return toDrawdown(s);
        case "Rolling 12M": return toRolling(s);
        case "Volatility": return toVolatility(s);
      }
    };
    const arr = selected.map((f, i) => ({
      id: f.id, name: f.name.replace(/\s*Fund\s*$/, ""),
      color: COMPARE_PALETTE[i % COMPARE_PALETTE.length], data: transform(f.spark), isBench: false,
    }));
    selBench.forEach((b) => arr.push({ id: b.id, name: b.name, color: b.color, data: transform(benchSpark(b.id)), isBench: true }));
    return arr;
  }, [selected, selBench, period, view]);

  const allVals = series.flatMap((s) => s.data);
  const max = Math.max(...allVals, view === "Drawdown" ? 0 : 1);
  const min = Math.min(...allVals, view === "Cumulative" ? -1 : 0);
  const range = max - min || 1;
  const len = series[0]?.data.length || 1;
  const W = 820, H = 280, PADL = 48, PADR = 16, PADT = 16, PADB = 28;
  const innerW = W - PADL - PADR, innerH = H - PADT - PADB;
  const xAt = (i: number) => PADL + (i / Math.max(len - 1, 1)) * innerW;
  const yAt = (v: number) => PADT + (1 - (v - min) / range) * innerH;
  const zeroY = yAt(0);
  const yTicks = Array.from({ length: 5 }, (_, i) => min + (range * i) / 4);
  const addableFunds = FUNDS.filter((f) => !picked.includes(f.id));
  const addableBench = COMPARE_BENCHMARKS.filter((b) => !benches.includes(b.id));

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current; if (!svg) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM(); if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    const x = Math.max(PADL, Math.min(W - PADR, loc.x));
    const i = Math.round(((x - PADL) / innerW) * (len - 1));
    setHoverI(Math.max(0, Math.min(len - 1, i)));
  }

  const phaseFor = hoverI === null ? null : PHASES.find((p) => (hoverI / Math.max(len - 1, 1)) >= p.start && (hoverI / Math.max(len - 1, 1)) <= p.end);
  const unit = view === "Volatility" ? "% ann." : "%";

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Performance Lab</div>
          <h3 className="mt-1 text-[15px] font-semibold">Multi-fund vs benchmark visualizer</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle active={view} options={["Cumulative", "Drawdown", "Rolling 12M", "Volatility"] as const} onChange={setView} />
          <Toggle active={period} options={["1M", "3M", "6M", "1Y", "YTD", "ALL"] as const} onChange={setPeriod} />
          <button title="Custom range" className="h-7 px-2 inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface text-[11px] text-muted-foreground hover:text-foreground">
            <Calendar className="size-3" />
          </button>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-2">
        {selected.map((f, i) => (
          <span key={f.id} className="inline-flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-surface-2 border border-border text-[11px]">
            <span className="size-2 rounded-full" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} />
            <span className="max-w-[150px] truncate">{f.name.replace(/\s*Fund\s*$/, "")}</span>
            <button onClick={() => setPicked(picked.filter((id) => id !== f.id))} className="p-0.5 rounded hover:bg-border-strong"><X className="size-3" /></button>
          </span>
        ))}
        {selBench.map((b) => (
          <span key={b.id} className="inline-flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-surface-2 border border-dashed border-border text-[11px] text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: b.color }} />
            <span className="max-w-[150px] truncate">{b.name}</span>
            <span className="text-[9px] font-mono uppercase tracking-widest">Bench</span>
            <button onClick={() => setBenches(benches.filter((id) => id !== b.id))} className="p-0.5 rounded hover:bg-border-strong"><X className="size-3" /></button>
          </span>
        ))}
        <div className="relative">
          <button onClick={() => setAddOpen((o) => !o)} className="h-7 px-3 inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong bg-surface text-[11px] text-muted-foreground hover:text-foreground">
            <Plus className="size-3" /> Add fund or benchmark
          </button>
          {addOpen && (
            <div className="absolute z-30 top-full mt-2 left-0 w-72 bg-surface border border-border-strong rounded-xl shadow-2xl shadow-black/50 p-2 max-h-[280px] overflow-auto">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Funds</div>
              {addableFunds.length === 0 && <div className="px-2 py-1 text-[11px] text-muted-foreground">All added</div>}
              {addableFunds.map((f) => (
                <button key={f.id} onClick={() => { if (picked.length < 5) setPicked([...picked, f.id]); setAddOpen(false); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-2 text-[12px] truncate">{f.name}</button>
              ))}
              <div className="px-2 py-1 mt-1 border-t border-border text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Benchmarks</div>
              {addableBench.length === 0 && <div className="px-2 py-1 text-[11px] text-muted-foreground">All added</div>}
              {addableBench.map((b) => (
                <button key={b.id} onClick={() => { setBenches([...benches, b.id]); setAddOpen(false); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-2 text-[12px] truncate">{b.name}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-3">
        <div className="relative h-5 rounded-md overflow-hidden border border-border flex">
          {PHASES.map((p, i) => (
            <div key={i} className="h-full flex items-center justify-center text-[9px] font-mono uppercase tracking-widest"
              style={{ width: `${(p.end - p.start) * 100}%`, background: `color-mix(in oklab, ${p.color} 12%, transparent)`, color: `color-mix(in oklab, ${p.color} 80%, var(--color-foreground))` }}>
              {p.label}
            </div>
          ))}
        </div>
      </div>

      <div className="px-2 py-3 flex-1 relative">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none" onMouseMove={onMove} onMouseLeave={() => setHoverI(null)}>
          {PHASES.map((p, i) => (
            <rect key={`phase-${i}`} x={PADL + p.start * innerW} y={PADT} width={(p.end - p.start) * innerW} height={innerH} fill={`color-mix(in oklab, ${p.color} 5%, transparent)`} />
          ))}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={PADL} x2={W - PADR} y1={yAt(t)} y2={yAt(t)} stroke="var(--color-border)" strokeDasharray="2 4" />
              <text x={PADL - 6} y={yAt(t) + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}>
                {t >= 0 ? "+" : ""}{t.toFixed(1)}{unit === "%" ? "%" : ""}
              </text>
            </g>
          ))}
          {view !== "Volatility" && (<line x1={PADL} x2={W - PADR} y1={zeroY} y2={zeroY} stroke="var(--color-border-strong)" />)}
          {EVENTS.map((e, i) => {
            const x = PADL + e.at * innerW;
            return (
              <g key={`ev-${i}`}>
                <line x1={x} x2={x} y1={PADT} y2={H - PADB} stroke="var(--color-gold)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.45" />
                <circle cx={x} cy={PADT} r="2.5" fill="var(--color-gold)" />
              </g>
            );
          })}
          {series.map((s) => {
            const path = s.data.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`).join(" ");
            return (
              <g key={s.id}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={s.isBench ? 1.2 : 1.8} strokeDasharray={s.isBench ? "4 4" : undefined} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={xAt(len - 1)} cy={yAt(s.data[s.data.length - 1])} r="3" fill={s.color} />
              </g>
            );
          })}
          {hoverI !== null && (
            <g pointerEvents="none">
              <line x1={xAt(hoverI)} x2={xAt(hoverI)} y1={PADT} y2={H - PADB} stroke="var(--color-foreground)" strokeWidth="0.8" opacity="0.4" />
              {series.map((s) => (
                <circle key={s.id} cx={xAt(hoverI)} cy={yAt(s.data[hoverI])} r="3.5" fill={s.color} stroke="var(--color-background)" strokeWidth="1.2" />
              ))}
            </g>
          )}
        </svg>
        {hoverI !== null && (
          <div className="pointer-events-none absolute top-3 bg-surface border border-border-strong rounded-lg shadow-2xl shadow-black/50 p-2.5 text-[11px] min-w-[180px]"
            style={{ left: `${Math.min(80, (hoverI / Math.max(len - 1, 1)) * 90 + 5)}%` }}>
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
              Point {hoverI + 1} / {len} · {phaseFor?.label}
            </div>
            <div className="space-y-1">
              {series.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="size-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="truncate flex-1">{s.name}</span>
                  <span className="tabular font-mono">{s.data[hoverI] >= 0 ? "+" : ""}{s.data[hoverI].toFixed(2)}{unit === "%" ? "%" : "%a"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {view === "Cumulative" && "% return indexed to start of period"}
        {view === "Drawdown" && "Peak-to-trough decline"}
        {view === "Rolling 12M" && "12-period rolling return"}
        {view === "Volatility" && "Annualised volatility (rolling window)"}
      </div>

      <div className="px-5 py-3 border-t border-border bg-surface-2/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Quick presets</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <button key={p.id} onClick={() => { const next = p.pick(); if (next.length) setPicked(next); }}
                className="h-7 px-2.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface hover:border-primary/40 text-[11px]">
                <Icon className="size-3 text-primary" /> {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Toggle<T extends string>({ active, options, onChange }: { active: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex items-center bg-surface-2 border border-border rounded-full p-0.5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`h-6 px-2.5 text-[10px] font-mono uppercase tracking-widest rounded-full transition-colors ${active === o ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
