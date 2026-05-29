import { fetchAndStoreSIFNav } from "@/lib/navFetcher";

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchAndStoreSIFNav();

  return Response.json({
    success: result.errors.length === 0,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
