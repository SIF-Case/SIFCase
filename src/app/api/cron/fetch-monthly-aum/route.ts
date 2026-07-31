import { fetchAndStoreMonthlyAum } from "@/lib/monthlyAumFetcher";
import { connectDB } from "@/lib/mongodb";
import CronLog from "@/models/CronLog";
import { revalidateTag } from "next/cache";

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const result = await fetchAndStoreMonthlyAum();

  await connectDB();
  await CronLog.create({
    job: "scheduled-monthly-aum-fetch",
    status: result.ok ? "success" : "error",
    message: result.message ?? `Fetched Grand Total AUM for ${result.periodLabel}: ₹${result.totalAumCr} Cr`,
    duration: Date.now() - start,
  });

  if (result.docFound) {
    // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
    revalidateTag("sif-data");
  }

  return Response.json({ ...result, timestamp: new Date().toISOString() });
}
