import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  await connectDB();
  const { slug } = await params;
  const report = await PerformanceReport.findOne({ slug, published: true }).lean();
  if (!report || !report.pdfUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.redirect(report.pdfUrl);
}
