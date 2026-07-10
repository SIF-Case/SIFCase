import { connectDB } from "./mongodb";
import Nfo from "@/models/Nfo";
import type { NFOData } from "./nfoData";

// NFOs "close within this many days" are flagged as closing soon on the public site.
const CLOSING_SOON_DAYS = 7;

function formatDisplayDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatRupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

type NfoLean = {
  slug: string; amc: string; amcShort: string; avatar: string; name: string;
  category: "Equity" | "Hybrid"; structure: "Open-ended" | "Close-ended";
  openDate: Date; closeDate: Date; allotmentDate: Date; reopenDate: Date | null;
  minInvestment: number; subscriptionPrice: number; exitLoad: string; benchmark: string;
  riskLevel: string; riskColor: string;
  allocationBands: NFOData["allocationBands"];
  strategyPoints: NFOData["strategyPoints"];
  managers: NFOData["managers"];
  docs: NFOData["docs"];
};

function toNFOData(doc: NfoLean): NFOData & { minInvestmentValue: number } {
  const daysLeft = Math.max(0, Math.ceil((new Date(doc.closeDate).getTime() - Date.now()) / 86400000));
  return {
    slug: doc.slug,
    amc: doc.amc,
    amcShort: doc.amcShort,
    avatar: doc.avatar,
    name: doc.name,
    category: doc.category,
    structure: doc.structure,
    daysLeft,
    closeDate: formatDisplayDate(doc.closeDate),
    openDate: formatDisplayDate(doc.openDate),
    allotmentDate: formatDisplayDate(doc.allotmentDate),
    reopenDate: doc.reopenDate ? formatDisplayDate(doc.reopenDate) : "",
    minInvestment: formatRupees(doc.minInvestment),
    minInvestmentValue: doc.minInvestment,
    subscriptionPrice: `₹${doc.subscriptionPrice.toFixed(2)}`,
    exitLoad: doc.exitLoad,
    benchmark: doc.benchmark,
    riskLevel: doc.riskLevel,
    riskColor: doc.riskColor,
    isClosingSoon: daysLeft <= CLOSING_SOON_DAYS,
    allocationBands: doc.allocationBands ?? [],
    strategyPoints: doc.strategyPoints ?? [],
    managers: doc.managers ?? [],
    docs: doc.docs ?? [],
  };
}

// Published NFOs still within their subscription window, soonest-closing first.
export async function getOpenNfos(): Promise<(NFOData & { minInvestmentValue: number })[]> {
  await connectDB();
  const docs = await Nfo.find(
    { published: true, closeDate: { $gte: new Date() } },
    "-createdAt -updatedAt -__v",
  ).sort({ closeDate: 1 }).lean<NfoLean[]>();
  return docs.map(toNFOData);
}

export async function getNfoBySlug(slug: string): Promise<(NFOData & { minInvestmentValue: number }) | null> {
  await connectDB();
  const doc = await Nfo.findOne({ slug, published: true }, "-createdAt -updatedAt -__v").lean<NfoLean | null>();
  return doc ? toNFOData(doc) : null;
}

export async function getOpenNfoSlugs(): Promise<string[]> {
  await connectDB();
  const docs = await Nfo.find({ published: true, closeDate: { $gte: new Date() } }, "slug").lean<{ slug: string }[]>();
  return docs.map((d) => d.slug);
}
