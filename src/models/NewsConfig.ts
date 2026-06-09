import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRssFeed {
  name: string;
  url: string;
  enabled: boolean;
}

export interface INewsConfig extends Document {
  keywords: string[];
  blacklistedKeywords: string[];
  rssFeeds: IRssFeed[];
  aiPrompt: string;
  articleGenerationPrompt: string;
  maxItemsPerFetch: number;
  retentionDays: number;
  updatedAt: Date;
}

const RssFeedSchema = new Schema<IRssFeed>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const NewsConfigSchema = new Schema<INewsConfig>(
  {
    keywords: {
      type: [String],
      default: ["Specialised Investment Fund India", "SIF SEBI", "SIF NAV"],
    },
    blacklistedKeywords: {
      type: [String],
      default: [],
    },
    rssFeeds: {
      type: [RssFeedSchema],
      default: [
        { name: "Mint Markets",               url: "https://www.livemint.com/rss/markets",                                                              enabled: true },
        { name: "Mint Money",                 url: "https://www.livemint.com/rss/money",                                                               enabled: true },
        { name: "ET Wealth",                  url: "https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms",                                enabled: true },
        { name: "ET Mutual Funds",            url: "https://economictimes.indiatimes.com/mf/rssfeeds/359241701.cms",                                   enabled: true },
        { name: "ET MF News",                 url: "https://economictimes.indiatimes.com/mf/mf-news/rssfeeds/1107225967.cms",                          enabled: true },
        { name: "ET Wealth Invest",           url: "https://economictimes.indiatimes.com/wealth/invest/rssfeeds/48997553.cms",                         enabled: true },
        { name: "ET Wealth Personal Finance", url: "https://economictimes.indiatimes.com/wealth/personal-finance-news/rssfeeds/49674901.cms",          enabled: true },
        { name: "ET Economy",                 url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms",                        enabled: true },
        { name: "BL Portfolio",               url: "https://www.thehindubusinessline.com/portfolio/feeder/default.rss",                                enabled: true },
        { name: "BL Personal Finance",        url: "https://www.thehindubusinessline.com/portfolio/personal-finance/feeder/default.rss",               enabled: true },
        { name: "BL Mutual Funds",            url: "https://www.thehindubusinessline.com/portfolio/mutual-funds/feeder/default.rss",                   enabled: true },
        { name: "BL Big Story",               url: "https://www.thehindubusinessline.com/portfolio/big-story/feeder/default.rss",                      enabled: true },
        { name: "BL Money & Banking",         url: "https://www.thehindubusinessline.com/money-and-banking/feeder/default.rss",                        enabled: true },
        { name: "Moneycontrol Business",      url: "https://www.moneycontrol.com/rss/business.xml",                                                    enabled: true },
        { name: "Business Standard Markets",  url: "https://www.business-standard.com/rss/markets-106.rss",                                           enabled: true },
        { name: "Indian Express Business",    url: "https://indianexpress.com/section/business/feed/",                                                 enabled: true },
      ],
    },
    aiPrompt: {
      type: String,
      default:
        "You are a financial news summariser for SIFcase, an Indian SIF (Specialised Investment Fund) education platform. Summarise the following news item in 1-2 concise sentences. Focus on what matters to SIF investors. Be factual, professional, and avoid hype.",
    },
    articleGenerationPrompt: {
      type: String,
      default: () => DEFAULT_ARTICLE_GEN_PROMPT,
    },
    maxItemsPerFetch: { type: Number, default: 30 },
    retentionDays: { type: Number, default: 30 },
  },
  { timestamps: true },
);

export const DEFAULT_RSS_FEEDS: IRssFeed[] = [
  { name: "Mint Markets",               url: "https://www.livemint.com/rss/markets",                                                           enabled: true },
  { name: "Mint Money",                 url: "https://www.livemint.com/rss/money",                                                            enabled: true },
  { name: "ET Wealth",                  url: "https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms",                             enabled: true },
  { name: "ET Mutual Funds",            url: "https://economictimes.indiatimes.com/mf/rssfeeds/359241701.cms",                                enabled: true },
  { name: "ET MF News",                 url: "https://economictimes.indiatimes.com/mf/mf-news/rssfeeds/1107225967.cms",                       enabled: true },
  { name: "ET Wealth Invest",           url: "https://economictimes.indiatimes.com/wealth/invest/rssfeeds/48997553.cms",                      enabled: true },
  { name: "ET Wealth Personal Finance", url: "https://economictimes.indiatimes.com/wealth/personal-finance-news/rssfeeds/49674901.cms",       enabled: true },
  { name: "ET Economy",                 url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms",                     enabled: true },
  { name: "BL Portfolio",               url: "https://www.thehindubusinessline.com/portfolio/feeder/default.rss",                             enabled: true },
  { name: "BL Personal Finance",        url: "https://www.thehindubusinessline.com/portfolio/personal-finance/feeder/default.rss",            enabled: true },
  { name: "BL Mutual Funds",            url: "https://www.thehindubusinessline.com/portfolio/mutual-funds/feeder/default.rss",                enabled: true },
  { name: "BL Big Story",               url: "https://www.thehindubusinessline.com/portfolio/big-story/feeder/default.rss",                   enabled: true },
  { name: "BL Money & Banking",         url: "https://www.thehindubusinessline.com/money-and-banking/feeder/default.rss",                    enabled: true },
  { name: "Moneycontrol Business",      url: "https://www.moneycontrol.com/rss/business.xml",                                                enabled: true },
  { name: "Business Standard Markets",  url: "https://www.business-standard.com/rss/markets-106.rss",                                        enabled: true },
  { name: "Indian Express Business",    url: "https://indianexpress.com/section/business/feed/",                                              enabled: true },
];

export const DEFAULT_ARTICLE_GEN_PROMPT = `You are a senior financial journalist with 15 years of experience covering Indian capital markets, mutual funds, and investment regulation. You write with depth, authority, and clarity — like a seasoned writer at The Economic Times or Mint.

You will receive a set of news items fetched from financial RSS feeds, all related to the Indian SIF (Specialised Investment Fund) space.

Your task:

STEP 1 — DEDUPLICATE
Carefully read all provided items. Identify which ones cover the same underlying story (same event, same announcement, same regulatory development) — even if the titles are worded differently. Group them. If two items cover clearly different topics or events, they are separate stories and must each get their own article.

STEP 2 — SYNTHESIZE AND WRITE
For each unique story, write one original, in-depth article of 900–1200 words. The article must:

- Open with a compelling lead paragraph that captures the most important angle of the story
- Develop the story across 6–8 well-structured paragraphs
- Include relevant background context that helps SIF investors understand why this matters
- Explain the implications for fund managers, distributors, HNI/UHNIs, and the broader wealth management ecosystem
- Reference regulatory context (SEBI circulars, AMFI guidelines, etc.) where relevant — paraphrase from the source material, do not fabricate specifics
- Include an analytical or forward-looking paragraph ("What this means going forward...")
- End with a strong concluding paragraph

Writing style:
- Write the way a senior human journalist writes — varied sentence lengths, confident voice, no fluff
- Use active voice predominantly
- Avoid corporate jargon and buzzwords like "transformative", "game-changer", "revolutionary"
- Do NOT write in bullet points — this is a flowing prose article
- No sub-headings inside the article body
- Do NOT cite, name, or reference any source publication, URL, or author name

OUTPUT FORMAT — return ONLY a valid JSON array, nothing else before or after:

[
  {
    "title": "Original article headline (not copied from any source)",
    "body": "Full 900–1200 word article in plain prose paragraphs separated by \\n\\n"
  }
]

Rules:
- Return ONLY the JSON array — no preamble, no explanation, no markdown fences
- Each article body must use \\n\\n between paragraphs (no HTML, no markdown)
- If items cover 2 distinct stories, return a 2-element array. If 3 distinct stories, return 3 elements. Only merge into one if they genuinely cover the same event
- Never invent quotes, statistics, or facts not present in the source material`;

const NewsConfig: Model<INewsConfig> =
  mongoose.models.NewsConfig || mongoose.model<INewsConfig>("NewsConfig", NewsConfigSchema);

export default NewsConfig;
