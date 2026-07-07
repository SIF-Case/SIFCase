/**
 * Cron endpoint to fetch risk band data
 * 
 * NOTE: AMFI does not provide a public API for risk band data.
 * This endpoint is a placeholder for when/if such an API becomes available.
 * 
 * Current solution: Manual upload via admin panel or XLS import script
 */

import { NextResponse } from "next/server";
import { fetchAndStoreRiskBands } from "@/lib/riskBandFetcher";
import { connectDB } from "@/lib/mongodb";
import CronLog from "@/models/CronLog";

export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const start = Date.now();
  const result = await fetchAndStoreRiskBands();
  const duration = Date.now() - start;

  // Log the result
  await CronLog.create({
    job: "fetch-risk-bands",
    status: result.errors.length === 0 ? "success" : "partial",
    duration,
    details: {
      fetched: result.fetched,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
    },
  });

  return NextResponse.json({
    success: true,
    ...result,
    duration,
  });
}
