import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import CronLog from "@/models/CronLog";

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const start = Date.now();
  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/cron/fetch-nav`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const data = await res.json();
    const duration = Date.now() - start;

    await connectDB();
    await CronLog.create({
      job: "manual-nav-fetch",
      status: res.ok ? "success" : "error",
      message: res.ok ? `Manual trigger succeeded` : `HTTP ${res.status}`,
      fundsUpdated: data.updated ?? 0,
      duration,
    });

    return NextResponse.json({ ok: res.ok, duration, ...data });
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
