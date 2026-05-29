// Seed data for the SIFHub platform — institutional sample data for SIFs in India.

export type RiskBand = 1 | 2 | 3 | 4 | 5;

export type Fund = {
  id: string;
  name: string;
  amc: string;
  category: string;
  strategy: string;
  launch: string;
  aum: number; // ₹ Cr
  nav: number;
  expense: number;
  risk: RiskBand;
  benchmark: string;
  subscription: string;
  redemption: string;
  returns: {
    ytd: number; m1: number; m3: number; m6: number; y1: number; si: number;
  };
  metrics: {
    sharpe: number; vol: number; drawdown: number; alpha: number; beta: number; ytm?: number; avgMaturity?: number;
  };
  allocation: { label: string; pct: number; note?: string }[];
  derivativesNotional?: number;
  topHoldings: { issuer: string; sector: string; weight: number; note?: string; delta?: number }[];
  strategy_regimes: { bull: string[]; flat: string[]; bear: string[] };
  positives: string[];
  negatives: string[];
  managers: { name: string; role: string; experience: string; prev: string; since: string }[];
  objective: string;
  exitLoad: string;
  spark: number[]; // mini sparkline points
};

const baseSpark = (n = 24, start = 100, drift = 0.4, vol = 0.8) => {
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    v += drift + (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * vol;
    out.push(+v.toFixed(2));
  }
  return out;
};

