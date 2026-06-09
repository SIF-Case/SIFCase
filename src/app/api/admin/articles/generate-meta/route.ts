import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import AISetting from "@/models/AISetting";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const ArticleMetaSchema = z.object({
  title: z.string().describe("SEO-friendly article title, concise and compelling, under 70 characters"),
  excerpt: z.string().describe("Excerpt shown in article cards, 300–350 characters"),
  tags: z.array(z.string()).describe("4–7 relevant lowercase tags/keywords for the article"),
  seoTitle: z.string().describe("SEO title tag, 50–60 characters, includes the focus keyphrase"),
  metaDescription: z.string().describe("Meta description, 150–160 characters, includes the focus keyphrase, written to drive clicks"),
  focusKeyphrase: z.string().describe("The single primary keyphrase this article should rank for, 2–5 words"),
  primaryKeyword: z.string().describe("A primary search keyword/phrase distinct from the focus keyphrase, e.g. a broader category term"),
});

type ArticleMeta = z.infer<typeof ArticleMetaSchema>;

function buildPrompt(input: { title: string; content: string; category: string; existing: Partial<ArticleMeta> }): string {
  const plain = input.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 8000);
  const existingLines = Object.entries(input.existing)
    .filter(([, v]) => v && (typeof v === "string" ? v.trim() : (v as string[]).length))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);

  return `You are an SEO copywriter for SIFcase, a financial education site about Specialised Investment Funds (SIFs) in India.

Generate metadata for the article below. Return fields that are SEO-optimised, accurate to the content, and written in a professional, no-hype tone (matches a "Wealth Trust" editorial voice — informative, precise, never salesy).

${existingLines.length ? `=== ALREADY FILLED — KEEP CONSISTENT WITH THESE, DO NOT CONTRADICT ===\n${existingLines.join("\n")}\n` : ""}
=== ARTICLE ===
Category: ${input.category}
Current title: ${input.title || "(none yet)"}
Content (excerpt):
${plain}

For the article above, from the SEO perspective, give me the following:

1. Title Tag (50–60 chars)
2. Meta Description (150–155 chars)
3. Focus Keyphrase
4. Primary Keyword

Also help me with an excerpt for the article (300–350 characters).

=== OUTPUT RULES ===
Treat every character range below as a HARD LIMIT, not a suggestion — count characters as you write and revise before answering so the final string fits BETWEEN the two numbers (inclusive). Going over the upper bound, even by a few characters, is a failure.
title: Only suggest if the current title is weak/missing — must be specific, factual, under 70 chars.
excerpt: Between 300 and 350 characters (count them) — summarising the article's core value for a reader scanning article cards. Do not exceed 350.
tags: 4–7 lowercase, comma-relevant tags (topics, fund types, themes mentioned).
seoTitle: The Title Tag — between 50 and 60 characters (count them), includes the focus keyphrase near the start. Do not exceed 60.
metaDescription: Between 150 and 160 characters (count them), includes the focus keyphrase, ends with a reason to click. Do not exceed 160.
focusKeyphrase: The single most important 2–5 word phrase this article should rank for.
primaryKeyword: A distinct broader search term/category (not identical to focusKeyphrase).`;
}

/** Hard ceiling for fields with strict SEO character limits — trims to the last whole word within bounds. */
function clamp(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

function clampMeta(meta: Partial<ArticleMeta>): Partial<ArticleMeta> {
  return {
    ...meta,
    title: meta.title !== undefined ? clamp(meta.title, 70) : undefined,
    excerpt: meta.excerpt !== undefined ? clamp(meta.excerpt, 350) : undefined,
    seoTitle: meta.seoTitle !== undefined ? clamp(meta.seoTitle, 60) : undefined,
    metaDescription: meta.metaDescription !== undefined ? clamp(meta.metaDescription, 160) : undefined,
  };
}

function parseAiJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

async function callDeepSeek(prompt: string, model: string, apiKey: string): Promise<Record<string, unknown>> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "DeepSeek API error");
  return parseAiJson(d.choices[0].message.content);
}

async function callOpenRouter(prompt: string, model: string, apiKey: string): Promise<Record<string, unknown>> {
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
      messages: [{ role: "user", content: `${prompt}\n\nReturn ONLY valid JSON matching: {"title":string,"excerpt":string,"tags":string[],"seoTitle":string,"metaDescription":string,"focusKeyphrase":string,"primaryKeyword":string}` }],
      temperature: 0.4,
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "OpenRouter API error");
  return parseAiJson(d.choices[0].message.content);
}

async function callGemini(prompt: string, model: string, apiKey: string): Promise<Record<string, unknown>> {
  const google = createGoogleGenerativeAI({ apiKey });
  const { object } = await generateObject({
    model: google(model),
    schema: ArticleMetaSchema,
    prompt,
  });
  return object as unknown as Record<string, unknown>;
}

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "articles", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const config = await AISetting.findOne({ usages: "articleMetaGeneration" }, "label provider modelName").lean();
  return NextResponse.json({ config: config ? { label: config.label, provider: config.provider, modelName: config.modelName } : null });
}

export async function POST(req: NextRequest) {
  try {
    if (!await hasPageAccess(req, "articles", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json() as {
      title: string;
      content: string;
      category: string;
      existing?: Partial<ArticleMeta>;
    };

    if (!body.content || !body.content.replace(/<[^>]+>/g, "").trim()) {
      return NextResponse.json({ error: "Add some article content first" }, { status: 400 });
    }

    await connectDB();
    const config = await AISetting.findOne({ usages: "articleMetaGeneration" }).lean();
    if (!config) {
      return NextResponse.json({ error: "No AI provider configured for this — set one up in Admin → AI Settings and assign it to “Articles — Title, Excerpt & SEO Generation”" }, { status: 400 });
    }

    const prompt = buildPrompt({ title: body.title, content: body.content, category: body.category, existing: body.existing ?? {} });

    let result: Record<string, unknown>;
    if (config.provider === "gemini") result = await callGemini(prompt, config.modelName, config.apiKey);
    else if (config.provider === "deepseek") result = await callDeepSeek(prompt, config.modelName, config.apiKey);
    else result = await callOpenRouter(prompt, config.modelName, config.apiKey);

    const parsed = ArticleMetaSchema.partial().safeParse(result);
    if (!parsed.success) return NextResponse.json({ error: "AI returned an unexpected format" }, { status: 502 });

    return NextResponse.json({ meta: clampMeta(parsed.data) });
  } catch (err) {
    console.error("generate-meta error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
