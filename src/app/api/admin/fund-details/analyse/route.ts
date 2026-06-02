import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";

const RISK_MAP: Record<string, string> = {
  "1": "Low Risk", "2": "Low to Moderate Risk", "3": "Moderate Risk",
  "4": "Moderately High Risk", "5": "High Risk", "6": "Very High Risk",
};

const EXTRACTION_PROMPT = `You are a precise financial extraction engine for Indian SIF/AIF factsheets. Return ONLY valid JSON — zero prose, zero markdown.

=== FIELD RULES ===

riskBand: Read the RISK LEVELS section. The line "Fund risk: Risk Level X" or "Fund risk: RISK-LEVEL X" tells you the fund's level. Map it: 1=Low Risk, 2=Low to Moderate Risk, 3=Moderate Risk, 4=Moderately High Risk, 5=High Risk, 6=Very High Risk. Example: "Fund risk: Risk Level 1" → return "Low Risk". Return English text, never the raw number. Do NOT infer from strategy name.

schemeType: Strategy/fund type. Look in the header/subtitle near the fund name. E.g. "Hybrid Long-Short Fund", "Equity Long-Short Fund".

exitLoad: Exact text under "Exit Load:" label. Usually "Nil" or a percentage description.

aumCurrent: "Month end AUM" value in ₹ Crore as a number (e.g. 38.41). NOT monthly average.

aumAggregate: Only if there is a separate "Aggregate AUM" or "Total AUM across plans" — otherwise null.

aumEnd: Target/maturity corpus, only if explicitly stated — otherwise null.

minInvestment: Initial minimum investment in ₹. "Rs.10,00,000" = 10000000. Do NOT use SIP amounts.

additionalInvestment: Additional/top-up per transaction in ₹. Only if explicitly stated with a rupee amount (e.g. "multiples of Rs.10,000"). "Re.1/- thereafter" means null.

fundManagers: ALL managers named under "Fund Manager:" section. Each gets {name, designation}.
  E.g. "Equity Portion: Mr. X, Mr. Y" → [{name:"Mr. X",designation:"Equity Portion"},{name:"Mr. Y",designation:"Equity Portion"}]

benchmarkName: Full benchmark index name. Look for "Benchmark:" label or the index name shown near the fund's risk meter.

benchmarkRiskBand: Read the RISK LEVELS section. The line "Benchmark risk: Risk Level X" or "Benchmark risk: RISK-LEVEL X" tells you the benchmark's level. Map it: 1=Low Risk, 2=Low to Moderate Risk, 3=Moderate Risk, 4=Moderately High Risk, 5=High Risk, 6=Very High Risk. Example: "Benchmark risk: Risk Level 2" → return "Low to Moderate Risk". Return the English text. Do NOT return null when this line is present.

benchmarkDetails: Description of benchmark composition if any — usually null.

assetAllocation:
  CRITICAL: Use ONLY the TOTAL rows from "Portfolio Classification by Asset Class / Rating Class (%)" table.
  Look for rows ending in "Total" or the grand summary rows: "Equity Total", "Equity Futures Total", "Corporate Bond Total", "Treasury Bill Total", "Net Cash and Cash Equivalent", "Grand Total".
  DO NOT include individual stock names or rating rows (AAA, SOV etc.) — only the category totals.
  Example correct output: [{"assetClass":"Equity","percentage":37.67},{"assetClass":"Equity Futures","percentage":-37.82},{"assetClass":"Corporate Bond","percentage":39.16},{"assetClass":"Treasury Bill","percentage":12.86},{"assetClass":"Net Cash and Cash Equivalent","percentage":10.31}]

portfolioByIndustry: From "Portfolio Classification by Industry" / "Sector Allocation" / "Industry Allocation" section. Extract ALL rows including "Sovereign", "Cash and Cash Equivalents", "Cash, Cash Equivalents, Derivative Margin And Others", "Unlisted" etc. — do NOT skip non-equity rows. Return [{industry, percentage}].

fundManagers: Extract ALL named portfolio/fund managers. If a manager has no explicit designation, use "Fund Manager". Never leave designation null — use "Fund Manager" as fallback.

assetAllocation: From "Portfolio Classification by Asset Class" or "Asset Class / Rating Class (%)" section. Extract only rows where BOTH a clear asset class label AND a percentage number appear together (same row or clearly paired). Do NOT infer or calculate missing percentages. If the section is unclear or interleaved with other data, return an empty array — never hallucinate values. Return [{assetClass, percentage}].

topHoldings:
  The holdings table format varies by PDF. Look for ANY table with instrument names and % to NAV / % of portfolio columns.
  CRITICAL: Extract ALL instrument types — equity shares, preference shares, bonds/debentures, government securities, T-bills, REITs, InvITs, ETFs, AND derivatives/futures/options. Do NOT skip any section.

  INSTRUMENT CLASSIFICATION RULES:
  - Equity shares (positive %): sector = industry from sector column (e.g. "Financial Services"). rating = null. If same company also has a bond, they are separate entries — do NOT merge.
  - Equity Futures / Short Futures (negative %): sector = same industry as underlying stock. rating = null. Extract ALL derivatives rows, not just a few.
  - Non-Convertible Preference Shares: sector = "Preference Share". Keep the credit rating (CARE A1+, CRISIL A1+).
  - Corporate Bonds / NCDs / Debentures (positive %, have AAA/AA/A rating): sector = "Corporate Bond". rating = full rating text (CRISIL AAA, [ICRA]AAA etc.)
  - T-Bills (91 Day, 182 Day, 364 Day): sector = "Treasury Bill". rating = "SOVEREIGN"
  - Government Securities / G-Secs / GOI Bonds (Government of India, long-term): sector = "Government Securities". rating = "SOVEREIGN"
  - REITs (Real Estate Investment Trusts): sector = "REIT". rating = null.
  - InvITs (Infrastructure Investment Trusts): sector = "InvIT". rating = null.
  - Net Cash / Cash Equivalents: sector = "Cash". rating = null.

  Same company CAN appear as equity long (+) AND equity futures short (-) AND bond — include ALL THREE as separate entries.
  Parse from ALL sections: LONG EQUITY POSITIONS, SHORT POSITIONS, CONTINUATION SHORT POSITIONS, CORPORATE BONDS AND TREASURY BILLS if provided, plus any raw table data in the text.
  Each entry: {name, percentage (number, negative for short/futures), sector (string or null), rating (string or null)}.

=== JSON SCHEMA ===
{"riskBand":string|null,"schemeType":string|null,"exitLoad":string|null,"aumCurrent":number|null,"aumAggregate":number|null,"aumEnd":number|null,"minInvestment":number|null,"additionalInvestment":number|null,"fundManagers":[{"name":string,"designation":string}],"benchmarkName":string|null,"benchmarkRiskBand":string|null,"benchmarkDetails":string|null,"assetAllocation":[{"assetClass":string,"percentage":number}],"portfolioByIndustry":[{"industry":string,"percentage":number}],"topHoldings":[{"name":string,"percentage":number,"sector":string|null,"rating":string|null}]}

=== FACTSHEET TEXT ===
`;

function parseAiJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function callGroq(text: string, model: string, apiKey: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: EXTRACTION_PROMPT + text }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "Groq API error");
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
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "OpenRouter API error");
  return parseAiJson(d.choices[0].message.content);
}

async function callGemini(text: string, model: string, apiKey: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: EXTRACTION_PROMPT + text + "\n\nReturn only valid JSON." }],
        }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    },
  );
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "Gemini API error");
  const raw = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseAiJson(raw);
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { pdfUrls, provider, model, apiKey } = await req.json() as {
    pdfUrls: string[];
    provider: "groq" | "gemini" | "openrouter";
    model: string;
    apiKey: string;
  };

  if (!pdfUrls?.length) return NextResponse.json({ error: "No PDFs provided" }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "API key required" }, { status: 400 });
  if (!model) return NextResponse.json({ error: "Model required" }, { status: 400 });

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
    equitySectorMap: Record<string, string>; // company name (lowercase) → sector
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

      // ── Long holdings ─────────────────────────────────────────────────────────
      // Use industry column (x≈17-19.5) as row anchors; company names at x≈12.75

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

      // Pre-group company names at x≈12.75 into multi-line entities (e.g. "Hindustan Petroleum" + "Corporation")
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

        // FIX: use CLOSEST pct match (not first-found) to prevent off-by-one row shift
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

      // ── Continuation short positions (bottom-section wrap at x≈22.8) ─────────
      // Shorts that don't fit in right column wrap to: name at x≈12.75 (with date suffix),
      // negative % at x≈22-23. Extract these explicitly.
      const contShortLines: string[] = ["CONTINUATION SHORT POSITIONS (equity futures, bottom section):"];
      const contShortPcts = items
        .filter(i => i.x >= 22 && i.x <= 23.3 && /^-\d+\.\d+%$/.test(i.text.trim()))
        .sort((a, b) => a.y - b.y);
      for (const p of contShortPcts) {
        // Find name at x≈12.75 closest to this y (must include a date to distinguish from long names)
        const name = nameGroups
          .filter(g => Math.abs(g.y - p.y) < 0.8 && /\d{2}\/\d{2}\/\d{4}/.test(g.text))
          .sort((a, b) => Math.abs(a.y - p.y) - Math.abs(b.y - p.y))[0];
        if (name) {
          // Strip date suffix to get clean company name
          const cleanName = name.text.replace(/\s*\d{2}\/\d{2}\/\d{4}.*/, "").trim();
          contShortLines.push(`${cleanName}  ${p.text}`);
        }
      }

      // ── Short + bonds + T-bills (x≥23 zone) ──────────────────────────────────
      // Exclude x≈22-23 negative % items to prevent them bleeding into bond/T-bill rows
      const rightItems = items.filter(i => i.x >= 23);
      const rByY: Record<number, TextItem[]> = {};
      for (const item of rightItems) {
        const bucket = Math.round(item.y * 4) / 4;
        (rByY[bucket] ??= []).push(item);
      }
      const shortLines: string[] = ["SHORT POSITIONS (equity futures, main column):"];
      const bondLines: string[] = ["CORPORATE BONDS AND TREASURY BILLS:"];
      // Equity futures section ends at "Equity Futures Total" row — find that y
      const eqFutTotal = rightItems.find(i => i.text.includes("Equity Futures Total"));
      const eqFutY = eqFutTotal?.y ?? 17;
      for (const bucket of Object.keys(rByY).map(Number).sort()) {
        const row = rByY[bucket].sort((a, b) => a.x - b.x);
        const txt = row.map(i => i.text).join("  ").trim();
        if (!txt || /^TOP HOLDINGS$|^Company\/Instrument$|^Industry\/Rating$|^% of NAV$/.test(txt.trim())) continue;
        if (bucket <= eqFutY + 0.5) {
          shortLines.push(txt);  // equity futures section
        } else {
          bondLines.push(txt);   // bonds, T-bills, cash section
        }
      }

      // ── Explicitly extracted key fields ──────────────────────────────────────

      // Risk levels: look for "RISK-LEVEL X" or "Risk Level X" patterns
      // Sort by x: leftmost item = fund riskometer, next = benchmark riskometer
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

      // Equity Total row: name at x≈12.75 ("Equity Total"), pct at x≈22.5-23 same y
      const eqTotalItem = items.find(i => i.x >= 12.4 && i.x <= 13.6 && i.text === "Equity Total");
      const eqTotalPct = eqTotalItem
        ? items.find(i => i.x >= 22 && i.x <= 23.5 && Math.abs(i.y - eqTotalItem.y) < 0.3)
        : null;

      // Only inject Equity Total if the value looks like a real percentage (5–80%)
      // and was found at the expected coordinates — prevents cross-PDF contamination
      const equityTotalLines: string[] = ["ASSET CLASS ALLOCATION (totals only):"];
      if (eqTotalItem && eqTotalPct) {
        const eqPctNum = parseFloat(eqTotalPct.text.replace("%", "").trim());
        if (!isNaN(eqPctNum) && eqPctNum >= 5 && eqPctNum <= 80) {
          equityTotalLines.push(`Equity Total  ${eqTotalPct.text}`);
        }
      }

      // ── Metadata (fund details, AUM, managers, etc.) ─────────────────────────
      const metaItems = items.filter((i: TextItem) => i.x < 17);
      const metaText = groupIntoLines(metaItems).join("\n");

      // ── Industry Allocation (direct parse y 31-41) ───────────────────────────
      const industryAllocRows: string[] = ["PORTFOLIO BY INDUSTRY (%):"];
      const indAllocNames = items
        .filter(i => i.x >= 12.5 && i.x <= 13.5 && i.y >= 31 && i.y <= 41)
        .sort((a, b) => a.y - b.y);
      const indAllocPcts = items.filter(i => i.x >= 22.0 && i.x <= 22.5 && i.y >= 31 && i.y <= 41);
      for (const ni of indAllocNames) {
        const pct = indAllocPcts.find(p => Math.abs(p.y - ni.y) < 0.3);
        if (pct) {
          const pctNum = parseFloat(pct.text.replace("%", "").trim());
          industryAllocRows.push(`${ni.text}  ${pct.text}`);
          if (!isNaN(pctNum)) direct.portfolioByIndustry.push({ industry: ni.text, percentage: pctNum });
        }
      }

      // ── Rating Class Allocation (direct parse — right column y 39-41) ─────────
      // "AAA Equivalent" at x≈28.5, percentage at x≈29-30
      const ratingClassNames = items.filter(i => i.x >= 28 && i.x <= 30 && i.y >= 38 && i.y <= 41 && !/%/.test(i.text));
      const ratingClassPcts = items.filter(i => i.x >= 29 && i.x <= 30.5 && i.y >= 38 && i.y <= 41 && /%/.test(i.text));
      for (const ni of ratingClassNames) {
        const pct = ratingClassPcts.find(p => Math.abs(p.y - ni.y) < 0.7);
        if (pct) {
          const pctNum = parseFloat(pct.text.replace("%", "").trim());
          if (!isNaN(pctNum)) direct.portfolioByRatingClass.push({ ratingClass: ni.text, percentage: pctNum });
        }
      }

      // ── Equity sector map (from longRows: "name | industry | %") ────────────
      for (const row of longRows.slice(1)) { // skip header
        const parts = row.split(" | ");
        if (parts.length >= 3) {
          const name = parts[0].trim().toLowerCase();
          const industry = parts[1].trim();
          if (name && industry) direct.equitySectorMap[name] = industry;
        }
      }

      // ── Bonds direct parse (preserve coupon rates, skip totals/headers) ────────
      // Name at x≈24.5, rating at x≈30, pct at x≈34.5; y range after equity futures total
      const bondNameItems = items.filter(i => i.x >= 24 && i.x <= 26.5 && i.y > eqFutY + 0.2 && i.y < eqFutY + 5.5);
      const bondRatingItems = items.filter(i => i.x >= 29 && i.x <= 31.5 && i.y > eqFutY + 0.2 && i.y < eqFutY + 5.5);
      const bondPctItems = items.filter(i => i.x >= 34 && i.x <= 35.5 && i.y > eqFutY + 0.2 && i.y < eqFutY + 5.5 && /%/.test(i.text));

      for (const pctItem of bondPctItems.sort((a, b) => a.y - b.y)) {
        const pctNum = parseFloat(pctItem.text.replace("%", "").trim());
        if (isNaN(pctNum) || pctNum > 20) continue; // skip totals

        // Name: items within ±0.5 y, excluding date fragments and section headers
        const nameParts = bondNameItems
          .filter(n =>
            Math.abs(n.y - pctItem.y) < 0.5 &&
            !/^\d{2}\/\d{2}\/\d{2,4}$/.test(n.text.trim()) && // strip dates
            !/^(Corporate Bond|Treasury Bill|Net Cash)$/i.test(n.text.trim()) && // strip headers
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

      const result = await new Promise<{ text: string; direct: DirectData }>((resolve, reject) => {
        const parser = new PDFParser();
        parser.on("pdfParser_dataError", (e: unknown) => reject(e instanceof Error ? e : new Error(String(e))));
        parser.on("pdfParser_dataReady", (data: Pdf2JsonData) => resolve(extractStructuredText(data)));
        parser.parseBuffer(buf);
      });

      if (result.text.trim()) textParts.push(result.text);
      else pdfErrors.push("No text extracted from PDF");

      // Merge direct data from first PDF
      if (!pdfDirectData.portfolioByIndustry.length) pdfDirectData.portfolioByIndustry = result.direct.portfolioByIndustry;
      if (!pdfDirectData.portfolioByRatingClass.length) pdfDirectData.portfolioByRatingClass = result.direct.portfolioByRatingClass;
      if (!Object.keys(pdfDirectData.equitySectorMap).length) pdfDirectData.equitySectorMap = result.direct.equitySectorMap;
      if (!pdfDirectData.bondEntries.length) pdfDirectData.bondEntries = result.direct.bondEntries;
    } catch (e) {
      pdfErrors.push(`Parse error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!textParts.length) {
    return NextResponse.json(
      { error: "Could not extract text from PDFs", details: pdfErrors },
      { status: 422 },
    );
  }

  // Clean and concatenate — pdf2json outputs encoded chars and excessive whitespace
  const combined = textParts
    .join("\n\n---\n\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/�/g, " ")            // replace replacement chars
    .replace(/&#x[\dA-Fa-f]+;/g, " ")  // strip HTML entities
    .replace(/[ \t]{3,}/g, "  ")        // collapse excessive spaces/tabs
    .replace(/\n{4,}/g, "\n\n\n")       // collapse excessive blank lines
    .trim()
    .slice(0, 30_000);

  try {
    let extracted: Record<string, unknown>;
    if (provider === "groq") extracted = await callGroq(combined, model, apiKey);
    else if (provider === "gemini") extracted = await callGemini(combined, model, apiKey);
    else extracted = await callOpenRouter(combined, model, apiKey);

    // Override with direct position-parse data (always more accurate than AI for structured tables)
    if (pdfDirectData.portfolioByIndustry.length) extracted.portfolioByIndustry = pdfDirectData.portfolioByIndustry;
    if (pdfDirectData.portfolioByRatingClass.length) extracted.portfolioByRatingClass = pdfDirectData.portfolioByRatingClass;

    // Normalise risk fields: if model returned a digit string, map to English
    for (const key of ["riskBand", "benchmarkRiskBand"] as const) {
      const v = extracted[key];
      if (typeof v === "string" && RISK_MAP[v.trim()]) {
        extracted[key] = RISK_MAP[v.trim()];
      }
    }

    // Normalise topHoldings
    if (Array.isArray(extracted.topHoldings)) {
      const CREDIT_RATING_RE = /^(AAA[\+\-]?|AA[\+\-]?|A[\+\-]?|BBB[\+\-]?|SOV|AAA equivalent|AAA\s*Equivalent)$/i;
      const SECTOR_KEYWORDS = /^(corporate bond|treasury bill|t-bill|cash|net cash)/i;

      const holdings = (extracted.topHoldings as Record<string, unknown>[]).map(h => {
        const raw = {
          name: String(h.name ?? h.company ?? h.instrument ?? "").trim(),
          percentage: Number(h.percentage ?? h.percent ?? h["% of NAV"] ?? 0),
          sector: String(h.sector ?? h.industry ?? h.Industry ?? "").trim() || null,
          rating: String(h.rating ?? h.Rating ?? "").trim() || null,
        };

        // Fix: if sector is actually a credit rating, move it to rating and infer sector from name
        if (raw.sector && CREDIT_RATING_RE.test(raw.sector) && !raw.rating) {
          raw.rating = raw.sector;
          if (/bill|t-bill|tbill/i.test(raw.name)) {
            raw.sector = "Treasury Bill";
          } else if (/government of india|goi\b|g-sec|gsec|sovereign/i.test(raw.name)) {
            raw.sector = "Government Securities";
          } else if (/bond|sidbi|exim|nabard|nhai|debenture|rec\b|ntpc\b|power finance|toyota financial/i.test(raw.name) || /housing finance/i.test(raw.name)) {
            raw.sector = "Corporate Bond";
          } else {
            raw.sector = null;
          }
        }

        // Fix: G-Secs are NOT Treasury Bills — distinguish by sovereign rating + instrument type
        if (raw.rating && /SOVEREIGN|SOV/i.test(raw.rating) && raw.percentage > 0) {
          if (/day t-bill|day tbill|\d+ day/i.test(raw.name) || /t-bill|tbill/i.test(raw.name)) {
            raw.sector = "Treasury Bill";
          } else {
            raw.sector = "Government Securities"; // G-Secs, GOI bonds
          }
        }

        // Fix: classify entries by long-term credit rating
        if (raw.rating && raw.percentage > 0) {
          const hasLongTermRating = /\bAAA\b|\bAA[\+\-]?\b|\bBBB[\+\-]?\b/i.test(raw.rating) &&
            !/A1\+|A2\+|P1\+/i.test(raw.rating);
          const hasShortTermRating = /\bA1\+|\bA1\b|\bA2\+|\bP1\+|\bP1\b/i.test(raw.rating);

          // Industry-specific sectors (from equity table) — AI got it right, rating is misattributed
          const aiHasIndustrySector = raw.sector &&
            !raw.sector.match(/Corporate Bond|Treasury Bill|Government Securities|Cash|Equity/i) &&
            !CREDIT_RATING_RE.test(raw.sector);

          if (hasLongTermRating) {
            if (aiHasIndustrySector) {
              // AI correctly identified an equity sector — strip the misattributed bond rating
              // (same company name appears in both equity and bond sections of the PDF)
              raw.rating = null;
            } else if (!raw.sector?.match(/Corporate Bond|Treasury Bill|Government Securities/i)) {
              raw.sector = "Corporate Bond";
            }
          } else if (hasShortTermRating) {
            // Preference shares / NCPs legitimately have A1+ ratings — keep if sector indicates it
            const isPreferenceShare = /preference share|ncd|commercial paper|cp\b/i.test(raw.sector ?? "");
            if (!isPreferenceShare) raw.rating = null; // strip from plain equity entries
          }
        }

        // If sector is already a proper sector (not a rating), keep it
        if (raw.sector && SECTOR_KEYWORDS.test(raw.sector) && !raw.rating) {
          // sector is correct, no fix needed
        }

        return raw;
      }).filter(h => h.name);

      // Apply sectors from direct parse (equitySectorMap from longRows) — most reliable
      // "Equity Futures" is not a sector — replace with underlying sector (Option B)
      // so industry-level analysis (net exposure = long + short) works correctly
      const directSectorMap = pdfDirectData.equitySectorMap;
      for (const h of holdings) {
        if (!h.sector || CREDIT_RATING_RE.test(h.sector ?? "") || h.sector === "Equity Futures" || h.sector === "Equity") {
          const directSector = directSectorMap[h.name.toLowerCase()];
          if (directSector) { h.sector = directSector; continue; }
          // Also try partial name match (e.g. "Central Depository Services" → "Central Depository Services India")
          const partialMatch = Object.entries(directSectorMap).find(([key]) =>
            key.startsWith(h.name.toLowerCase()) || h.name.toLowerCase().startsWith(key),
          );
          if (partialMatch) {
            h.sector = partialMatch[1];
            // Restore full name from direct map key if this is a truncated short name
            const fullName = Object.keys(directSectorMap).find(k => k.startsWith(h.name.toLowerCase()) && k.length > h.name.length);
            if (fullName) {
              // Capitalize back (direct map keys are lowercase)
              const originalName = Object.keys(pdfDirectData.equitySectorMap).find(k => k === fullName);
              if (originalName) h.name = originalName; // still lowercase — fix next step
            }
          }
        }
      }

      // Restore proper case for names that were lowercased during lookup
      // Use the longRows data to map lowercase → proper case
      const properCaseMap: Record<string, string> = {};
      for (const [lower] of Object.entries(directSectorMap)) {
        // Find original proper-case name from longRows (it was lowercased for the map)
        // We stored lowercase keys; use the sector map to recover from holdings themselves
        const existing = holdings.find(h => h.percentage > 0 && h.name.toLowerCase() === lower);
        if (existing) properCaseMap[lower] = existing.name;
      }
      // Fix truncated short names
      for (const h of holdings) {
        if (h.percentage < 0) {
          const lookup = properCaseMap[h.name.toLowerCase()];
          if (!lookup) {
            // Try to find longer canonical name
            const canonical = Object.keys(properCaseMap).find(k => k.startsWith(h.name.toLowerCase()) || h.name.toLowerCase().startsWith(k.slice(0, k.length - 5)));
            if (canonical && properCaseMap[canonical]) h.name = properCaseMap[canonical];
          }
        }
      }

      // Fallback: cross-reference sector from long positions within extracted holdings
      const aiSectorMap: Record<string, string> = {};
      for (const h of holdings) {
        if (h.percentage > 0 && h.sector && !SECTOR_KEYWORDS.test(h.sector)) {
          aiSectorMap[h.name.toLowerCase()] = h.sector;
        }
      }
      for (const h of holdings) {
        if (!h.sector && h.percentage < 0) {
          const match = aiSectorMap[h.name.toLowerCase()];
          if (match) h.sector = match;
        }
      }

      // Restore full bond names from direct parse (AI strips coupon rates)
      if (pdfDirectData.bondEntries.length) {
        for (const h of holdings) {
          if (h.sector === "Corporate Bond" || h.sector === "Treasury Bill") {
            const match = pdfDirectData.bondEntries.find(b =>
              Math.abs(b.percentage - h.percentage) < 0.1 &&
              (b.name.toLowerCase().includes(h.name.toLowerCase().slice(0, 10)) ||
               h.name.toLowerCase().includes(b.name.toLowerCase().slice(0, 10))),
            );
            if (match) {
              h.name = match.name;
              if (match.rating && !h.rating) h.rating = match.rating;
            }
          }
        }
      }

      // Remove date-misread percentages and zero entries
      const isBondOrTBill = (name: string) =>
        /bond|bill|t-bill|tbill|debenture|ncd|sidbi|nabard|nhai|exim|housing finance/i.test(name);
      const filtered = holdings.filter(h => {
        if (h.percentage === 0) return false;
        if (Math.abs(h.percentage) > 15 && !isBondOrTBill(h.name)) return false;
        return true;
      });

      // Inject Net Cash if not present and assetAllocation has it
      const assetAlloc = extracted.assetAllocation as { assetClass: string; percentage: number }[] | undefined;
      const cashFromAlloc = assetAlloc?.find(a => /cash/i.test(a.assetClass));
      const hasCash = filtered.some(h => /net cash|cash equivalent/i.test(h.name));
      if (cashFromAlloc && !hasCash) {
        filtered.push({
          name: "Net Cash and Cash Equivalent",
          percentage: cashFromAlloc.percentage,
          sector: "Cash",
          rating: null,
        });
      }

      extracted.topHoldings = filtered;
    }

    // Remove additionalInvestment = 1 (Re 1/- is SIP minimum, not a real additional amount)
    if (extracted.additionalInvestment === 1 || extracted.additionalInvestment === 1.0) {
      extracted.additionalInvestment = null;
    }

    // Fix null fund manager designations
    if (Array.isArray(extracted.fundManagers)) {
      extracted.fundManagers = (extracted.fundManagers as { name: string; designation: string | null }[])
        .map(m => ({ ...m, designation: m.designation || "Fund Manager" }));
    }

    // Fix null Debt percentage in assetAllocation — compute from 100 minus known categories
    if (Array.isArray(extracted.assetAllocation)) {
      const alloc = extracted.assetAllocation as { assetClass: string; percentage: number | null }[];
      const nullEntry = alloc.find(a => a.percentage == null);
      if (nullEntry) {
        const known = alloc.filter(a => a.percentage != null).reduce((s, a) => s + (a.percentage ?? 0), 0);
        nullEntry.percentage = Math.round((100 - known) * 100) / 100;
      }
    }

    return NextResponse.json({ extracted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI call failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
