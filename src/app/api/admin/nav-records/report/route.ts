import { NextRequest, NextResponse } from "next/server";
import { hasAnyPageAccess } from "@/lib/adminAuth";
import { buildReportModel, reportFileName } from "@/lib/reports/buildReportData";
import { renderReport } from "@/lib/reports/renderDocx";

const ALLOWED_PAGES = ["funds", "schemes"];

export async function POST(req: NextRequest) {
  if (!(await hasAnyPageAccess(req, ALLOWED_PAGES, "view"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let toDate = "";
  try {
    const body = await req.json();
    toDate = String(body.toDate || "");
  } catch { /* fallthrough */ }
  if (!toDate) return NextResponse.json({ error: "toDate required" }, { status: 400 });

  try {
    const model = await buildReportModel(toDate);
    const buf = renderReport(model);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${reportFileName(toDate)}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Report generation failed";
    // AMFI-prefixed errors (source PDF unavailable / failed reconciliation) are
    // actionable data-availability feedback for the admin, so surface them as
    // 502. Anything else may carry DB/internal detail — log it server-side and
    // return a generic message.
    if (/AMFI/.test(msg)) {
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    console.error(`[report] generation failed for toDate=${toDate}:`, e);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
