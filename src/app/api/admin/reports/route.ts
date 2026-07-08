import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";
import { monthKeyToLabel, monthKeyToSlug } from "@/lib/sifData";
import { revalidateTag, revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const reports = await PerformanceReport.find().sort({ monthKey: -1 }).lean();
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const body = await req.json();
    const { monthKey, summary, niftyReturn, pdfUrl, pdfFilename, published } = body;

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json({ error: "monthKey must be in YYYY-MM format" }, { status: 400 });
    }

    const existing = await PerformanceReport.findOne({ monthKey });
    if (existing) return NextResponse.json({ error: "A report for this month already exists" }, { status: 409 });

    const report = await PerformanceReport.create({
      monthKey,
      slug: monthKeyToSlug(monthKey),
      label: monthKeyToLabel(monthKey),
      summary: summary || "",
      niftyReturn: niftyReturn != null && niftyReturn !== "" ? Number(niftyReturn) : null,
      pdfUrl: pdfUrl || "",
      pdfFilename: pdfFilename || "",
      published: !!published,
    });

    // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
    revalidateTag("sif-data");
    revalidatePath("/");
    revalidatePath(`/performance/${report.slug}`);
    return NextResponse.json({ ok: true, id: report._id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
