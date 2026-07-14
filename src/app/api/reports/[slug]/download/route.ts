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
  
  // Hardcoded known reports (no database needed)
  const knownReports: Record<string, { label: string; monthKey: string; slug: string }> = {
    "may-2026": { label: "May 2026", monthKey: "2026-05", slug: "may-2026" },
    "june-2026": { label: "June 2026", monthKey: "2026-06", slug: "june-2026" },
  };
  
  const report = knownReports[slug];
  
  if (!report) {
    return NextResponse.json({ 
      error: "Report not found",
      availableSlugs: Object.keys(knownReports)
    }, { status: 404 });
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

  return NextResponse.json({ 
    error: `PDF file not found`,
    expectedPath: `public/reports/${fileName}`
  }, { status: 404 });
}
