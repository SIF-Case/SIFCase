export interface AllocationBand {
  name: string;
  range: string;
  percent: number;
  color: string;
}

export interface StrategyPoint {
  title: string;
  desc: string;
  icon: "pulse" | "clock" | "shield" | "chart" | "lock";
}

export interface Manager {
  name: string;
  role: string;
  cred: string;
  avatar: string;
}

export interface NFODocument {
  title: string;
  href: string;
}

export interface NFOData {
  slug: string;
  amc: string;
  amcShort: string;
  avatar: string;
  name: string;
  category: "Equity" | "Hybrid";
  structure: "Open-ended" | "Close-ended";
  daysLeft: number;
  closeDate: string;
  openDate: string;
  allotmentDate: string;
  reopenDate: string;
  minInvestment: string;
  subscriptionPrice: string;
  exitLoad: string;
  benchmark: string;
  riskLevel: string;
  riskColor: string;
  isClosingSoon: boolean;
  allocationBands: AllocationBand[];
  strategyPoints: StrategyPoint[];
  managers: Manager[];
  docs: NFODocument[];
}

export const NFOS_DATA: NFOData[] = [
  {
    slug: "kotak-infinity-hybrid",
    amc: "Kotak Mahindra Mutual Fund",
    amcShort: "kotak",
    avatar: "K",
    name: "Kotak Infinity Hybrid Long-Short Fund",
    category: "Hybrid",
    structure: "Open-ended",
    daysLeft: 3,
    closeDate: "29 Jun 2026",
    openDate: "15 Jun 2026",
    allotmentDate: "3 Jul 2026",
    reopenDate: "8 Jul 2026",
    minInvestment: "₹10,00,000",
    subscriptionPrice: "₹10.00",
    exitLoad: "1% ≤ 30 days",
    benchmark: "CRISIL Hybrid 50+50",
    riskLevel: "Level 5 — High",
    riskColor: "var(--danger)",
    isClosingSoon: true,
    allocationBands: [
      { name: "Equity & equity-related instruments", range: "25% – 65%", percent: 65, color: "var(--accent)" },
      { name: "Debt & money market instruments", range: "25% – 65%", percent: 65, color: "var(--primary)" },
      { name: "Unhedged short exposure (equity + debt)", range: "0% – 25%", percent: 25, color: "var(--danger)" },
      { name: "REITs & InvITs", range: "0% – 10%", percent: 10, color: "var(--warn)" }
    ],
    strategyPoints: [
      {
        title: "Hybrid long-short across market phases",
        desc: "The fund dynamically combines equity, debt, and derivative exposures to navigate multiple market cycles, aiming for better risk-adjusted returns than a static equity or debt allocation alone.",
        icon: "pulse"
      },
      {
        title: "Minimum 25% allocation each to equity and debt",
        desc: "Unlike pure equity SIFs, this hybrid structure maintains a floor in both equity and debt, with the remaining allocation actively rotated based on market conditions and macro signals.",
        icon: "clock"
      },
      {
        title: "Short exposure used for hedging and tactical positioning",
        desc: "Derivatives are used for hedging, portfolio rebalancing, and limited unhedged short exposure — capped at 25% of net assets across the fund, in line with SEBI's SIF framework.",
        icon: "shield"
      }
    ],
    managers: [
      {
        name: "Rohit Sharma",
        role: "Chief Investment Officer — SIF",
        cred: "14+ years fund management experience. Manages average AUM exceeding ₹5,000 Cr across Kotak's equity strategies.",
        avatar: "RS"
      },
      {
        name: "Priya Mehta",
        role: "Fund Manager — Debt & Derivatives",
        cred: "8+ years in fixed income and derivatives. Previously managed credit and hedging strategies at a leading PMS.",
        avatar: "PM"
      }
    ],
    docs: [
      { title: "Investment Strategy Information Document (ISID)", href: "#" },
      { title: "SIF Application Form", href: "#" },
      { title: "Key Information Memorandum (KIM)", href: "#" }
    ]
  },
  {
    slug: "sbi-magnum-ex-top-100",
    amc: "SBI Mutual Fund",
    amcShort: "sbi",
    avatar: "S",
    name: "SBI Magnum Equity Ex-Top 100 Long-Short Fund",
    category: "Equity",
    structure: "Open-ended",
    daysLeft: 6,
    closeDate: "2 Jul 2026",
    openDate: "18 Jun 2026",
    allotmentDate: "7 Jul 2026",
    reopenDate: "12 Jul 2026",
    minInvestment: "₹10,00,000",
    subscriptionPrice: "₹10.00",
    exitLoad: "1% ≤ 15 days",
    benchmark: "NIFTY 500 TRI",
    riskLevel: "Level 6 — Very High",
    riskColor: "var(--danger)",
    isClosingSoon: true,
    allocationBands: [
      { name: "Equity & equity-related instruments", range: "65% – 95%", percent: 95, color: "var(--accent)" },
      { name: "Debt & money market instruments", range: "0% – 35%", percent: 35, color: "var(--primary)" },
      { name: "Unhedged short exposure (equity + debt)", range: "0% – 25%", percent: 25, color: "var(--danger)" }
    ],
    strategyPoints: [
      {
        title: "Large & midcap long-short positioning",
        desc: "Excluding the top 100 stocks, this fund identifies long and short opportunities in high-potential mid and small-cap segments to extract maximum alpha.",
        icon: "pulse"
      },
      {
        title: "Quantitative active stock selection",
        desc: "Uses a robust quantitative model with strict risk control measures to dynamically adjust the long-short exposure based on liquidity and earnings momentum.",
        icon: "chart"
      },
      {
        title: "Hedged portfolio to limit downside volatility",
        desc: "Maintains a hedging sleeve through index futures and options to buffer market downturns and lock in gains during high-volatility phases.",
        icon: "shield"
      }
    ],
    managers: [
      {
        name: "Sanjay Kumar",
        role: "CIO — Equity",
        cred: "18+ years experience. Manages SBI's top-performing large-cap and long-short strategies with strong risk-adjusted returns.",
        avatar: "SK"
      },
      {
        name: "Amit Patel",
        role: "Co-Fund Manager",
        cred: "10+ years in derivative strategies. Specialized in option hedging and long-short pair trades.",
        avatar: "AP"
      }
    ],
    docs: [
      { title: "Investment Strategy Information Document (ISID)", href: "#" },
      { title: "SIF Application Form", href: "#" },
      { title: "Key Information Memorandum (KIM)", href: "#" }
    ]
  },
  {
    slug: "isif-active-momentum",
    amc: "ICICI Prudential Mutual Fund",
    amcShort: "icici",
    avatar: "I",
    name: "iSIF Active Momentum Long-Short Fund",
    category: "Equity",
    structure: "Open-ended",
    daysLeft: 11,
    closeDate: "11 Jul 2026",
    openDate: "27 Jun 2026",
    allotmentDate: "16 Jul 2026",
    reopenDate: "21 Jul 2026",
    minInvestment: "₹10,00,000",
    subscriptionPrice: "₹10.00",
    exitLoad: "1% ≤ 15 days",
    benchmark: "NIFTY 500 TRI",
    riskLevel: "Level 6 — Very High",
    riskColor: "var(--danger)",
    isClosingSoon: false,
    allocationBands: [
      { name: "Equity & equity-related instruments", range: "80% – 100%", percent: 100, color: "var(--accent)" },
      { name: "Debt & money market instruments", range: "0% – 20%", percent: 20, color: "var(--primary)" },
      { name: "Unhedged short exposure (equity + debt)", range: "0% – 25%", percent: 25, color: "var(--danger)" }
    ],
    strategyPoints: [
      {
        title: "Momentum factor-based stock selection",
        desc: "Focuses on stocks showing strong price and earnings momentum, riding trends while shorting underperforming laggards to enhance returns.",
        icon: "pulse"
      },
      {
        title: "Dynamic leverage and hedging overlay",
        desc: "Uses tactical derivatives overlays to increase exposure in bullish cycles and rapidly raise hedging ratios when technical indicators turn bearish.",
        icon: "chart"
      },
      {
        title: "Aggressive growth targeting mid and small-caps",
        desc: "Aims to capture rapid growth phases of mid and small-sized enterprises under SEBI's Specialized Investment Fund framework.",
        icon: "shield"
      }
    ],
    managers: [
      {
        name: "Vikas Gupta",
        role: "Head of Equities",
        cred: "16+ years experience in thematic and quantitative investment strategies across global and domestic markets.",
        avatar: "VG"
      },
      {
        name: "Neha Shah",
        role: "Fund Manager",
        cred: "9+ years in options trading, risk management, and quantitative strategy design.",
        avatar: "NS"
      }
    ],
    docs: [
      { title: "Investment Strategy Information Document (ISID)", href: "#" },
      { title: "SIF Application Form", href: "#" },
      { title: "Key Information Memorandum (KIM)", href: "#" }
    ]
  },
  {
    slug: "qsif-multi-asset",
    amc: "Quant Mutual Fund",
    amcShort: "quant",
    avatar: "Q",
    name: "qSIF Multi-Asset Allocator Long-Short Fund",
    category: "Hybrid",
    structure: "Open-ended",
    daysLeft: 14,
    closeDate: "14 Jul 2026",
    openDate: "30 Jun 2026",
    allotmentDate: "19 Jul 2026",
    reopenDate: "24 Jul 2026",
    minInvestment: "₹10,00,000",
    subscriptionPrice: "₹10.00",
    exitLoad: "1% ≤ 30 days",
    benchmark: "CRISIL Hybrid 50+50",
    riskLevel: "Level 5 — High",
    riskColor: "var(--danger)",
    isClosingSoon: false,
    allocationBands: [
      { name: "Equity & equity-related instruments", range: "10% – 50%", percent: 50, color: "var(--accent)" },
      { name: "Debt & money market instruments", range: "10% – 50%", percent: 50, color: "var(--primary)" },
      { name: "Gold & Commodities (derivatives)", range: "10% – 30%", percent: 30, color: "var(--warn)" },
      { name: "Unhedged short exposure (equity + debt)", range: "0% – 25%", percent: 25, color: "var(--danger)" }
    ],
    strategyPoints: [
      {
        title: "Multi-asset diversification & long-short tactical rotation",
        desc: "Combines equity, debt, gold, and other asset classes with a long-short derivative strategy to deliver absolute returns irrespective of asset performance.",
        icon: "pulse"
      },
      {
        title: "Predictive analytics for weights (VLRT framework)",
        desc: "Uses Quant AMC's proprietary VLRT framework (Valuation, Liquidity, Risk Appetite, Time) to capture macroeconomic shifts and dynamically adjust allocation.",
        icon: "chart"
      },
      {
        title: "Hedged equity portfolio for capital preservation",
        desc: "Active protection via short hedges in index options to limit drawdown risks in critical downturns.",
        icon: "shield"
      }
    ],
    managers: [
      {
        name: "Sandeep Tandon",
        role: "Chief Investment Officer",
        cred: "22+ years experience in global market analysis, asset allocation, and quantitative investing.",
        avatar: "ST"
      },
      {
        name: "Aniket Dev",
        role: "Fund Manager",
        cred: "7+ years experience in fixed income, commodity markets, and derivative derivative pricing models.",
        avatar: "AD"
      }
    ],
    docs: [
      { title: "Investment Strategy Information Document (ISID)", href: "#" },
      { title: "SIF Application Form", href: "#" },
      { title: "Key Information Memorandum (KIM)", href: "#" }
    ]
  }
];
