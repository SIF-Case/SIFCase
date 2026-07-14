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

  await connectDB();
  const { slug } = await params;
  
  // Special handling for June 2026 report
  if (slug === "June-2026") {
    try {
      await logClientActivity(userId, "Booklet", `Downloaded report booklet: June 2026`);
    } catch (err) {
      console.error("Booklet download activity logger error:", err);
    }

    // Serve the PDF file from public directory
    const filePath = path.join(process.cwd(), "public", "reports", "SIF-Monthly-Report-June2026.pdf");
    
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="SIF-Monthly-Report-June2026.pdf"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } else {
      console.error("PDF file not found at:", filePath);
      return NextResponse.json({ 
        error: "PDF file not found. Please ensure the file is placed at public/reports/SIF-Monthly-Report-June2026.pdf" 
      }, { status: 404 });
    }
  }

  // Fallback to database pdfUrl for other reports
  const report = await PerformanceReport.findOne({ slug, published: true }).lean();
  if (!report || !report.pdfUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await logClientActivity(userId, "Booklet", `Downloaded report booklet: ${report.label || slug}`);
  } catch (err) {
    console.error("Booklet download activity logger error:", err);
  }

  return NextResponse.redirect(report.pdfUrl);
}
