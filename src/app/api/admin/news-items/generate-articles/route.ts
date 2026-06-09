import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import NewsItem from "@/models/NewsItem";
import NewsConfig, { DEFAULT_ARTICLE_GEN_PROMPT } from "@/models/NewsConfig";
import AISetting from "@/models/AISetting";

type AiProvider = "deepseek" | "gemini" | "openrouter";

async function callAi(
  prompt: string,
  userContent: string,
  provider: AiProvider,
  modelName: string,
  apiKey: string,
): Promise<string> {
  if (provider === "deepseek") {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(120000),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error?.message || "DeepSeek error");
    return (d.choices[0].message.content as string).trim();
  }

  if (provider === "openrouter") {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://sifcase.in",
        "X-Title": "SIFcase Article Generation",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(120000),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error?.message || "OpenRouter error");
    return (d.choices[0].message.content as string).trim();
  }

  if (provider === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\n${userContent}` }] }],
          generationConfig: { temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(120000),
      },
    );
    const d = await res.json();
    if (!res.ok) throw new Error(d.error?.message || "Gemini error");
    return (d.candidates?.[0]?.content?.parts?.[0]?.text as string ?? "").trim();
  }

  throw new Error("Unsupported provider");
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "news", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No items selected" }, { status: 400 });
  }

  const [newsItems, config, aiSetting] = await Promise.all([
    NewsItem.find({ _id: { $in: ids } }).lean(),
    NewsConfig.findOne({}).lean(),
    AISetting.findOne({ usages: "articleGeneration" }).lean(),
  ]);

  if (!aiSetting) {
    return NextResponse.json({
      error: "No AI setting configured for 'articleGeneration'. Go to Settings → AI Settings and assign a model to that usage.",
    }, { status: 400 });
  }

  const articleGenerationPrompt = config?.articleGenerationPrompt?.trim() || DEFAULT_ARTICLE_GEN_PROMPT;

  // Build user content — include everything we have for each item
  const itemsText = newsItems
    .map((item, i) => [
      `=== Source ${i + 1} of ${newsItems.length} ===`,
      `Title: ${item.title}`,
      `Source: ${item.source}`,
      `Published: ${new Date(item.publishedAt).toDateString()}`,
      `Content: ${item.originalExcerpt?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? ""}`,
    ].join("\n"))
    .join("\n\n");

  const userContent = `I am providing you ${newsItems.length} news item${newsItems.length > 1 ? "s" : ""}. After deduplication, if there are ${newsItems.length > 1 ? "multiple distinct stories" : "a story"}, write a separate article for each one. Do not collapse different stories into one article.\n\n${itemsText}`;

  let raw: string;
  try {
    raw = await callAi(
      articleGenerationPrompt,
      userContent,
      aiSetting.provider as AiProvider,
      aiSetting.modelName,
      aiSetting.apiKey,
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  let parsed: { title: string; body: string }[];
  try {
    parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Not an array");
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON. Raw response: " + cleaned.slice(0, 500) }, { status: 500 });
  }

  // Return content only — user reviews and saves from the UI
  const articles = parsed.map(item => ({
    title: (item.title ?? "").trim() || "Untitled Article",
    body: (item.body ?? "").trim(),
  }));

  return NextResponse.json({ ok: true, articles });
}
