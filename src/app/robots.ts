import type { MetadataRoute } from "next";
import { BASE_URL } from "./sitemap";

// Everything not explicitly private is crawlable — admin panel, user
// dashboard, and API routes are the only disallowed paths. AI crawlers get
// explicit named allow rules so future tightening of the wildcard rule can
// never accidentally block them (named user-agent blocks always win over "*").
const DISALLOW = ["/admin", "/api/", "/dashboard"];

const AI_CRAWLERS = [
  "GPTBot",              // OpenAI training
  "OAI-SearchBot",       // OpenAI search
  "ChatGPT-User",        // ChatGPT browsing/plugins
  "Google-Extended",     // Gemini / Google AI features
  "PerplexityBot",       // Perplexity search indexing
  "Perplexity-User",     // Perplexity live browsing
  "ClaudeBot",           // Anthropic crawling
  "Claude-User",         // Claude live browsing
  "Claude-SearchBot",    // Anthropic search
  "anthropic-ai",        // Anthropic (legacy token)
  "CCBot",               // Common Crawl (feeds many AI models)
  "Bytespider",          // ByteDance/TikTok AI
  "Amazonbot",           // Amazon/Alexa AI
  "Applebot-Extended",   // Apple Intelligence
  "Diffbot",             // Diffbot knowledge graph
  "cohere-ai",           // Cohere
  "YouBot",              // You.com search
  "Meta-ExternalAgent",  // Meta AI
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
