import { connectDB } from "./mongodb";
import mongoose from "mongoose";
import PerformanceReport from "@/models/PerformanceReport";

export interface SnapshotStats {
  totalSchemes: number;
  totalRegular: number;
  totalGrowthRegular: number;
  uniqueAMCs: number;
  latestNavDate: string;
  totalNavRecords: number;
}

export interface SIFRow {
  schemeCode: string;
  name: string;
  fundName: string;
  amc: string;
  companyName: string;
  brandName: string;
  strategy: string;
  plan: "Regular" | "Direct";
  option: string;
  nav: string;
  navDate: string;
  isin: string | null;
  return1m: string | null;
  return3m: string | null;
  return6m: string | null;
  return1y: string | null;
  returnSI: string | null;
}

export type PeriodKey = "1M" | "3M" | "6M" | "1Y" | "SI";

export interface FundRow {
  schemeCode: string;
  name: string;
  fundName: string;
  amc: string;
  companyName: string;
  strategy: string;
  category: "Equity" | "Hybrid";
  plan: "Regular" | "Direct";
  nav: number;
  navDate: string;
  isin: string | null;
  aum: number | null;
  returns: Record<PeriodKey, number | null>;
  sharpes: Record<PeriodKey, number | null>;
  drawdowns: Record<PeriodKey, number | null>;
  sparklines: Record<PeriodKey, number[]>;
  sparklineDates: Record<PeriodKey, string[]>;
  riskBand: 1 | 2 | 3 | 4 | 5 | null;
}

export interface TickerNav {
  label: string;
  value: string;
  change: string;
  neg: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Returns index of the last record whose navDate <= cutoff.
// If cutoff falls on a weekend/holiday, this gives the last trading day before it.
function lastIdxOnOrBefore(records: { navDate: Date }[], cutoff: Date): number {
  let idx = -1;
  for (let i = 0; i < records.length; i++) {
    if (records[i].navDate <= cutoff) idx = i;
    else break;
  }
  return idx;
}

// Safe month/year subtraction — clamps to last day of month to avoid JS Date overflow
// e.g. May 31 - 1 month → April 30, not May 1
function subMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() - months;
  d.setMonth(targetMonth);
  // If day overflowed (e.g. Jan 31 - 1 month → Feb 31 → Mar 3), roll back to last day of intended month
  const expected = ((targetMonth % 12) + 12) % 12;
  if (d.getMonth() !== expected) d.setDate(0);
  return d;
}

function subYears(date: Date, years: number): Date {
  return subMonths(date, years * 12);
}

function pct(current: number, base: number): number {
  return +((( current - base) / base) * 100).toFixed(2);
}

// Annualised (CAGR) return for periods longer than 1 year; absolute return otherwise.
function annualizedReturn(current: number, base: number, startDate: Date, endDate: Date): number {
  const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years <= 1) return pct(current, base);
  return +((Math.pow(current / base, 1 / years) - 1) * 100).toFixed(2);
}

function fmtReturn(val: number | null): string | null {
  if (val === null) return null;
  return (val >= 0 ? "+" : "") + val.toFixed(2);
}

// For a sorted array of nav records, find the record closest to a target date
function navClosestTo(
  sorted: { navDate: Date; nav: number }[],
  target: Date
): { nav: number } | null {
  if (sorted.length === 0) return null;
  let best = sorted[0];
  let bestDiff = Math.abs(sorted[0].navDate.getTime() - target.getTime());
  for (const r of sorted) {
    const diff = Math.abs(r.navDate.getTime() - target.getTime());
    if (diff < bestDiff) { bestDiff = diff; best = r; }
  }
  return best;
}

function strategyToCategory(strategy: string): "Equity" | "Hybrid" {
  if (/hybrid/i.test(strategy) || /active\s*asset/i.test(strategy)) return "Hybrid";
  return "Equity";
}

function computeSharpe(records: { nav: number; navDate: Date }[], riskFreeAnnual = 0.065): number | null {
  if (records.length < 15) return null;

  // Standard mutual fund Sharpe: treat each consecutive NAV pair as a 1-trading-day return.
  // Do NOT normalise by calendar day gap — NAVs are only published on trading days,
  // so each observation is already one trading day regardless of weekend/holiday gaps.
  // Skip zero returns (duplicate NAV entries in DB).
  const returns: number[] = [];
  for (let i = 1; i < records.length; i++) {
    const r = (records[i].nav - records[i - 1].nav) / records[i - 1].nav;
    returns.push(r);
  }

  if (returns.length < 10) return null;

  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1); // sample std dev
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return null;

  return +((mean - riskFreeAnnual / 252) / stdDev * Math.sqrt(252)).toFixed(2);
}

