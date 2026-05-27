export type SourceVariant =
  | "amfi"
  | "calculated"
  | "isid"
  | "amc"
  | "review"
  | "unavailable";

export interface SnapshotStat {
  label: string;
  value: string;
  sub: string;
  badge: SourceVariant;
}

export interface SIFRecord {
  name: string;
  amc: string;
  strategy: string;
  plan: "Regular" | "Direct";
  nav: string;
  navDate: string;
  return1m: string | null;
  return3m: string | null;
  returnSI: string | null;
  ter: string | null;
}

export interface NFORecord {
  amc: string;
  name: string;
  strategy: string;
  opens: string;
  closes: string;
  daysLeft: number | null;
  minInvestment: string;
  status: "live" | "upcoming" | "closed";
}

export interface Article {
  title: string;
  category: string;
  readTime: string;
  summary: string;
}

// ── Static sample data — not live, for UI demonstration only ─────────────────

export const SNAPSHOT_STATS: SnapshotStat[] = [
  { label: "Total SIFs", value: "37", sub: "as of May 2026", badge: "amfi" },
  { label: "Live NFOs", value: "4", sub: "closing this month", badge: "amfi" },
  {
    label: "AMCs with SIFs",
    value: "12",
    sub: "active asset managers",
    badge: "amfi",
  },
  {
    label: "Latest NAV Date",
    value: "25 May",
    sub: "2026 · Regular Plans",
    badge: "amfi",
  },
  {
    label: "Regular Plan NAVs",
    value: "37",
    sub: "AMFI imported",
    badge: "amfi",
  },
  {
    label: "Data Fields Verified",
    value: "1,240+",
    sub: "across all SIFs",
    badge: "calculated",
  },
];

export const SAMPLE_SIFS: SIFRecord[] = [
  {
    name: "iSIF Equity Ex-Top 100 Long-Short Fund",
    amc: "ISEC Prudential AMC",
    strategy: "Equity Ex-Top 100",
    plan: "Regular",
    nav: "9.990",
    navDate: "25 May 2026",
    return1m: null,
    return3m: null,
    returnSI: null,
    ter: "1.85",
  },
  {
    name: "Nuvama Neutral Strategy SIF",
    amc: "Nuvama AMC",
    strategy: "Market Neutral",
    plan: "Regular",
    nav: "10.142",
    navDate: "25 May 2026",
    return1m: null,
    return3m: null,
    returnSI: "+1.42",
    ter: "1.92",
  },
  {
    name: "Quant SIF Long-Short Fund",
    amc: "Quant AMC",
    strategy: "Equity Long-Short",
    plan: "Regular",
    nav: "10.843",
    navDate: "25 May 2026",
    return1m: "+0.82",
    return3m: null,
    returnSI: "+8.43",
    ter: "1.75",
  },
  {
    name: "ALTIVA Hybrid L/S Fund",
    amc: "ALTIVA AMC",
    strategy: "Hybrid Long-Short",
    plan: "Regular",
    nav: "11.482",
    navDate: "25 May 2026",
    return1m: "+0.62",
    return3m: "+2.14",
    returnSI: "+14.82",
    ter: "1.68",
  },
];

export const SAMPLE_NFOS: NFORecord[] = [
  {
    amc: "Quant AMC",
    name: "Quant SIF Equity Long-Short",
    strategy: "Equity Long-Short",
    opens: "20 May 2026",
    closes: "3 Jun 2026",
    daysLeft: 8,
    minInvestment: "₹10,00,000",
    status: "live",
  },
  {
    amc: "Nuvama AMC",
    name: "Nuvama Neutral Strategy SIF",
    strategy: "Market Neutral",
    opens: "28 May 2026",
    closes: "11 Jun 2026",
    daysLeft: 16,
    minInvestment: "₹10,00,000",
    status: "live",
  },
  {
    amc: "HDFC AMC",
    name: "HDFC SIF Equity Opportunities",
    strategy: "Equity Ex-Top 100",
    opens: "15 Jun 2026",
    closes: "29 Jun 2026",
    daysLeft: null,
    minInvestment: "₹10,00,000",
    status: "upcoming",
  },
];

export const KNOWLEDGE_ARTICLES: Article[] = [
  {
    title: "What is a Specialized Investment Fund?",
    category: "Basics",
    readTime: "5 min read",
    summary:
      "A clear explanation of what SIFs are, how they differ from mutual funds, and who they are designed for.",
  },
  {
    title: "SIF vs Mutual Fund vs PMS — Key Differences",
    category: "Comparison",
    readTime: "7 min read",
    summary:
      "A side-by-side breakdown of SIFs, mutual funds, and PMS on regulation, minimum investment, strategy flexibility, and investor eligibility.",
  },
  {
    title: "How to read a SIF ISID document",
    category: "Documents",
    readTime: "6 min read",
    summary:
      "The Investment Strategy Information Document contains strategy rules, risk details, and benchmark data. Here's how to read it.",
  },
  {
    title: "What is long-short investing?",
    category: "Strategy",
    readTime: "8 min read",
    summary:
      "Long-short strategies hold both buy and short positions. This article explains the mechanics, risk profile, and what to look for in an ISID.",
  },
];
