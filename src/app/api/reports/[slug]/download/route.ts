import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";
import { logClientActivity } from "@/lib/activityLogger";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { slug } = await params;

  await connectDB();
  const report = await PerformanceReport.findOne({ slug, published: true }).lean();
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  try {
    await logClientActivity(userId, "Booklet", `Downloaded report booklet: ${report.label}`);
  } catch (err) {
    console.error("Booklet download activity logger error:", err);
  }

  const downloadName = `SIF-Monthly-Report-${report.label.replace(/\s+/g, "")}.pdf`;

  // Normal path: the PDF uploaded in /admin/settings, stored on Cloudinary.
  // Proxied rather than redirected so the file stays behind the sign-in gate.
  if (report.pdfUrl) {
    const upstream = await fetch(report.pdfUrl, { cache: "no-store" });
    if (!upstream.ok) {
      console.error(`[reports] upstream PDF ${report.pdfUrl} returned ${upstream.status}`);
      return NextResponse.json({ error: "Report PDF is unavailable" }, { status: 502 });
    }
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.pdfFilename || downloadName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  // Legacy fallback: reports created before PDF upload existed still ship as
  // files in public/reports (May 2026, June 2026).
  const filePath = path.join(process.cwd(), "public", "reports", downloadName);
  if (fs.existsSync(filePath)) {
    return new NextResponse(new Uint8Array(fs.readFileSync(filePath)), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return NextResponse.json({ error: "No PDF has been uploaded for this report" }, { status: 404 });
}
