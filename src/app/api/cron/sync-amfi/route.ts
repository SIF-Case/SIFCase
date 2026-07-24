import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import CronLog from "@/models/CronLog";
import { syncAllAmfiSources, syncSchemeMappings } from "@/lib/amfiSync";

// Daily refresh of the AMFI-derived sources: scheme mapping, SSD, then TER.
//
// One job with three ordered phases rather than three crons — SSD depends on the
// mapping phase's output, and separate crons would race. Scheduled at 08:00 UTC in
// vercel.json, after sync-fund-details (07:00), so SSD-owned fields land last and
// win over anything finapi wrote for the same key.

export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  // ?phase=mapping runs only phase 1 — refreshes the scheme mapping and records
  // SSD availability without writing any SSD/TER-owned field. Safe smoke test;
  // the scheduled run passes nothing and does all three phases.
  // ?phase=mapping runs only phase 1 — refreshes the scheme mapping and records
  // SSD availability without writing any SSD/TER-owned field. Read-mostly smoke
  // test; the scheduled run passes nothing and does all three phases.
  const phase = new URL(request.url).searchParams.get("phase");
  if (phase === "mapping") {
    const mapping = await syncSchemeMappings();
    return Response.json({ ok: mapping.errors.length === 0, phase: "mapping", mapping });
  }

  try {
    const r = await syncAllAmfiSources();

    // A partial run is still worth publishing; only a total wipeout is a failure.
    const ok = r.funds > 0 && (r.ssdApplied > 0 || r.terApplied > 0);

    if (ok) {
      // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
      revalidateTag("sif-data");
    }

    await connectDB();
    await CronLog.create({
      job: "sync-amfi",
      status: ok ? "success" : "error",
      message: [
        `${r.mapping.schemesSeen} schemes seen, ${r.mapping.created} new mappings, ${r.mapping.verified} newly ISIN-verified, ${r.mapping.schemesStamped} SIFScheme rows stamped`,
        `${r.ssdApplied}/${r.funds} SSD applied, ${r.ssdMissing} without a published SSD`,
        `${r.terApplied}/${r.funds} TER applied`,
        r.mapping.unmatchedAmfi.length ? `in AMFI but not in DB: ${r.mapping.unmatchedAmfi.slice(0, 5).join(", ")}` : null,
        r.mapping.conflicts.length ? `conflicts: ${r.mapping.conflicts.slice(0, 3).join(" | ")}` : null,
        r.errors.length ? `errors: ${r.errors.slice(0, 5).join(" | ")}` : null,
      ].filter(Boolean).join(" · "),
      fundsUpdated: r.ssdApplied,
      duration: Date.now() - startedAt,
    });

    return Response.json({ ok, ...r });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await connectDB();
    await CronLog.create({
      job: "sync-amfi",
      status: "error",
      message,
      fundsUpdated: 0,
      duration: Date.now() - startedAt,
    });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
