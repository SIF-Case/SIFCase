import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import FundDetails from "@/models/FundDetails";
import AISetting from "@/models/AISetting";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const NarrativeSchema = z.object({
  benchmarkDetails: z.string().describe("1-2 sentences describing what the benchmark index represents and why it fits this fund's strategy."),
  taxationSummary: z.string().describe("2-3 sentences summarising how gains from this fund are taxed, based on its category (equity vs hybrid/debt) and holding period."),
  suitableFor: z.string().describe("2-3 sentences on the type of investor this fund suits, given its risk band, category, and volatility profile."),
  notSuitableFor: z.string().describe("2-3 sentences on who should avoid this fund."),
  bullMarket: z.string().describe("2-3 sentences on how this fund likely performs in rising equity markets, given its strategy and net exposure."),
  bearMarket: z.string().describe("2-3 sentences on how this fund likely performs in falling markets — does its strategy provide downside protection?"),
  sidewaysMarket: z.string().describe("2-3 sentences on likely performance in flat/range-bound markets."),
  mfEquivalent: z.string().describe("1 sentence naming the closest mutual fund category and why."),
  portfolioFit: z.string().describe("2-3 sentences on where this SIF fits in a diversified portfolio — satellite, alternative sleeve, hedge, etc."),
});

const PROMPT_INTRO = `You are a SEBI-registered SIF (Specialized Investment Fund) research analyst. Based ONLY on the structured fund data given below (JSON), write the following fields. Be concrete and specific — reference actual numbers, sector names, holdings, and metrics from the data instead of generic boilerplate. Do not invent facts not supported by the data; where data is thin, keep the field brief rather than speculative.

Fields to produce:
- benchmarkDetails
- taxationSummary
- suitableFor
- notSuitableFor
- bullMarket
- bearMarket
- sidewaysMarket
- mfEquivalent
- portfolioFit

=== FUND DATA (JSON) ===
`;

function parseAiJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

async function callDeepSeek(prompt: string, model: string, apiKey: string) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "DeepSeek API error");
  return parseAiJson(d.choices[0].message.content);
}

async function callOpenRouter(prompt: string, model: string, apiKey: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://sifcase.in",
      "X-Title": "SIFcase Admin",
    },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2 }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "OpenRouter API error");
  return parseAiJson(d.choices[0].message.content);
}

export async function POST(req: NextRequest) {
  try {
    if (!await hasPageAccess(req, "fundDetails", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await connectDB();

    const body = await req.json() as {
      fundName?: string;
      provider?: "deepseek" | "gemini" | "openrouter";
      model?: string;
      apiKey?: string;
    };
    if (!body.fundName) return NextResponse.json({ error: "fundName required" }, { status: 400 });

    let { provider, model, apiKey } = body;
    const savedConfig = await AISetting.findOne({ usages: "fundDetailsAnalysis" }).lean();
    if (savedConfig) {
      provider = savedConfig.provider;
      model = savedConfig.modelName;
      apiKey = savedConfig.apiKey;
    }
    if (!provider) return NextResponse.json({ error: "No AI provider configured — set one up in Admin → AI Settings or enter one manually" }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: "API key required" }, { status: 400 });
    if (!model) return NextResponse.json({ error: "Model required" }, { status: 400 });

    const detail = await FundDetails.findOne({ fundName: body.fundName }).lean();
    if (!detail) return NextResponse.json({ error: "No FundDetails record for this fund yet — sync from ISIN first" }, { status: 404 });

    // Ground the AI only in the data-rich, factual fields — not the narrative fields
    // we're about to generate (avoid it echoing/anchoring on prior AI text).
    const context = {
      fundName: detail.fundName,
      schemeCategory: detail.schemeCategory,
      schemeType: detail.schemeType,
      riskBand: detail.riskBand,
      benchmarkName: detail.benchmarkName,
      exitLoad: detail.exitLoad,
      aumCurrent: detail.aumCurrent,
      terMax: detail.terMax,
      assetAllocation: detail.assetAllocation,
      portfolioByIndustry: detail.portfolioByIndustry,
      topHoldings: detail.topHoldings,
      fundamentals: detail.fundamentals,
      concentration: detail.concentration,
      marketCapWeightage: detail.marketCapWeightage,
      rollingReturns: detail.rollingReturns,
      categoryRanks: detail.categoryRanks,
      peers: detail.peers,
      amcName: detail.amcName,
    };

    const prompt = PROMPT_INTRO + JSON.stringify(context, null, 2);

    let extracted: Record<string, unknown>;
    if (provider === "gemini") {
      const google = createGoogleGenerativeAI({ apiKey });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { object } = await generateObject({ model: google(model), schema: NarrativeSchema as any, prompt });
      extracted = object as Record<string, unknown>;
    } else if (provider === "deepseek") {
      extracted = await callDeepSeek(prompt, model, apiKey);
    } else {
      extracted = await callOpenRouter(prompt, model, apiKey);
    }

    return NextResponse.json({ extracted });
  } catch (err) {
    console.error("[fund-details generate-narrative]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
