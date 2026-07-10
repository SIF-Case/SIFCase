// Shared fund-detail URL slug: keyword-rich fund name + trailing scheme code
// for guaranteed uniqueness (a fund name has multiple scheme rows — one per
// plan/option combo — each with its own distinct schemeCode).
// e.g. "WSIF Equity Ex-Top 100 Long-Short Fund" + "SIF-105"
//   -> "wsif-equity-ex-top-100-long-short-fund-sif-105"

export function slugifyText(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function fundSlug(fundName: string, schemeCode: string): string {
  return `${slugifyText(fundName)}-${schemeCode.toLowerCase()}`;
}

export function fundHref(fundName: string, schemeCode: string): string {
  return `/sifs/${fundSlug(fundName, schemeCode)}`;
}

// Old bare-code URLs ("sif-105") and new pretty slugs both end in the scheme
// code, so one pattern resolves either — this is what makes the migration
// backward-compatible without a lookup table.
const SCHEME_CODE_RE = /(sif-\d+)$/i;

export function extractSchemeCode(param: string): string | null {
  const match = param.match(SCHEME_CODE_RE);
  return match ? match[1].toUpperCase() : null;
}
