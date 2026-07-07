/**
 * This endpoint is no longer used.
 *
 * Cache invalidation is handled by the fetch-nav cron, which calls
 * revalidateTag('sif-data') after a successful NAV import. The Next.js
 * Data Cache then repopulates automatically on the next user request.
 *
 * You can safely delete this file.
 */
export async function GET() {
  return Response.json(
    { error: "Endpoint removed. Cache is invalidated by fetch-nav." },
    { status: 410 }
  );
}
