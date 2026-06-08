import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import AISetting from "@/models/AISetting";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

// ─── Zod schema (single source of truth for extraction output) ────────────────

const FundManagerSchema = z.object({
  name: z.string(),
  designation: z.string().default("Fund Manager"),
});

const AssetAllocationSchema = z.object({
  assetClass: z.string(),
  percentage: z.number(),
});

const IndustrySchema = z.object({
  industry: z.string(),
  percentage: z.number(),
});

const HoldingSchema = z.object({
  name: z.string(),
  percentage: z.number(),
  sector: z.string().nullable(),
  rating: z.string().nullable(),
});

export const FactsheetExtractionSchema = z.object({
  riskBand: z.number().int().min(1).max(5).nullable().describe("SEBI risk band as integer 1–5: 1=Low, 2=Low to Moderate, 3=Moderate, 4=Moderately High, 5=High"),
  schemeType: z.string().nullable().describe("Strategy/fund type from header, e.g. 'Hybrid Long-Short Fund'"),
  exitLoad: z.string().nullable().describe("Exact text under Exit Load label, e.g. 'Nil'"),
  aumCurrent: z.number().nullable().describe("Month end AUM in ₹ Crore as a number"),
  aumAggregate: z.number().nullable().describe("Monthly Average AUM (AAUM) if stated separately from month-end AUM, otherwise null"),
  minInvestment: z.number().nullable().describe("Initial minimum investment in ₹ as a number"),
  additionalInvestment: z.number().nullable().describe("Additional investment per transaction in ₹, null if only Re.1"),
  fundManagers: z.array(FundManagerSchema).describe("All fund managers with name and designation"),
  benchmarkName: z.string().nullable().describe("Full benchmark index name"),
  benchmarkRiskBand: z.number().int().min(1).max(5).nullable().describe("SEBI risk band as integer 1–5, same mapping as riskBand"),
  benchmarkDetails: z.string().nullable().describe("Benchmark composition description if any"),
  assetAllocation: z.array(AssetAllocationSchema).describe("Only category totals from asset class table, not individual stocks"),
  portfolioByIndustry: z.array(IndustrySchema).describe("All rows from industry/sector allocation section"),
  portfolioByRatingClass: z.array(z.object({ ratingClass: z.string(), percentage: z.number() })).describe("Rating class allocation rows if present"),
  topHoldings: z.array(HoldingSchema).describe("All holdings including equity long, equity futures short (negative %), bonds, T-bills, G-Secs, cash"),
  suitableFor: z.string().nullable().describe("Who this SIF is suitable for — describe target investor profile, minimum net-worth, risk appetite, investment horizon, and goals"),
  notSuitableFor: z.string().nullable().describe("Who this SIF is NOT suitable for — describe investor types that should avoid this fund"),
  bullMarket: z.string().nullable().describe("How this fund is expected to perform in bull markets and why, based on its strategy"),
  bearMarket: z.string().nullable().describe("How this fund is expected to perform in bear markets and why, based on its strategy"),
  sidewaysMarket: z.string().nullable().describe("How this fund is expected to perform in sideways/range-bound markets and why, based on its strategy"),
  howItWorks: z.string().nullable().describe("Concise 2–4 sentence explanation of how the fund strategy works — long/short mechanics, instruments used, return drivers"),
  mfEquivalent: z.string().nullable().describe("Closest mutual fund category or comparable MF product for an investor familiar with mutual funds"),
  portfolioFit: z.string().nullable().describe("Where this fund fits in a diversified portfolio — e.g. satellite allocation, alternative/hedge sleeve, return enhancer"),
});

export type FactsheetExtraction = z.infer<typeof FactsheetExtractionSchema>;

// ─── Risk band normalisation ───────────────────────────────────────────────────

const RISK_MAP: Record<string, number> = {
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
  "Low Risk": 1, "Low to Moderate Risk": 2, "Moderate Risk": 3,
  "Moderately High Risk": 4, "High Risk": 5,
};

// ─── Legacy providers (DeepSeek / OpenRouter) ─────────────────────────────────

