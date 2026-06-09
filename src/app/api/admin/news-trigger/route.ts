import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { fetchAndStoreNews } from "@/lib/newsFetcher";
import { connectDB } from "@/lib/mongodb";
import CronLog from "@/models/CronLog";

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "news", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const start = Date.now();
  try {
    const result = await fetchAndStoreNews();
    await connectDB();
    await CronLog.create({
      job: "manual-news-fetch",
      status: "success",
      message: `Fetched ${result.fetched} items, stored ${result.stored} new`,
      duration: Date.now() - start,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    await connectDB();
    await CronLog.create({
      job: "manual-news-fetch",
      status: "error",
      message: err instanceof Error ? err.message : String(err),
      duration: Date.now() - start,
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
