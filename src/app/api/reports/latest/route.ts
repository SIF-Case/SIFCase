import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";
import { getMonthlyPerformanceData } from "@/lib/sifData";

export async function GET() {
  await connectDB();
  const report = await PerformanceReport.findOne({ published: true }).sort({ monthKey: -1 }).lean();
  if (!report) return NextResponse.json({ report: null });

  const data = await getMonthlyPerformanceData(report.monthKey);

  return NextResponse.json({
    report: {
      monthKey: report.monthKey,
      slug: report.slug,
      label: report.label,
      summary: report.summary,
      niftyReturn: report.niftyReturn,
    },
    data,
  });
}
