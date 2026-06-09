export interface AiUsageDef {
  key: string;
  label: string;
  description: string;
}

// Registry of places in the app that can consume an AI provider config.
// Add an entry here whenever a new AI-powered feature is wired up to
// settings — the admin Settings page renders one checkbox per entry.
export const AI_USAGES: AiUsageDef[] = [
  {
    key: "fundDetailsAnalysis",
    label: "Fund Details — Factsheet Analysis",
    description: "Extracts structured fund data from uploaded factsheet PDFs/Excel sheets.",
  },
  {
    key: "articleMetaGeneration",
    label: "Articles — Title, Excerpt & SEO Generation",
    description: "Generates title, excerpt, tags, and SEO fields from article content.",
  },
  {
    key: "articleGeneration",
    label: "News — Article Generation",
    description: "Synthesizes selected news items into full original articles (500–700 words each).",
  },
];

const AI_USAGE_KEYS = new Set(AI_USAGES.map(u => u.key));

export function isValidAiUsage(key: string): boolean {
  return AI_USAGE_KEYS.has(key);
}
