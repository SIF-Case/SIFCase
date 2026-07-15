import { connectDB } from "./mongodb";
import Nfo from "@/models/Nfo";
import type { NFOData } from "./nfoData";
import { formatFundName } from "@/lib/utils";

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
  category: "Equity" | "Hybrid" | "Debt"; structure: "Open-ended" | "Close-ended"; objective: string;
  openDate: Date; closeDate: Date; allotmentDate: Date | null; reopenDate: Date | null;
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
    name: formatFundName(doc.name),
    category: doc.category,
    structure: doc.structure,
    objective: doc.objective,
    daysLeft,
    closeDate: formatDisplayDate(doc.closeDate),
    openDate: formatDisplayDate(doc.openDate),
    allotmentDate: doc.allotmentDate ? formatDisplayDate(doc.allotmentDate) : "",
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

// AMFI close dates are date-only (stored at UTC midnight), so an NFO "closing
// today" must still count as open until the end of today, not just until 00:00.
function startOfToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Flips published NFOs whose subscription window has fully closed (before today)
// to unpublished, so admins don't have to remember to hide them manually.
export async function unpublishExpiredNfos(): Promise<{ unpublished: number }> {
  await connectDB();
  const result = await Nfo.updateMany(
    { published: true, closeDate: { $lt: startOfToday() } },
    { $set: { published: false } },
  );
  return { unpublished: result.modifiedCount };
}

// Published NFOs still within their subscription window, soonest-closing first.
export async function getOpenNfos(): Promise<(NFOData & { minInvestmentValue: number })[]> {
  await connectDB();
  const docs = await Nfo.find(
    { published: true, closeDate: { $gte: startOfToday() } },
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
  const docs = await Nfo.find({ published: true, closeDate: { $gte: startOfToday() } }, "slug").lean<{ slug: string }[]>();
  return docs.map((d) => d.slug);
}
