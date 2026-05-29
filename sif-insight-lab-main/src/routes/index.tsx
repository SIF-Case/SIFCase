import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, TrendingUp, BarChart3, Layers, GraduationCap, Shield, Sparkles, Activity, Building2, Briefcase, Wallet, BookOpen, Scale, ArrowLeftRight, Receipt, Clock, FileText, Radio, Minus, Info } from "lucide-react";
import { FUNDS, STRATEGIES, RESEARCH, AMCS } from "@/lib/data";

import { RiskMeter } from "@/components/ui-bits/RiskMeter";
import { CompareTrayProvider } from "@/components/home/CompareTray";
import { PulseStrip } from "@/components/home/PulseStrip";
import { BuildYourCompare } from "@/components/home/BuildYourCompare";
import { UniverseMap } from "@/components/home/UniverseMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIFHub — India's Specialized Investment Fund Intelligence Platform" },
      { name: "description", content: "Research, compare and analyze India's SIFs with institutional-grade transparency, strategy intelligence and portfolio analytics." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <CompareTrayProvider>
      <Hero />
      <PulseStrip />
      <CompareSection />
      <UniverseMap />
      <FeaturedSIFs />
      <UnderstandBeforeYouInvest />
      <ResearchStrip />
      <CTASection />
    </CompareTrayProvider>
  );
}

function CompareSection() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-16">
        <BuildYourCompare />
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-12 lg:py-16 grid lg:grid-cols-[1fr_440px] gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live SIF Intelligence · 142 schemes tracked
          </div>
          <h1 className="mt-6 text-[44px] lg:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            India's premier <span className="text-muted-foreground">Specialized Investment Fund</span> intelligence platform.
          </h1>
          <p className="mt-6 text-[15px] lg:text-base text-muted-foreground max-w-[58ch] leading-relaxed">
            Research, compare, analyze and understand SIFs — before you invest. Hedge-fund-grade depth for HNIs, RIAs,
            distributors and sophisticated investors.
          </p>

          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              placeholder='Try "Long-Short", "Quant Mutual Fund", or a strategy…'
              className="w-full h-12 pl-11 pr-32 rounded-lg bg-surface border border-border-strong text-[14px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold">
              Search
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 max-w-xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">Popular</span>
            {[
              { label: "Long-Short", to: "/explore" as const },
              { label: "Quant Mutual Fund", to: "/explore" as const },
              { label: "Market Neutral", to: "/explore" as const },
              { label: "Multi-Asset", to: "/explore" as const },
              { label: "Event Driven", to: "/explore" as const },
              { label: "Arbitrage", to: "/explore" as const },
              { label: "Top by Sharpe", to: "/analytics" as const },
              { label: "New Launches", to: "/market" as const },
            ].map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-surface hover:bg-surface-2 hover:border-border-strong transition text-muted-foreground hover:text-foreground"
              >
                {c.label}
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/explore" className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90">
              Explore Funds <ArrowUpRight className="size-3.5" />
            </Link>
            <Link to="/compare" className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border-strong text-[13px] font-medium hover:bg-surface">
              Compare SIFs
            </Link>
            <Link to="/learn" className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border-strong text-[13px] font-medium hover:bg-surface">
              Learn SIFs
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 h-10 px-4 rounded-md text-[13px] text-muted-foreground hover:text-foreground">
              Book Free Call →
            </Link>
          </div>
        </div>

        <HeroPanel />
      </div>
    </section>
  );
}

