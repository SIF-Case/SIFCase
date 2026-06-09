import { connectDB } from "@/lib/mongodb";
import NewsConfig from "@/models/NewsConfig";
import NewsItem from "@/models/NewsItem";
import AISetting from "@/models/AISetting";

// ── RSS XML parser (no external deps) ────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i").exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(xml);
  return match ? stripHtml(match[1]).trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["']`, "i").exec(xml);
  return match ? match[1].trim() : "";
}

export interface RawNewsItem {
  title: string;
  url: string;
  excerpt: string;
  imageUrl: string;
  publishedAt: Date;
  source: string;
}

function parseRssItems(xml: string, sourceName: string): RawNewsItem[] {
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const items: RawNewsItem[] = [];

  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, "title");
    const link =
      extractTag(itemXml, "link") ||
      extractAttr(itemXml, "link", "href") ||
      extractTag(itemXml, "guid");
    if (!title || !link) continue;

    const excerpt =
      extractTag(itemXml, "description") ||
      extractTag(itemXml, "summary") ||
      extractTag(itemXml, "content:encoded");

    // Try to find image from media:thumbnail, media:content, or enclosure
    const imageUrl =
      extractAttr(itemXml, "media:thumbnail", "url") ||
      extractAttr(itemXml, "media:content", "url") ||
      extractAttr(itemXml, "enclosure", "url") ||
      "";

    const pubDateStr =
      extractTag(itemXml, "pubDate") ||
      extractTag(itemXml, "published") ||
      extractTag(itemXml, "dc:date");
    const publishedAt = pubDateStr ? new Date(pubDateStr) : new Date();

    items.push({
      title: title.slice(0, 300),
      url: link.slice(0, 1000),
      excerpt: excerpt.slice(0, 1000),
      imageUrl: imageUrl.slice(0, 500),
      publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
      source: sourceName,
    });
  }

  return items;
}

async function fetchRssFeed(url: string, sourceName: string): Promise<RawNewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SIFcase/1.0 (+https://sifcase.in)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml, sourceName);
  } catch {
    return [];
  }
}

function buildGoogleNewsUrl(keyword: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-IN&gl=IN&ceid=IN:en`;
}

// ── AI summarisation ──────────────────────────────────────────────────────────

type AiProvider = "deepseek" | "gemini" | "openrouter";

async function callAiForSummary(
  text: string,
  systemPrompt: string,
  provider: AiProvider,
  modelName: string,
  apiKey: string,
): Promise<string> {
  const userMsg = `${text}\n\nRespond with ONLY the summary text — no JSON, no markdown, no labels.`;

  if (provider === "deepseek") {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(15000),
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
        "X-Title": "SIFcase News",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(15000),
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
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMsg}` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 150 },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const d = await res.json();
    if (!res.ok) throw new Error(d.error?.message || "Gemini error");
    return (d.candidates?.[0]?.content?.parts?.[0]?.text as string ?? "").trim();
  }

  return "";
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export interface FetchNewsResult {
  fetched: number;
  stored: number;
  skipped: number;
  errors: number;
}

export async function fetchAndStoreNews(): Promise<FetchNewsResult> {
  await connectDB();

  const [config, aiSetting] = await Promise.all([
    NewsConfig.findOne().lean(),
    AISetting.findOne({ usages: "newsSummarisation" }).lean(),
  ]);

  const keywords = config?.keywords ?? ["Specialised Investment Fund India", "SIF SEBI"];
  const rssFeeds = (config?.rssFeeds ?? []).filter((f) => f.enabled);
  const aiPrompt = config?.aiPrompt ?? "Summarise this news item in 1-2 sentences for SIF investors. Be factual and concise.";
  const maxItems = config?.maxItemsPerFetch ?? 30;
  const retentionDays = config?.retentionDays ?? 30;

  // Collect all raw items
  const rawItemsMap = new Map<string, RawNewsItem>();

  const allFeeds: { url: string; name: string }[] = [
    ...keywords.map((kw) => ({ url: buildGoogleNewsUrl(kw), name: kw })),
    ...rssFeeds.map((f) => ({ url: f.url, name: f.name })),
  ];

  const feedResults = await Promise.all(
    allFeeds.map(({ url, name }) => fetchRssFeed(url, name)),
  );

  for (const items of feedResults) {
    for (const item of items) {
      if (!rawItemsMap.has(item.url)) {
        rawItemsMap.set(item.url, item);
      }
    }
  }

  const allRaw = Array.from(rawItemsMap.values())
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, maxItems * 2); // fetch extra, deduplicate against DB below

  // Find which URLs already exist
  const existingUrls = new Set(
    (await NewsItem.find({ url: { $in: allRaw.map((i) => i.url) } }, "url").lean()).map((d) => d.url),
  );

  const newItems = allRaw.filter((i) => !existingUrls.has(i.url)).slice(0, maxItems);

  let stored = 0;
  let errors = 0;

  // Process in batches of 5 to avoid AI rate limits
  const BATCH = 5;
  for (let i = 0; i < newItems.length; i += BATCH) {
    const batch = newItems.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (item) => {
        try {
          let aiSummary = "";
          if (aiSetting) {
            const inputText = `Title: ${item.title}\n\n${item.excerpt}`.slice(0, 1500);
            aiSummary = await callAiForSummary(
              inputText,
              aiPrompt,
              aiSetting.provider as AiProvider,
              aiSetting.modelName,
              aiSetting.apiKey,
            );
          }

          await NewsItem.create({
            title: item.title,
            url: item.url,
            source: item.source,
            originalExcerpt: item.excerpt,
            aiSummary,
            imageUrl: item.imageUrl,
            publishedAt: item.publishedAt,
            fetchedAt: new Date(),
            isVisible: true,
          });
          stored++;
        } catch {
          errors++;
        }
      }),
    );
  }

  // Purge old items
  if (retentionDays > 0) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await NewsItem.deleteMany({ publishedAt: { $lt: cutoff }, promotedArticleId: null });
  }

  return {
    fetched: allRaw.length,
    stored,
    skipped: existingUrls.size,
    errors,
  };
}
