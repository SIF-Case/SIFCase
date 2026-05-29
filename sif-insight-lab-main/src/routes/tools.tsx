import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, TrendingUp, Activity, Percent, Target, PieChart, Repeat, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/tools")({
  head: () => ({ meta: [
    { title: "Tools & Calculators — SIFHub" },
    { name: "description", content: "SIP, lumpsum, CAGR, drawdown recovery, rolling return, goal planner, tax and allocation calculators built for SIF investors." },
  ] }),
  component: Tools,
});

type ToolId = "sip" | "lumpsum" | "cagr" | "drawdown" | "rolling" | "goal" | "tax" | "alloc";

const TOOLS: { id: ToolId; t: string; d: string; icon: typeof Calculator }[] = [
  { id: "sip",      t: "SIP Projection",      d: "Corpus from monthly investments.",     icon: Calculator },
  { id: "lumpsum",  t: "Lumpsum Growth",      d: "Future value of a one-time amount.",   icon: TrendingUp },
  { id: "cagr",     t: "CAGR Calculator",     d: "Compounded annual growth rate.",       icon: Percent },
  { id: "drawdown", t: "Drawdown Recovery",   d: "How long to recover from a fall.",     icon: ShieldAlert },
  { id: "rolling",  t: "Rolling Return",      d: "Average rolling-window return.",       icon: Repeat },
  { id: "goal",     t: "Goal Planner",        d: "Monthly SIP to hit a corpus target.",  icon: Target },
  { id: "tax",      t: "Tax Calculator",      d: "LTCG / STCG by SIF category.",         icon: Activity },
  { id: "alloc",    t: "Allocation Simulator",d: "Model returns across asset mixes.",    icon: PieChart },
];

function Tools() {
  const [tool, setTool] = useState<ToolId>("sip");
  const active = TOOLS.find((t) => t.id === tool)!;

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-8">
      <header className="space-y-3 max-w-2xl">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Tools</div>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Calculators for serious investors</h1>
        <p className="text-[14px] text-muted-foreground">Fast, precise, transparent — every calculation runs in your browser. Built around the realities of SIF investing.</p>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-surface border border-border rounded-xl p-2 h-fit lg:sticky lg:top-4">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md flex items-start gap-3 transition ${isActive ? "bg-primary/10 text-foreground" : "hover:bg-surface-2 text-muted-foreground"}`}
              >
                <Icon className={`size-4 mt-0.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                <div className="min-w-0">
                  <div className={`text-[13px] font-medium ${isActive ? "text-foreground" : ""}`}>{t.t}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{t.d}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Active calculator */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">{active.t}</div>
          {tool === "sip" && <SIP />}
          {tool === "lumpsum" && <Lumpsum />}
          {tool === "cagr" && <CAGR />}
          {tool === "drawdown" && <Drawdown />}
          {tool === "rolling" && <Rolling />}
          {tool === "goal" && <Goal />}
          {tool === "tax" && <Tax />}
          {tool === "alloc" && <Alloc />}
        </div>
      </div>
    </div>
  );
}

// ---------- Shared UI ----------
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-surface border border-border rounded-xl p-6">{children}</div>;
}
function Field({ label, value, set, min, max, step, suffix }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step: number; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1.5">
        <label className="text-muted-foreground">{label}</label>
        <div className="flex items-center gap-1">
          <input type="number" value={value} onChange={(e) => set(+e.target.value)} className="bg-surface-2 border border-border rounded px-2 h-7 w-28 text-right tabular text-[13px]" />
          {suffix && <span className="text-[11px] text-muted-foreground font-mono">{suffix}</span>}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--color-primary)]" />
    </div>
  );
}
function KPI({ k, v, tone, big }: { k: string; v: string; tone?: "positive" | "negative"; big?: boolean }) {
  const toneCls = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "";
  return (
    <div className={`flex items-center justify-between ${big ? "pt-3 mt-1 border-t border-border" : ""}`}>
      <span className="text-[11px] text-muted-foreground uppercase font-mono tracking-widest">{k}</span>
      <span className={`${big ? "text-2xl font-semibold" : "text-[14px] font-medium"} tabular ${toneCls}`}>{v}</span>
    </div>
  );
}
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function Chart({ series, baseline }: { series: number[]; baseline?: number[] }) {
  const all = [...series, ...(baseline ?? [0])];
  const max = Math.max(...all, 1);
  const w = 600, h = 180;
  const path = (arr: number[]) => arr.map((v, i) => `${(i / (arr.length - 1)) * w},${h - (v / max) * (h - 10) - 5}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {baseline && <polyline fill="none" stroke="var(--color-muted-foreground)" strokeOpacity="0.5" strokeDasharray="3 3" strokeWidth="1.5" points={path(baseline)} />}
      <polyline fill="url(#g1)" stroke="none" points={`0,${h} ${path(series)} ${w},${h}`} />
      <polyline fill="none" stroke="var(--color-primary)" strokeWidth="2" points={path(series)} />
    </svg>
  );
}