const EXTRACTION_PROMPT = `You are a precise financial extraction engine for Indian SIF/AIF factsheets. Return ONLY valid JSON — zero prose, zero markdown.

=== FIELD RULES ===

riskBand: Read the RISK LEVELS section. The line "Fund risk: Risk Level X" or "Fund risk: RISK-LEVEL X" tells you the fund's level. SEBI mandates levels 1–5 only (1=Low … 5=High). Return the integer directly. Example: "Fund risk: Risk Level 3" → return 3. Do NOT infer from strategy name or from any spreadsheet data.

schemeType: Strategy/fund type. Look in the header/subtitle near the fund name. E.g. "Hybrid Long-Short Fund", "Equity Long-Short Fund".

exitLoad: Exact text under "Exit Load:" label. Usually "Nil" or a percentage description.

aumCurrent: "Month end AUM" value in ₹ Crore as a number (e.g. 38.41). NOT monthly average.

aumAggregate: Monthly Average AUM (AAUM / Average AUM) if stated separately — otherwise null.

minInvestment: Initial minimum investment in ₹. "Rs.10,00,000" = 10000000. Do NOT use SIP amounts.

additionalInvestment: Additional/top-up per transaction in ₹. Only if explicitly stated with a rupee amount (e.g. "multiples of Rs.10,000"). "Re.1/- thereafter" means null.

fundManagers: ALL managers named under "Fund Manager:" section. Each gets {name, designation}.

benchmarkName: Full benchmark index name.

benchmarkRiskBand: Benchmark risk level as integer 1–6, same mapping as riskBand.

assetAllocation: Only TOTAL rows from asset class table. Never individual stocks. Return [{assetClass, percentage}].

portfolioByIndustry: All rows from industry/sector allocation. Return [{industry, percentage}].

topHoldings: ALL holdings — equity long (positive %), equity futures short (negative %), bonds, T-bills, G-Secs, cash. Each: {name, percentage, sector, rating}.

suitableFor: 2–4 sentences describing the target investor — minimum net-worth (SEBI Category III AIF requires ₹5 Cr), risk appetite, investment horizon, and goals. Infer from the fund strategy and any suitability disclosures in the document.

notSuitableFor: 2–3 sentences describing investor types who should NOT invest — e.g. risk-averse investors, those with short horizons, those needing liquidity.

bullMarket: 2–3 sentences on how this fund performs in rising equity markets, citing the long-short strategy.

bearMarket: 2–3 sentences on how this fund performs in falling equity markets — does the short book provide downside protection?

sidewaysMarket: 2–3 sentences on performance in flat/range-bound markets.

howItWorks: 2–4 sentences explaining the fund's long-short mechanics, key instruments, and return drivers.

mfEquivalent: 1 sentence naming the closest mutual fund category (e.g. "Balanced Advantage Fund / Dynamic Asset Allocation Fund") and why.

portfolioFit: 2–3 sentences on where this SIF fits in a diversified portfolio — satellite, alternative sleeve, hedge, etc.

=== JSON SCHEMA ===
{"riskBand":string|null,"schemeType":string|null,"exitLoad":string|null,"aumCurrent":number|null,"aumAggregate":number|null,"aumEnd":number|null,"minInvestment":number|null,"additionalInvestment":number|null,"fundManagers":[{"name":string,"designation":string}],"benchmarkName":string|null,"benchmarkRiskBand":string|null,"benchmarkDetails":string|null,"assetAllocation":[{"assetClass":string,"percentage":number}],"portfolioByIndustry":[{"industry":string,"percentage":number}],"portfolioByRatingClass":[{"ratingClass":string,"percentage":number}],"topHoldings":[{"name":string,"percentage":number,"sector":string|null,"rating":string|null}],"suitableFor":string|null,"notSuitableFor":string|null,"bullMarket":string|null,"bearMarket":string|null,"sidewaysMarket":string|null,"howItWorks":string|null,"mfEquivalent":string|null,"portfolioFit":string|null}

=== FACTSHEET TEXT ===
`;

function parseAiJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

const MODEL_MAX_CHARS: Record<string, number> = {
  "deepseek-chat": 60_000,
  "deepseek-reasoner": 50_000,
};

async function callDeepSeek(text: string, model: string, apiKey: string) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: EXTRACTION_PROMPT + text }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "DeepSeek API error");
  return parseAiJson(d.choices[0].message.content);
}

async function callOpenRouter(text: string, model: string, apiKey: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://sifcase.in",
      "X-Title": "SIFcase Admin",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: EXTRACTION_PROMPT + text }],
      temperature: 0.1,
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "OpenRouter API error");
  return parseAiJson(d.choices[0].message.content);
}

// ─── Gemini native PDF path (generateObject) ──────────────────────────────────

