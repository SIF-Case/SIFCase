import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";

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

  const { reports } = await req.json();
  await connectDB();

  for (const report of reports) {
    if (report._id) {
      // Update existing
      await PerformanceReport.updateOne(
        { _id: report._id },
        {
          $set: {
            monthKey: report.monthKey,
            slug: report.slug,
            label: report.label,
            summary: report.summary || "",
            niftyReturn: report.niftyReturn,
            published: report.published,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Create new
      await PerformanceReport.create({
        monthKey: report.monthKey,
        slug: report.slug,
        label: report.label,
        summary: report.summary || "",
        niftyReturn: report.niftyReturn,
        published: report.published,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
