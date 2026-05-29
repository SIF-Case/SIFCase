// Derived ecosystem-level analytics for the SIFs Universe page.
// Pure functions over FUNDS so we can swap in real data later without
// touching widget code.

import { FUNDS, type Fund } from "@/lib/data";

export type Timeframe = "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL";
export const TIMEFRAMES: Timeframe[] = ["1M", "3M", "6M", "1Y", "YTD", "ALL"];

// ── SIF canonical categorization (7 SEBI-aligned strategies) ────
export const SIF_CATEGORIES = [
  "Equity Long-Short",
  "Equity Ex-Top 100 Long-Short",
  "Sector Rotation Long-Short",
  "Debt Long-Short",
  "Sectoral Debt Long-Short",
  "Active Asset Allocator Long-Short",
  "Hybrid Long-Short",
] as const;
export type SifCategory = (typeof SIF_CATEGORIES)[number];

export const SIF_CATEGORY_COLORS: Record<SifCategory, string> = {
  "Equity Long-Short": "var(--color-primary)",
  "Equity Ex-Top 100 Long-Short": "#a78bfa",
  "Sector Rotation Long-Short": "#f472b6",
  "Debt Long-Short": "#22d3ee",
  "Sectoral Debt Long-Short": "#fb923c",
  "Active Asset Allocator Long-Short": "var(--color-gold)",
  "Hybrid Long-Short": "var(--color-positive)",
};

function mapToSifCategory(f: Fund): SifCategory {
  const c = (f.category + " " + f.strategy).toLowerCase();
  if (c.includes("ex top 100") || c.includes("ex-top")) return "Equity Ex-Top 100 Long-Short";
  if (c.includes("hybrid")) return "Hybrid Long-Short";
  if (c.includes("multi-asset") || c.includes("multi asset") || c.includes("allocator")) return "Active Asset Allocator Long-Short";
  if (c.includes("sectoral debt")) return "Sectoral Debt Long-Short";
  if (c.includes("debt")) return "Debt Long-Short";
  if (c.includes("sector") || c.includes("event")) return "Sector Rotation Long-Short";
  return "Equity Long-Short";
}

// ── deterministic pseudo-random based on string id ──────────────
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function rand(seed: string, min: number, max: number) {
  const r = (hash(seed) % 10000) / 10000;
  return +(min + r * (max - min)).toFixed(2);
}

// ── derived per-fund fields (flows, cash, launchDate) ───────────

const parseLaunch = (s: string) => {
  // "12 Nov 2025" → Date
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date("2025-01-01") : d;
};

export type FundDerived = Fund & {
  flows: { m1: number; m3: number; m6: number; y1: number };
  cashPct: number;
  launchDate: Date;
  sifCategory: SifCategory;
};

export const DERIVED: FundDerived[] = FUNDS.map((f) => {
  const cashRow = f.allocation.find((a) => /cash/i.test(a.label));
  const cashPct = cashRow ? cashRow.pct : rand(f.id + "cash", 5, 25);
  const m1 = +(f.aum * rand(f.id + "m1", -0.04, 0.12)).toFixed(1);
  const m3 = +(m1 * rand(f.id + "m3", 1.5, 3.2)).toFixed(1);
  const m6 = +(m3 * rand(f.id + "m6", 1.2, 2.0)).toFixed(1);
  const y1 = +(m6 * rand(f.id + "y1", 1.1, 1.8)).toFixed(1);
  return { ...f, flows: { m1, m3, m6, y1 }, cashPct, launchDate: parseLaunch(f.launch), sifCategory: mapToSifCategory(f) };
});

// ── timeframe accessors ─────────────────────────────────────────
export const flowOf = (f: FundDerived, tf: Timeframe) =>
  tf === "1M" ? f.flows.m1 : tf === "3M" ? f.flows.m3 : tf === "6M" ? f.flows.m6 : f.flows.y1;

export const returnOf = (f: Fund, tf: Timeframe) =>
  tf === "1M" ? f.returns.m1
  : tf === "3M" ? f.returns.m3
  : tf === "6M" ? f.returns.m6
  : tf === "YTD" ? f.returns.ytd
  : tf === "ALL" ? f.returns.si
  : f.returns.y1;

