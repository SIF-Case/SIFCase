import { connectDB } from "./mongodb";
import SifMonthlyAum from "@/models/SifMonthlyAum";

const BASE_URL = "https://portal.amfiindia.com/spages/sif_am{mon}{year}repo.pdf";
const MONTH_ABBR = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_NAME = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const USER_AGENT = "Mozilla/5.0 (compatible; SIF-dashboard-fetcher/1.0)";

export interface MonthlyAumResult {
  ok: boolean;
  year: number;
  month: number; // 1-12
  periodLabel: string;
  totalAumCr: number | null;
  docFound: boolean;
  message: string | null;
}

function buildUrl(year: number, month: number): string {
  return BASE_URL.replace("{mon}", MONTH_ABBR[month - 1]).replace("{year}", String(year));
}

/**
 * AMFI's monthly report table always lists the Grand Total row last, with columns:
 * schemes, folios, funds mobilized, repurchase, net inflow, Net Assets AUM, average
 * AUM, segregated portfolios, segregated AUM (in that order). We only need the 6th
 * number after "Grand Total" — the Net Assets Under Management figure.
 */
function extractGrandTotalAum(pdfText: string): number | null {
  const idx = pdfText.search(/Grand\s*Total/i);
  if (idx === -1) return null;

  const tail = pdfText.slice(idx, idx + 500);
  const numberMatches = tail.match(/-?[\d,]+\.\d{2}|-?[\d,]+/g) ?? [];
  const numbers = numberMatches.map((n) => Number(n.replace(/,/g, "")));

  if (numbers.length < 6) return null;
  const netAssetsAum = numbers[5];
  return Number.isFinite(netAssetsAum) ? netAssetsAum : null;
}

/** Attempts to fetch and parse the AMFI SIF monthly report PDF for a given month/year. */
export async function fetchMonthlyAumFor(year: number, month: number): Promise<MonthlyAumResult> {
  const periodLabel = `${MONTH_NAME[month - 1]} ${year}`;
  const sourceUrl = buildUrl(year, month);

  try {
    const res = await fetch(sourceUrl, {
      cache: "no-store",
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      return {
        ok: true,
        year,
        month,
        periodLabel,
        totalAumCr: null,
        docFound: false,
        message: `No AUM doc found for ${periodLabel} (HTTP ${res.status})`,
      };
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const { text } = await parser.getText();
    await parser.destroy();

    const totalAumCr = extractGrandTotalAum(text);
    if (totalAumCr === null) {
      return {
        ok: true,
        year,
        month,
        periodLabel,
        totalAumCr: null,
        docFound: false,
        message: `AUM doc found for ${periodLabel} but Grand Total figure could not be parsed`,
      };
    }

    return { ok: true, year, month, periodLabel, totalAumCr, docFound: true, message: null };
  } catch (err) {
    return {
      ok: false,
      year,
      month,
      periodLabel,
      totalAumCr: null,
      docFound: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Fetches the previous calendar month's report (AMFI publishes after month-end) and stores it. */
export async function fetchAndStoreMonthlyAum(): Promise<MonthlyAumResult> {
  await connectDB();

  const now = new Date();
  let month = now.getMonth(); // 0-indexed current month -> previous month, 1-indexed
  let year = now.getFullYear();
  if (month === 0) {
    month = 12;
    year -= 1;
  }

  const result = await fetchMonthlyAumFor(year, month);

  await SifMonthlyAum.findOneAndUpdate(
    { year, month },
    {
      year,
      month,
      periodLabel: result.periodLabel,
      totalAumCr: result.totalAumCr,
      docFound: result.docFound,
      sourceUrl: buildUrl(year, month),
      message: result.message,
      fetchedAt: new Date(),
    },
    { upsert: true },
  );

  return result;
}

/** Latest month with a successfully parsed AUM figure, for display fallback. */
export async function getLatestMonthlyAum() {
  await connectDB();
  return SifMonthlyAum.findOne({ docFound: true }).sort({ year: -1, month: -1 }).lean();
}

/** Most recent fetch attempt regardless of outcome, for admin status display. */
export async function getLatestMonthlyAumAttempt() {
  await connectDB();
  return SifMonthlyAum.findOne({}).sort({ year: -1, month: -1 }).lean();
}