// ---------- SIP ----------
function SIP() {
  const [monthly, setMonthly] = useState(25000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(14);
  const n = years * 12, i = rate / 12 / 100;
  const fv = monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  const invested = monthly * n;
  const series = Array.from({ length: years + 1 }, (_, y) => {
    const m = y * 12; if (m === 0) return 0;
    return monthly * ((Math.pow(1 + i, m) - 1) / i) * (1 + i);
  });
  const baseline = Array.from({ length: years + 1 }, (_, y) => monthly * y * 12);
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
      <Card>
        <div className="space-y-5">
          <Field label="Monthly SIP" value={monthly} set={setMonthly} min={500} max={500000} step={500} suffix="₹" />
          <Field label="Period" value={years} set={setYears} min={1} max={30} step={1} suffix="yrs" />
          <Field label="Expected return" value={rate} set={setRate} min={1} max={30} step={0.5} suffix="% p.a." />
        </div>
      </Card>
      <Card>
        <Chart series={series} baseline={baseline} />
        <div className="space-y-3 mt-4">
          <KPI k="Total invested" v={inr(invested)} />
          <KPI k="Estimated gain" v={inr(fv - invested)} tone="positive" />
          <KPI k="Projected corpus" v={inr(fv)} big />
        </div>
      </Card>
    </div>
  );
}

// ---------- Lumpsum ----------
function Lumpsum() {
  const [amt, setAmt] = useState(1000000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const fv = amt * Math.pow(1 + rate / 100, years);
  const series = Array.from({ length: years + 1 }, (_, y) => amt * Math.pow(1 + rate / 100, y));
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
      <Card>
        <div className="space-y-5">
          <Field label="Investment" value={amt} set={setAmt} min={10000} max={50000000} step={10000} suffix="₹" />
          <Field label="Period" value={years} set={setYears} min={1} max={30} step={1} suffix="yrs" />
          <Field label="Expected return" value={rate} set={setRate} min={1} max={30} step={0.5} suffix="% p.a." />
        </div>
      </Card>
      <Card>
        <Chart series={series} />
        <div className="space-y-3 mt-4">
          <KPI k="Invested" v={inr(amt)} />
          <KPI k="Estimated gain" v={inr(fv - amt)} tone="positive" />
          <KPI k="Future value" v={inr(fv)} big />
        </div>
      </Card>
    </div>
  );
}

// ---------- CAGR ----------
function CAGR() {
  const [start, setStart] = useState(100000);
  const [end, setEnd] = useState(185000);
  const [years, setYears] = useState(5);
  const cagr = (Math.pow(end / start, 1 / years) - 1) * 100;
  const series = Array.from({ length: years + 1 }, (_, y) => start * Math.pow(end / start, y / years));
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
      <Card>
        <div className="space-y-5">
          <Field label="Initial value" value={start} set={setStart} min={1000} max={50000000} step={1000} suffix="₹" />
          <Field label="Final value" value={end} set={setEnd} min={1000} max={500000000} step={1000} suffix="₹" />
          <Field label="Holding period" value={years} set={setYears} min={1} max={40} step={1} suffix="yrs" />
        </div>
      </Card>
      <Card>
        <Chart series={series} />
        <div className="space-y-3 mt-4">
          <KPI k="Absolute return" v={`${(((end - start) / start) * 100).toFixed(2)}%`} />
          <KPI k="Profit" v={inr(end - start)} tone={end >= start ? "positive" : "negative"} />
          <KPI k="CAGR" v={`${cagr.toFixed(2)}%`} big />
        </div>
      </Card>
    </div>
  );
}