// ── colors ──────────────────────────────────────────────────────
export const STRATEGY_COLORS: Record<string, string> = SIF_CATEGORY_COLORS as unknown as Record<string, string>;
export const colorFor = (s: string) => (SIF_CATEGORY_COLORS as Record<string, string>)[s] || "var(--color-muted-foreground)";

// ── strategy flow aggregates (by SIF canonical category) ────────
export function strategyFlows(tf: Timeframe) {
  const groups = new Map<string, { strategy: string; flow: number; aum: number; count: number }>();
  for (const f of DERIVED) {
    const key = f.sifCategory;
    const g = groups.get(key) ?? { strategy: key, flow: 0, aum: 0, count: 0 };
    g.flow += flowOf(f, tf);
    g.aum += f.aum;
    g.count += 1;
    groups.set(key, g);
  }
  const rows = Array.from(groups.values());
  const total = rows.reduce((s, r) => s + Math.abs(r.flow), 0) || 1;
  const totalAum = rows.reduce((s, r) => s + r.aum, 0) || 1;
  return rows
    .map((r) => ({ ...r, share: (Math.abs(r.flow) / total) * 100, aumShare: (r.aum / totalAum) * 100 }))
    .sort((a, b) => b.aum - a.aum);
}

// ── AMC aggregates ──────────────────────────────────────────────
export function amcFlows(tf: Timeframe) {
  const groups = new Map<string, { amc: string; flow: number; aum: number; count: number }>();
  for (const f of DERIVED) {
    const g = groups.get(f.amc) ?? { amc: f.amc, flow: 0, aum: 0, count: 0 };
    g.flow += flowOf(f, tf);
    g.aum += f.aum;
    g.count += 1;
    groups.set(f.amc, g);
  }
  const rows = Array.from(groups.values());
  const totalAum = rows.reduce((s, r) => s + r.aum, 0) || 1;
  const totalFlow = rows.reduce((s, r) => s + Math.abs(r.flow), 0) || 1;
  return rows
    .map((r) => ({ ...r, aumShare: (r.aum / totalAum) * 100, flowShare: (Math.abs(r.flow) / totalFlow) * 100 }))
    .sort((a, b) => b.aum - a.aum);
}

// stable palette for AMCs
const AMC_PALETTE = ["var(--color-primary)", "var(--color-gold)", "var(--color-positive)", "#a78bfa", "#f472b6", "#22d3ee", "#fb923c", "#facc15", "#34d399", "#60a5fa"];
export const colorForAmc = (amc: string, idx: number) => AMC_PALETTE[idx % AMC_PALETTE.length];

// ── smart metrics ───────────────────────────────────────────────
export function smartMetrics(tf: Timeframe) {
  const totalAUM = DERIVED.reduce((s, f) => s + f.aum, 0);
  const netFlow = DERIVED.reduce((s, f) => s + flowOf(f, tf), 0);
  const avgSharpe = DERIVED.reduce((s, f) => s + f.metrics.sharpe, 0) / DERIVED.length;
  const avgCash = DERIVED.reduce((s, f) => s + f.cashPct, 0) / DERIVED.length;
  const flows = strategyFlows(tf);
  const topStrategy = flows[0]?.strategy ?? "—";
  const hedgeAvg =
    DERIVED.reduce((s, f) => s + (f.allocation.find((a) => /hedged|arbitrage/i.test(a.label))?.pct ?? 0), 0) /
    DERIVED.length;
  const now = new Date("2026-05-25");
  const newLaunches = DERIVED.filter(
    (f) => (now.getTime() - f.launchDate.getTime()) / 86400000 <= 30,
  ).length + 3; // + dummy upcoming hits
  return {
    totalAUM,
    netFlow,
    activeSIFs: DERIVED.length,
    topStrategy,
    avgSharpe,
    avgCash,
    hedgeLevel: hedgeAvg > 20 ? "Elevated" : hedgeAvg > 10 ? "Normal" : "Low",
    newLaunches,
  };
}

// ── regime pills ────────────────────────────────────────────────
export type Pill = { label: string; value: string; tone: "pos" | "neg" | "neutral" | "warn" };