export const FUNDS: Fund[] = [
  {
    id: "qsif-ex-top-100-long-short",
    name: "qsif Ex Top 100 Long-Short Fund",
    amc: "Quant Mutual Fund",
    category: "Ex Top 100 Long-Short",
    strategy: "Long-Short",
    launch: "12 Nov 2025",
    aum: 211.68,
    nav: 10.842,
    expense: 2.47,
    risk: 5,
    benchmark: "NIFTY 500 TRI",
    subscription: "Daily",
    redemption: "Daily",
    returns: { ytd: 2.57, m1: 1.27, m3: 2.04, m6: 4.73, y1: 5.36, si: 5.36 },
    metrics: { sharpe: 1.82, vol: 14.2, drawdown: -8.4, alpha: 4.81, beta: 0.64, ytm: 5.71, avgMaturity: 0.05 },
    allocation: [
      { label: "Directional Equity", pct: 68.21, note: "30 stocks — HDFC Bank 3.02%, Lenskart 2.89%, Sudeep Pharma 3.49%." },
      { label: "Hedged & Arbitrage", pct: 0 },
      { label: "Fixed Income & Credit", pct: 0, note: "No NCDs, bonds, G-Secs or CDs." },
      { label: "Real Assets & Alternatives", pct: 0, note: "No REITs or InvITs." },
      { label: "Cash & Liquidity", pct: 31.73, note: "TREPS 24.32% + T-Bills 7.41% (May–Jun 2026)." },
      { label: "Other / Net Current Assets", pct: 0.07, note: "Clean month-end; ₹1,413.20L derivative margin posted separately." },
    ],
    derivativesNotional: 7.82,
    topHoldings: [
      { issuer: "ICICI Prudential AMC Ltd", sector: "Capital Markets", weight: 4.82, note: "Largest equity position", delta: 0.12 },
      { issuer: "AU Small Finance Bank Ltd", sector: "Banks", weight: 4.65, delta: 0 },
      { issuer: "NMDC Ltd", sector: "Minerals & Mining", weight: 3.51, delta: -0.08 },
      { issuer: "Sudeep Pharma Limited", sector: "Pharma & Biotech", weight: 3.49, delta: 0.34 },
      { issuer: "IRB Infrastructure Developers", sector: "Construction", weight: 3.31, delta: 0.05 },
      { issuer: "Adani Wilmar Limited", sector: "Agri Food & Products", weight: 3.27, delta: -0.18 },
      { issuer: "Sonata Software Limited", sector: "IT - Software", weight: 3.21, delta: 0.22 },
      { issuer: "HDFC Bank Limited", sector: "Banks", weight: 3.02, delta: 0.10 },
      { issuer: "Lenskart Solutions Limited", sector: "Retailing", weight: 2.89, note: "New listing", delta: 2.89 },
      { issuer: "Poly Medicure Limited", sector: "Healthcare Equipment", weight: 2.65, delta: -0.04 },
    ],
    strategy_regimes: {
      bull: [
        "Long SMID leaders (tactical mid-cap bets)",
        "Small cap strategic longs in high-quality businesses",
        "IPOs / Open Offers / Special Situations",
        "Small minus Large alpha generation capacity",
      ],
      flat: [
        "Exploit mispricing long & short simultaneously",
        "Arbitrage via futures (MIDCPNIFTY index futures active — 6.4% of NAV)",
      ],
      bear: [
        "Short book up to 25% (AU SFB short −4.7% NAV; Laurus Labs short −1.6% NAV)",
        "Shift to large cap longs for defensive buffer (up to 35% large cap permitted)",
        "Defensive cash shift for capital protection",
      ],
    },
    positives: [
      "First SMID long-short SIF in India",
      "MARCOV + HFA (70% high-freq signals) ensures fast regime response",
      "High-quality, ultra-short liquidity buffer: 31.73% in cash equivalents",
      "Best for risk-takers comfortable with volatility in pursuit of benchmark alpha",
    ],
    negatives: [
      "Sharp directional down moves may hurt portfolio (high mid-small cap beta)",
      "High TREPS concentration (24.3%) signals caution / low deployment",
      "Ultrashort debt = rate reinvestment risk (avg maturity 0.06 yr)",
      "Derivatives mispricing risk (bid-ask spreads, F&O liquidity gaps)",
      "SMID segment susceptible to steep swings on earnings misses",
    ],
    managers: [
      { name: "Sandeep Tandon", role: "Founder & Chief Investment Officer", experience: "33 years", prev: "Ex IDBI Asset Management, Kotak, ICICI Securities", since: "Nov 2025" },
      { name: "Sameer Kate", role: "Money Manager", experience: "20 years", prev: "Ex Investec Capital, Kotak Securities", since: "Nov 2025" },
    ],
    objective:
      "To generate long-term capital appreciation by investing primarily in equity and equity-related instruments of stocks outside the top 100 by market capitalization, while utilizing limited short exposure through derivatives to enhance returns and manage risk.",
    exitLoad: "1% if redeemed/switched out on or before 15 days from allotment. Nil thereafter.",
    spark: baseSpark(36, 100, 0.18, 1.4),
  },
  {
    id: "altiva-hybrid-long-short",
    name: "Altiva Hybrid Long-Short Fund",
    amc: "Altiva Asset Management",
    category: "Hybrid Long-Short",
    strategy: "Long-Short",
    launch: "08 Aug 2025",
    aum: 482.10,
    nav: 11.482,
    expense: 1.92,
    risk: 4,
    benchmark: "CRISIL Hybrid 50+50",
    subscription: "Daily",
    redemption: "Daily",
    returns: { ytd: 4.12, m1: 1.85, m3: 3.21, m6: 5.94, y1: 8.42, si: 8.42 },
    metrics: { sharpe: 2.04, vol: 9.8, drawdown: -3.6, alpha: 5.42, beta: 0.42 },
    allocation: [
      { label: "Directional Equity", pct: 52.4 },
      { label: "Hedged & Arbitrage", pct: 18.2 },
      { label: "Fixed Income & Credit", pct: 21.6 },
      { label: "Real Assets & Alternatives", pct: 0 },
      { label: "Cash & Liquidity", pct: 7.8 },
      { label: "Other / Net Current Assets", pct: 0 },
    ],
    topHoldings: [
      { issuer: "Reliance Industries", sector: "Energy", weight: 4.21 },
      { issuer: "HDFC Bank", sector: "Banks", weight: 3.92 },
      { issuer: "Infosys", sector: "IT - Software", weight: 3.40 },
    ],
    strategy_regimes: { bull: ["Tactical long beta"], flat: ["Cash-future arbitrage"], bear: ["Index shorts via futures"] },
    positives: ["Lower volatility profile", "Diversified across hybrid sleeves"],
    negatives: ["Limited equity upside vs pure long-short"],
    managers: [{ name: "Rohit Mehra", role: "CIO", experience: "22 years", prev: "Ex Reliance MF, Axis MF", since: "Aug 2025" }],
    objective: "Hybrid long-short with downside cushion via debt and arbitrage sleeves.",
    exitLoad: "0.5% within 30 days.",
    spark: baseSpark(36, 100, 0.22, 0.6),
  },
  {
    id: "nuvama-market-neutral",
    name: "Nuvama Market Neutral SIF",
    amc: "Nuvama Asset Management",
    category: "Market Neutral",
    strategy: "Market Neutral",
    launch: "04 Mar 2026",
    aum: 168.30,
    nav: 10.142,
    expense: 2.10,
    risk: 3,
    benchmark: "NIFTY Arbitrage TRI",
    subscription: "Daily",
    redemption: "Daily",
    returns: { ytd: 1.42, m1: 0.62, m3: 1.18, m6: 1.84, y1: 1.84, si: 1.84 },
    metrics: { sharpe: 2.41, vol: 3.2, drawdown: -0.9, alpha: 1.42, beta: 0.04 },
    allocation: [
      { label: "Directional Equity", pct: 0 },
      { label: "Hedged & Arbitrage", pct: 72.4 },
      { label: "Fixed Income & Credit", pct: 18.2 },
      { label: "Real Assets & Alternatives", pct: 0 },
      { label: "Cash & Liquidity", pct: 9.4 },
      { label: "Other / Net Current Assets", pct: 0 },
    ],
    topHoldings: [{ issuer: "Cash-Future Arbitrage Basket", sector: "Arbitrage", weight: 38.2 }],
    strategy_regimes: { bull: ["Captured spreads"], flat: ["Optimal regime"], bear: ["Defensive arbitrage"] },
    positives: ["Very low volatility", "Equity taxation"],
    negatives: ["Returns capped by spread compression"],
    managers: [{ name: "Anjali Rao", role: "Fund Manager", experience: "14 years", prev: "Ex Edelweiss, IIFL", since: "Mar 2026" }],
    objective: "Generate absolute returns through cash-future arbitrage with near-zero beta.",
    exitLoad: "Nil.",
    spark: baseSpark(36, 100, 0.08, 0.18),
  },
  {
    id: "edelweiss-multi-asset-sif",
    name: "Edelweiss Multi-Asset SIF",
    amc: "Edelweiss Asset Management",
    category: "Multi-Asset",
    strategy: "Multi-Asset",
    launch: "22 Jan 2026",
    aum: 312.55,
    nav: 10.612,
    expense: 1.65,
    risk: 3,
    benchmark: "Custom Multi-Asset Index",
    subscription: "Daily",
    redemption: "Daily",
    returns: { ytd: 2.18, m1: 0.94, m3: 1.62, m6: 2.84, y1: 6.12, si: 6.12 },
    metrics: { sharpe: 1.62, vol: 7.4, drawdown: -2.8, alpha: 2.40, beta: 0.31 },
    allocation: [
      { label: "Directional Equity", pct: 42.0 },
      { label: "Hedged & Arbitrage", pct: 10.0 },
      { label: "Fixed Income & Credit", pct: 28.0 },
      { label: "Real Assets & Alternatives", pct: 14.0 },
      { label: "Cash & Liquidity", pct: 6.0 },
      { label: "Other / Net Current Assets", pct: 0 },
    ],
    topHoldings: [{ issuer: "Gold ETF", sector: "Commodity", weight: 8.4 }],
    strategy_regimes: { bull: ["Equity overweight"], flat: ["Balanced sleeves"], bear: ["Gold + debt overweight"] },
    positives: ["Diversification across asset classes"],
    negatives: ["Slower equity upside"],
    managers: [{ name: "Vikram Shah", role: "CIO", experience: "26 years", prev: "Ex DSP, HDFC MF", since: "Jan 2026" }],
    objective: "Dynamic multi-asset allocation across equity, debt, gold, and REITs.",
    exitLoad: "1% within 90 days.",
    spark: baseSpark(36, 100, 0.16, 0.4),
  },
  {
    id: "iifl-event-driven",
    name: "IIFL Event-Driven Opportunities SIF",
    amc: "IIFL Asset Management",
    category: "Event Driven",
    strategy: "Event Driven",
    launch: "18 Sep 2025",
    aum: 96.84,
    nav: 11.124,
    expense: 2.20,
    risk: 4,
    benchmark: "NIFTY 500 TRI",
    subscription: "Weekly",
    redemption: "Weekly",
    returns: { ytd: 3.42, m1: 1.04, m3: 2.62, m6: 4.18, y1: 11.24, si: 11.24 },
    metrics: { sharpe: 1.74, vol: 11.6, drawdown: -5.2, alpha: 6.12, beta: 0.52 },
    allocation: [
      { label: "Directional Equity", pct: 38 },
      { label: "Hedged & Arbitrage", pct: 32 },
      { label: "Fixed Income & Credit", pct: 12 },
      { label: "Real Assets & Alternatives", pct: 0 },
      { label: "Cash & Liquidity", pct: 18 },
      { label: "Other / Net Current Assets", pct: 0 },
    ],
    topHoldings: [{ issuer: "M&A Arbitrage Book", sector: "Special Situations", weight: 14.2 }],
    strategy_regimes: { bull: ["IPO/follow-on participation"], flat: ["Merger arb"], bear: ["De-listings, buybacks"] },
    positives: ["Uncorrelated alpha source"],
    negatives: ["Deal-break risk"],
    managers: [{ name: "Karthik Iyer", role: "Fund Manager", experience: "19 years", prev: "Ex Avendus, Motilal Oswal", since: "Sep 2025" }],
    objective: "Capture alpha from corporate actions, M&A, buybacks, and special situations.",
    exitLoad: "1% within 60 days.",
    spark: baseSpark(36, 100, 0.28, 0.7),
  },
  {
    id: "motilal-quant-alpha",
    name: "Motilal Oswal Quant Alpha SIF",
    amc: "Motilal Oswal AMC",
    category: "Quant",
    strategy: "Quant",
    launch: "11 Dec 2025",
    aum: 184.20,
    nav: 10.482,
    expense: 1.85,
    risk: 4,
    benchmark: "NIFTY 200 TRI",
    subscription: "Daily",
    redemption: "Daily",
    returns: { ytd: 2.84, m1: 1.42, m3: 2.41, m6: 3.92, y1: 4.82, si: 4.82 },
    metrics: { sharpe: 1.58, vol: 12.8, drawdown: -6.1, alpha: 3.10, beta: 0.78 },
    allocation: [
      { label: "Directional Equity", pct: 78 },
      { label: "Hedged & Arbitrage", pct: 8 },
      { label: "Fixed Income & Credit", pct: 0 },
      { label: "Real Assets & Alternatives", pct: 0 },
      { label: "Cash & Liquidity", pct: 14 },
      { label: "Other / Net Current Assets", pct: 0 },
    ],
    topHoldings: [{ issuer: "Factor Long Book", sector: "Multi-Sector", weight: 78 }],
    strategy_regimes: { bull: ["Momentum + Quality"], flat: ["Low-vol tilt"], bear: ["Defensive factor rotation"] },
    positives: ["Systematic, no manager bias"],
    negatives: ["Factor drawdowns can persist"],
    managers: [{ name: "Anand Subramanian", role: "Head of Quant", experience: "17 years", prev: "Ex Two Sigma, Goldman Sachs", since: "Dec 2025" }],
    objective: "Multi-factor systematic equity strategy across momentum, value, quality, and low-vol.",
    exitLoad: "1% within 30 days.",
    spark: baseSpark(36, 100, 0.20, 0.9),
  },
];