function computeMaxDrawdown(records: { nav: number }[]): number | null {
  if (records.length < 2) return null;
  let peak = records[0].nav;
  let maxDD = 0;
  for (const r of records) {
    if (r.nav > peak) peak = r.nav;
    const dd = (r.nav - peak) / peak * 100;
    if (dd < maxDD) maxDD = dd;
  }
  return +maxDD.toFixed(2);
}

// ── DB queries ────────────────────────────────────────────────────────────────

async function getCollections() {
  await connectDB();
  const db = mongoose.connection.db!;
  return {
    schemes: db.collection("sifschemes"),
    navs: db.collection("sifnavs"),
  };
}

export async function getSnapshotStats(): Promise<SnapshotStats> {
  const { schemes, navs } = await getCollections();

  const [totalSchemes, totalRegular, totalGrowthRegular, totalNavRecords, amcList, latestNavRecord] =
    await Promise.all([
      schemes.countDocuments(),
      schemes.countDocuments({ plan: "Regular" }),
      schemes.countDocuments({ plan: "Regular", option: "Growth" }),
      navs.countDocuments(),
      schemes.distinct("amc"),
      navs.findOne({}, { sort: { navDate: -1 } }),
    ]);

  return {
    totalSchemes,
    totalRegular,
    totalGrowthRegular,
    uniqueAMCs: amcList.length,
    latestNavDate: latestNavRecord
      ? formatDate(latestNavRecord.navDate)
      : "—",
    totalNavRecords,
  };
}

export async function getSIFsWithReturns(plan?: "Regular" | "Direct", option?: string, brandName?: string): Promise<SIFRow[]> {
  const { schemes, navs } = await getCollections();

  const filter: Record<string, string> = {};
  if (plan) filter.plan = plan;
  if (option) filter.option = option;
  if (brandName) filter.brandName = brandName;
  const allSchemes = await schemes
    .find(filter, { projection: { _id: 0 } })
    .sort({ amc: 1, schemeName: 1 })
    .toArray();

  if (allSchemes.length === 0) return [];

  const codes = allSchemes.map((s) => s.schemeCode as string);

  // Fetch all NAV records for these schemes in one query
  const allNavRecords = await navs
    .find({ schemeCode: { $in: codes } }, { projection: { schemeCode: 1, nav: 1, navDate: 1 } })
    .sort({ navDate: 1 })
    .toArray();

  // Group by schemeCode
  const navsByCode = new Map<string, { nav: number; navDate: Date }[]>();
  for (const r of allNavRecords) {
    const code = r.schemeCode as string;
    if (!navsByCode.has(code)) navsByCode.set(code, []);
    navsByCode.get(code)!.push({ nav: r.nav as number, navDate: r.navDate as Date });
  }

  const rows: SIFRow[] = [];

  for (const s of allSchemes) {
    const code = s.schemeCode as string;
    const records = navsByCode.get(code) ?? [];
    if (records.length === 0) continue;

    const latest = records[records.length - 1];
    const first = records[0];

    const latestDate = new Date(latest.navDate);
    const ago1m = subMonths(latestDate, 1);
    const ago3m = subMonths(latestDate, 3);
    const ago6m = subMonths(latestDate, 6);
    const ago1y = subYears(latestDate, 1);

    const idx1m = lastIdxOnOrBefore(records, ago1m);
    const idx3m = lastIdxOnOrBefore(records, ago3m);
    const idx6m = lastIdxOnOrBefore(records, ago6m);
    const idx1y = lastIdxOnOrBefore(records, ago1y);

    rows.push({
      schemeCode: code,
      name: s.schemeName as string,
      fundName: (s.fundName as string) || (s.schemeName as string),
      amc: s.amc as string,
      companyName: (s.companyName as string) || (s.amc as string),
      brandName: (s.brandName as string) || "",
      strategy: s.strategy as string,
      plan: s.plan as "Regular" | "Direct",
      option: s.option as string,
      nav: (latest.nav as number).toFixed(4),
      navDate: formatDate(latestDate),
      isin: (s.isinGrowth as string) || null,
      return1m:
        idx1m >= 0 && records.length >= 20
          ? fmtReturn(pct(latest.nav, records[idx1m].nav))
          : null,
      return3m:
        idx3m >= 0 && records.length >= 60
          ? fmtReturn(pct(latest.nav, records[idx3m].nav))
          : null,
      return6m:
        idx6m >= 0 && records.length >= 120
          ? fmtReturn(pct(latest.nav, records[idx6m].nav))
          : null,
      return1y:
        idx1y >= 0 && records.length >= 240
          ? fmtReturn(pct(latest.nav, records[idx1y].nav))
          : null,
      returnSI:
        first.nav !== latest.nav || records.length > 1
          ? fmtReturn(annualizedReturn(latest.nav, first.nav, new Date(first.navDate), latestDate))
          : null,
    });
  }

  return rows;
}

