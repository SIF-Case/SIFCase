// Shared field handling for the monthly performance report admin routes, so the
// create (POST /api/admin/reports) and edit (PATCH /api/admin/reports/[id])
// paths can't drift apart on which fields they accept.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthName(monthKey: string): string {
  const mi = Number(monthKey.slice(5, 7)) - 1;
  return MONTHS[mi] ?? "";
}

/** "2026-06" → "June 2026" */
export function monthKeyToLabel(monthKey: string): string {
  return `${monthName(monthKey)} ${monthKey.slice(0, 4)}`;
}

/** "2026-06" → "june-2026" */
export function monthKeyToSlug(monthKey: string): string {
  return `${monthName(monthKey).toLowerCase()}-${monthKey.slice(0, 4)}`;
}

export interface ReportFields {
  summary: string;
  niftyReturn: number | null;
  pdfUrl: string;
  pdfFilename: string;
  published: boolean;
  bannerTitle: string;
  unlockHeading: string;
  unlockSubtext: string;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Editable fields only — monthKey/slug/label are derived at creation and never
 * taken from the client, so an edit can't silently repoint a report at another
 * month while its URL stays the same.
 */
export function reportFieldsFromBody(body: Record<string, unknown>): ReportFields {
  const nifty = body.niftyReturn;
  return {
    summary: str(body.summary),
    niftyReturn: nifty === null || nifty === "" || nifty === undefined ? null : Number(nifty),
    pdfUrl: str(body.pdfUrl),
    pdfFilename: str(body.pdfFilename),
    published: body.published === true,
    bannerTitle: str(body.bannerTitle),
    unlockHeading: str(body.unlockHeading),
    unlockSubtext: str(body.unlockSubtext),
  };
}

/**
 * Partial variant for PATCH: only keys actually present in the body are
 * returned, so the publish toggle (which sends `{ published }` alone) doesn't
 * blank out the report's copy and PDF.
 */
export function reportPatchFromBody(body: Record<string, unknown>): Partial<ReportFields> {
  const full = reportFieldsFromBody(body);
  const patch: Partial<ReportFields> = {};
  for (const key of Object.keys(full) as (keyof ReportFields)[]) {
    if (key in body) (patch as Record<string, unknown>)[key] = full[key];
  }
  return patch;
}