export const STRATEGIES = [
  { slug: "long-short", name: "Long-Short", desc: "Directional long book hedged with short exposure to manage beta.", risk: "High" },
  { slug: "market-neutral", name: "Market Neutral", desc: "Beta-zero strategies harvesting stock-specific dispersion.", risk: "Low" },
  { slug: "arbitrage", name: "Arbitrage", desc: "Cash-futures and corporate-action driven low-volatility returns.", risk: "Low" },
  { slug: "multi-asset", name: "Multi-Asset", desc: "Dynamic allocation across equity, debt, gold, and alternatives.", risk: "Medium" },
  { slug: "quant", name: "Quant", desc: "Systematic, model-driven exposure across factors and signals.", risk: "Medium-High" },
  { slug: "event-driven", name: "Event Driven", desc: "Alpha from M&A, IPOs, buybacks, de-mergers and special situations.", risk: "Medium-High" },
  { slug: "special-situations", name: "Special Situations", desc: "Catalyst-led concentrated plays with idiosyncratic risk.", risk: "High" },
  { slug: "credit-opportunities", name: "Credit Opportunities", desc: "Structured credit, high-yield, and stressed debt strategies.", risk: "Medium-High" },
];

export const TICKERS: { sym: string; val: string; chg: number; fundId?: string }[] = [
  { sym: "NIFTY 50", val: "24,192.40", chg: 0.42 },
  { sym: "SENSEX", val: "79,876.82", chg: 0.38 },
  { sym: "NIFTY MIDCAP", val: "56,210.05", chg: 0.91 },
  { sym: "INDIA VIX", val: "12.84", chg: -2.14 },
  { sym: "USD/INR", val: "83.12", chg: 0.04 },
  { sym: "GOLD ₹/10g", val: "74,210", chg: -0.12 },
  { sym: "QSIF LONG-SHORT", val: "10.842", chg: 1.24, fundId: "qsif-ex-top-100-long-short" },
  { sym: "ALTIVA HYBRID L/S", val: "11.482", chg: 0.62, fundId: "altiva-hybrid-long-short" },
  { sym: "NUVAMA NEUTRAL", val: "10.142", chg: 0.18, fundId: "nuvama-market-neutral" },
  { sym: "EDELWEISS MULTI-ASSET", val: "12.014", chg: 0.34, fundId: "edelweiss-multi-asset-sif" },
  { sym: "IIFL EVENT DRIVEN", val: "10.918", chg: 0.71, fundId: "iifl-event-driven" },
  { sym: "MOTILAL QUANT", val: "11.226", chg: -0.18, fundId: "motilal-quant-alpha" },
  { sym: "TOTAL SIF AUM", val: "₹42,109 Cr", chg: 0.0 },
  { sym: "ACTIVE SCHEMES", val: "142", chg: 0.0 },
];

