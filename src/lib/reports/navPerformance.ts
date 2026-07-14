import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import type { PerfRow, PerformanceData } from "./types";

// Helper: subtract months or years from a date
function subtractPeriod(base: Date, period: string): Date {
  const d = new Date(base);
  d.setHours(23, 59, 59, 999);
  if (period === "1m")      d.setMonth(d.getMonth() - 1);
  else if (period === "3m") d.setMonth(d.getMonth() - 3);
  else if (period === "6m") d.setMonth(d.getMonth() - 6);
  else if (period === "1y") d.setFullYear(d.getFullYear() - 1);
  return d;
}

// Get the closest NAV on or before `date` for each scheme in `codes`
async function navAtDate(
  db: mongoose.mongo.Db,
  codes: string[],
  date: Date
): Promise<Record<string, { nav: number; navDate: Date }>> {
  if (codes.length === 0) return {};
  const results = await db.collection("sifnavs").aggregate([
    { $match: { schemeCode: { $in: codes }, navDate: { $lte: date } } },
    { $sort: { schemeCode: 1, navDate: -1 } },
    { $group: { _id: "$schemeCode", nav: { $first: "$nav" }, navDate: { $first: "$navDate" } } },
  ]).toArray();
  return Object.fromEntries(
    results.map((r) => [r._id as string, { nav: r.nav as number, navDate: r.navDate as Date }])
  );
}

// Get the very first NAV ever (inception) for each scheme in `codes`
async function navAtInception(
  db: mongoose.mongo.Db,
  codes: string[]
): Promise<Record<string, { nav: number; navDate: Date }>> {
  if (codes.length === 0) return {};
  const results = await db.collection("sifnavs").aggregate([
    { $match: { schemeCode: { $in: codes } } },
    { $sort: { schemeCode: 1, navDate: 1 } },
    { $group: { _id: "$schemeCode", nav: { $first: "$nav" }, navDate: { $first: "$navDate" } } },
  ]).toArray();
  return Object.fromEntries(
    results.map((r) => [r._id as string, { nav: r.nav as number, navDate: r.navDate as Date }])
  );
}

