import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";
import { monthKeyToLabel, monthKeyToSlug, reportFieldsFromBody } from "@/lib/reportAdmin";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "fundDetails", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const reports = await PerformanceReport.find({}).sort({ monthKey: -1 }).lean();

  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "fundDetails", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const monthKey = String(body.monthKey || "");
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return NextResponse.json({ error: "Month must be in YYYY-MM format" }, { status: 400 });
  }

  await connectDB();
  // monthKey and slug are unique — a duplicate would otherwise surface as a raw
  // Mongo E11000 the admin can't act on.
  if (await PerformanceReport.exists({ monthKey })) {
    return NextResponse.json({ error: `A report for ${monthKeyToLabel(monthKey)} already exists` }, { status: 409 });
  }

  const report = await PerformanceReport.create({
    monthKey,
    slug: monthKeyToSlug(monthKey),
    label: monthKeyToLabel(monthKey),
    ...reportFieldsFromBody(body),
  });

  // The homepage banner reads through unstable_cache under the shared sif-data
  // tag, so a new or edited report stays invisible until that tag is busted.
  // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
  revalidateTag("sif-data");

  return NextResponse.json({ report });
}