function brandNameToSlug(brandName: string): string {
  return brandName.toLowerCase().replace(/\s+/g, "-");
}

export interface FundHouseInfo {
  brandName: string;
  companyName: string;
  schemeCount: number;
}

// Resolve a URL slug (e.g. "abc-mutual-fund") back to its brandName (e.g. "ABC Mutual Fund")
export async function getFundHouseBySlug(slug: string): Promise<FundHouseInfo | null> {
  const { schemes } = await getCollections();
  const rows = await schemes.aggregate([
    { $match: { brandName: { $exists: true, $ne: "" } } },
    { $group: { _id: "$brandName", companyName: { $first: "$companyName" }, schemeCount: { $sum: 1 } } },
  ]).toArray();

  for (const r of rows) {
    const brandName = r._id as string;
    if (brandNameToSlug(brandName) === slug) {
      return {
        brandName,
        companyName: (r.companyName as string) || brandName,
        schemeCount: r.schemeCount as number,
      };
    }
  }
  return null;
}

const RISK_BAND_STRING_MAP_EARLY: Record<string, 1 | 2 | 3 | 4 | 5> = {
  "Low Risk": 1, "Low to Moderate Risk": 2, "Moderate Risk": 3,
  "Moderately High Risk": 4, "High Risk": 5,
};

function normaliseRiskBandEarly(v: unknown): 1 | 2 | 3 | 4 | 5 | null {
  if (v == null) return null;
  if (typeof v === "string") {
    if (RISK_BAND_STRING_MAP_EARLY[v]) return RISK_BAND_STRING_MAP_EARLY[v];
    const n = parseInt(v, 10);
    if (n >= 1 && n <= 5) return n as 1 | 2 | 3 | 4 | 5;
    return null;
  }
  if (typeof v === "number" && v >= 1 && v <= 5) return Math.round(v) as 1 | 2 | 3 | 4 | 5;
  return null;
}