export function regimePills(tf: Timeframe): Pill[] {
  const avgRet = DERIVED.reduce((s, f) => s + returnOf(f, tf), 0) / DERIVED.length;
  const avgVol = DERIVED.reduce((s, f) => s + f.metrics.vol, 0) / DERIVED.length;
  const ls = DERIVED.filter((f) => f.strategy === "Long-Short");
  const lsFlow = ls.reduce((s, f) => s + flowOf(f, tf), 0);
  const avgCash = DERIVED.reduce((s, f) => s + f.cashPct, 0) / DERIVED.length;

  return [
    {
      label: "Market Regime",
      value: avgRet > 4 ? "Risk-On" : avgRet > 1 ? "Moderate Risk-On" : avgRet > -1 ? "Neutral" : "Risk-Off",
      tone: avgRet > 1 ? "pos" : avgRet > -1 ? "neutral" : "neg",
    },
    {
      label: "Long-Short Flows",
      value: lsFlow > 100 ? "Increasing" : lsFlow > 0 ? "Stable" : "Declining",
      tone: lsFlow > 100 ? "pos" : lsFlow > 0 ? "neutral" : "neg",
    },
    {
      label: "Cash Allocation",
      value: avgCash > 20 ? "Elevated" : avgCash > 10 ? "Normal" : "Low",
      tone: avgCash > 20 ? "warn" : "neutral",
    },
    {
      label: "Volatility",
      value: avgVol > 12 ? "Elevated" : avgVol > 8 ? "Stable" : "Calm",
      tone: avgVol > 12 ? "warn" : "neutral",
    },
  ];
}

// ── AI insights ─────────────────────────────────────────────────
export function aiInsights(tf: Timeframe): string[] {
  const sm = smartMetrics(tf);
  const flows = strategyFlows(tf);
  const top = flows[0];
  const cashHigh = sm.avgCash > 20;
  return [
    `${top.strategy} strategies are absorbing the bulk of net flows (${top.share.toFixed(0)}%) — directional conviction is rebuilding across the ${tf} window.`,
    cashHigh
      ? `Cash-heavy long-short funds (avg ${sm.avgCash.toFixed(0)}% in liquidity) are gradually increasing directional exposure amid improving midcap breadth.`
      : `Deployment is high (avg cash only ${sm.avgCash.toFixed(0)}%) — managers are running with limited dry powder, leaving little buffer against drawdowns.`,
    `Risk-adjusted alpha is broadening: avg Sharpe sits at ${sm.avgSharpe.toFixed(2)} with ${sm.activeSIFs} active SIFs; expect a wider quality dispersion as new launches scale.`,
  ];
}

// ── universe explorer chip logic ────────────────────────────────
export const EXPLORER_CHIPS: { key: string; label: string; match: (f: FundDerived) => boolean }[] = [
  { key: "long-short", label: "Long-Short", match: (f) => f.strategy === "Long-Short" },
  { key: "quant", label: "Quant", match: (f) => f.strategy === "Quant" },
  { key: "low-vol", label: "Low Volatility", match: (f) => f.metrics.vol < 8 },
  { key: "high-alpha", label: "High Alpha", match: (f) => f.metrics.alpha > 4 },
  { key: "new", label: "New Funds", match: (f) => (Date.now() - f.launchDate.getTime()) / 86400000 < 180 },
  { key: "high-cash", label: "High Cash", match: (f) => f.cashPct > 20 },
  { key: "defensive", label: "Defensive", match: (f) => f.metrics.drawdown > -6 && f.metrics.vol < 10 },
  { key: "aggressive", label: "Aggressive", match: (f) => f.risk >= 4 && f.metrics.vol > 11 },
  { key: "top-quartile", label: "Top Quartile (1Y)", match: (f) => f.returns.y1 > 6 },
  { key: "high-sharpe", label: "High Sharpe", match: (f) => f.metrics.sharpe > 1.8 },
];

export const fmtCr = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1000) return `${n < 0 ? "−" : ""}₹${(abs / 1000).toFixed(2)}K Cr`;
  return `${n < 0 ? "−" : ""}₹${abs.toFixed(0)} Cr`;
};
