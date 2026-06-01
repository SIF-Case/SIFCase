import { connectDB } from "./mongodb";
import SIFScheme, {
  parsePlanFromName,
  parseOptionFromName,
  parseStrategyFromName,
  deriveCompanyNameShort,
  deriveBrandName,
  deriveFundName,
} from "@/models/SIFScheme";
import SIFNav from "@/models/SIFNav";

export interface FetchResult {
  fetched: number;
  filtered: number;
  upserted: number;
  errors: string[];
}

const NAV_TXT_URL = "https://portal.amfiindia.com/spages/SIF_NAVAll.txt";

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

// Parses "26-May-2026" → UTC midnight Date (avoids IST local-time shift)
function parseNavDate(raw: string): Date {
  const [dd, mon, yyyy] = raw.trim().split("-");
  const mm = MONTHS[mon];
  if (!dd || !mm || !yyyy) return new Date(NaN);
  return new Date(`${yyyy}-${mm}-${dd.padStart(2, "0")}T00:00:00.000Z`);
}

export async function fetchAndStoreSIFNav(): Promise<FetchResult> {
  await connectDB();

  const result: FetchResult = { fetched: 0, filtered: 0, upserted: 0, errors: [] };

  let text: string;
  try {
    const response = await fetch(NAV_TXT_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    text = await response.text();
  } catch (err) {
    result.errors.push(`Fetch failed: ${String(err)}`);
    return result;
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Skip header line if present (contains "Scheme Code" text)
  // Skip header and group/AMC label lines (data lines contain a SIF- code before the first semicolon)
  const dataLines = lines.filter((l) => /^SIF-\d+;/i.test(l));
  result.fetched = dataLines.length;

  const schemeOps: Parameters<typeof SIFScheme.bulkWrite>[0] = [];
  const navOps: Parameters<typeof SIFNav.bulkWrite>[0] = [];

  for (const line of dataLines) {
    const parts = line.split(";");
    if (parts.length < 6) continue;

    const [schemeCode, isinGrowth, isinReinvestment, schemeName, navRaw, dateRaw] = parts;
    const nav = parseFloat(navRaw?.trim());
    if (!schemeCode?.trim() || isNaN(nav)) continue;

    // Filter to SIF schemes only (codes start with "SIF-")
    if (!/^SIF-/i.test(schemeCode.trim())) continue;

    const code = schemeCode.trim();
    const name = schemeName?.trim() ?? "";
    const navDateStr = dateRaw?.trim();

    let navDate: Date;
    try {
      // SIF_NAVAll.txt date format: "26-May-2026"
      // Must parse as UTC — non-ISO strings parsed with new Date() use local time
      // which shifts the date by -5:30 in IST, storing May 26 as May 25 in MongoDB.
      navDate = parseNavDate(navDateStr);
      if (isNaN(navDate.getTime())) throw new Error("invalid date");
    } catch {
      result.errors.push(`Bad date for ${code}: ${navDateStr}`);
      continue;
    }

    result.filtered++;

    schemeOps.push({
      updateOne: {
        filter: { schemeCode: code },
        update: {
          $setOnInsert: {
            schemeCode: code,
            schemeName: name,
            amc: "",
            fundType: "Open Ended Scheme",
            isinGrowth: isinGrowth?.trim() ?? "",
            isinReinvestment:
              isinReinvestment?.trim() === "-" ? null : isinReinvestment?.trim(),
            plan: parsePlanFromName(name),
            option: parseOptionFromName(name),
            strategy: parseStrategyFromName(name),
            brandName: deriveBrandName(name),
            fundName: deriveFundName(name),
            companyName: "",
            companyName_short: "",
            isActive: true,
          },
        },
        upsert: true,
      },
    });

    navOps.push({
      updateOne: {
        filter: { schemeCode: code, navDate },
        update: {
          $setOnInsert: {
            schemeCode: code,
            nav,
            repurchasePrice: null,
            salePrice: null,
            navDate,
            source: "amfi_txt_fetch" as const,
            fetchedAt: new Date(),
          },
        },
        upsert: true,
      },
    });
  }

  try {
    if (schemeOps.length > 0) await SIFScheme.bulkWrite(schemeOps, { ordered: false });
    if (navOps.length > 0) {
      const navResult = await SIFNav.bulkWrite(navOps, { ordered: false });
      result.upserted = navResult.upsertedCount;
    }
  } catch (err) {
    result.errors.push(`DB write error: ${String(err)}`);
  }

  return result;
}
