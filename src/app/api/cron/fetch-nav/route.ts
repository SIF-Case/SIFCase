import { fetchAndStoreSIFNav } from "@/lib/navFetcher";
import { revalidateTag } from "next/cache";

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchAndStoreSIFNav();

  // Bust the Next.js Data Cache so the next page request re-fetches fresh
  // data from MongoDB instead of returning stale cached results.
  if (result.errors.length === 0) {
    revalidateTag("sif-data");

  }

  return Response.json({
    success: result.errors.length === 0,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

