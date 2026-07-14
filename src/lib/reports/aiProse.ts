import type { UniverseData, PerformanceData, Prose } from "./types";

function inCr(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fallbackProse(monthLabel: string, u: UniverseData, perf: PerformanceData): Prose {
  const g = u.grandTotal;
  const cats = u.categories.length || 6;
  return {
    universeOverview:
      `As of ${monthLabel}, the SIF universe comprised ${g.schemes} active schemes across ${cats} categories ` +
      `with net AUM of ₹${inCr(g.aumCr)} Cr and ${g.folios.toLocaleString("en-IN")} investor folios, ` +
      `recording net inflows of ₹${inCr(g.netFlowCr)} Cr for the month.`,
    debtSectionNote:
      `No Debt Long-Short SIF schemes have been launched as of ${monthLabel}. ` +
      `This table will be populated once schemes become active on the SIFcase platform.`,
    highlightsIntro:
      `All returns computed from NAV history on the SIFcase platform. ` +
      `Returns are absolute given the short track record of the SIF framework.`,
  };
}

const PROMPT = `You are a SEBI-registered SIF research analyst. Using ONLY the JSON figures given, write three fields as JSON:
- "universeOverview": one sentence like the reference — must state the exact scheme count, category count (6), net AUM (₹ Cr), folio count, and net inflow (₹ Cr) from the data. Do not invent any number.
- "debtSectionNote": one/two sentences noting no Debt Long-Short SIF schemes exist as of the given month, populated when schemes go live.
- "highlightsIntro": one/two neutral sentences introducing the monthly performance highlights (returns are absolute, computed from NAV history).
Return strict JSON with exactly these keys.`;

export async function generateProse(monthLabel: string, u: UniverseData, perf: PerformanceData): Promise<Prose> {
  const fb = fallbackProse(monthLabel, u, perf);
  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { default: AISetting } = await import("@/models/AISetting");
    await connectDB();
    const setting = await AISetting.findOne({ usages: "monthly-report" }).lean();
    if (!setting) return fb;

    const payload = {
      monthLabel,
      grandTotal: { schemes: u.grandTotal.schemes, categories: 6, netAumCr: u.grandTotal.aumCr, folios: u.grandTotal.folios, netInflowCr: u.grandTotal.netFlowCr },
      topPerformers: perf.top3.map((r) => ({ name: r.schemeName, oneMonth: r.r1m })),
    };
    const prompt = `${PROMPT}\n\n=== DATA (JSON) ===\n${JSON.stringify(payload)}`;

    let out: Partial<Prose> = {};
    if (setting.provider === "gemini") {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const { generateText } = await import("ai");
      const google = createGoogleGenerativeAI({ apiKey: setting.apiKey });
      const { text } = await generateText({ model: google(setting.modelName), prompt, temperature: 0.2 });
      out = parseJson(text);
    } else if (setting.provider === "deepseek") {
      out = await callDeepSeek(prompt, setting.modelName, setting.apiKey);
    } else if (setting.provider === "openrouter") {
      out = await callOpenRouter(prompt, setting.modelName, setting.apiKey);
    }
    return {
      universeOverview: out.universeOverview?.trim() || fb.universeOverview,
      debtSectionNote: out.debtSectionNote?.trim() || fb.debtSectionNote,
      highlightsIntro: out.highlightsIntro?.trim() || fb.highlightsIntro,
    };
  } catch {
    return fb; // never fail the report because of AI
  }
}

function parseJson(text: string): Partial<Prose> {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch { return {}; }
}

async function callDeepSeek(prompt: string, model: string, apiKey: string): Promise<Partial<Prose>> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2, response_format: { type: "json_object" } }),
  });
  const d = await res.json() as { error?: { message?: string }; choices: { message: { content: string } }[] };
  if (!res.ok) throw new Error(d.error?.message || "DeepSeek error");
  return parseJson(d.choices[0].message.content);
}

async function callOpenRouter(prompt: string, model: string, apiKey: string): Promise<Partial<Prose>> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": "https://sifcase.in", "X-Title": "SIFcase Admin" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2 }),
  });
  const d = await res.json() as { error?: { message?: string }; choices: { message: { content: string } }[] };
  if (!res.ok) throw new Error(d.error?.message || "OpenRouter error");
  return parseJson(d.choices[0].message.content);
}