// ---------- Drawdown Recovery ----------
function Drawdown() {
  const [peak, setPeak] = useState(100);
  const [dd, setDd] = useState(15);
  const [rate, setRate] = useState(12);
  const trough = peak * (1 - dd / 100);
  const months = Math.log(peak / trough) / Math.log(1 + rate / 12 / 100);
  const series = Array.from({ length: Math.max(12, Math.ceil(months) + 6) }, (_, m) => trough * Math.pow(1 + rate / 12 / 100, m));
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
      <Card>
        <div className="space-y-5">
          <Field label="Peak NAV" value={peak} set={setPeak} min={1} max={1000} step={1} />
          <Field label="Drawdown" value={dd} set={setDd} min={1} max={60} step={0.5} suffix="%" />
          <Field label="Expected recovery rate" value={rate} set={setRate} min={1} max={25} step={0.5} suffix="% p.a." />
        </div>
      </Card>
      <Card>
        <Chart series={series} />
        <div className="space-y-3 mt-4">
          <KPI k="Trough NAV" v={trough.toFixed(2)} tone="negative" />
          <KPI k="Recovery (months)" v={months.toFixed(1)} />
          <KPI k="Recovery (years)" v={(months / 12).toFixed(2)} big />
        </div>
      </Card>
    </div>
  );
}

// ---------- Rolling Return ----------
function Rolling() {
  const [cagr, setCagr] = useState(14);
  const [vol, setVol] = useState(12);
  const [window, setWindow] = useState(3);
  const series = useMemo(() => {
    const arr: number[] = []; let v = 100;
    for (let i = 0; i < 60; i++) { v *= 1 + (cagr / 100 + Math.sin(i * 0.7) * vol / 200) / 12; arr.push(v); }
    return arr;
  }, [cagr, vol]);
  const rolls: number[] = [];
  const w = window * 12;
  for (let i = w; i < series.length; i++) {
    rolls.push((Math.pow(series[i] / series[i - w], 1 / window) - 1) * 100);
  }
  const avg = rolls.reduce((a, b) => a + b, 0) / Math.max(rolls.length, 1);
  const best = Math.max(...rolls), worst = Math.min(...rolls);
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
      <Card>
        <div className="space-y-5">
          <Field label="Expected CAGR" value={cagr} set={setCagr} min={1} max={30} step={0.5} suffix="%" />
          <Field label="Volatility" value={vol} set={setVol} min={1} max={40} step={0.5} suffix="%" />
          <Field label="Rolling window" value={window} set={setWindow} min={1} max={5} step={1} suffix="yrs" />
        </div>
      </Card>
      <Card>
        <Chart series={rolls.map((r) => r + 20)} />
        <div className="space-y-3 mt-4">
          <KPI k="Average rolling" v={`${avg.toFixed(2)}%`} />
          <KPI k="Best window" v={`${best.toFixed(2)}%`} tone="positive" />
          <KPI k="Worst window" v={`${worst.toFixed(2)}%`} tone={worst >= 0 ? "positive" : "negative"} />
        </div>
      </Card>
    </div>
  );
}

// ---------- Goal Planner ----------
function Goal() {
  const [target, setTarget] = useState(10000000);
  const [years, setYears] = useState(15);
  const [rate, setRate] = useState(14);
  const n = years * 12, i = rate / 12 / 100;
  const monthly = (target * i) / ((Math.pow(1 + i, n) - 1) * (1 + i));
  const series = Array.from({ length: years + 1 }, (_, y) => {
    const m = y * 12; if (m === 0) return 0;
    return monthly * ((Math.pow(1 + i, m) - 1) / i) * (1 + i);
  });
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
      <Card>
        <div className="space-y-5">
          <Field label="Target corpus" value={target} set={setTarget} min={100000} max={500000000} step={100000} suffix="₹" />
          <Field label="Time horizon" value={years} set={setYears} min={1} max={40} step={1} suffix="yrs" />
          <Field label="Expected return" value={rate} set={setRate} min={1} max={25} step={0.5} suffix="% p.a." />
        </div>
      </Card>
      <Card>
        <Chart series={series} />
        <div className="space-y-3 mt-4">
          <KPI k="Total to invest" v={inr(monthly * n)} />
          <KPI k="Wealth created" v={inr(target - monthly * n)} tone="positive" />
          <KPI k="Required monthly SIP" v={inr(monthly)} big />
        </div>
      </Card>
    </div>
  );
}