function pctReturn(current: number | undefined, past: number | undefined): number | null {
  if (current == null || past == null || past === 0) return null;
  return ((current - past) / past) * 100;
}

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function fmtSince(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export interface RawSchemeRow {
  schemeCode: string;
  schemeName: string;
  amc: string;
  strategy: string;
  plan: string;
  option: string;
  currentNav: number | null;
  currentNavDate: string | null;
  inceptionDate: string | null;
  inceptionLabel: string | null; // e.g. "Jun-24"
  returns: {
    "1m": number | null;
    "3m": number | null;
    "6m": number | null;
    "1y": number | null;
    si: number | null;
  };
}

export async function computeSchemeReturns(opts: {
  toDate: string;
  plan: string;
  option: string;
  q?: string;
}): Promise<{
  schemes: RawSchemeRow[];
  categoryAverages: Record<string, Record<string, number | null>>;
  top3: RawSchemeRow[];
  bottom3: RawSchemeRow[];
  total: number;
  toDate: string;
}> {
  const { toDate: toDateRaw, plan, option, q = "" } = opts;

  await connectDB();
  const db = mongoose.connection.db!;

  const toDate = toDateRaw ? new Date(toDateRaw) : new Date();
  toDate.setHours(23, 59, 59, 999);

  // Period anchor dates
  const d1m = subtractPeriod(toDate, "1m");
  const d3m = subtractPeriod(toDate, "3m");
  const d6m = subtractPeriod(toDate, "6m");
  const d1y = subtractPeriod(toDate, "1y");

  // ── Build scheme filter ─────────────────────────────────────────────────
  const andClauses: object[] = [];

  // Plan filter (empty string = all plans)
  if (plan) andClauses.push({ plan });

  // Option filter (empty string = all options)
  if (option) andClauses.push({ option });

  // Free-text search
  if (q) {
    andClauses.push({
      $or: [
        { schemeName:        { $regex: q, $options: "i" } },
        { schemeCode:        { $regex: q, $options: "i" } },
        { amc:               { $regex: q, $options: "i" } },
        { brandName:         { $regex: q, $options: "i" } },
        { fundName:          { $regex: q, $options: "i" } },
        { isinGrowth:        { $regex: q, $options: "i" } },
        { companyName_short: { $regex: q, $options: "i" } },
      ],
    });
  }

  const schemeFilter = andClauses.length > 0 ? { $and: andClauses } : {};

  const allSchemes = await db.collection("sifschemes")
    .find(schemeFilter, {
      projection: { schemeCode: 1, schemeName: 1, amc: 1, strategy: 1, plan: 1, option: 1 },
    })
    .sort({ amc: 1, schemeName: 1 })
    .toArray();

  const allCodes = allSchemes.map((s) => s.schemeCode as string);

  // ── Run 6 parallel NAV lookups ──────────────────────────────────────────
  const [navCurrent, nav1m, nav3m, nav6m, nav1y, navSI] = await Promise.all([
    navAtDate(db, allCodes, toDate),
    navAtDate(db, allCodes, d1m),
    navAtDate(db, allCodes, d3m),
    navAtDate(db, allCodes, d6m),
    navAtDate(db, allCodes, d1y),
    navAtInception(db, allCodes),
  ]);

  // ── Build per-scheme performance rows ───────────────────────────────────
  // KEY RULE: Only include schemes that have a current NAV on or before
  // toDate. Schemes launched after toDate have no entry in navCurrent and
  // are silently excluded — this prevents future funds from appearing with
  // all-N/A rows.
  const schemes: RawSchemeRow[] = [];
  for (const s of allSchemes) {
    const code = s.schemeCode as string;
    const currEntry = navCurrent[code];

    // ← Existence gate: skip schemes with no NAV as of toDate
    if (!currEntry) continue;

    const curr = currEntry.nav;
    const incEntry = navSI[code];

    schemes.push({
      schemeCode:     code,
      schemeName:     s.schemeName as string,
      amc:            s.amc as string,
      strategy:       s.strategy as string,
      plan:           s.plan as string,
      option:         s.option as string,
      currentNav:     curr,
      currentNavDate: currEntry.navDate.toISOString(),
      inceptionDate:  incEntry?.navDate?.toISOString() ?? null,
      inceptionLabel: incEntry?.navDate ? fmtSince(incEntry.navDate) : null,
      returns: {
        "1m": pctReturn(curr, nav1m[code]?.nav),
        "3m": pctReturn(curr, nav3m[code]?.nav),
        "6m": pctReturn(curr, nav6m[code]?.nav),
        "1y": pctReturn(curr, nav1y[code]?.nav),
        si:   pctReturn(curr, incEntry?.nav),
      },
    });
  }

  // ── Category (strategy) averages — computed over visible schemes only ───
  type PeriodKey = "1m" | "3m" | "6m" | "1y" | "si";
  const PERIODS: PeriodKey[] = ["1m", "3m", "6m", "1y", "si"];
  const catBuckets: Record<string, Record<PeriodKey, number[]>> = {};

  for (const s of schemes) {
    const cat = s.strategy ?? "Unknown";
    if (!catBuckets[cat]) {
      catBuckets[cat] = { "1m": [], "3m": [], "6m": [], "1y": [], si: [] };
    }
    for (const p of PERIODS) {
      if (s.returns[p] !== null) catBuckets[cat][p].push(s.returns[p]!);
    }
  }

  const categoryAverages: Record<string, Record<string, number | null>> = {};
  for (const [cat, data] of Object.entries(catBuckets)) {
    categoryAverages[cat] = {};
    for (const p of PERIODS) {
      categoryAverages[cat][p] = avg(data[p]);
    }
  }

  // ── Top / Bottom 3 by 1M return ─────────────────────────────────────────
  const withReturn = schemes.filter((s) => s.returns["1m"] !== null);
  const sorted1m   = [...withReturn].sort((a, b) => (b.returns["1m"] ?? 0) - (a.returns["1m"] ?? 0));
  const top3    = sorted1m.slice(0, 3);
  const bottom3 = [...sorted1m].reverse().slice(0, 3);

  return {
    schemes,
    categoryAverages,
    top3,
    bottom3,
    total: schemes.length,
    toDate: toDate.toISOString(),
  };
}

export function shortCategoryOf(strategy: string): string {
  const s = (strategy || "").toLowerCase();
  if (s.includes("ex-top 100")) return "Ex-100 L-S";
  if (s.includes("sector rotation")) return "Sector R L-S";
  if (s.includes("active asset allocator")) return "AAA L-S";
  if (s.includes("hybrid")) return "Hybrid L-S";
  if (s.includes("equity")) return "Equity L-S";
  if (s.includes("debt")) return "Debt L-S";
  return strategy || "—";
}

function isEquity(strategy: string): boolean {
  const s = (strategy || "").toLowerCase();
  return s.includes("equity") || s.includes("sector rotation");
}
function isHybrid(strategy: string): boolean {
  const s = (strategy || "").toLowerCase();
  return s.includes("hybrid") || s.includes("active asset allocator");
}
function isDebt(strategy: string): boolean {
  return (strategy || "").toLowerCase().includes("debt") && !isHybrid(strategy);
}

function toPerfRow(r: RawSchemeRow): PerfRow {
  return {
    schemeName: r.schemeName, category: r.strategy, shortCategory: shortCategoryOf(r.strategy),
    amc: r.amc, r1m: r.returns["1m"], r3m: r.returns["3m"], r6m: r.returns["6m"],
    r1y: r.returns["1y"], si: r.returns.si, since: r.inceptionLabel,
  };
}

export async function computeReportPerformance(toDate: string): Promise<PerformanceData> {
  const { schemes } = await computeSchemeReturns({ toDate, plan: "Regular", option: "Growth" });
  const rows = schemes.map(toPerfRow);
  const byName = (a: PerfRow, b: PerfRow) => a.schemeName.localeCompare(b.schemeName);
  const comprehensive = [...rows].sort(byName);
  const equity = comprehensive.filter((r) => isEquity(r.category));
  const hybrid = comprehensive.filter((r) => isHybrid(r.category));
  const debt = comprehensive.filter((r) => isDebt(r.category));
  const with1m = rows.filter((r) => r.r1m !== null);
  const sorted = [...with1m].sort((a, b) => (b.r1m ?? 0) - (a.r1m ?? 0));
  const top3 = sorted.slice(0, 3);
  const bottom3 = [...sorted].reverse().slice(0, 3);
  const positive = rows.filter((r) => (r.r1m ?? -Infinity) > 0).length;
  const negative = rows.filter((r) => r.r1m !== null && r.r1m < 0).length;
  return { equity, hybrid, debt, comprehensive, top3, bottom3, totals: { schemes: rows.length, positive, negative } };
}