export async function getTopFunds(): Promise<FundRow[]> {
  const sifs = await getSIFsWithReturns("Regular", "Growth");

  // Belt-and-suspenders: drop any IDCW that slipped through via mis-tagged option field
  const growthOnly = sifs.filter((s) => {
    const n = s.name.toLowerCase();
    return !n.includes("idcw") && !n.includes("income distribution") && !n.includes("withdrawal") && !n.includes("dividend");
  });

  // Sort by SI return descending
  const sorted = [...growthOnly].sort((a, b) => {
    const ra = a.returnSI ? parseFloat(a.returnSI) : -Infinity;
    const rb = b.returnSI ? parseFloat(b.returnSI) : -Infinity;
    return rb - ra;
  });

  const { navs } = await getCollections();
  const codes = sorted.map((s) => s.schemeCode);

  // Batch fetch all NAVs in one query
  const allNavRecords = await navs
    .find({ schemeCode: { $in: codes } }, { projection: { schemeCode: 1, nav: 1, navDate: 1 } })
    .sort({ navDate: 1 })
    .toArray();

  const navsByCode = new Map<string, { nav: number; navDate: Date }[]>();
  for (const r of allNavRecords) {
    const code = r.schemeCode as string;
    if (!navsByCode.has(code)) navsByCode.set(code, []);
    navsByCode.get(code)!.push({ nav: r.nav as number, navDate: new Date(r.navDate) });
  }

  // Batch fetch riskBand from funddetails
  const db = mongoose.connection.db!;
  const fundNames = sorted.map((s) => s.fundName);
  const detailsDocs = await db.collection("funddetails")
    .find({ fundName: { $in: fundNames } }, { projection: { fundName: 1, riskBand: 1, aumCurrent: 1, aumAggregate: 1, aumEnd: 1, _id: 0 } })
    .toArray();
  const riskBandByName = new Map<string, 1 | 2 | 3 | 4 | 5 | null>();
  const aumByName = new Map<string, number | null>();
  for (const d of detailsDocs) {
    riskBandByName.set(d.fundName as string, normaliseRiskBandEarly(d.riskBand));
    aumByName.set(d.fundName as string, d.aumCurrent ?? d.aumAggregate ?? d.aumEnd ?? null);
  }

  const funds: FundRow[] = sorted.map((s) => {
      const allHistory = navsByCode.get(s.schemeCode) ?? [];

      const latestDate = allHistory.length ? allHistory[allHistory.length - 1].navDate : new Date();

      const cutoffs: Record<string, Date> = {
        "1M": subMonths(latestDate, 1),
        "3M": subMonths(latestDate, 3),
        "6M": subMonths(latestDate, 6),
        "1Y": subYears(latestDate, 1),
      };

      // Start from the last trading day ON OR BEFORE the cutoff so the first
      // return in the window captures the weekend/holiday gap correctly.
      const sliceFor = (cutoff: Date) => {
        const idx = lastIdxOnOrBefore(allHistory, cutoff);
        return idx >= 0 ? allHistory.slice(idx) : allHistory.filter((r) => r.navDate >= cutoff);
      };

      const sharpes: Record<PeriodKey, number | null> = {
        "1M": computeSharpe(sliceFor(cutoffs["1M"])),
        "3M": computeSharpe(sliceFor(cutoffs["3M"])),
        "6M": computeSharpe(sliceFor(cutoffs["6M"])),
        "1Y": computeSharpe(sliceFor(cutoffs["1Y"])),
        "SI": computeSharpe(allHistory),
      };

      const drawdowns: Record<PeriodKey, number | null> = {
        "1M": computeMaxDrawdown(sliceFor(cutoffs["1M"])),
        "3M": computeMaxDrawdown(sliceFor(cutoffs["3M"])),
        "6M": computeMaxDrawdown(sliceFor(cutoffs["6M"])),
        "1Y": computeMaxDrawdown(sliceFor(cutoffs["1Y"])),
        "SI": computeMaxDrawdown(allHistory),
      };

      const sparklines = {
        "1M": sliceFor(cutoffs["1M"]).map((r) => r.nav),
        "3M": sliceFor(cutoffs["3M"]).map((r) => r.nav),
        "6M": sliceFor(cutoffs["6M"]).map((r) => r.nav),
        "1Y": sliceFor(cutoffs["1Y"]).map((r) => r.nav),
        "SI": allHistory.map((r) => r.nav),
      } as Record<PeriodKey, number[]>;

      const sparklineDates = {
        "1M": sliceFor(cutoffs["1M"]).map((r) => formatDate(r.navDate)),
        "3M": sliceFor(cutoffs["3M"]).map((r) => formatDate(r.navDate)),
        "6M": sliceFor(cutoffs["6M"]).map((r) => formatDate(r.navDate)),
        "1Y": sliceFor(cutoffs["1Y"]).map((r) => formatDate(r.navDate)),
        "SI": allHistory.map((r) => formatDate(r.navDate)),
      } as Record<PeriodKey, string[]>;

      return {
        schemeCode: s.schemeCode,
        name: s.name,
        fundName: s.fundName,
        amc: s.amc,
        companyName: s.companyName,
        strategy: s.strategy,
        category: strategyToCategory(s.strategy),
        plan: s.plan,
        nav: parseFloat(s.nav),
        navDate: s.navDate,
        isin: s.isin,
        aum: aumByName.get(s.fundName) ?? (s as any).aum ?? null,
        returns: {
          "1M": s.return1m ? parseFloat(s.return1m) : null,
          "3M": s.return3m ? parseFloat(s.return3m) : null,
          "6M": s.return6m ? parseFloat(s.return6m) : null,
          "1Y": s.return1y ? parseFloat(s.return1y) : null,
          "SI": allHistory.length > 1
            ? annualizedReturn(
                allHistory[allHistory.length - 1].nav,
                allHistory[0].nav,
                allHistory[0].navDate,
                allHistory[allHistory.length - 1].navDate
              )
            : null,
        },
        sharpes,
        drawdowns,
        sparklines,
        sparklineDates,
        riskBand: riskBandByName.get(s.fundName) ?? null,
      };
    });

  return funds;
}

export async function getTickerNavs(): Promise<TickerNav[]> {
  const { schemes, navs } = await getCollections();

  // Only Regular plan Growth schemes for the ticker
  const regularSchemes = await schemes
    .find({ plan: "Regular", option: "Growth" }, { projection: { schemeCode: 1, schemeName: 1, fundName: 1, amc: 1 } })
    .limit(12)
    .toArray();

  const items: TickerNav[] = [];

  for (const s of regularSchemes) {
    const code = s.schemeCode as string;

    // Latest two NAV records to compute daily change
    const recent = await navs
      .find({ schemeCode: code }, { projection: { nav: 1, navDate: 1 } })
      .sort({ navDate: -1 })
      .limit(2)
      .toArray();

    if (recent.length === 0) continue;

    const latest = recent[0].nav as number;
    const prev = recent.length > 1 ? (recent[1].nav as number) : latest;
    const change = pct(latest, prev);

    // Use fundName (clean brand name) when available, else strip plan/option suffixes from schemeName
    const rawName = (s.fundName as string) || (s.schemeName as string);
    const name = rawName
      .replace(/- Growth.*$/i, "")
      .replace(/- Regular Plan.*$/i, "")
      .replace(/- Direct Plan.*$/i, "")
      .trim()
      .toUpperCase();

    items.push({
      label: name,
      value: latest.toFixed(4),
      change: (change >= 0 ? "+" : "") + change.toFixed(2) + "%",
      neg: change < 0,
    });
  }

  return items;
}

