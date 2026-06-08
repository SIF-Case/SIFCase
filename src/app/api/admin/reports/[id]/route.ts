import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { summary, niftyReturn, pdfUrl, pdfFilename, published } = body;

    const update: Record<string, unknown> = {};
    if (summary !== undefined) update.summary = summary;
    if (niftyReturn !== undefined) update.niftyReturn = niftyReturn != null && niftyReturn !== "" ? Number(niftyReturn) : null;
    if (pdfUrl !== undefined) update.pdfUrl = pdfUrl;
    if (pdfFilename !== undefined) update.pdfFilename = pdfFilename;
    if (published !== undefined) update.published = !!published;

    const report = await PerformanceReport.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;
    await PerformanceReport.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
