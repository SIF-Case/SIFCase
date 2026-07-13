import { fetchAndStoreSifAum } from "@/lib/aumFetcher";
import { revalidateTag } from "next/cache";

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchAndStoreSifAum();

  if (result.ok) {
    // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
    revalidateTag("sif-data");
  }

  return Response.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}