function HeroPanel() {
  const totalAum = FUNDS.reduce((s, f) => s + f.aum, 0);
  const avgSharpe = (FUNDS.reduce((s, f) => s + f.metrics.sharpe, 0) / FUNDS.length).toFixed(2);
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">SIFs Universe · Snapshot</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-positive flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-positive animate-pulse" /> Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
        <UCell I={Wallet} label="Total AUM" value="₹42,109 Cr" sub="+12.4% YoY" tone="positive" />
        <UCell I={Activity} label="Active Schemes" value="142" sub="across categories" />
        <UCell I={Building2} label="AMCs Tracked" value={String(AMCS.length * 7)} sub="onboarded" />
        <UCell I={Briefcase} label="Avg Sharpe (1Y)" value={avgSharpe} sub="institutional median" tone="positive" />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">SIFHub aggregate · {totalAum.toFixed(0)} Cr sample</span>
        <Link to="/market" className="text-[12px] text-primary font-medium hover:underline inline-flex items-center gap-1">
          Open Universe <ArrowUpRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

function UCell({ I, label, value, sub, tone }: { I: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; tone?: "positive" }) {
  return (
    <div className="bg-surface p-3.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <I className="size-3" />
        <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-1 text-[18px] tabular font-semibold tracking-tight">{value}</div>
      <div className={`mt-0.5 text-[10px] ${tone === "positive" ? "text-positive" : "text-muted-foreground"}`}>{sub}</div>
    </div>
  );
}


function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">{eyebrow}</div>
        <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const ASSET_CLASS: Record<string, "Hybrid" | "Equity" | "Debt"> = {
  "Long-Short": "Equity",
  "Market Neutral": "Equity",
  "Quant": "Equity",
  "Event Driven": "Equity",
  "Multi-Asset": "Hybrid",
  "Hybrid Long-Short": "Hybrid",
  "Arbitrage": "Debt",
  "Credit Opportunities": "Debt",
};

function classOf(f: { strategy: string; category: string }) {
  return ASSET_CLASS[f.category] || ASSET_CLASS[f.strategy] || "Equity";
}

function FeaturedSIFs() {
  const [amc, setAmc] = useState<string>("All");
  const [klass, setKlass] = useState<"All" | "Hybrid" | "Equity" | "Debt">("All");

  const amcs = useMemo(() => ["All", ...Array.from(new Set(FUNDS.map((f) => f.amc)))], []);
  const filtered = useMemo(
    () =>
      FUNDS.filter((f) => (amc === "All" || f.amc === amc) && (klass === "All" || classOf(f) === klass)),
    [amc, klass],
  );

  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-primary">(01) Featured Funds</div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight">Featured Funds</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">Specialised Investment Funds — live performance &amp; metrics</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={amc}
                onChange={(e) => setAmc(e.target.value)}
                className="appearance-none h-10 pl-4 pr-9 rounded-full border border-border-strong bg-surface text-[13px] font-medium hover:bg-surface-2 transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {amcs.map((a) => (
                  <option key={a} value={a}>{a === "All" ? "All AMCs" : a}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
            <div className="inline-flex p-1 rounded-full border border-border-strong bg-surface">
              {(["All", "Hybrid", "Equity", "Debt"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKlass(k)}
                  className={`h-8 px-4 rounded-full text-[12px] font-medium transition ${
                    klass === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-border rounded-xl bg-surface p-12 text-center text-[13px] text-muted-foreground">
            No funds match the current filter.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((f) => (
              <FundCard key={f.id} f={f} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full border border-border-strong bg-surface text-[13px] font-medium hover:bg-surface-2 transition"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FundCard({ f }: { f: (typeof FUNDS)[number] }) {
  const positive = f.returns.y1 >= 0;
  return (
    <div className="group bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-border-strong hover:shadow-xl hover:shadow-black/20 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/fund/$id"
            params={{ id: f.id }}
            className="block text-[18px] font-semibold leading-tight truncate group-hover:text-primary transition-colors"
          >
            {f.name.replace(/\s*Fund\s*$/, "").replace(/\s*SIF\s*$/, "")}
          </Link>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">By {f.amc}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">NAV</div>
          <div className="mt-0.5 text-[15px] font-semibold tabular">₹{f.nav.toFixed(2)}</div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Body: 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">AUM</div>
            <div className="mt-1 text-[16px] font-semibold tabular">₹{f.aum.toFixed(2)} Cr</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Sharpe</div>
            <div className="mt-1 text-[16px] font-semibold tabular">{f.metrics.sharpe.toFixed(2)}</div>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">1yr Returns</div>
            <div className={`mt-1 text-[16px] font-semibold tabular ${positive ? "text-positive" : "text-negative"}`}>
              {positive ? "+" : ""}{f.returns.y1.toFixed(2)}%
            </div>
          </div>
          <div className="flex justify-start">
            <RiskGauge level={f.risk} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          to="/fund/$id"
          params={{ id: f.id }}
          className="flex-1 h-10 inline-flex items-center justify-center rounded-full border border-border-strong text-[13px] font-medium hover:bg-surface-2 transition"
        >
          Details
        </Link>
        <Link
          to="/contact"
          className="flex-1 h-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition"
        >
          Invest Now
        </Link>
      </div>
    </div>
  );
}

function RiskGauge({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  // semicircle gauge 5 segments, needle position
  const segs = [
    { color: "var(--color-positive)" },
    { color: "#a3d977" },
    { color: "var(--color-gold)" },
    { color: "#f0915a" },
    { color: "var(--color-negative)" },
  ];
  const cx = 50, cy = 50, r = 40;
  // angle: -180 (left) -> 0 (right). needle at center of segment
  const segAngle = 180 / 5;
  const needleDeg = -180 + segAngle * (level - 0.5);
  const rad = (needleDeg * Math.PI) / 180;
  const nx = cx + (r - 6) * Math.cos(rad);
  const ny = cy + (r - 6) * Math.sin(rad);

  const arc = (i: number) => {
    const a1 = (-180 + i * segAngle) * Math.PI / 180;
    const a2 = (-180 + (i + 1) * segAngle) * Math.PI / 180;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div className="w-[110px]">
      <svg viewBox="0 0 100 60" className="w-full h-auto">
        {segs.map((s, i) => (
          <path key={i} d={arc(i)} fill="none" stroke={s.color} strokeWidth="9" strokeLinecap="butt" />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--color-foreground)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3" fill="var(--color-foreground)" />
      </svg>
      <div className="text-center text-[9px] font-mono uppercase tracking-widest text-muted-foreground -mt-1">
        {["Low", "Low-Mod", "Moderate", "Mod-High", "High"][level - 1]} risk
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-[13px] font-medium ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function MarketDashboard() {
  const totalAum = FUNDS.reduce((s, f) => s + f.aum, 0);
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="max-w-[1440px] mx-auto px-6 py-20">
        <SectionHeader
          eyebrow="(02) Market Dashboard"
          title="Industry-wide intelligence"
          action={<Link to="/market" className="text-[12px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">Open terminal →</Link>}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
          <Kpi label="Total SIF AUM" value="₹42,109 Cr" sub="+12.4% YoY" tone="positive" />
          <Kpi label="Active Schemes" value="142" sub="Across 42 AMCs" />
          <Kpi label="Avg Expense" value="2.18%" sub="Industry median" />
          <Kpi label="Median Sharpe" value="1.74" sub="Trailing 1Y" tone="positive" />
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[13px] font-semibold">Category-wise allocation</h3>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Industry rollup</span>
            </div>
            <div className="space-y-3">
              {[
                ["Long-Short", 38, "var(--color-primary)"],
                ["Market Neutral", 14, "var(--color-positive)"],
                ["Arbitrage", 12, "var(--color-chart-5)"],
                ["Multi-Asset", 18, "var(--color-gold)"],
                ["Quant", 11, "var(--color-chart-5)"],
                ["Event Driven", 7, "var(--color-negative)"],
              ].map(([label, pct, color]) => (
                <div key={label as string} className="flex items-center gap-3 text-[12px]">
                  <div className="w-32 text-muted-foreground">{label as string}</div>
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct as number}%`, backgroundColor: color as string }} />
                  </div>
                  <div className="w-14 text-right tabular">{pct}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 flex flex-col">
            <h3 className="text-[13px] font-semibold mb-5">Top performing strategies (1M)</h3>
            <div className="divide-y divide-border flex-1">
              {[
                ["Long-Short", "+2.84%"],
                ["Event Driven", "+2.41%"],
                ["Multi-Asset", "+1.62%"],
                ["Quant", "+1.42%"],
                ["Market Neutral", "+0.62%"],
              ].map(([name, ret]) => (
                <div key={name} className="flex items-center justify-between py-3 text-[13px]">
                  <span>{name}</span>
                  <span className="text-positive font-mono tabular">{ret}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Source: SIFHub aggregate · {totalAum.toFixed(0)} Cr sample
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "positive" }) {
  return (
    <div className="bg-surface p-6">
      <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular tracking-tight">{value}</div>
      <div className={`mt-1.5 text-[11px] ${tone === "positive" ? "text-positive" : "text-muted-foreground"}`}>{sub}</div>
    </div>
  );
}

function UnderstandBeforeYouInvest() {
  const cards: Array<Omit<Parameters<typeof LearnCard>[0], "index">> = [
    {
      t: "What is a SIF?",
      d: "Understand the basics of SEBI's SIF category and how it brings advanced strategies within a regulated wrapper.",
      insight: "SEBI introduced SIFs in 2024 to bridge a ₹3L Cr gap between MFs and AIFs.",
      min: 8, lessons: 4, level: "Beginner",
      accent: "primary",
      gradient: "linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 14%, transparent), transparent 70%)",
      Icon: BookOpen,
      Visual: VisualSIFBox,
    },
    {
      t: "How it differs from MFs",
      d: "Explore the key structural, operational and strategy differences between SIFs and Mutual Funds.",
      insight: "SIFs can take short positions and hold up to 20% in a single issuer — MFs cannot.",
      min: 10, lessons: 5, level: "Beginner",
      accent: "positive",
      gradient: "linear-gradient(135deg, color-mix(in oklab, var(--color-positive) 14%, transparent), transparent 70%)",
      Icon: Scale,
      Visual: VisualScale,
    },
    {
      t: "Long-Short investing",
      d: "Learn how investors generate alpha from both sides of the market using long and short positions.",
      insight: "A market-neutral L/S book can deliver 8–12% with <6% volatility — equity-like, bond-like risk.",
      min: 12, lessons: 6, level: "Intermediate",
      accent: "gold",
      gradient: "linear-gradient(135deg, color-mix(in oklab, var(--color-gold) 16%, transparent), transparent 70%)",
      Icon: ArrowLeftRight,
      Visual: VisualLongShort,
    },
    {
      t: "Taxation primer",
      d: "A simple guide to taxation for equity, debt and other instruments in SIFs with real examples.",
      insight: "Equity-oriented: 12.5% LTCG after 12m. Debt: slab or 12.5% post 24m. Structure dictates outcome.",
      min: 7, lessons: 3, level: "Beginner",
      accent: "primary",
      gradient: "linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 12%, transparent), transparent 70%)",
      Icon: Receipt,
      Visual: VisualTax,
    },
  ];
  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-20">
        <SectionHeader eyebrow="(03) Why SIFs" title="Understand Before You Invest" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c, i) => (
            <LearnCard key={c.t} index={i + 1} {...c} />
          ))}
        </div>

        <div className="mt-6 grid lg:grid-cols-[1fr_auto] gap-4 items-stretch">
          <div className="bg-surface border border-border rounded-xl px-5 py-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary mr-1">Popular topics</span>
            {["#Hedging", "#Arbitrage", "#Derivatives", "#Alpha", "#Drawdown", "#Taxation", "#MarketNeutral"].map((t) => (
              <Link key={t} to="/learn" className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-surface hover:bg-surface-2 transition text-muted-foreground hover:text-foreground">
                {t}
              </Link>
            ))}
            <Link to="/learn" className="text-[11px] font-mono uppercase tracking-widest text-primary ml-1 hover:underline">
              View all topics →
            </Link>
          </div>
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 h-full min-h-[52px] px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition justify-center"
          >
            Explore the Learn Hub <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function LearnCard({
  index, t, d, insight, min, lessons, level, accent, gradient, Icon, Visual,
}: {
  index: number; t: string; d: string; insight: string; min: number; lessons: number; level: string;
  accent: "primary" | "positive" | "gold"; gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
  Visual: React.ComponentType<{ className?: string }>;
}) {
  const accentColor = `var(--color-${accent})`;
  const levelTone =
    level === "Beginner" ? "text-positive bg-positive/10 border-positive/20"
    : level === "Intermediate" ? "text-gold bg-gold/10 border-gold/20"
    : "text-negative bg-negative/10 border-negative/20";

  return (
    <div className="learn-card group relative bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 hover:border-border-strong">
      {/* gradient wash */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: gradient }}
      />
      {/* corner accent */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between">
        <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accentColor }}>
          0{index}
        </div>
        <div className="size-9 rounded-lg flex items-center justify-center border border-border bg-surface/80 backdrop-blur transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ color: accentColor }}>
          <Icon className="size-4" />
        </div>
      </div>

      <Visual className="visual relative h-16 w-full mt-1 transition-transform duration-500 ease-out group-hover:scale-[1.04]" />

      <div className="relative">
        <h3 className="text-[15px] font-semibold leading-tight">{t}</h3>
        <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed">{d}</p>
      </div>

      {/* hover-reveal extra insight */}
      <div className="relative grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
        <div className="overflow-hidden">
          <div className="pt-1 text-[11.5px] leading-relaxed text-foreground/85 border-l-2 pl-3" style={{ borderColor: accentColor }}>
            <span className="font-mono uppercase tracking-widest text-[9px]" style={{ color: accentColor }}>Insight · </span>
            {insight}
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-2 flex-wrap mt-1">
        <Meta I={Clock} text={`${min} min`} />
        <Meta I={FileText} text={`${lessons} lessons`} />
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${levelTone}`}>{level}</span>
      </div>

      <div className="relative pt-1">
        <Link
          to="/learn"
          className="text-[12px] font-semibold inline-flex items-center gap-1 transition-all"
          style={{ color: accentColor }}
        >
          <span className="group-hover:hidden">Read more →</span>
          <span className="hidden group-hover:inline-flex items-center gap-1">Explore Module <ArrowUpRight className="size-3.5" /></span>
        </Link>
      </div>
    </div>
  );
}

function Meta({ I, text }: { I: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground font-mono uppercase tracking-wider">
      <I className="size-3" /> {text}
    </span>
  );
}

/* ---- Mini SVG visuals (animate on hover via group-hover) ---- */

function VisualSIFBox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 64" className={className} preserveAspectRatio="xMidYMid meet">
      <g>
        <rect x="14" y="18" width="36" height="32" rx="3" fill="var(--color-surface-2)" stroke="var(--color-border-strong)" />
        <text x="32" y="38" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-muted-foreground)">MF</text>
        <g className="origin-center transition-transform duration-500 group-hover:translate-x-1">
          <path d="M58 34 L88 34" stroke="var(--color-primary)" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M85 30 L92 34 L85 38 Z" fill="var(--color-primary)" />
        </g>
        <rect x="100" y="12" width="44" height="44" rx="4" fill="var(--color-primary)" opacity="0.85" />
        <text x="122" y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-primary-foreground)">SIF</text>
        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <circle cx="160" cy="20" r="3" fill="var(--color-positive)" />
          <circle cx="172" cy="32" r="3" fill="var(--color-gold)" />
          <circle cx="160" cy="44" r="3" fill="var(--color-primary)" />
        </g>
      </g>
    </svg>
  );
}

function VisualScale({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 64" className={className} preserveAspectRatio="xMidYMid meet">
      <line x1="100" y1="8" x2="100" y2="56" stroke="var(--color-border-strong)" strokeWidth="1.5" />
      <g className="origin-[100px_18px] transition-transform duration-500 group-hover:-rotate-6">
        <line x1="40" y1="18" x2="160" y2="18" stroke="var(--color-foreground)" strokeWidth="1.5" />
        <rect x="28" y="22" width="36" height="14" rx="2" fill="var(--color-positive)" opacity="0.9" />
        <text x="46" y="33" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">MF</text>
        <rect x="136" y="22" width="36" height="14" rx="2" fill="var(--color-primary)" opacity="0.9" />
        <text x="154" y="33" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">SIF</text>
      </g>
      <circle cx="100" cy="56" r="3" fill="var(--color-foreground)" />
    </svg>
  );
}

function VisualLongShort({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 64" className={className} preserveAspectRatio="xMidYMid meet">
      <g>
        <rect x="18" y="14" width="64" height="36" rx="4" fill="color-mix(in oklab, var(--color-positive) 16%, transparent)" stroke="var(--color-positive)" strokeOpacity="0.6" />
        <text x="50" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-positive)">LONG</text>
        <g className="transition-transform duration-500 group-hover:-translate-y-0.5">
          <path d="M50 42 L46 38 L50 34 L54 38 Z" fill="var(--color-positive)" />
        </g>

        <rect x="118" y="14" width="64" height="36" rx="4" fill="color-mix(in oklab, var(--color-negative) 16%, transparent)" stroke="var(--color-negative)" strokeOpacity="0.6" />
        <text x="150" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-negative)">SHORT</text>
        <g className="transition-transform duration-500 group-hover:translate-y-0.5">
          <path d="M150 34 L154 38 L150 42 L146 38 Z" fill="var(--color-negative)" />
        </g>

        <path d="M82 24 C 95 6, 105 6, 118 24" fill="none" stroke="var(--color-muted-foreground)" strokeWidth="1" strokeDasharray="3 3" />
      </g>
    </svg>
  );
}

function VisualTax({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 64" className={className} preserveAspectRatio="xMidYMid meet">
      {/* document */}
      <rect x="20" y="10" width="48" height="44" rx="3" fill="var(--color-surface-2)" stroke="var(--color-border-strong)" />
      <text x="44" y="28" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--color-primary)">TAX</text>
      <line x1="26" y1="34" x2="62" y2="34" stroke="var(--color-border-strong)" />
      <line x1="26" y1="40" x2="56" y2="40" stroke="var(--color-border-strong)" />
      <line x1="26" y1="46" x2="60" y2="46" stroke="var(--color-border-strong)" />
      {/* donut */}
      <g transform="translate(110,32)" className="transition-transform duration-500 group-hover:rotate-[18deg] origin-center">
        <circle r="18" fill="none" stroke="var(--color-border)" strokeWidth="7" />
        <circle r="18" fill="none" stroke="var(--color-primary)" strokeWidth="7" strokeDasharray="60 113" transform="rotate(-90)" />
        <circle r="18" fill="none" stroke="var(--color-positive)" strokeWidth="7" strokeDasharray="35 113" transform="rotate(60)" />
        <circle r="18" fill="none" stroke="var(--color-gold)" strokeWidth="7" strokeDasharray="18 113" transform="rotate(180)" />
      </g>
      {/* coins */}
      <g transform="translate(160,40)">
        <ellipse cx="0" cy="6" rx="14" ry="4" fill="var(--color-gold)" opacity="0.8" />
        <ellipse cx="0" cy="0" rx="14" ry="4" fill="var(--color-gold)" />
        <ellipse cx="0" cy="-6" rx="14" ry="4" fill="var(--color-gold)" opacity="0.7" className="transition-transform duration-500 group-hover:-translate-y-1" />
      </g>
    </svg>
  );
}

function PlatformFeatures() {
  const FEATS = [
    { I: Layers, t: "Deep portfolio analysis", d: "Holdings, exposures, concentration, and derivative usage at the issuer level." },
    { I: BarChart3, t: "Compare engine", d: "Side-by-side up to 4 funds across returns, risk, holdings overlap and strategy." },
    { I: Shield, t: "Risk analytics", d: "Volatility cones, drawdowns, rolling Sharpe, upside/downside capture." },
    { I: Sparkles, t: "Strategy intelligence", d: "How each fund behaves across bull, flat and bear regimes — visually decoded." },
    { I: TrendingUp, t: "Manager analysis", d: "Tenure, track record, pedigree, and specialization profile of each PM." },
    { I: GraduationCap, t: "Taxation insights", d: "Equity vs. debt vs. other treatment, LTCG/STCG, with worked examples." },
  ];
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="max-w-[1440px] mx-auto px-6 py-20">
        <SectionHeader eyebrow="(04) Platform" title="What SIFHub gives you" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {FEATS.map(({ I, t, d }) => (
            <div key={t} className="bg-surface p-6 hover:bg-surface-2 transition-colors">
              <I className="size-5 text-primary" />
              <div className="mt-4 text-[15px] font-semibold">{t}</div>
              <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TopStrategies() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-20">
        <SectionHeader
          eyebrow="(05) Strategies"
          title="The eight strategy archetypes"
          action={<Link to="/strategy" className="text-[12px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">Strategy hub →</Link>}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {STRATEGIES.map((s) => (
            <Link key={s.slug} to="/strategy" className="bg-surface p-6 hover:bg-surface-2 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary">{s.risk}</div>
                <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="mt-3 text-[15px] font-semibold">{s.name}</div>
              <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResearchStrip() {
  const signals: Array<{ label: string; value: string; tone: "positive" | "negative" | "gold" | "muted"; dir: "up" | "down" | "flat" }> = [
    { label: "Industry AUM Trend", value: "Bullish", tone: "positive", dir: "up" },
    { label: "Long-Short Positioning", value: "Neutral", tone: "muted", dir: "flat" },
    { label: "Cash Allocation Trend", value: "Elevated", tone: "negative", dir: "up" },
    { label: "Midcap Risk Sentiment", value: "Moderately High", tone: "gold", dir: "up" },
    { label: "Hedge Activity", value: "Increasing", tone: "positive", dir: "up" },
  ];
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="max-w-[1440px] mx-auto px-6 py-20">
        <SectionHeader
          eyebrow="(04) Research"
          title="Research & Insights"
          action={<Link to="/research" className="text-[12px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">All reports →</Link>}
        />

        {/* Market Signals strip */}
        <div className="bg-surface border border-border rounded-xl px-4 py-3 mb-6 flex flex-wrap items-stretch gap-x-1 gap-y-2">
          <div className="flex items-center gap-2 pr-4 mr-1 border-r border-border">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <Radio className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">Market Signals</span>
          </div>
          {signals.map((s) => {
            const Icon = s.dir === "up" ? TrendingUp : s.dir === "down" ? TrendingUp : Minus;
            const toneClass = s.tone === "positive" ? "text-positive" : s.tone === "negative" ? "text-negative" : s.tone === "gold" ? "text-gold" : "text-muted-foreground";
            return (
              <div key={s.label} className="px-4 flex-1 min-w-[140px] border-r border-border last:border-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className={`mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold ${toneClass}`}>
                  <Icon className={`size-3 ${s.dir === "down" ? "rotate-180" : s.dir === "flat" ? "" : ""}`} />
                  {s.value}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 pl-4 ml-1 border-l border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            As of 12 May 2026 <Info className="size-3" />
          </div>
        </div>

        {/* Headlines / research cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESEARCH.map((r, i) => {
            const accents = ["primary", "positive", "gold", "primary"] as const;
            const a = accents[i % accents.length];
            const color = `var(--color-${a})`;
            return (
              <Link
                key={i}
                to="/research"
                className="group relative bg-surface border border-border rounded-xl p-5 flex flex-col gap-3 overflow-hidden transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xl hover:shadow-black/20"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0 w-[3px] opacity-70 group-hover:opacity-100 transition-opacity"
                  style={{ background: color }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color }}>{r.tag}</span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition" />
                </div>
                <h3 className="text-[14.5px] font-semibold leading-snug flex-1">{r.title}</h3>
                <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-widest text-muted-foreground border-t border-border pt-2.5">
                  <span>{r.date}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {r.read} min</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-24 text-center">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Advisor Connect</div>
        <h2 className="mt-4 text-3xl lg:text-5xl font-semibold tracking-tight max-w-3xl mx-auto text-balance">
          Talk to a SIF specialist before you commit capital.
        </h2>
        <p className="mt-5 text-[15px] text-muted-foreground max-w-xl mx-auto">
          1:1 Expert Connect • No Obligation and Spam • 100% Confidential
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/contact" className="h-11 px-5 inline-flex items-center rounded-md bg-primary text-primary-foreground text-[13px] font-semibold">
            Book Free Call
          </Link>
          <Link to="/contact" className="h-11 px-5 inline-flex items-center rounded-md border border-border-strong text-[13px] font-medium hover:bg-surface">
            WhatsApp Connect
          </Link>
          <Link to="/explore" className="h-11 px-5 inline-flex items-center rounded-md border border-border-strong text-[13px] font-medium hover:bg-surface">
            Invest Now
          </Link>
        </div>
      </div>
    </section>
  );
}
