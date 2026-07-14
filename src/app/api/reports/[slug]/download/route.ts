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
  
  // Dynamic handling for any report slug
  const report = await PerformanceReport.findOne({ slug, published: true }).lean();
  
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  try {
    await logClientActivity(userId, "Booklet", `Downloaded report booklet: ${report.label}`);
  } catch (err) {
    console.error("Booklet download activity logger error:", err);
  }

  // Serve the PDF file from public directory
  const fileName = `SIF-Monthly-Report-${report.label.replace(/\s+/g, "")}.pdf`;
  const filePath = path.join(process.cwd(), "public", "reports", fileName);
  
  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Fallback to pdfUrl if file doesn't exist locally
  if (report.pdfUrl) {
    return NextResponse.redirect(report.pdfUrl);
  }

  console.error("PDF file not found at:", filePath);
  return NextResponse.json({ 
    error: `PDF file not found. Please ensure the file is placed at public/reports/${fileName}` 
  }, { status: 404 });
}
