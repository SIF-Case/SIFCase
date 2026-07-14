import { NextRequest, NextResponse } from "next/server";
import { hasAnyPageAccess } from "@/lib/adminAuth";
import { computeSchemeReturns } from "@/lib/reports/navPerformance";

const ALLOWED_PAGES = ["funds", "schemes"];

export async function GET(req: NextRequest) {
  if (!await hasAnyPageAccess(req, ALLOWED_PAGES, "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  // ── params ──────────────────────────────────────────────────────────────
  // toDate : anchor date — returns are computed relative to this date.
  //          Also acts as existence filter: only schemes with at least one
  //          NAV record on or before this date are included.
  // plan   : "Regular" | "Direct" | "" (all) — default "Regular"
  // option : "Growth" | "IDCW" | ... | "" (all) — default "" (all)
  // q      : free-text scheme search
  // ────────────────────────────────────────────────────────────────────────
  const toDateRaw = searchParams.get("toDate") ?? "";
  // Default plan to "Regular" when not explicitly passed
  const plan      = searchParams.get("plan")   ?? "Regular";
  const option    = searchParams.get("option") ?? "";
  const q         = searchParams.get("q")      ?? "";

  const result = await computeSchemeReturns({ toDate: toDateRaw, plan, option, q });

  return NextResponse.json({
    ...result,
    // Echo back active filters so the client can display them
    activeFilters: { plan, option, q },
  });
}
