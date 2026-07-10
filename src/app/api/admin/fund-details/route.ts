import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import FundDetails from "@/models/FundDetails";
import SIFScheme from "@/models/SIFScheme";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "fundDetails", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const { searchParams } = new URL(req.url);

  if (searchParams.get("list") === "1") {
    // Return both brandNames (for the filter) and fundNames (optionally filtered by brand)
    const brand = searchParams.get("brand");
    const query: Record<string, unknown> = { plan: "Regular" };
    if (brand) query.brandName = brand;

    const [fundNames, brandNames] = await Promise.all([
      SIFScheme.distinct("fundName", query),
      SIFScheme.distinct("brandName", { plan: "Regular" }),
    ]);
    return NextResponse.json({
      fundNames: fundNames.filter(Boolean).sort(),
      brandNames: brandNames.filter(Boolean).sort(),
    });
  }

  const fundName = searchParams.get("fundName");
  if (!fundName) return NextResponse.json({ error: "fundName required" }, { status: 400 });

  const [detail, scheme] = await Promise.all([
    FundDetails.findOne({ fundName }).lean(),
    SIFScheme.findOne({ fundName, plan: "Regular" }, { isinGrowth: 1, _id: 0 }).lean(),
  ]);
  return NextResponse.json({ detail: detail ?? null, isinGrowth: scheme?.isinGrowth ?? "" });
}