// ── Monthly Heatmap ───────────────────────────────────────────────────────────

export interface MonthlyHeatmapFund {
  schemeCode: string;
  name: string;
  strategy: string;
  category: "Equity" | "Hybrid";
  months: (number | null)[];
}

export async function getMonthlyHeatmapData(monthsBack = 7): Promise<{
  funds: MonthlyHeatmapFund[];
  monthLabels: string[];
}> {
  const { schemes, navs } = await getCollections();

  const now = new Date();
  const periods: { start: Date; end: Date; label: string }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() - i;
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    periods.push({
      start,
      end,
      label: start.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(" ", " '"),
    });
  }

  const allSchemes = await schemes
    .find({ plan: "Regular", option: "Growth" }, { projection: { schemeCode: 1, schemeName: 1, strategy: 1 } })
    .sort({ amc: 1 })
    .toArray();

  if (allSchemes.length === 0) return { funds: [], monthLabels: periods.map((p) => p.label) };

  const codes = allSchemes.map((s) => s.schemeCode as string);
  const rangeStart = periods[0].start;

  const allNavRecords = await navs
    .find(
      { schemeCode: { $in: codes }, navDate: { $gte: rangeStart } },
      { projection: { schemeCode: 1, nav: 1, navDate: 1 } },
    )
    .sort({ navDate: 1 })
    .toArray();

  const navsByCode = new Map<string, { nav: number; navDate: Date }[]>();
  for (const r of allNavRecords) {
    const code = r.schemeCode as string;
    if (!navsByCode.has(code)) navsByCode.set(code, []);
    navsByCode.get(code)!.push({ nav: r.nav as number, navDate: new Date(r.navDate) });
  }

  const funds: MonthlyHeatmapFund[] = [];
  for (const s of allSchemes) {
    const code = s.schemeCode as string;
    const records = navsByCode.get(code) ?? [];

    const monthReturns: (number | null)[] = periods.map(({ start, end }) => {
      const inMonth = records.filter((r) => r.navDate >= start && r.navDate <= end);
      if (inMonth.length < 2) return null;
      return pct(inMonth[inMonth.length - 1].nav, inMonth[0].nav);
    });

    if (monthReturns.every((v) => v === null)) continue;

    funds.push({
      schemeCode: code,
      name: s.schemeName as string,
      strategy: s.strategy as string,
      category: strategyToCategory(s.strategy as string),
      months: monthReturns,
    });
  }

  return { funds, monthLabels: periods.map((p) => p.label) };
}

// ── Fund Detail ───────────────────────────────────────────────────────────────

export interface FundVariant {
  schemeCode: string;
  plan: string;
  option: string;
  nav: number;
  isin: string | null;
}

export interface FundDetail {
  schemeCode: string;
  name: string;
  fundName: string;
  isin: string | null;
  amc: string;
  companyName: string;
  strategy: string;
  category: "Equity" | "Hybrid";
  plan: "Regular" | "Direct";
  option: string;
  nav: number;
  navDate: string;
  launchDate: string;
  aum: number | null;
  expenseRatio: number | null;
  benchmark: string | null;
  navHistory: { date: string; nav: number }[];
  returns: { YTD: number | null; "1M": number | null; "3M": number | null; "6M": number | null; "1Y": number | null; SI: number | null };
  sharpes: Record<PeriodKey, number | null>;
  drawdowns: Record<PeriodKey, number | null>;
  volatilities: Record<PeriodKey, number | null>;
  variants: FundVariant[];
}

function computeVolatility(records: { nav: number }[]): number | null {
  if (records.length < 15) return null;
  const rets: number[] = [];
  for (let i = 1; i < records.length; i++) {
    rets.push((records[i].nav - records[i - 1].nav) / records[i - 1].nav);
  }
  if (rets.length < 10) return null;
  const n = rets.length;
  const mean = rets.reduce((a, b) => a + b, 0) / n;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  return +(Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2);
}

// ── FundDetails (rich factsheet data) ────────────────────────────────────────

export interface FundDetailsData {
  riskBand: 1 | 2 | 3 | 4 | 5 | null;
  schemeType: string;
  exitLoad: string;
  aumCurrent: number | null;
  aumAggregate: number | null;
  minInvestment: number | null;
  additionalInvestment: number | null;
  fundManagers: { name: string; designation?: string }[];
  benchmarkName: string;
  benchmarkRiskBand: 1 | 2 | 3 | 4 | 5 | null;
  benchmarkDetails: string;
  assetAllocation: { assetClass: string; percentage: number }[];
  portfolioByIndustry: { industry: string; percentage: number }[];
  portfolioByRatingClass: { ratingClass: string; percentage: number }[];
  topHoldings: { name: string; percentage: number; sector?: string; rating?: string }[];
  factsheets: { url: string; filename: string; documentType?: string; uploadedAt: string }[];
  suitableFor: string;
  notSuitableFor: string;
  bullMarket: string;
  bearMarket: string;
  sidewaysMarket: string;
  howItWorks: string;
  mfEquivalent: string;
  portfolioFit: string;
}

