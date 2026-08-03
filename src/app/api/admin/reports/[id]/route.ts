import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";
import { reportPatchFromBody } from "@/lib/reportAdmin";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await hasPageAccess(req, "fundDetails", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid report id" }, { status: 400 });

  const body = await req.json();
  const patch = reportPatchFromBody(body);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await connectDB();
  const report = await PerformanceReport.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
  revalidateTag("sif-data");
  return NextResponse.json({ report });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await hasPageAccess(req, "fundDetails", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();

  await PerformanceReport.deleteOne({ _id: new ObjectId(id) });

  // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
  revalidateTag("sif-data");
  return NextResponse.json({ ok: true });
}
