import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { findFund, GLOSSARY } from "@/lib/data";
import { Sparkline } from "@/components/ui-bits/Sparkline";
import { RiskMeter } from "@/components/ui-bits/RiskMeter";
import { ArrowUpRight, Download, Plus, Bookmark, Share2, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/fund/$id")({
  loader: ({ params }) => {
    const fund = findFund(params.id);
    if (!fund) throw notFound();
    return { fund };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.fund.name} — SIFHub Tear Sheet` },
      { name: "description", content: `${loaderData?.fund.name}: AUM ₹${loaderData?.fund.aum} Cr · ${loaderData?.fund.category}. Full institutional analysis with portfolio, strategy, risk and taxation breakdown.` },
    ],
  }),
  component: FundPage,
  notFoundComponent: () => (
    <div className="max-w-[1440px] mx-auto px-6 py-24 text-center">
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">No such fund</div>
      <h1 className="mt-3 text-3xl font-semibold">Fund not in our coverage</h1>
      <Link to="/explore" className="mt-6 inline-flex text-[13px] text-primary">← Back to explore</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="max-w-[1440px] mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Couldn't load this fund</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

const TABS = ["Overview", "Performance", "Portfolio", "Strategy", "Taxation", "Team", "Compare"] as const;

function FundPage() {
  const { fund } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-12">
      {/* HEADER */}
      <header className="space-y-6 border-b border-border pb-10">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest">
              <Link to="/explore" className="text-muted-foreground hover:text-foreground">Explore</Link>
              <span className="text-border-strong">/</span>
              <span className="text-primary">{fund.category}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">{fund.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
              <span>{fund.amc}</span>
              <span className="text-border-strong">·</span>
              <span>Launched {fund.launch}</span>
              <span className="text-border-strong">·</span>
              <span>Benchmark: <Term term="Benchmark" label={fund.benchmark} /></span>
              <span className="text-border-strong">·</span>
              <span>Subscription: {fund.subscription}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold">Invest now <ArrowUpRight className="size-3.5" /></button>
            <Link to="/compare" className="h-9 px-4 inline-flex items-center gap-2 rounded-md border border-border-strong text-[12px] font-medium hover:bg-surface"><Plus className="size-3.5" /> Compare</Link>
            <button className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border-strong text-[12px] hover:bg-surface"><Download className="size-3.5" /></button>
            <button className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border-strong text-[12px] hover:bg-surface"><Bookmark className="size-3.5" /></button>
            <button className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border-strong text-[12px] hover:bg-surface"><Share2 className="size-3.5" /></button>
          </div>
        </div>

        {/* Key metric tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border border-border rounded-xl overflow-hidden">
          <Tile label="NAV (Regular - Growth)" value={`₹${fund.nav.toFixed(3)}`} sub="12 May 2026" />
          <Tile label="Since Inception" value={`+${fund.returns.si}%`} sub="Absolute" tone="positive" />
          <Tile label="Expense Ratio" value={`${fund.expense}%`} sub="Regular plan" />
          <Tile label={<Term term="Sharpe" label="Sharpe Ratio" />} value={fund.metrics.sharpe.toFixed(2)} sub="Trailing 1Y" tone="positive" />
          <Tile label="Risk Band" value={`${fund.risk} / 5`} sub={fund.risk === 5 ? "Highest risk" : "Moderate-high"} tone={fund.risk >= 4 ? "negative" : undefined} />
        </div>
      </header>

      {/* TABS */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 h-10 text-[13px] font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {(tab === "Overview" || tab === "Performance") && <PerformancePanel fund={fund} />}

      {/* PORTFOLIO */}
      {(tab === "Overview" || tab === "Portfolio") && <PortfolioPanel fund={fund} />}
      {(tab === "Overview" || tab === "Portfolio") && <HoldingsPanel fund={fund} />}

      {/* STRATEGY */}
      {(tab === "Overview" || tab === "Strategy") && <StrategyPanel fund={fund} />}
      {(tab === "Overview" || tab === "Strategy") && <PositivesNegatives fund={fund} />}

      {/* TAXATION */}
      {(tab === "Overview" || tab === "Taxation") && <TaxationPanel />}

      {/* TEAM */}
      {(tab === "Overview" || tab === "Team") && <TeamPanel fund={fund} />}

      {/* COMPARE PROMPT */}
      {tab === "Compare" && (
        <div className="border border-border rounded-xl p-12 text-center bg-surface">
          <h3 className="text-2xl font-semibold">Open this fund in the Compare engine</h3>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">Stack against up to 3 other SIFs across returns, risk, holdings overlap and strategy.</p>
          <Link to="/compare" className="mt-6 inline-flex h-10 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold items-center">Go to Compare →</Link>
        </div>
      )}

      {(tab === "Overview") && (
        <>
          <SchemeDetails fund={fund} />
          <RiskClassification fund={fund} />
          <FAQ />
        </>
      )}
    </div>
  );
}

/* ---------- sub-components ---------- */

function Tile({ label, value, sub, tone }: { label: React.ReactNode; value: string; sub: string; tone?: "positive" | "negative" }) {
  return (
    <div className="bg-surface p-5">
      <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular tracking-tight ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function Term({ term, label }: { term: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="underline decoration-dotted decoration-border-strong underline-offset-4 hover:text-foreground inline-flex items-center gap-1"
      >
        {label}
        <HelpCircle className="size-3 opacity-50" />
      </button>
      {open && (
        <span className="absolute left-0 top-full mt-2 z-30 w-64 p-3 rounded-md bg-popover border border-border shadow-xl text-[12px] text-popover-foreground leading-relaxed">
          <span className="font-mono uppercase tracking-widest text-[10px] text-primary block mb-1">{term}</span>
          {GLOSSARY[term] ?? "Glossary entry coming soon."}
        </span>
      )}
    </span>
  );
}

function PerformancePanel({ fund }: { fund: ReturnType<typeof findFund> & {} }) {
  const rows: Array<[string, number]> = [
    ["YTD", fund.returns.ytd], ["1M", fund.returns.m1], ["3M", fund.returns.m3], ["6M", fund.returns.m6], ["1Y", fund.returns.y1], ["Since Launch", fund.returns.si],
  ];
  return (
    <section className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold">Performance · live NAV</h3>
          <div className="flex gap-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {["1M", "3M", "6M", "1Y", "All", "Custom"].map((t, i) => (
              <button key={t} className={`px-2 py-1 rounded ${i === 3 ? "bg-primary/15 text-primary" : "hover:text-foreground"}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="h-56"><Sparkline data={fund.spark} width={800} height={220} fill="var(--color-primary)" /></div>
        <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {rows.map(([k, v]) => (
            <div key={k} className="bg-surface p-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{k}</div>
              <div className={`mt-1 text-[14px] tabular font-medium ${v >= 0 ? "text-positive" : "text-negative"}`}>
                {v > 0 ? "+" : ""}{v}%
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-[13px] font-semibold">Risk-adjusted metrics</h3>
        {[
          ["Sharpe Ratio", fund.metrics.sharpe.toFixed(2), "positive"],
          ["Volatility", `${fund.metrics.vol}%`, undefined],
          ["Max Drawdown", `${fund.metrics.drawdown}%`, "negative"],
          ["Alpha", `+${fund.metrics.alpha}%`, "positive"],
          ["Beta", fund.metrics.beta.toFixed(2), undefined],
          ...(fund.metrics.ytm ? [["YTM", `${fund.metrics.ytm}%`, undefined]] : []) as Array<[string, string, undefined]>,
          ...(fund.metrics.avgMaturity ? [["Avg Maturity", `${fund.metrics.avgMaturity} yr`, undefined]] : []) as Array<[string, string, undefined]>,
        ].map(([k, v, tone]) => (
          <div key={k as string} className="flex items-center justify-between text-[13px] border-b border-border pb-3 last:border-0">
            <span className="text-muted-foreground">{k}</span>
            <span className={`tabular font-medium ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""}`}>{v as string}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PortfolioPanel({ fund }: { fund: ReturnType<typeof findFund> & {} }) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Portfolio</div>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">Strategy-wise allocation · 31 March 2026</h3>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
          Derivatives Notional: <span className="text-foreground">+{fund.derivativesNotional ?? 0}%</span>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex h-10 w-full rounded-md overflow-hidden ring-1 ring-border">
          {fund.allocation.filter(a => a.pct > 0).map((a, i) => {
            const colors = ["var(--color-primary)", "var(--color-positive)", "var(--color-gold)", "var(--color-chart-5)", "var(--color-secondary)", "var(--color-negative)"];
            return (
              <div key={a.label} style={{ width: `${a.pct}%`, backgroundColor: colors[i % colors.length] }} title={`${a.label}: ${a.pct}%`} />
            );
          })}
        </div>

        <table className="w-full mt-6 text-[13px]">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
              <th className="text-left py-3 font-medium">Category</th>
              <th className="text-right py-3 font-medium w-28">% AUM</th>
              <th className="text-left py-3 font-medium pl-6">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border tabular">
            {fund.allocation.map((a) => (
              <tr key={a.label}>
                <td className="py-4 font-medium">{a.label}</td>
                <td className={`py-4 text-right font-medium ${a.pct === 0 ? "text-muted-foreground" : ""}`}>{a.pct.toFixed(2)}%</td>
                <td className="py-4 pl-6 text-muted-foreground leading-relaxed">{a.note ?? "—"}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-border-strong">
              <td className="py-4 font-semibold">Total</td>
              <td className="py-4 text-right font-semibold">100.00%</td>
              <td className="py-4 pl-6" />
            </tr>
          </tbody>
        </table>
      </div>

      {fund.metrics.ytm && (
        <div className="grid sm:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
          <div className="bg-surface p-6">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Yield to Maturity (YTM)</div>
            <div className="mt-2 text-2xl font-semibold tabular">{fund.metrics.ytm}%</div>
          </div>
          <div className="bg-surface p-6">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Average Maturity</div>
            <div className="mt-2 text-2xl font-semibold tabular">{fund.metrics.avgMaturity} yr</div>
          </div>
        </div>
      )}
    </section>
  );
}

function HoldingsPanel({ fund }: { fund: ReturnType<typeof findFund> & {} }) {
  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Holdings</div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">Top 10 equity holdings</h3>
      </div>
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
              <th className="text-left py-3 px-5 font-medium w-10">#</th>
              <th className="text-left py-3 font-medium">Issuer</th>
              <th className="text-left py-3 font-medium">Sector</th>
              <th className="text-right py-3 px-5 font-medium w-32">Weight</th>
              <th className="text-right py-3 px-5 font-medium w-28">Δ MoM</th>
              <th className="text-left py-3 px-5 font-medium w-40">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border tabular">
            {fund.topHoldings.map((h, i) => (
              <tr key={h.issuer} className="hover:bg-surface-2 transition-colors">
                <td className="py-3.5 px-5 text-muted-foreground">{i + 1}</td>
                <td className="py-3.5 font-medium">{h.issuer}</td>
                <td className="py-3.5 text-muted-foreground">{h.sector}</td>
                <td className="py-3.5 px-5 text-right font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(h.weight / 5) * 100}%` }} />
                    </div>
                    {h.weight.toFixed(2)}%
                  </div>
                </td>
                <td className={`py-3.5 px-5 text-right text-[12px] ${(h.delta ?? 0) > 0 ? "text-positive" : (h.delta ?? 0) < 0 ? "text-negative" : "text-muted-foreground"}`}>
                  {h.delta != null ? (h.delta > 0 ? "+" : "") + h.delta.toFixed(2) + "%" : "—"}
                </td>
                <td className="py-3.5 px-5 text-[12px] text-muted-foreground">{h.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StrategyPanel({ fund }: { fund: ReturnType<typeof findFund> & {} }) {
  const items = [
    { label: "Bull Market", color: "var(--color-positive)", bg: "var(--color-positive)", list: fund.strategy_regimes.bull },
    { label: "Flat Market", color: "var(--color-gold)", bg: "var(--color-gold)", list: fund.strategy_regimes.flat },
    { label: "Bear Market", color: "var(--color-negative)", bg: "var(--color-negative)", list: fund.strategy_regimes.bear },
  ];
  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Strategy Intelligence</div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">How this fund behaves across market regimes</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {items.map((it) => (
          <div key={it.label} className="bg-surface p-6">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: it.bg }} />
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: it.color }}>{it.label}</span>
            </div>
            <ul className="mt-5 space-y-3">
              {it.list.map((l, i) => (
                <li key={i} className="text-[13px] text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-foreground mt-2 size-1 rounded-full bg-foreground/40 shrink-0" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function PositivesNegatives({ fund }: { fund: ReturnType<typeof findFund> & {} }) {
  return (
    <section className="grid md:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
      <div className="bg-surface p-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-positive">Positives</div>
        <ul className="mt-4 space-y-3">
          {fund.positives.map((p, i) => (
            <li key={i} className="text-[13px] leading-relaxed flex gap-2.5">
              <span className="text-positive mt-1 shrink-0">+</span><span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-surface p-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-negative">Negatives</div>
        <ul className="mt-4 space-y-3">
          {fund.negatives.map((p, i) => (
            <li key={i} className="text-[13px] leading-relaxed flex gap-2.5">
              <span className="text-negative mt-1 shrink-0">−</span><span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TaxationPanel() {
  const rows = [
    { t: "Equity-Oriented", d: "LTCG 12.5% (after 12 months), STCG as applicable under equity taxation." },
    { t: "Debt-Oriented", d: "Taxed at applicable slab rate." },
    { t: "Others / Non-Equity", d: "LTCG 12.5% (after 24 months)." },
  ];
  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Taxation</div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">How returns are taxed</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {rows.map((r) => (
          <div key={r.t} className="bg-surface p-6">
            <div className="text-[13px] font-semibold">{r.t}</div>
            <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{r.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TeamPanel({ fund }: { fund: ReturnType<typeof findFund> & {} }) {
  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Fund Management</div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">Who runs this fund</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {fund.managers.map((m) => (
          <div key={m.name} className="bg-surface p-6 flex gap-5">
            <div className="size-16 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-2xl font-mono text-primary shrink-0">
              {m.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{m.name}</div>
              <div className="text-[12px] text-primary font-mono uppercase tracking-widest mt-0.5">{m.role}</div>
              <div className="mt-3 text-[12px] text-muted-foreground leading-relaxed">{m.experience} experience. {m.prev}</div>
              <div className="mt-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Managing since {m.since}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SchemeDetails({ fund }: { fund: ReturnType<typeof findFund> & {} }) {
  const rows: [string, string][] = [
    ["Investment Objective", fund.objective],
    ["Benchmark", fund.benchmark],
    ["Category", fund.category],
    ["Type", "Open-Ended Fund"],
    ["Subscription", fund.subscription],
    ["Redemption", fund.redemption],
    ["Exit Load", fund.exitLoad],
  ];
  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Scheme Details</div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">The fine print</h3>
      </div>
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[200px_1fr] gap-6 px-6 py-4">
              <dt className="text-[12px] font-mono uppercase tracking-widest text-muted-foreground">{k}</dt>
              <dd className="text-[13px] leading-relaxed">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function RiskClassification({ fund }: { fund: ReturnType<typeof findFund> & {} }) {
  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Risk Classification</div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">Where this fund sits on the risk spectrum</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
        <div className="bg-surface p-6 space-y-4">
          <div className="text-[12px] font-semibold">Strategy Risk Band: Level {fund.risk}</div>
          <RiskMeter level={fund.risk} />
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Exposure to 65–100% mid/small-cap equities with up to 25% unhedged short derivatives and tactical cash allocation creates high volatility and elevated market risk.
          </p>
          <p className="text-[11px] italic text-muted-foreground">Note: SIF investments involve potential loss of capital.</p>
        </div>
        <div className="bg-surface p-6 space-y-4">
          <div className="text-[12px] font-semibold">Benchmark Risk Band: Level 4</div>
          <RiskMeter level={4} />
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Benchmarked against {fund.benchmark}, reflecting broad-market equity exposure across large, mid, and small-cap segments.
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    ["What exactly is a Specialized Investment Fund?", "SIFs are a new SEBI category bridging mutual funds and AIFs. They permit derivatives beyond hedging, short-selling, and higher concentration."],
    ["How is taxation different from a mutual fund?", "Taxation depends on the underlying portfolio — equity, debt, or other. SIFs largely follow standard MF taxation rules of their underlying category."],
    ["Is there a lock-in?", "Most SIFs have no lock-in but levy a short-period exit load (typically 0.5–1% for 15–60 days)."],
    ["What is the minimum investment?", "Typically ₹10 lakhs, in line with SEBI guidelines for sophisticated investor classification."],
    ["How are derivatives used?", "For both hedging and alpha generation. Each fund's strategy intelligence section explains exactly how derivatives are deployed."],
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="space-y-5">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">FAQs</div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">Quick answers</h3>
      </div>
      <div className="bg-surface border border-border rounded-xl overflow-hidden divide-y divide-border">
        {items.map(([q, a], i) => (
          <div key={q}>
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-2 transition-colors">
              <span className="text-[14px] font-medium">{q}</span>
              <ChevronDown className={`size-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <div className="px-6 pb-5 text-[13px] text-muted-foreground leading-relaxed">{a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
