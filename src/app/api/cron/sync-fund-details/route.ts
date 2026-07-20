import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import CronLog from "@/models/CronLog";
import { syncAllFundDetailsFromFinApi } from "@/lib/fundDetailsSync";

// Daily refresh of every fund's details from finapi (https://finapi.upvaly.com).
// Scheduled in vercel.json at 07:00 UTC — after fetch-nav (03:30) and fetch-nfos
// (05:00), because this job matches ISINs against SIFScheme and wants the freshest
// scheme rows to work from.

export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  // ?limit=N caps funds for a manual smoke test. The scheduled run passes nothing.
  const limitParam = new URL(request.url).searchParams.get("limit");
  const limitFunds = limitParam ? Math.max(1, Number(limitParam) || 0) : undefined;

  try {
    const result = await syncAllFundDetailsFromFinApi({ limitFunds });

    // A run that reached some funds is still worth publishing; only a total
    // wipeout counts as failure.
    const ok = result.fundsUpdated > 0 || result.funds === 0;

    if (result.fundsUpdated > 0) {
      // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
      revalidateTag("sif-data");
    }

    await connectDB();
    await CronLog.create({
      job: "sync-fund-details",
      status: ok ? "success" : "error",
      message: [
        `${result.fundsUpdated}/${result.funds} funds updated`,
        `${result.isinsFetched} ISINs fetched, ${result.isinsFailed} failed`,
        result.isinsInvalid ? `${result.isinsInvalid} malformed ISINs skipped` : null,
        result.skipped ? `${result.skipped} skipped (no ISIN resolved)` : null,
        result.truncated ? "TRUNCATED — resumes next run" : null,
        // Bound the log entry; the full list can be long and this field is read in admin UI.
        result.errors.length ? `errors: ${result.errors.slice(0, 5).join(" | ")}` : null,
      ].filter(Boolean).join(" · "),
      fundsUpdated: result.fundsUpdated,
      duration: result.durationMs,
    });

    return Response.json({
      success: ok,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    try {
      await connectDB();
      await CronLog.create({
        job: "sync-fund-details",
        status: "error",
        message: `Run aborted: ${msg}`,
        fundsUpdated: 0,
        duration: Date.now() - startedAt,
      });
    } catch {
      // Logging failure must not mask the original error.
    }

    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