export const AMCS = [
  { slug: "quant", name: "Quant Mutual Fund", schemes: 4, aum: 412, specialty: "Long-Short, Quant" },
  { slug: "altiva", name: "Altiva Asset Management", schemes: 2, aum: 482, specialty: "Hybrid Long-Short" },
  { slug: "nuvama", name: "Nuvama Asset Management", schemes: 3, aum: 268, specialty: "Market Neutral, Arbitrage" },
  { slug: "edelweiss", name: "Edelweiss Asset Management", schemes: 5, aum: 612, specialty: "Multi-Asset, Credit" },
  { slug: "iifl", name: "IIFL Asset Management", schemes: 3, aum: 196, specialty: "Event-Driven" },
  { slug: "motilal", name: "Motilal Oswal AMC", schemes: 4, aum: 384, specialty: "Quant, Factor" },
];

export const RESEARCH = [
  { title: "The Rise of SIFs: India's Alternative Investment Frontier", tag: "Industry Outlook", date: "May 2026", read: 12 },
  { title: "Long-Short Mechanics: A Primer for HNIs", tag: "Strategy Deep-Dive", date: "Apr 2026", read: 18 },
  { title: "Decoding Taxation of SIF Categories", tag: "Taxation", date: "Apr 2026", read: 8 },
  { title: "Q1 2026 SIF Industry Flow Report", tag: "Monthly Review", date: "Apr 2026", read: 6 },
];

