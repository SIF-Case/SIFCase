import { fetchAndStoreNews } from "@/lib/newsFetcher";
import { connectDB } from "@/lib/mongodb";
import CronLog from "@/models/CronLog";

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  let result;
  try {
    result = await fetchAndStoreNews();
    await connectDB();
    await CronLog.create({
      job: "scheduled-news-fetch",
      status: "success",
      message: `Fetched ${result.fetched} items, stored ${result.stored} new`,
      duration: Date.now() - start,
    });
  } catch (err) {
    await connectDB();
    await CronLog.create({
      job: "scheduled-news-fetch",
      status: "error",
      message: err instanceof Error ? err.message : String(err),
      duration: Date.now() - start,
    });
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }

  return Response.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