const RISK_BAND_STRING_MAP: Record<string, 1 | 2 | 3 | 4 | 5> = {
  "Low Risk": 1, "Low to Moderate Risk": 2, "Moderate Risk": 3,
  "Moderately High Risk": 4, "High Risk": 5,
};

function normaliseRiskBand(v: unknown): 1 | 2 | 3 | 4 | 5 | null {
  if (v == null) return null;
  if (typeof v === "string") {
    if (RISK_BAND_STRING_MAP[v]) return RISK_BAND_STRING_MAP[v];
    const n = parseInt(v, 10);
    if (n >= 1 && n <= 5) return n as 1 | 2 | 3 | 4 | 5;
    return null;
  }
  if (typeof v === "number" && v >= 1 && v <= 5) return Math.round(v) as 1 | 2 | 3 | 4 | 5;
  return null;
}

export async function getFundDetailsForName(fundName: string): Promise<FundDetailsData | null> {
  await connectDB();
  const db = mongoose.connection.db!;
  const escaped = fundName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const doc = await db.collection("funddetails").findOne(
    { fundName: { $regex: new RegExp(escaped, "i") } },
    { projection: { _id: 0, __v: 0 } },
  );
  if (!doc) return null;
  // JSON round-trip strips BSON ObjectIds (_id on subdocuments) and converts Dates to strings —
  // required so the result can be passed as a plain prop to Client Components.
  const data = JSON.parse(JSON.stringify(doc)) as FundDetailsData;
  data.riskBand = normaliseRiskBand(data.riskBand);
  data.benchmarkRiskBand = normaliseRiskBand(data.benchmarkRiskBand);
  return data;
}