export const GLOSSARY: Record<string, string> = {
  SIF: "Specialized Investment Fund — a new SEBI-regulated category bridging mutual funds and AIFs, permitting derivatives, long-short, and alternative strategies.",
  NAV: "Net Asset Value — the per-unit market value of the fund's portfolio at end of day.",
  Sharpe: "Sharpe Ratio — risk-adjusted return per unit of total volatility (return − risk-free rate / std-dev).",
  Drawdown: "Peak-to-trough decline of the NAV before a new peak is reached.",
  Volatility: "Annualised standard deviation of returns — a measure of dispersion.",
  Alpha: "Excess return relative to a benchmark, after adjusting for beta.",
  Beta: "Sensitivity of fund returns to benchmark returns; 1.0 = moves in lockstep.",
  Arbitrage: "Simultaneously buying and selling related instruments to lock in a low-risk spread.",
  "Long-Short": "Going long on stocks expected to rise while shorting those expected to fall — generating alpha from both sides.",
  LTCG: "Long-Term Capital Gains — taxed at 12.5% on equity-oriented SIFs held > 12 months.",
  TREPS: "Tri-party Repo Dealing System — overnight money market instrument used for cash management.",
  Futures: "Standardised exchange-traded contracts to buy/sell an underlying at a future date.",
  Hedging: "Offsetting exposure using derivatives to reduce specific risks.",
  YTM: "Yield to Maturity — the total return anticipated on a debt instrument held to maturity.",
};

export function findFund(id: string): Fund | undefined {
  return FUNDS.find((f) => f.id === id);
}
