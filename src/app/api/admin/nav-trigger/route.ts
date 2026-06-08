import { NextRequest, NextResponse } from "next/server";
import { hasAnyPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import CronLog from "@/models/CronLog";
import { fetchAndStoreSIFNav } from "@/lib/navFetcher";

export async function POST(req: NextRequest) {
  if (!await hasAnyPageAccess(req, ["funds", "schemes"], "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const start = Date.now();
  try {
    const data = await fetchAndStoreSIFNav();
    const duration = Date.now() - start;
    const ok = data.errors.length === 0;

    await connectDB();
    await CronLog.create({
      job: "manual-nav-fetch",
      status: ok ? "success" : "error",
      message: ok ? `Manual trigger succeeded` : data.errors[0],
      fundsUpdated: data.upserted ?? 0,
      duration,
    });

    return NextResponse.json({ ok, duration, success: ok, ...data, timestamp: new Date().toISOString() });
  } catch (e: unknown) {
    await connectDB();
    await CronLog.create({
      job: "manual-nav-fetch",
      status: "error",
      message: (e as Error).message,
      duration: Date.now() - start,
    });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