export async function getFundDetail(code: string): Promise<FundDetail | null> {
  const { schemes, navs } = await getCollections();

  const upperCode = code.toUpperCase();
  const scheme = await schemes.findOne({ schemeCode: upperCode }, { projection: { _id: 0 } });
  if (!scheme) return null;

  const schemeCode = scheme.schemeCode as string;

  const rawNavs = await navs
    .find({ schemeCode }, { projection: { nav: 1, navDate: 1, _id: 0 } })
    .sort({ navDate: 1 })
    .toArray();

  if (rawNavs.length === 0) return null;

  const allHistory = rawNavs.map((r) => ({
    nav: r.nav as number,
    navDate: new Date(r.navDate),
  }));

  const latest = allHistory[allHistory.length - 1];
  const first = allHistory[0];
  const latestDate = latest.navDate;

  const cutoffs = {
    "1M": subMonths(latestDate, 1),
    "3M": subMonths(latestDate, 3),
    "6M": subMonths(latestDate, 6),
    "1Y": subYears(latestDate, 1),
  };

  const sliceFor = (cutoff: Date) => {
    const idx = lastIdxOnOrBefore(allHistory, cutoff);
    return idx >= 0 ? allHistory.slice(idx) : allHistory.filter((r) => r.navDate >= cutoff);
  };

  const ytdCutoff = new Date(Date.UTC(latestDate.getUTCFullYear(), 0, 1));
  const ytdIdx = lastIdxOnOrBefore(allHistory, ytdCutoff);
  const ytdSlice = ytdIdx >= 0 ? allHistory.slice(ytdIdx) : allHistory;

  const slice1m = sliceFor(cutoffs["1M"]);
  const slice3m = sliceFor(cutoffs["3M"]);
  const slice6m = sliceFor(cutoffs["6M"]);
  const slice1y = sliceFor(cutoffs["1Y"]);

  const computeReturn = (slice: typeof allHistory): number | null =>
    slice.length >= 2 ? pct(slice[slice.length - 1].nav, slice[0].nav) : null;

  const fundNameValue = (scheme.fundName as string) || (scheme.schemeName as string);

  // Fetch all variants sharing the same fundName
  const variantDocs = await schemes
    .find({ fundName: fundNameValue }, { projection: { schemeCode: 1, plan: 1, option: 1, isinGrowth: 1, isinReinvestment: 1, _id: 0 } })
    .toArray();

  const variantNavs = await Promise.all(
    variantDocs.map(async (v) => {
      const latest = await navs.findOne(
        { schemeCode: v.schemeCode as string },
        { projection: { nav: 1, _id: 0 }, sort: { navDate: -1 } }
      );
      const navVal = latest ? (latest.nav as number) : 0;
      const isinG = (v.isinGrowth as string) || null;
      const isinR = (v.isinReinvestment as string) || null;
      const entries: FundVariant[] = [
        { schemeCode: v.schemeCode as string, plan: v.plan as string, option: v.option as string, nav: navVal, isin: isinG },
      ];
      // If this is an IDCW record with a reinvestment ISIN, add a virtual IDCW Reinvestment variant
      if ((v.option as string).toLowerCase().includes("idcw") && !(v.option as string).toLowerCase().includes("reinvest") && isinR) {
        entries.push({ schemeCode: v.schemeCode as string, plan: v.plan as string, option: "IDCW Reinvestment", nav: navVal, isin: isinR });
      }
      return entries;
    })
  );

  const flatVariantNavs = variantNavs.flat();

  // Filter to Regular plan only, dedupe by option (current scheme wins ties)
  const regularVariants = flatVariantNavs.filter((v) => v.plan === "Regular");
  regularVariants.sort((a, b) => (b.schemeCode === schemeCode ? 1 : 0) - (a.schemeCode === schemeCode ? 1 : 0));
  const seen = new Set<string>();
  const samePlanVariants = regularVariants.filter((v) => {
    const key = v.option.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const OPTION_ORDER = ["Growth", "IDCW", "IDCW Reinvestment", "IDCW Reinvest"];
  samePlanVariants.sort((a, b) => {
    const ai = OPTION_ORDER.findIndex((o) => a.option.toLowerCase().includes(o.toLowerCase()));
    const bi = OPTION_ORDER.findIndex((o) => b.option.toLowerCase().includes(o.toLowerCase()));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // isinGrowth holds the primary ISIN for any record (Growth ISIN or IDCW ISIN)
  // isinReinvestment is only for the virtual "IDCW Reinvestment" variant
  const isin = (scheme.isinGrowth as string) || null;

  return {
    schemeCode,
    name: scheme.schemeName as string,
    fundName: fundNameValue,
    isin,
    amc: scheme.amc as string,
    companyName: (scheme.companyName as string) || (scheme.amc as string),
    strategy: scheme.strategy as string,
    category: strategyToCategory(scheme.strategy as string),
    plan: scheme.plan as "Regular" | "Direct",
    option: scheme.option as string,
    nav: latest.nav,
    navDate: formatDate(latestDate),
    launchDate: formatDate(first.navDate),
    aum: (scheme as any).aum ?? null,
    expenseRatio: null,
    benchmark: null,
    navHistory: allHistory.map((r) => ({ date: formatDate(r.navDate), nav: r.nav })),
    returns: {
      YTD: computeReturn(ytdSlice),
      "1M": computeReturn(slice1m),
      "3M": computeReturn(slice3m),
      "6M": computeReturn(slice6m),
      "1Y": computeReturn(slice1y),
      SI: annualizedReturn(latest.nav, first.nav, first.navDate, latestDate),
    },
    sharpes: {
      "1M": computeSharpe(slice1m),
      "3M": computeSharpe(slice3m),
      "6M": computeSharpe(slice6m),
      "1Y": computeSharpe(slice1y),
      SI: computeSharpe(allHistory),
    },
    drawdowns: {
      "1M": computeMaxDrawdown(slice1m),
      "3M": computeMaxDrawdown(slice3m),
      "6M": computeMaxDrawdown(slice6m),
      "1Y": computeMaxDrawdown(slice1y),
      SI: computeMaxDrawdown(allHistory),
    },
    volatilities: {
      "1M": computeVolatility(slice1m),
      "3M": computeVolatility(slice3m),
      "6M": computeVolatility(slice6m),
      "1Y": computeVolatility(slice1y),
      SI: computeVolatility(allHistory),
    },
    variants: samePlanVariants,
  };
}

// ── Monthly Performance Reports ──────────────────────────────────────────────

export interface MonthlyReportFundRow {
  schemeCode: string;
  fundName: string;
  amc: string;
  inceptionDate: string;
  monthlyReturn: number;
  sinceInceptionReturn: number | null;
}

export interface MonthlyPerformanceData {
  monthKey: string;
  label: string;
  rangeStart: string;
  rangeEnd: string;
  isCurrentMonth: boolean;
  funds: MonthlyReportFundRow[];
  excludedCount: number;
  bestPerformer: MonthlyReportFundRow | null;
  worstPerformer: MonthlyReportFundRow | null;
  avgReturn: number | null;
  positiveCount: number;
  negativeCount: number;
}

export function monthKeyToLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function monthKeyToSlug(monthKey: string): string {
  return monthKeyToLabel(monthKey).toLowerCase().replace(/\s+/g, "-");
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Computes a month's SIF performance table (Direct • Growth) directly from stored NAV history. */
export async function getMonthlyPerformanceData(monthKey: string): Promise<MonthlyPerformanceData | null> {
  const m = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = parseInt(m[1]);
  const month = parseInt(m[2]);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const now = new Date();
  const isCurrentMonth = now.getUTCFullYear() === year && now.getUTCMonth() + 1 === month;
  const effectiveEnd = isCurrentMonth ? now : end;

  const { schemes, navs } = await getCollections();

  const allSchemes = await schemes
    .find({ plan: "Direct", option: "Growth" }, { projection: { schemeCode: 1, schemeName: 1, amc: 1, companyName: 1 } })
    .toArray();
  if (!allSchemes.length) return null;

  const codes = allSchemes.map((s) => s.schemeCode as string);
  const allNavRecords = await navs
    .find({ schemeCode: { $in: codes }, navDate: { $lte: effectiveEnd } }, { projection: { schemeCode: 1, nav: 1, navDate: 1 } })
    .sort({ navDate: 1 })
    .toArray();

  const navsByCode = new Map<string, { nav: number; navDate: Date }[]>();
  for (const r of allNavRecords) {
    const code = r.schemeCode as string;
    if (!navsByCode.has(code)) navsByCode.set(code, []);
    navsByCode.get(code)!.push({ nav: r.nav as number, navDate: new Date(r.navDate) });
  }

  const funds: MonthlyReportFundRow[] = [];
  let excludedCount = 0;

  for (const s of allSchemes) {
    const code = s.schemeCode as string;
    const records = navsByCode.get(code) ?? [];
    if (!records.length) continue;

    const first = records[0];
    if (first.navDate > end) { excludedCount++; continue; } // not yet launched in this month

    const inMonth = records.filter((r) => r.navDate >= start && r.navDate <= end);
    if (inMonth.length < 2) { excludedCount++; continue; }

    const latest = records[records.length - 1];
    funds.push({
      schemeCode: code,
      fundName: (s.schemeName as string).replace(/\s*-\s*(Direct|Regular)\s*Plan.*$/i, "").replace(/\s*-\s*Growth.*$/i, "").trim(),
      amc: (s.companyName as string) || (s.amc as string),
      inceptionDate: formatDate(first.navDate),
      monthlyReturn: pct(inMonth[inMonth.length - 1].nav, inMonth[0].nav),
      sinceInceptionReturn: pct(latest.nav, first.nav),
    });
  }

  funds.sort((a, b) => b.monthlyReturn - a.monthlyReturn);

  const positiveCount = funds.filter((f) => f.monthlyReturn >= 0).length;
  const negativeCount = funds.filter((f) => f.monthlyReturn < 0).length;
  const avgReturn = funds.length
    ? +(funds.reduce((sum, f) => sum + f.monthlyReturn, 0) / funds.length).toFixed(2)
    : null;

  return {
    monthKey,
    label: monthKeyToLabel(monthKey),
    rangeStart: formatDate(start),
    rangeEnd: isCurrentMonth ? "present" : formatDate(end),
    isCurrentMonth,
    funds,
    excludedCount,
    bestPerformer: funds[0] ?? null,
    worstPerformer: funds.length ? funds[funds.length - 1] : null,
    avgReturn,
    positiveCount,
    negativeCount,
  };
}

export interface LatestReportSummary {
  monthKey: string;
  slug: string;
  label: string;
  summary: string;
  niftyReturn: number | null;
  data: MonthlyPerformanceData | null;
}

/** Latest published monthly report plus its live-computed performance data, for the homepage banner. */
export async function getLatestPublishedReport(): Promise<LatestReportSummary | null> {
  await connectDB();
  const report = await PerformanceReport.findOne({ published: true }).sort({ monthKey: -1 }).lean();
  if (!report) return null;

  const data = await getMonthlyPerformanceData(report.monthKey);

  return {
    monthKey: report.monthKey,
    slug: report.slug,
    label: report.label,
    summary: report.summary,
    niftyReturn: report.niftyReturn,
    data,
  };
}

export interface FaqGroup {
  category: string;
  items: { question: string; answer: string }[];
}

/** Published FAQs grouped by category, in admin-defined order, for the homepage FAQ section. */
export async function getPublishedFaqs(): Promise<FaqGroup[]> {
  await connectDB();
  const [Faq, FaqCategory] = await Promise.all([
    (await import("@/models/Faq")).default,
    (await import("@/models/FaqCategory")).default,
  ]);

  const [faqs, catDoc] = await Promise.all([
    Faq.find({ published: true }).sort({ category: 1, order: 1, createdAt: 1 }).lean(),
    FaqCategory.findOne({}).lean(),
  ]);

  const categories = catDoc?.categories ?? ["General"];
  const groups: FaqGroup[] = [];
  for (const cat of categories) {
    const items = faqs
      .filter((f) => f.category === cat)
      .map((f) => ({ question: f.question, answer: f.answer }));
    if (items.length) groups.push({ category: cat, items });
  }
  return groups;
}