async function callGeminiNative(pdfUrls: string[], model: string, apiKey: string, extraText = ""): Promise<Record<string, unknown>> {
  const google = createGoogleGenerativeAI({ apiKey });

  // Fetch all PDFs as buffers (up to 3)
  const pdfBuffers: Uint8Array[] = [];
  for (const url of pdfUrls.slice(0, 3)) {
    const r = await fetch(url);
    if (!r.ok) continue;
    const buf = await r.arrayBuffer();
    if (buf.byteLength) pdfBuffers.push(new Uint8Array(buf));
  }

  if (!pdfBuffers.length && !extraText) throw new Error("Could not fetch any files");

  const PROMPT = `You are extracting data from an Indian SIF/AIF fund factsheet. Be exhaustive — do not skip any row or section.

=== SCALAR FIELDS ===
riskBand: Read ONLY from the PDF's FUND/STRATEGY riskometer — the LEFT dial in the "RISK BAND" section. SEBI mandates levels 1–5 only (1=Low, 2=Low to Moderate, 3=Moderate, 4=Moderately High, 5=High). Return the integer directly — do NOT convert to English. NEVER infer from the fund name, strategy, or Excel data. Return null if unclear.
benchmarkRiskBand: Read ONLY from the PDF's BENCHMARK riskometer — the RIGHT dial in the "RISK BAND" section. Return the integer level (1–5) directly. Do NOT copy riskBand here; the fund and benchmark levels are often different.
schemeType: Fund strategy type from the header/subtitle (e.g. "Hybrid Long-Short Fund").
exitLoad: Exact text under "Exit Load" label.
aumCurrent: Month-end AUM in ₹ Crore as a plain number (e.g. 803.02). Look for "Month End AUM" or "AUM as on" — NOT the monthly average.
aumAggregate: Monthly Average AUM (also called AAUM or Average AUM) in ₹ Crore if stated separately — else null.
minInvestment: Initial minimum investment in ₹ as a plain integer (Rs.10,00,000 = 10000000).
additionalInvestment: Additional/top-up investment in ₹ as a plain integer. If stated as "Re.1/- thereafter" or "multiples of Re.1", return null.
benchmarkName: Full benchmark index name.
benchmarkDetails: Benchmark composition description if stated, else null.

=== FUND MANAGERS ===
Extract ALL named portfolio/fund managers. Each gets { name, designation }.
If a manager covers a specific portion (e.g. "Equity Portion", "Debt Portion", "Overseas Investments"), use that as designation.
If no designation is given, use "Fund Manager". Never return null for designation.

=== ASSET ALLOCATION ===
Extract ONLY the summary/total rows from the "Portfolio Classification by Asset Class" table.
Include rows like: Equity, Equity Futures, Corporate Bond, Treasury Bill, Government Securities, Net Cash and Cash Equivalent, Index Futures, Stock Futures, Index Options, Stock Options, etc.
Futures and options have negative percentages if they represent short positions.
Do NOT include individual stock or bond names here.

=== PORTFOLIO BY INDUSTRY ===
Extract ALL rows from the industry/sector allocation table.
Include every row — equities, sovereign, cash equivalents, derivatives — do not skip any.
Return { industry, percentage } for each.

=== PORTFOLIO BY RATING CLASS ===
Extract all rows from the rating class allocation table if present (AAA, AA+, AA, A1+, Sovereign, TREPS etc.).
Return { ratingClass, percentage } for each.

=== TOP HOLDINGS — CRITICAL, BE EXHAUSTIVE ===
You MUST extract EVERY instrument listed across ALL sections of the holdings table. Do not stop early or summarise.

EQUITY LONG POSITIONS: All stocks with positive % of NAV/portfolio. sector = industry column value. rating = null.

EQUITY FUTURES / SHORT POSITIONS: All futures contracts. These have NEGATIVE percentages (the fund is short). Look for rows with company names followed by expiry dates (e.g. "Reliance Industries Ltd. 29/05/2025"). Strip the date from the name. percentage must be NEGATIVE. sector = same industry as the underlying stock. rating = null.

INDEX FUTURES / INDEX OPTIONS: Nifty 50, Bank Nifty, etc. percentage = negative for short futures/puts, positive for long calls. sector = "Index Futures" or "Index Options".

CERTIFICATES OF DEPOSIT (CD): Banks issuing CDs. sector = "Certificate of Deposit". rating = credit rating (e.g. "CRISIL A1+").

COMMERCIAL PAPER (CP): sector = "Commercial Paper". rating = credit rating.

CORPORATE BONDS / NCDs / DEBENTURES: sector = "Corporate Bond". rating = full rating text (e.g. "CRISIL AAA", "ICRA AA+").

GOVERNMENT SECURITIES / SDL / GOI BONDS: Long-dated bonds. sector = "Government Securities". rating = "SOVEREIGN".

TREASURY BILLS (91-day, 182-day, 364-day T-Bills): sector = "Treasury Bill". rating = "SOVEREIGN".

TREPS / CBLO / REPO: sector = "Cash". rating = null.

NET CASH / CASH EQUIVALENTS: sector = "Cash". rating = null.

IMPORTANT: The same company CAN appear as both a long equity position AND a short futures position — include BOTH as separate entries with correct sign.
IMPORTANT: Extract every single row. A factsheet with 60+ holdings should have 60+ entries in topHoldings.

=== INVESTOR SUITABILITY & FUND FIT ===
suitableFor: 2–4 sentences on who this SIF is suitable for — target investor profile, SEBI Category III AIF minimum net-worth requirement (₹5 Cr), risk appetite, investment horizon, and goals. Infer from the fund strategy, risk band, and any suitability disclosures.
notSuitableFor: 2–3 sentences on who should NOT invest — e.g. risk-averse investors, short investment horizons, liquidity needs.
bullMarket: 2–3 sentences on performance in rising equity markets, referencing the long book and short hedges.
bearMarket: 2–3 sentences on performance in falling equity markets — does the short book provide downside protection?
sidewaysMarket: 2–3 sentences on performance in flat / range-bound markets.
howItWorks: 2–4 sentences explaining the long-short strategy mechanics, instruments used, and return drivers.
mfEquivalent: 1 sentence naming the closest mutual fund category and why.
portfolioFit: 2–3 sentences on where this SIF belongs in a diversified portfolio — satellite, alternative, hedge sleeve, etc.`;

  type ContentPart =
    | { type: "text"; text: string }
    | { type: "file"; data: Uint8Array; mediaType: string };

  const content: ContentPart[] = [
    ...pdfBuffers.map(buf => ({ type: "file" as const, data: buf, mediaType: "application/pdf" })),
    ...(extraText ? [{ type: "text" as const, text: `=== SPREADSHEET DATA ===\n${extraText}\n\n` }] : []),
    { type: "text" as const, text: PROMPT },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { object } = await generateObject({
    model: google(model),
    schema: FactsheetExtractionSchema,
    messages: [{ role: "user", content: content as any }],
  });

  return object as Record<string, unknown>;
}

// ─── Post-processing (shared across all providers) ────────────────────────────

function postProcess(extracted: Record<string, unknown>): Record<string, unknown> {
  // Normalise risk fields → integer 1–6
  for (const key of ["riskBand", "benchmarkRiskBand"] as const) {
    const v = extracted[key];
    if (typeof v === "number") {
      extracted[key] = Math.round(v);
    } else if (typeof v === "string") {
      const raw = v.trim();
      if (RISK_MAP[raw] != null) { extracted[key] = RISK_MAP[raw]; continue; }
      const m = raw.match(/(?:RISK[-\s]LEVEL|Risk\s*Level)\s*(\d)/i);
      if (m && RISK_MAP[m[1]] != null) extracted[key] = RISK_MAP[m[1]];
    }
  }

  // Fix null fund manager designations
  if (Array.isArray(extracted.fundManagers)) {
    extracted.fundManagers = (extracted.fundManagers as { name: string; designation: string | null }[])
      .map(m => ({ ...m, designation: m.designation || "Fund Manager" }));
  }

  // Remove additionalInvestment = 1 (Re 1/- is not a real additional amount)
  if (extracted.additionalInvestment === 1 || extracted.additionalInvestment === 1.0) {
    extracted.additionalInvestment = null;
  }

  // Fix null percentage in assetAllocation — compute from 100 minus known categories
  if (Array.isArray(extracted.assetAllocation)) {
    const alloc = extracted.assetAllocation as { assetClass: string; percentage: number | null }[];
    const nullEntry = alloc.find(a => a.percentage == null);
    if (nullEntry) {
      const known = alloc.filter(a => a.percentage != null).reduce((s, a) => s + (a.percentage ?? 0), 0);
      nullEntry.percentage = Math.round((100 - known) * 100) / 100;
    }
  }

  // Normalise topHoldings
  if (Array.isArray(extracted.topHoldings)) {
    const CREDIT_RATING_RE = /^(AAA[\+\-]?|AA[\+\-]?|A[\+\-]?|BBB[\+\-]?|SOV|AAA equivalent|AAA\s*Equivalent)$/i;

    const holdings = (extracted.topHoldings as Record<string, unknown>[]).map(h => ({
      name: String(h.name ?? "").trim(),
      percentage: Number(h.percentage ?? 0),
      sector: String(h.sector ?? "").trim() || null,
      rating: String(h.rating ?? "").trim() || null,
    }));

    // If sector is a credit rating, move it to rating and infer sector from name
    for (const h of holdings) {
      if (h.sector && CREDIT_RATING_RE.test(h.sector) && !h.rating) {
        h.rating = h.sector;
        if (/bill|t-bill|tbill/i.test(h.name)) h.sector = "Treasury Bill";
        else if (/government of india|goi\b|g-sec|gsec|sovereign/i.test(h.name)) h.sector = "Government Securities";
        else if (/bond|debenture|ncd|sidbi|nabard|nhai|exim|housing finance/i.test(h.name)) h.sector = "Corporate Bond";
        else h.sector = null;
      }
      // G-Secs vs T-bills by name
      if (h.rating && /SOVEREIGN|SOV/i.test(h.rating) && h.percentage > 0) {
        h.sector = /day t-bill|day tbill|\d+ day|t-bill|tbill/i.test(h.name) ? "Treasury Bill" : "Government Securities";
      }
    }

    extracted.topHoldings = holdings.filter(h => h.percentage !== 0);

    // Inject Net Cash if missing but present in assetAllocation
    const assetAlloc = extracted.assetAllocation as { assetClass: string; percentage: number }[] | undefined;
    const cashFromAlloc = assetAlloc?.find(a => /cash/i.test(a.assetClass));
    const hasCash = (extracted.topHoldings as typeof holdings).some(h => /net cash|cash equivalent/i.test(h.name));
    if (cashFromAlloc && !hasCash) {
      (extracted.topHoldings as typeof holdings).push({
        name: "Net Cash and Cash Equivalent",
        percentage: cashFromAlloc.percentage,
        sector: "Cash",
        rating: null,
      });
    }
  }

  return extracted;
}

// ─── Excel text extraction ─────────────────────────────────────────────────────

async function extractExcelText(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" }) as unknown[][];
    if (!rows.length) continue;
    parts.push(`=== Sheet: ${sheetName} ===`);
    for (const row of rows) {
      const cells = (row as unknown[]).map(c => String(c ?? "").trim());
      if (cells.some(c => c)) parts.push(cells.join("\t"));
    }
  }
  return parts.join("\n");
}

