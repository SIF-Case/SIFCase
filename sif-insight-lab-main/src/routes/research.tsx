import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RESEARCH } from "@/lib/data";
import { Sparkline } from "@/components/ui-bits/Sparkline";
import { Download, FileText, CalendarDays, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export const Route = createFileRoute("/research")({
  head: () => ({ meta: [
    { title: "Market Outlook — SIFHub" },
    { name: "description", content: "Institutional market outlook, strategy stance, macro dashboard, sector positioning and downloadable research for SIF investors." },
  ] }),
  component: Outlook,
});

type Stance = "Overweight" | "Neutral" | "Underweight";
type Conv = "High" | "Medium" | "Low";

const HOUSE_VIEW = {
  regime: "Late-cycle expansion",
  conviction: "Medium-High",
  bias: "Risk-on with selective hedges",
  updated: "20 May 2026",
  themes: [
    "India earnings cycle troughed in Q4; small-caps look stretched",
    "Soft USD + DXY breakdown is supportive of EM flows",
    "Long-short strategies preferred over directional small-cap exposure",
    "Credit spreads compressed — debt-oriented SIFs offer limited cushion",
  ],
};

const STRATEGIES: { s: string; stance: Stance; conv: Conv; rationale: string; chg: number }[] = [
  { s: "Long-Short Equity",     stance: "Overweight",   conv: "High",   rationale: "Wide single-stock dispersion = strong alpha environment.",        chg: +1 },
  { s: "Market Neutral",        stance: "Overweight",   conv: "Medium", rationale: "Pairs spreads attractive; low correlation to drawdowns.",        chg: 0 },
  { s: "Event-Driven",          stance: "Neutral",      conv: "Medium", rationale: "Deal pipeline healthy but spreads tight after recent rally.",   chg: -1 },
  { s: "Hybrid Long-Short",     stance: "Neutral",      conv: "Medium", rationale: "Carry decent but duration exposure capped.",                     chg: 0 },
  { s: "Arbitrage",             stance: "Underweight",  conv: "High",   rationale: "Annualised spreads near multi-year lows.",                       chg: -1 },
  { s: "Credit / Hybrid Debt",  stance: "Underweight",  conv: "Medium", rationale: "Spread compression + duration risk if RBI pauses.",             chg: 0 },
];

const MACRO = [
  { k: "NIFTY 50",     v: "24,812",  d: +0.42, spark: [100,101,99,102,103,104,103,105,106,107,106,108] },
  { k: "10Y G-Sec",    v: "6.87%",   d: -0.04, spark: [100,99,99,98,98,97,97,96,96,97,97,96] },
  { k: "USD/INR",      v: "83.42",   d: -0.18, spark: [100,100,101,100,99,99,100,99,98,98,99,98] },
  { k: "India VIX",    v: "13.2",    d: +1.20, spark: [100,98,97,99,101,103,102,104,106,107,105,108] },
  { k: "Brent",        v: "$78.40",  d: -0.65, spark: [100,102,101,100,99,98,99,97,96,95,96,94] },
  { k: "Gold (₹/10g)", v: "76,820",  d: +0.31, spark: [100,101,102,101,103,104,105,104,106,107,108,109] },
];

const SECTORS = [
  { s: "Financials",     w: +35 },
  { s: "IT Services",    w: +20 },
  { s: "Industrials",    w: +15 },
  { s: "Consumer Disc.", w:  +5 },
  { s: "Healthcare",     w:   0 },
  { s: "Energy",         w: -10 },
  { s: "Utilities",      w: -15 },
  { s: "Materials",      w: -25 },
];

const CALLS = [
  { d: "20 May", t: "Trim arbitrage book by 30%", note: "Spreads no longer compensating for execution costs." },
  { d: "12 May", t: "Add to long-short equity allocations", note: "Dispersion widening across mid-cap basket — alpha environment improving." },
  { d: "02 May", t: "Hedge USD/INR exposure on offshore-flow SIFs", note: "Pivoting from a directional rupee call to defensive carry." },
  { d: "24 Apr", t: "Lower credit SIF weights", note: "AA-A spreads compressed; reward-to-risk skewed unfavourably." },
];

const EVENTS = [
  { d: "28 May", t: "Webinar: Reading an SIF factsheet", host: "SIFHub Research Desk" },
  { d: "04 Jun", t: "SEBI consultation paper deadline", host: "Regulatory" },
  { d: "11 Jun", t: "RBI MPC decision", host: "Macro" },
  { d: "18 Jun", t: "Roundtable: Long-short in Indian equities", host: "SIFHub + Edelweiss MF" },
];

function Outlook() {
  const [tf, setTf] = useState<"1M" | "3M" | "6M">("1M");

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-14">
      {/* HERO HOUSE VIEW */}
      <header className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="bg-gradient-to-br from-primary/15 via-surface to-surface border border-border rounded-xl p-7">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">House View · {HOUSE_VIEW.updated}</div>
            <div className="flex gap-1 bg-background/40 border border-border rounded-md p-0.5">
              {(["1M","3M","6M"] as const).map((t) => (
                <button key={t} onClick={() => setTf(t)} className={`px-2.5 h-6 text-[10px] font-mono uppercase tracking-widest rounded ${tf === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{t}</button>
              ))}
            </div>
          </div>
          <h1 className="mt-3 text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
            {HOUSE_VIEW.regime}.<br />
            <span className="text-muted-foreground">{HOUSE_VIEW.bias}.</span>
          </h1>
          <div className="mt-5 grid grid-cols-3 gap-4 max-w-md">
            <Pill k="Regime" v={HOUSE_VIEW.regime.split(" ")[0]} />
            <Pill k="Conviction" v={HOUSE_VIEW.conviction} />
            <Pill k="Bias" v="Risk-On" />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Key Themes</div>
          <ul className="mt-3 space-y-3">
            {HOUSE_VIEW.themes.map((t, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                <span className="text-[10px] font-mono text-primary mt-1 tabular shrink-0">0{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* MACRO DASHBOARD */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Macro Dashboard</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {MACRO.map((m) => (
            <div key={m.k} className="bg-surface p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{m.k}</div>
              <div className="mt-1.5 text-lg font-semibold tabular">{m.v}</div>
              <div className={`text-[11px] font-mono tabular ${m.d >= 0 ? "text-positive" : "text-negative"}`}>{m.d >= 0 ? "+" : ""}{m.d.toFixed(2)}%</div>
              <div className="h-6 mt-2"><Sparkline data={m.spark} stroke={m.d >= 0 ? "var(--color-positive)" : "var(--color-negative)"} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* STRATEGY STANCE */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Strategy Stance</div>
            <h2 className="mt-1 text-xl lg:text-2xl font-semibold tracking-tight">Where we'd lean across the SIF universe</h2>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{STRATEGIES.length} strategies · forward 3M</div>
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1.2fr_120px_100px_60px_2fr] gap-4 px-5 py-3 border-b border-border bg-surface-2/40 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>Strategy</span><span>Stance</span><span>Conviction</span><span className="text-center">Δ</span><span>Rationale</span>
          </div>
          <div className="divide-y divide-border">
            {STRATEGIES.map((r) => (
              <div key={r.s} className="grid grid-cols-[1.2fr_120px_100px_60px_2fr] gap-4 px-5 py-3.5 items-center hover:bg-surface-2 transition">
                <div className="text-[13px] font-medium">{r.s}</div>
                <StanceChip s={r.stance} />
                <div className="text-[12px] tabular">{r.conv}</div>
                <div className="flex justify-center">
                  {r.chg > 0 ? <ArrowUpRight className="size-4 text-positive" /> : r.chg < 0 ? <ArrowDownRight className="size-4 text-negative" /> : <Minus className="size-3.5 text-muted-foreground" />}
                </div>
                <div className="text-[12px] text-muted-foreground leading-relaxed">{r.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTOR POSITIONING */}
      <section className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Sector Positioning</div>
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="grid grid-cols-[120px_1fr_50px] gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 px-1">
              <span>Sector</span><span className="text-center">Underweight · Neutral · Overweight</span><span className="text-right">Bps</span>
            </div>
            <div className="space-y-2">
              {SECTORS.map((s) => (
                <div key={s.s} className="grid grid-cols-[120px_1fr_50px] gap-3 items-center">
                  <span className="text-[12px]">{s.s}</span>
                  <div className="relative h-5 bg-surface-2 rounded overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border-strong" />
                    {s.w >= 0 ? (
                      <div className="absolute top-0 bottom-0 left-1/2 bg-positive/60" style={{ width: `${Math.abs(s.w)}%` }} />
                    ) : (
                      <div className="absolute top-0 bottom-0 bg-negative/60" style={{ right: "50%", width: `${Math.abs(s.w)}%` }} />
                    )}
                  </div>
                  <span className={`text-right text-[11px] font-mono tabular ${s.w >= 0 ? "text-positive" : "text-negative"}`}>{s.w >= 0 ? "+" : ""}{s.w * 10}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Recent Calls</div>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border">
            {CALLS.map((c, i) => (
              <div key={i} className="px-5 py-4 flex gap-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground tabular shrink-0 w-12 pt-0.5">{c.d}</div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{c.t}</div>
                  <div className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">{c.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESEARCH REPORTS */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Research Reports</div>
            <h2 className="mt-1 text-xl lg:text-2xl font-semibold tracking-tight">Deep-dives & monthly reviews</h2>
          </div>
          <button className="text-[11px] font-mono uppercase tracking-widest text-primary">All reports →</button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {RESEARCH.map((r, i) => (
            <article key={i} className="bg-surface p-5 hover:bg-surface-2 transition flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded">{r.tag}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{r.date}</span>
              </div>
              <h3 className="text-[14px] font-semibold leading-snug flex-1">{r.title}</h3>
              <div className="flex items-center gap-3 pt-3 border-t border-border text-[11px] font-mono">
                <button className="inline-flex items-center gap-1.5 text-primary"><Download className="size-3" /> PDF</button>
                <span className="text-border-strong">·</span>
                <span className="text-muted-foreground inline-flex items-center gap-1.5"><FileText className="size-3" /> {r.read} min</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Upcoming</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {EVENTS.map((e) => (
            <div key={e.t} className="bg-surface border border-border rounded-xl p-4 hover:bg-surface-2 transition">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary">
                <CalendarDays className="size-3.5" /> {e.d}
              </div>
              <div className="mt-2 text-[13px] font-semibold leading-snug">{e.t}</div>
              <div className="mt-1 text-[11px] font-mono text-muted-foreground">{e.host}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Pill({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-background/40 border border-border rounded-md px-3 py-2">
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="text-[13px] font-semibold mt-0.5">{v}</div>
    </div>
  );
}

function StanceChip({ s }: { s: Stance }) {
  const tone = s === "Overweight" ? "text-positive border-positive/30 bg-positive/10"
    : s === "Underweight" ? "text-negative border-negative/30 bg-negative/10"
    : "text-muted-foreground border-border bg-surface-2";
  return <span className={`inline-flex w-fit text-[10px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded ${tone}`}>{s}</span>;
}
