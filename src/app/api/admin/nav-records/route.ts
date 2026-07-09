import { NextRequest, NextResponse } from "next/server";
import { hasAnyPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const ALLOWED_PAGES = ["funds", "schemes"];

// Helper: subtract months or years from a date
function subtractPeriod(base: Date, period: string): Date {
  const d = new Date(base);
  d.setHours(23, 59, 59, 999);
  if (period === "1m") d.setMonth(d.getMonth() - 1);
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

// Get the very first NAV (inception) for each scheme in `codes`
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

export async function GET(req: NextRequest) {
  if (!await hasAnyPageAccess(req, ALLOWED_PAGES, "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const db = mongoose.connection.db!;
  const { searchParams } = new URL(req.url);

  // ── params ──────────────────────────────────────────────────────────────
  // toDate:  anchor date for return calculation (default = today)
  // q:       free-text scheme filter
  // export:  "1" → CSV export payload (same shape, full list)
  // ────────────────────────────────────────────────────────────────────────
  const toDateRaw = searchParams.get("toDate") ?? "";
  const q         = searchParams.get("q") ?? "";

  const toDate = toDateRaw ? new Date(toDateRaw) : new Date();
  toDate.setHours(23, 59, 59, 999);

  // Period anchor dates
  const d1m = subtractPeriod(toDate, "1m");
  const d3m = subtractPeriod(toDate, "3m");
  const d6m = subtractPeriod(toDate, "6m");
  const d1y = subtractPeriod(toDate, "1y");

  // ── Load schemes ────────────────────────────────────────────────────────
  const schemeFilter: Record<string, unknown> = {};
  if (q) {
    schemeFilter.$or = [
      { schemeName:        { $regex: q, $options: "i" } },
      { schemeCode:        { $regex: q, $options: "i" } },
      { amc:               { $regex: q, $options: "i" } },
      { brandName:         { $regex: q, $options: "i" } },
      { fundName:          { $regex: q, $options: "i" } },
      { isinGrowth:        { $regex: q, $options: "i" } },
      { companyName_short: { $regex: q, $options: "i" } },
    ];
  }

  const allSchemes = await db.collection("sifschemes")
    .find(schemeFilter, {
      projection: { schemeCode: 1, schemeName: 1, amc: 1, strategy: 1, plan: 1, option: 1 },
    })
    .sort({ amc: 1, schemeName: 1 })
    .toArray();

  const codes = allSchemes.map((s) => s.schemeCode as string);

  // ── Run 6 parallel NAV lookups ──────────────────────────────────────────
  const [navCurrent, nav1m, nav3m, nav6m, nav1y, navSI] = await Promise.all([
    navAtDate(db, codes, toDate),
    navAtDate(db, codes, d1m),
    navAtDate(db, codes, d3m),
    navAtDate(db, codes, d6m),
    navAtDate(db, codes, d1y),
    navAtInception(db, codes),
  ]);

  // ── Build per-scheme performance rows ───────────────────────────────────
  type SchemeRow = {
    schemeCode: string;
    schemeName: string;
    amc: string;
    strategy: string;
    plan: string;
    option: string;
    currentNav: number | null;
    currentNavDate: string | null;
    inceptionDate: string | null;
    returns: {
      "1m": number | null;
      "3m": number | null;
      "6m": number | null;
      "1y": number | null;
      si: number | null;
    };
  };

  const schemes: SchemeRow[] = allSchemes.map((s) => {
    const code = s.schemeCode as string;
    const curr = navCurrent[code]?.nav;
    return {
      schemeCode:     code,
      schemeName:     s.schemeName as string,
      amc:            s.amc as string,
      strategy:       s.strategy as string,
      plan:           s.plan as string,
      option:         s.option as string,
      currentNav:     curr ?? null,
      currentNavDate: navCurrent[code]?.navDate?.toISOString() ?? null,
      inceptionDate:  navSI[code]?.navDate?.toISOString() ?? null,
      returns: {
        "1m": pctReturn(curr, nav1m[code]?.nav),
        "3m": pctReturn(curr, nav3m[code]?.nav),
        "6m": pctReturn(curr, nav6m[code]?.nav),
        "1y": pctReturn(curr, nav1y[code]?.nav),
        si:   pctReturn(curr, navSI[code]?.nav),
      },
    };
  });

  // ── Category (strategy) averages ────────────────────────────────────────
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

  // ── Top / Bottom 3 by 1M return (schemes with valid 1M data only) ───────
  const withReturn = schemes.filter((s) => s.returns["1m"] !== null);
  const sorted1m   = [...withReturn].sort((a, b) => (b.returns["1m"] ?? 0) - (a.returns["1m"] ?? 0));
  const top3    = sorted1m.slice(0, 3);
  const bottom3 = [...sorted1m].reverse().slice(0, 3);

  return NextResponse.json({
    schemes,
    categoryAverages,
    top3,
    bottom3,
    total:  schemes.length,
    toDate: toDate.toISOString(),
  });
}