// ---------- Tax ----------
function Tax() {
  const [gain, setGain] = useState(500000);
  const [holding, setHolding] = useState(18);
  const [cat, setCat] = useState<"equity" | "debt" | "other">("equity");
  const slab = 30;
  let rate = 0, label = "";
  if (cat === "equity") { rate = holding > 12 ? 12.5 : 20; label = holding > 12 ? "LTCG (equity)" : "STCG (equity)"; }
  else if (cat === "debt") { rate = slab; label = "Slab (debt-oriented)"; }
  else { rate = holding > 24 ? 12.5 : slab; label = holding > 24 ? "LTCG (other, > 24M)" : "Slab (other)"; }
  const tax = (gain * rate) / 100;
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
      <Card>
        <div className="space-y-5">
          <div>
            <div className="text-[12px] text-muted-foreground mb-2">SIF category</div>
            <div className="flex gap-1 bg-surface-2 border border-border rounded-md p-0.5">
              {(["equity", "debt", "other"] as const).map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`flex-1 h-8 text-[12px] font-medium capitalize rounded ${cat === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{c}-oriented</button>
              ))}
            </div>
          </div>
          <Field label="Realised gain" value={gain} set={setGain} min={10000} max={50000000} step={10000} suffix="₹" />
          <Field label="Holding period" value={holding} set={setHolding} min={1} max={120} step={1} suffix="months" />
        </div>
      </Card>
      <Card>
        <div className="space-y-3">
          <KPI k="Treatment" v={label} />
          <KPI k="Effective tax rate" v={`${rate.toFixed(1)}%`} />
          <KPI k="Tax payable" v={inr(tax)} tone="negative" />
          <KPI k="Net after tax" v={inr(gain - tax)} big />
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
          Indicative only. Surcharge and cess not included. Confirm with a qualified tax advisor before filing.
        </p>
      </Card>
    </div>
  );
}

// ---------- Allocation Simulator ----------
function Alloc() {
  const [eq, setEq] = useState(50);
  const [sif, setSif] = useState(30);
  const [debt, setDebt] = useState(15);
  const gold = Math.max(0, 100 - eq - sif - debt);
  const ret = (eq * 13 + sif * 15 + debt * 7 + gold * 9) / 100;
  const vol = (eq * 18 + sif * 12 + debt * 4 + gold * 14) / 100;
  const sharpe = (ret - 6.5) / vol;
  const segs = [
    { k: "Equity", v: eq, c: "var(--color-primary)" },
    { k: "SIFs", v: sif, c: "var(--color-positive)" },
    { k: "Debt", v: debt, c: "var(--color-gold)" },
    { k: "Gold", v: gold, c: "var(--color-muted-foreground)" },
  ];
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-4">
      <Card>
        <div className="space-y-5">
          <Field label="Equity" value={eq} set={setEq} min={0} max={100} step={1} suffix="%" />
          <Field label="SIFs" value={sif} set={setSif} min={0} max={100} step={1} suffix="%" />
          <Field label="Debt" value={debt} set={setDebt} min={0} max={100} step={1} suffix="%" />
          <div className="text-[12px] text-muted-foreground">Gold: <span className="text-foreground font-mono tabular">{gold}%</span></div>
        </div>
      </Card>
      <Card>
        <div className="h-6 flex rounded overflow-hidden">
          {segs.map((s) => s.v > 0 && (
            <div key={s.k} title={`${s.k} ${s.v}%`} style={{ width: `${s.v}%`, background: s.c }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono">
          {segs.map((s) => (
            <div key={s.k} className="flex items-center gap-2">
              <span className="size-2 rounded-sm" style={{ background: s.c }} />
              <span className="text-muted-foreground">{s.k}</span>
              <span className="ml-auto tabular">{s.v}%</span>
            </div>
          ))}
        </div>
        <div className="space-y-3 mt-5 pt-4 border-t border-border">
          <KPI k="Expected return" v={`${ret.toFixed(2)}%`} tone="positive" />
          <KPI k="Expected volatility" v={`${vol.toFixed(2)}%`} />
          <KPI k="Sharpe (rf 6.5%)" v={sharpe.toFixed(2)} big />
        </div>
      </Card>
    </div>
  );
}
