import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import FundHouse from "@/models/FundHouse";
import mongoose from "mongoose";
import { revalidatePath, revalidateTag } from "next/cache";

// GET /api/admin/fund-houses
// Returns all unique brandNames from sifschemes, merged with any saved branding
export async function GET(req: NextRequest) {
  if (!(await hasPageAccess(req, "fundHouses", "view")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const db = mongoose.connection.db!;

  // All unique brand names from live data
  const brandNames: string[] = await db
    .collection("sifschemes")
    .distinct("brandName", { brandName: { $exists: true, $ne: "" } });

  // All saved branding records
  const saved = await FundHouse.find({}).lean();
  const savedMap = new Map(saved.map((s) => [s.brandName, s]));

  const result = brandNames.sort().map((bn) => {
    const rec = savedMap.get(bn);
    return {
      brandName: bn,
      logoUrl: rec?.logoUrl ?? "",
      overview: rec?.overview ?? "",
    };
  });

  return NextResponse.json(result);
}

// PUT /api/admin/fund-houses
// Body: { brandName: string, logoUrl?: string, overview?: string }
export async function PUT(req: NextRequest) {
  if (!(await hasPageAccess(req, "fundHouses", "edit")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { brandName, logoUrl, overview } = body as {
    brandName: string;
    logoUrl?: string;
    overview?: string;
  };

  if (!brandName?.trim())
    return NextResponse.json({ error: "brandName is required" }, { status: 400 });

  await connectDB();

  const update: Partial<{ logoUrl: string; overview: string }> = {};
  if (logoUrl !== undefined) update.logoUrl = logoUrl;
  if (overview !== undefined) update.overview = overview;

  const doc = await FundHouse.findOneAndUpdate(
    { brandName },
    { $set: update },
    { upsert: true, new: true, runValidators: true },
  ).lean();

  // Revalidate the fund houses listing page
  revalidatePath("/fund-houses");
  
  // Revalidate individual fund house detail page
  const slug = brandName.toLowerCase().replace(/\s+/g, "-");
  revalidatePath(`/fund-house/${slug}`);

  // Bust the unstable_cache tag so getFundHouseBySlug returns fresh data
  // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
  revalidateTag("sif-data");

  return NextResponse.json({ ok: true, doc });
}
