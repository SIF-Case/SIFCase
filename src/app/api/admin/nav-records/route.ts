import { NextRequest, NextResponse } from "next/server";
import { hasAnyPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// Shared with the funds admin pages
const ALLOWED_PAGES = ["funds", "schemes"];

export async function GET(req: NextRequest) {
  if (!await hasAnyPageAccess(req, ALLOWED_PAGES, "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const db = mongoose.connection.db!;
  const { searchParams } = new URL(req.url);

  // --- params -----------------------------------------------------------
  // toDate:   the "anchor" date (inclusive upper bound), default = today
  // period:   "1m" | "3m" | "6m" | "1y" — window going backward from toDate
  //           if omitted/invalid, no lower-bound is applied
  // q:        scheme code / name free-text search
  // export:   "1" to return ALL matching records (no pagination)
  // page / limit for paginated view
  // ----------------------------------------------------------------------

  const toDateRaw = searchParams.get("toDate") ?? "";
  const period    = searchParams.get("period") ?? "";
  const q         = searchParams.get("q") ?? "";
  const isExport  = searchParams.get("export") === "1";
  const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit     = isExport ? 100_000 : Math.min(200, Math.max(10, parseInt(searchParams.get("limit") ?? "100")));

  // Build upper bound date
  const toDate = toDateRaw ? new Date(toDateRaw) : new Date();
  toDate.setHours(23, 59, 59, 999); // inclusive end of day

  // Build lower bound date based on period
  let fromDate: Date | null = null;
  if (period) {
    const base = new Date(toDate);
    base.setHours(0, 0, 0, 0);
    if (period === "1m") base.setMonth(base.getMonth() - 1);
    else if (period === "3m") base.setMonth(base.getMonth() - 3);
    else if (period === "6m") base.setMonth(base.getMonth() - 6);
    else if (period === "1y") base.setFullYear(base.getFullYear() - 1);
    fromDate = base;
  }

  // Build NAV query
  const navQuery: Record<string, unknown> = {};
  const dateFilter: Record<string, Date> = { $lte: toDate };
  if (fromDate) dateFilter.$gte = fromDate;
  navQuery.navDate = dateFilter;

  // Resolve scheme codes when a search term is provided
  if (q) {
    const matchingSchemes = await db.collection("sifschemes").find({
      $or: [
        { schemeName:  { $regex: q, $options: "i" } },
        { schemeCode:  { $regex: q, $options: "i" } },
        { amc:         { $regex: q, $options: "i" } },
        { brandName:   { $regex: q, $options: "i" } },
        { fundName:    { $regex: q, $options: "i" } },
        { isinGrowth:  { $regex: q, $options: "i" } },
      ],
    }, { projection: { schemeCode: 1 } }).toArray();

    const codes = matchingSchemes.map((s) => s.schemeCode as string);
    navQuery.schemeCode = { $in: codes };
  }

  const [total, navDocs] = await Promise.all([
    db.collection("sifnavs").countDocuments(navQuery),
    db.collection("sifnavs")
      .find(navQuery)
      .sort({ navDate: -1, schemeCode: 1 })
      .skip(isExport ? 0 : (page - 1) * limit)
      .limit(limit)
      .toArray(),
  ]);

  // Enrich with scheme name
  const uniqueCodes = [...new Set(navDocs.map((d) => d.schemeCode as string))];
  const schemes = await db.collection("sifschemes")
    .find({ schemeCode: { $in: uniqueCodes } }, { projection: { schemeCode: 1, schemeName: 1, amc: 1 } })
    .toArray();
  const schemeMap = Object.fromEntries(schemes.map((s) => [s.schemeCode as string, s]));

  const records = navDocs.map((d) => ({
    schemeCode:  d.schemeCode,
    schemeName:  schemeMap[d.schemeCode as string]?.schemeName ?? "—",
    amc:         schemeMap[d.schemeCode as string]?.amc ?? "—",
    nav:         d.nav,
    repurchasePrice: d.repurchasePrice ?? null,
    salePrice:   d.salePrice ?? null,
    navDate:     d.navDate,
    source:      d.source,
    fetchedAt:   d.fetchedAt,
  }));

  return NextResponse.json({
    records,
    total,
    page,
    pages: Math.ceil(total / limit),
    fromDate: fromDate?.toISOString() ?? null,
    toDate: toDate.toISOString(),
  });
}
