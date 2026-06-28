export const STORAGE_KEY = "sif101_completed";

export interface TopicMeta {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: "Beginner" | "Intermediate" | "Core";
  iconBg: string;
}

export const TOPICS: TopicMeta[] = [
  {
    id: "what-is-a-sif",
    title: "What is a SIF?",
    description:
      "Understand the structure, mandate, and SEBI framework behind Specialised Investment Funds.",
    duration: 4,
    level: "Beginner",
    iconBg: "#E8F5F0",
  },
  {
    id: "products-strategies",
    title: "Products & strategies",
    description:
      "Long-short equity, multi-asset, arbitrage — what each SIF strategy type actually does.",
    duration: 6,
    level: "Beginner",
    iconBg: "#E8F5F0",
  },
  {
    id: "how-sifs-work",
    title: "How SIFs work",
    description:
      "Mechanics of daily NAV, portfolio disclosure, and what makes SIFs operationally distinct from MFs.",
    duration: 5,
    level: "Beginner",
    iconBg: "#E8F5F0",
  },
  {
    id: "categorisation",
    title: "Categorisation",
    description:
      "The 5 SEBI categories of SIFs — equity, debt, hybrid, real estate, and commodity strategies.",
    duration: 5,
    level: "Intermediate",
    iconBg: "#FFF3E0",
  },
  {
    id: "risk-risk-band",
    title: "Risk & Risk Band",
    description:
      "How the SEBI 1–6 Risk Band is computed, what each level means, and how to use it when comparing funds.",
    duration: 4,
    level: "Core",
    iconBg: "#EEF2FF",
  },
  {
    id: "regulatory-framework",
    title: "Regulatory framework",
    description:
      "SEBI circular, AMC eligibility, investment manager norms, and ongoing compliance obligations.",
    duration: 7,
    level: "Intermediate",
    iconBg: "#FFF3E0",
  },
  {
    id: "taxation-of-sifs",
    title: "Taxation of SIFs",
    description:
      "Short-term vs long-term gains, pass-through taxation, and how SIF distributions are treated under Indian tax law.",
    duration: 6,
    level: "Intermediate",
    iconBg: "#FFF3E0",
  },
  {
    id: "sif-vs-mf-vs-pms",
    title: "SIF vs MF vs PMS",
    description:
      "A direct comparison of fees, liquidity, disclosures, and strategy flexibility across the three structures.",
    duration: 5,
    level: "Core",
    iconBg: "#EEF2FF",
  },
  {
    id: "ten-lakh-minimum",
    title: "The ₹10 lakh minimum",
    description:
      "Why SEBI set a ₹10 lakh entry ticket, who qualifies as an eligible investor, and what changes for NRIs.",
    duration: 4,
    level: "Core",
    iconBg: "#EEF2FF",
  },
];