function isExcelUrl(url: string) {
  return /\.(xlsx|xls)(\?|$)/i.test(url);
}

function isExcelBuffer(buf: Buffer): boolean {
  // XLSX/OOXML = ZIP magic bytes: PK (50 4B)
  if (buf[0] === 0x50 && buf[1] === 0x4B) return true;
  // Legacy XLS = CFBF magic bytes: D0 CF 11 E0
  if (buf[0] === 0xD0 && buf[1] === 0xCF && buf[2] === 0x11 && buf[3] === 0xE0) return true;
  return false;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

// Reports whether a centrally-configured AI provider exists for this feature
// (Admin → AI Settings) so the UI can skip manual key entry. Never returns the key itself.
export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "fundDetails", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const config = await AISetting.findOne({ usages: "fundDetailsAnalysis" }, "label provider modelName").lean();
  return NextResponse.json({ config: config ? { label: config.label, provider: config.provider, modelName: config.modelName } : null });
}

export async function POST(req: NextRequest) {
  try {
    if (!await hasPageAccess(req, "fundDetails", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json() as {
      pdfUrls: string[];
      provider?: "deepseek" | "gemini" | "openrouter";
      model?: string;
      apiKey?: string;
    };
    const { pdfUrls } = body;
    let { provider, model, apiKey } = body;

    // Prefer the centrally-configured provider for this usage (Admin → AI Settings)
    // over manually-entered values — keeps API keys server-side only.
    await connectDB();
    const savedConfig = await AISetting.findOne({ usages: "fundDetailsAnalysis" }).lean();
    if (savedConfig) {
      provider = savedConfig.provider;
      model = savedConfig.modelName;
      apiKey = savedConfig.apiKey;
    }

    if (!pdfUrls?.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });
    if (!provider) return NextResponse.json({ error: "No AI provider configured — set one up in Admin → AI Settings or enter one manually" }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: "API key required" }, { status: 400 });
    if (!model) return NextResponse.json({ error: "Model required" }, { status: 400 });

    // ── Gemini: native PDF path + Excel text ─────────────────────────────────
    if (provider === "gemini") {
      const pdfUrlsForGemini: string[] = [];
      const excelTexts: string[] = [];

      for (const url of pdfUrls.slice(0, 3)) {
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const buf = Buffer.from(await r.arrayBuffer());
          if (!buf.byteLength) continue;
          if (isExcelBuffer(buf) || isExcelUrl(url)) {
            excelTexts.push(await extractExcelText(buf));
          } else {
            pdfUrlsForGemini.push(url);
          }
        } catch { /* skip */ }
      }

      const extracted = await callGeminiNative(pdfUrlsForGemini, model, apiKey, excelTexts.join("\n\n"));
      return NextResponse.json({ extracted: postProcess(extracted) });
    }

    // ── DeepSeek / OpenRouter: text extraction path ──────────────────────────
    const { default: PDFParser } = await import("pdf2json");

    type Pdf2JsonData = {
      Pages: Array<{ Texts: Array<{ x: number; y: number; R: Array<{ T: string }> }> }>;
    };

    function safeDecodeText(t: string): string {
      try { return decodeURIComponent(t); } catch { return t.replace(/%[0-9A-Fa-f]{2}/g, " "); }
    }

    type TextItem = { x: number; y: number; text: string };

    function groupIntoLines(items: TextItem[], yThreshold = 0.3): string[] {
      const sorted = [...items].sort((a, b) => Math.abs(a.y - b.y) > yThreshold ? a.y - b.y : a.x - b.x);
      const lines: string[] = [];
      let cur: TextItem[] = [];
      let lastY = -999;
      for (const item of sorted) {
        if (Math.abs(item.y - lastY) > yThreshold) {
          if (cur.length) lines.push(cur.map(i => i.text).join("  "));
          cur = [item];
          lastY = item.y;
        } else {
          cur.push(item);
        }
      }
      if (cur.length) lines.push(cur.map(i => i.text).join("  "));
      return lines;
    }

    type DirectData = {
      portfolioByIndustry: { industry: string; percentage: number }[];
      portfolioByRatingClass: { ratingClass: string; percentage: number }[];
      equitySectorMap: Record<string, string>;
      bondEntries: { name: string; percentage: number; rating: string | null }[];
    };

    function extractStructuredText(data: Pdf2JsonData): { text: string; direct: DirectData } {
      let allText = "";
      const direct: DirectData = {
        portfolioByIndustry: [],
        portfolioByRatingClass: [],
        equitySectorMap: {},
        bondEntries: [],
      };

      for (const page of data.Pages) {
        const items: TextItem[] = page.Texts
          .map(t => ({ x: t.x, y: t.y, text: t.R.map(r => safeDecodeText(r.T)).join("").trim() }))
          .filter(i => i.text);

        const hasHoldingsTable = items.some(i => i.text.includes("TOP HOLDINGS") && i.x > 18);

        if (!hasHoldingsTable) {
          allText += groupIntoLines(items).join("\n") + "\n\n---PAGE---\n\n";
          continue;
        }

        const industryAnchorItems = items.filter(i => i.x >= 17 && i.x <= 19.5);
        const industryGroups: { y: number; text: string }[] = [];
        for (const item of industryAnchorItems.sort((a, b) => a.y - b.y)) {
          const prev = industryGroups[industryGroups.length - 1];
          if (prev && Math.abs(item.y - prev.y) < 0.48) {
            prev.text += " " + item.text;
            prev.y = (prev.y + item.y) / 2;
          } else {
            industryGroups.push({ y: item.y, text: item.text });
          }
        }

        const nameColItems = items
          .filter(i => i.x >= 12.4 && i.x <= 13.6 && i.text.length > 0)
          .sort((a, b) => a.y - b.y);
        const nameGroups: { y: number; text: string }[] = [];
        for (const ni of nameColItems) {
          const prev = nameGroups[nameGroups.length - 1];
          if (prev && Math.abs(ni.y - prev.y) < 0.48) {
            prev.text += " " + ni.text;
            prev.y = (prev.y + ni.y) / 2;
          } else {
            nameGroups.push({ y: ni.y, text: ni.text });
          }
        }

        const longRows: string[] = ["LONG EQUITY POSITIONS (name | industry | % of NAV):"];
        for (const ind of industryGroups) {
          if (/Industry\/Rating/.test(ind.text)) continue;
          const pctCandidates = items.filter(i =>
            i.x >= 21.5 && i.x <= 23.5 &&
            /^\d+\.\d+%$/.test(i.text.trim()) &&
            Math.abs(i.y - ind.y) < 0.8,
          );
          const pct = pctCandidates.sort((a, b) => Math.abs(a.y - ind.y) - Math.abs(b.y - ind.y))[0];
          if (!pct) continue;
          const closestGroup = nameGroups.reduce<{ y: number; text: string } | null>((best, g) => {
            const dist = Math.abs(g.y - ind.y);
            if (!best || dist < Math.abs(best.y - ind.y)) return g;
            return best;
          }, null);
          const name = (closestGroup && Math.abs(closestGroup.y - ind.y) < 1.2) ? closestGroup.text : "?";
          longRows.push(`${name || "?"}  |  ${ind.text}  |  ${pct.text}`);
        }

        const contShortLines: string[] = ["CONTINUATION SHORT POSITIONS (equity futures, bottom section):"];
        const contShortPcts = items
          .filter(i => i.x >= 22 && i.x <= 23.3 && /^-\d+\.\d+%$/.test(i.text.trim()))
          .sort((a, b) => a.y - b.y);
        for (const p of contShortPcts) {
          const name = nameGroups
            .filter(g => Math.abs(g.y - p.y) < 0.8 && /\d{2}\/\d{2}\/\d{4}/.test(g.text))
            .sort((a, b) => Math.abs(a.y - p.y) - Math.abs(b.y - p.y))[0];
          if (name) {
            const cleanName = name.text.replace(/\s*\d{2}\/\d{2}\/\d{4}.*/, "").trim();
            contShortLines.push(`${cleanName}  ${p.text}`);
          }
        }

        const rightItems = items.filter(i => i.x >= 23);
        const rByY: Record<number, TextItem[]> = {};
        for (const item of rightItems) {
          const bucket = Math.round(item.y * 4) / 4;
          (rByY[bucket] ??= []).push(item);
        }
        const shortLines: string[] = ["SHORT POSITIONS (equity futures, main column):"];
        const bondLines: string[] = ["CORPORATE BONDS AND TREASURY BILLS:"];
        const eqFutTotal = rightItems.find(i => i.text.includes("Equity Futures Total"));
        const eqFutY = eqFutTotal?.y ?? 17;
        for (const bucket of Object.keys(rByY).map(Number).sort()) {
          const row = rByY[bucket].sort((a, b) => a.x - b.x);
          const txt = row.map(i => i.text).join("  ").trim();
          if (!txt || /^TOP HOLDINGS$|^Company\/Instrument$|^Industry\/Rating$|^% of NAV$/.test(txt.trim())) continue;
          if (bucket <= eqFutY + 0.5) shortLines.push(txt);
          else bondLines.push(txt);
        }

        const riskItems = items
          .filter(i => /RISK[- ]LEVEL\s*\d|Risk\s*Level\s*\d/i.test(i.text))
          .sort((a, b) => a.x - b.x);
        const fundRisk = riskItems[0];
        const benchRisk = riskItems[1];
        const riskSection = [
          "RISK LEVELS:",
          `  Fund risk: ${fundRisk?.text ?? "not found"}`,
          `  Benchmark risk: ${benchRisk?.text ?? "not found"}`,
        ].join("\n");

        const eqTotalItem = items.find(i => i.x >= 12.4 && i.x <= 13.6 && i.text === "Equity Total");
        const eqTotalPct = eqTotalItem
          ? items.find(i => i.x >= 22 && i.x <= 23.5 && Math.abs(i.y - eqTotalItem.y) < 0.3)
          : null;
        const equityTotalLines: string[] = ["ASSET CLASS ALLOCATION (totals only):"];
        if (eqTotalItem && eqTotalPct) {
          const eqPctNum = parseFloat(eqTotalPct.text.replace("%", "").trim());
          if (!isNaN(eqPctNum) && eqPctNum >= 5 && eqPctNum <= 80) {
            equityTotalLines.push(`Equity Total  ${eqTotalPct.text}`);
          }
        }

        const metaItems = items.filter((i: TextItem) => i.x < 17);
        const metaText = groupIntoLines(metaItems).join("\n");

        const industryAllocRows: string[] = ["PORTFOLIO BY INDUSTRY (%):"];
        const indAllocNames = items.filter(i => i.x >= 12.5 && i.x <= 13.5 && i.y >= 31 && i.y <= 41).sort((a, b) => a.y - b.y);
        const indAllocPcts = items.filter(i => i.x >= 22.0 && i.x <= 22.5 && i.y >= 31 && i.y <= 41);
        for (const ni of indAllocNames) {
          const pct = indAllocPcts.find(p => Math.abs(p.y - ni.y) < 0.3);
          if (pct) {
            const pctNum = parseFloat(pct.text.replace("%", "").trim());
            industryAllocRows.push(`${ni.text}  ${pct.text}`);
            if (!isNaN(pctNum)) direct.portfolioByIndustry.push({ industry: ni.text, percentage: pctNum });
          }
        }

        const ratingClassNames = items.filter(i => i.x >= 28 && i.x <= 30 && i.y >= 38 && i.y <= 41 && !/%/.test(i.text));
        const ratingClassPcts = items.filter(i => i.x >= 29 && i.x <= 30.5 && i.y >= 38 && i.y <= 41 && /%/.test(i.text));
        for (const ni of ratingClassNames) {
          const pct = ratingClassPcts.find(p => Math.abs(p.y - ni.y) < 0.7);
          if (pct) {
            const pctNum = parseFloat(pct.text.replace("%", "").trim());
            if (!isNaN(pctNum)) direct.portfolioByRatingClass.push({ ratingClass: ni.text, percentage: pctNum });
          }
        }

        for (const row of longRows.slice(1)) {
          const parts = row.split(" | ");
          if (parts.length >= 3) {
            const name = parts[0].trim().toLowerCase();
            const industry = parts[1].trim();
            if (name && industry) direct.equitySectorMap[name] = industry;
          }
        }

        const bondNameItems = items.filter(i => i.x >= 24 && i.x <= 26.5 && i.y > eqFutY + 0.2 && i.y < eqFutY + 5.5);
        const bondRatingItems = items.filter(i => i.x >= 29 && i.x <= 31.5 && i.y > eqFutY + 0.2 && i.y < eqFutY + 5.5);
        const bondPctItems = items.filter(i => i.x >= 34 && i.x <= 35.5 && i.y > eqFutY + 0.2 && i.y < eqFutY + 5.5 && /%/.test(i.text));

        for (const pctItem of bondPctItems.sort((a, b) => a.y - b.y)) {
          const pctNum = parseFloat(pctItem.text.replace("%", "").trim());
          if (isNaN(pctNum) || pctNum > 20) continue;
          const nameParts = bondNameItems
            .filter(n =>
              Math.abs(n.y - pctItem.y) < 0.5 &&
              !/^\d{2}\/\d{2}\/\d{2,4}$/.test(n.text.trim()) &&
              !/^(Corporate Bond|Treasury Bill|Net Cash)$/i.test(n.text.trim()) &&
              !n.text.includes("Total"),
            )
            .sort((a, b) => a.y - b.y || a.x - b.x)
            .map(n => n.text);
          const name = nameParts.join(" ").replace(/\s+/g, " ").trim();
          if (!name) continue;
          const ratingItem = bondRatingItems.find(r => Math.abs(r.y - pctItem.y) < 0.4);
          direct.bondEntries.push({ name, percentage: pctNum, rating: ratingItem?.text ?? null });
        }

        allText += riskSection + "\n\n" + metaText + "\n\n"
          + longRows.join("\n") + "\n\n"
          + equityTotalLines.join("\n") + "\n"
          + shortLines.join("\n") + "\n\n"
          + contShortLines.join("\n") + "\n\n"
          + bondLines.join("\n") + "\n\n"
          + industryAllocRows.join("\n")
          + "\n\n---PAGE---\n\n";
      }

      return { text: allText, direct };
    }

    const textParts: string[] = [];
    const pdfErrors: string[] = [];
    const pdfDirectData: DirectData = {
      portfolioByIndustry: [],
      portfolioByRatingClass: [],
      equitySectorMap: {},
      bondEntries: [],
    };

    for (const url of pdfUrls.slice(0, 3)) {
      try {
        const r = await fetch(url);
        if (!r.ok) { pdfErrors.push(`Fetch failed: HTTP ${r.status}`); continue; }
        const buf = Buffer.from(await r.arrayBuffer());
        if (!buf.byteLength) { pdfErrors.push("Empty response from URL"); continue; }

        // Excel path — detect by magic bytes (Cloudinary strips extensions)
        if (isExcelBuffer(buf) || isExcelUrl(url)) {
          const xlText = await extractExcelText(buf);
          if (xlText.trim()) textParts.push(xlText);
          else pdfErrors.push("No text extracted from Excel");
          continue;
        }

        const result = await new Promise<{ text: string; direct: DirectData }>((resolve, reject) => {
          const parser = new PDFParser();
          parser.on("pdfParser_dataError", (e: unknown) => reject(e instanceof Error ? e : new Error(String(e))));
          parser.on("pdfParser_dataReady", (data: Pdf2JsonData) => resolve(extractStructuredText(data)));
          parser.parseBuffer(buf);
        });

        if (result.text.trim()) textParts.push(result.text);
        else pdfErrors.push("No text extracted from PDF");

        if (!pdfDirectData.portfolioByIndustry.length) pdfDirectData.portfolioByIndustry = result.direct.portfolioByIndustry;
        if (!pdfDirectData.portfolioByRatingClass.length) pdfDirectData.portfolioByRatingClass = result.direct.portfolioByRatingClass;
        if (!Object.keys(pdfDirectData.equitySectorMap).length) pdfDirectData.equitySectorMap = result.direct.equitySectorMap;
        if (!pdfDirectData.bondEntries.length) pdfDirectData.bondEntries = result.direct.bondEntries;
      } catch (e) {
        pdfErrors.push(`Parse error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (!textParts.length) {
      return NextResponse.json({ error: "Could not extract text from PDFs", details: pdfErrors }, { status: 422 });
    }

    const maxChars = MODEL_MAX_CHARS[model] ?? 30_000;
    const combined = textParts
      .join("\n\n---\n\n")
      .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
      .replace(/�/g, " ")
      .replace(/&#x[\dA-Fa-f]+;/g, " ")
      .replace(/[ \t]{3,}/g, "  ")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim()
      .slice(0, maxChars);

    let aiExtracted: Record<string, unknown>;
    if (provider === "deepseek") aiExtracted = await callDeepSeek(combined, model, apiKey);
    else aiExtracted = await callOpenRouter(combined, model, apiKey);

    // Override with direct-parsed data (more accurate than AI for structured tables)
    if (pdfDirectData.portfolioByIndustry.length) aiExtracted.portfolioByIndustry = pdfDirectData.portfolioByIndustry;
    if (pdfDirectData.portfolioByRatingClass.length) aiExtracted.portfolioByRatingClass = pdfDirectData.portfolioByRatingClass;

    // Apply sector/bond overrides for text-extraction path
    if (Array.isArray(aiExtracted.topHoldings)) {
      const CREDIT_RATING_RE = /^(AAA[\+\-]?|AA[\+\-]?|A[\+\-]?|BBB[\+\-]?|SOV|AAA equivalent|AAA\s*Equivalent)$/i;
      const holdings = aiExtracted.topHoldings as Record<string, unknown>[];

      const directSectorMap = pdfDirectData.equitySectorMap;
      for (const h of holdings) {
        const sector = String(h.sector ?? "");
        if (!sector || CREDIT_RATING_RE.test(sector) || sector === "Equity Futures" || sector === "Equity") {
          const directSector = directSectorMap[String(h.name ?? "").toLowerCase()];
          if (directSector) { h.sector = directSector; continue; }
          const partialMatch = Object.entries(directSectorMap).find(([key]) => {
            const name = String(h.name ?? "").toLowerCase();
            return key.startsWith(name) || name.startsWith(key);
          });
          if (partialMatch) h.sector = partialMatch[1];
        }
      }

      // Restore bond names from direct parse
      if (pdfDirectData.bondEntries.length) {
        for (const h of holdings) {
          if (h.sector === "Corporate Bond" || h.sector === "Treasury Bill") {
            const match = pdfDirectData.bondEntries.find(b =>
              Math.abs(b.percentage - Number(h.percentage)) < 0.1 &&
              (b.name.toLowerCase().includes(String(h.name ?? "").toLowerCase().slice(0, 10)) ||
               String(h.name ?? "").toLowerCase().includes(b.name.toLowerCase().slice(0, 10))),
            );
            if (match) {
              h.name = match.name;
              if (match.rating && !h.rating) h.rating = match.rating;
            }
          }
        }
      }
    }

    return NextResponse.json({ extracted: postProcess(aiExtracted) });
  } catch (err) {
    console.error("analyse error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
