/**
 * Catalogue of every page whose SEO the admin can edit, with the values the
 * code ships as defaults. The admin screen renders this list; a PageSeo row
 * only exists once someone overrides something, so the defaults here stay the
 * single source of truth for "what does this page say today".
 *
 * Pattern entries (path containing "[...]") apply to every page on that route.
 * Their title/description may use {token} placeholders — the tokens each route
 * supplies are listed in `tokens`.
 */

export type SeoPageDef = {
  path: string;
  label: string;
  group: "Core" | "Listing" | "Content" | "Legal" | "Templates";
  title: string;
  description: string;
  /** Placeholder names usable in title/description. Pattern routes only. */
  tokens?: string[];
};

export const SEO_PAGES: SeoPageDef[] = [
  // ── Core ────────────────────────────────────────────────────────────────
  {
    path: "/",
    label: "Homepage",
    group: "Core",
    title: "SIFcase — Compare SIFs with verified data",
    description:
      "Track NAV, NFOs, TER, strategy documents, and returns from official sources — simplified for serious investors.",
  },
  {
    path: "/about",
    label: "About",
    group: "Core",
    title: "About SIFcase — India's SIF Research & Comparison Platform",
    description:
      "SIFcase is India's dedicated research, comparison, and distribution platform for SEBI-registered Specialised Investment Funds. Built by Aureva Capital Private Limited (ARN-346247).",
  },
  {
    path: "/suitability",
    label: "Find My Ideal SIF",
    group: "Core",
    title: "Find My Ideal SIF — SIFcase",
    description:
      "Answer a few questions and we'll match you with the Specialised Investment Funds that suit your goals and risk profile.",
  },

  // ── Listing ─────────────────────────────────────────────────────────────
  {
    path: "/sifs",
    label: "All SIFs",
    group: "Listing",
    title: "All SIFs — SIFcase",
    description: "Browse every Specialised Investment Fund with verified NAV, returns, and risk metrics.",
  },
  {
    path: "/fund-houses",
    label: "Fund Houses",
    group: "Listing",
    title: "Fund Houses — SIFcase",
    description:
      "Browse all AMCs offering Specialised Investment Funds. Compare schemes, AUM, strategies, and performance across fund houses.",
  },
  {
    path: "/nfos",
    label: "Open NFOs",
    group: "Listing",
    title: "Open SIF NFOs — SIFcase",
    description:
      "Track every open SIF NFO — subscription window, allotment dates, asset allocation, exit load and minimum investment. Verified from official sources.",
  },
  {
    path: "/compare",
    label: "Compare",
    group: "Listing",
    title: "Compare SIFs — SIFcase",
    description:
      "Compare up to 4 Specialized Investment Funds side by side. Source-verified NAV, returns, risk metrics, and strategy",
  },
  {
    path: "/performance",
    label: "Performance Reports",
    group: "Listing",
    title: "SIF Performance Reports — SIFcase",
    description:
      "Monthly performance analysis across every Specialised Investment Fund in India — category leaders, fund-by-fund returns, and downloadable reports.",
  },

  // ── Content hubs ────────────────────────────────────────────────────────
  {
    path: "/read",
    label: "Read",
    group: "Content",
    title: "Read — SIFcase",
    description: "Insights, education, and analysis on Specialised Investment Funds.",
  },
  {
    path: "/news",
    label: "News",
    group: "Content",
    title: "Latest SIF News - SIFcase",
    description:
      "Stay updated with the latest news and developments in the Specialised Investment Fund industry.",
  },
  {
    path: "/sif-101",
    label: "SIF 101",
    group: "Content",
    title: "SIF 101 — Learning Hub | SIFcase",
    description:
      "Build confidence before you invest. Bite-sized articles on SIF products, mechanics, risk, regulation and tax.",
  },
  {
    path: "/sif-101/quiz",
    label: "SIF 101 Quiz",
    group: "Content",
    title: "Test Your Readiness — SIF 101 Quiz | SIFcase",
    description:
      "Test your understanding of SIF basics with our interactive quiz. Get instant feedback and learn as you go.",
  },

  // ── Legal ───────────────────────────────────────────────────────────────
  {
    path: "/privacy",
    label: "Privacy Policy",
    group: "Legal",
    title: "Privacy Policy — SIFCase",
    description: "Privacy Policy for SIFCase by Aureva Capital Private Limited.",
  },
  {
    path: "/terms",
    label: "Terms of Use",
    group: "Legal",
    title: "Terms of Use — SIFcase",
    description:
      "Terms of Use for SIFcase by Aureva Capital Private Limited. Governs your access to and use of sifcase.com.",
  },
  {
    path: "/disclaimer",
    label: "Disclaimer",
    group: "Legal",
    title: "Disclaimer — SIFCase",
    description: "Legal disclaimer for SIFCase by Aureva Capital Private Limited.",
  },
  {
    path: "/sebi",
    label: "SEBI Disclosure",
    group: "Legal",
    title: "SEBI Disclosure — SIFcase",
    description:
      "SEBI regulatory disclosure for SIFcase by Aureva Capital Private Limited. Registration details, commission disclosure, and mandated risk disclaimers.",
  },

  // ── Templates (one row drives hundreds of pages) ─────────────────────────
  {
    path: "/sifs/[code]",
    label: "Fund detail pages",
    group: "Templates",
    title: "{fundName}{optionSuffix} — SIFcase",
    description:
      "{strategy} SIF by {amc}. Latest NAV ₹{nav} as of {navDate}. Source-verified returns and risk metrics.",
    tokens: ["fundName", "optionSuffix", "strategy", "amc", "nav", "navDate", "option", "schemeCode"],
  },
  {
    path: "/fund-house/[slug]",
    label: "Fund house pages",
    group: "Templates",
    title: "{brandName} — SIFcase",
    description: "{brandName} Specialised Investment Funds — schemes, NAV performance, and news.",
    tokens: ["brandName", "fundCount"],
  },
  {
    path: "/nfos/[slug]",
    label: "NFO detail pages",
    group: "Templates",
    title: "{name} NFO — SIFcase",
    description:
      "{name} NFO. Open {openDate} – {closeDate}. Minimum {minInvestment}. {category} long-short strategy under SEBI's SIF framework.",
    tokens: ["name", "openDate", "closeDate", "minInvestment", "category"],
  },
  {
    path: "/performance/[slug]",
    label: "Performance report pages",
    group: "Templates",
    title: "{label} SIF Performance Report — SIFcase",
    description:
      "{label} performance analysis across {fundCount} Specialized Investment Fund schemes — best/worst performers, returns table and key insights.",
    tokens: ["label", "fundCount"],
  },
];

export function getSeoPageDef(path: string): SeoPageDef | undefined {
  return SEO_PAGES.find((p) => p.path === path);
}
