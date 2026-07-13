import { fetchAndSyncNfos } from "@/lib/nfoFetcher";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchAndSyncNfos();

  if (result.created > 0 || result.updated > 0) {
    revalidatePath("/nfos");
    revalidatePath("/");
  }

  return Response.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}
