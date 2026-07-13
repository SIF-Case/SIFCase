import { connectDB } from "./mongodb";
import Nfo from "@/models/Nfo";

export interface NfoFetchResult {
  ok: boolean;
  found: number;
  created: number;
  updated: number;
  errors: string[];
}

const AMFI_SIF_NFO_BASE = "https://www.amfiindia.com/api/sif-nfo";

interface NfoListItem {
  Scheme_Id: string;
  Specialized_Investment_Fund: string;
  Investment_Strategy: string;
  sifId: string;
}

interface NfoListResponse {
  NewFundOffer: { MutualFund: string; items: NfoListItem[] }[];
}

interface NfoDetailItem {
  Scheme_Id: string;
  sifId: string;
  Specialized_Investment_Fund: string;
  Investment_Strategy: string;
  Type: string;
  Category: string;
  Objective_of_Investment_Strategy: string;
  New_Fund_Launch_Date: string | null;
  New_Fund_Earliest_Closure_Date: string | null;
  New_Fund_Offer_Closure_Date: string | null;
  Offer_Price_Rs: string;
  Minimum_Subscription_Amount: string;
  For_Further_Details_Please_Visit_Website: string;
  infoDocumentUrl: string;
}

interface NfoDetailResponse {
  NewFundOffer: { MutualFund: string; items: NfoDetailItem[] }[];
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function amcShortFor(amc: string): string {
  const stripped = amc.replace(/\bmutual fund\b/i, "").trim();
  return (stripped.split(/\s+/)[0] ?? "").toLowerCase();
}

function avatarFor(amc: string): string {
  const stripped = amc.replace(/\bmutual fund\b/i, "").trim();
  return (stripped[0] ?? "").toUpperCase();
}

function categoryFor(categoryText: string): "Equity" | "Hybrid" {
  return /hybrid/i.test(categoryText) ? "Hybrid" : "Equity";
}

function structureFor(typeText: string): "Open-ended" | "Close-ended" {
  return /open/i.test(typeText) ? "Open-ended" : "Close-ended";
}

// Parses figures like "10,00,000 and in multiples of Re. 1 thereafter." or
// "Rs.10 lakhs and any amount thereafter." into a raw rupee number.
function parseMinInvestment(text: string): number {
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*lakh/i);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);
  const numMatch = text.match(/[\d,]{4,}/);
  if (numMatch) return parseInt(numMatch[0].replace(/,/g, ""), 10);
  return 1000000;
}

// Parses figures like "10", "INR 10/- per Unit", "₹10.00" into a rupee number.
function parseSubscriptionPrice(text: string): number {
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : 10;
}

/** Fetches all currently-listed SIF NFOs from AMFI and upserts them into the Nfo collection. */
export async function fetchAndSyncNfos(): Promise<NfoFetchResult> {
  await connectDB();
  const result: NfoFetchResult = { ok: true, found: 0, created: 0, updated: 0, errors: [] };

  let list: NfoListResponse;
  try {
    const res = await fetch(AMFI_SIF_NFO_BASE, { cache: "no-store" });
    if (!res.ok) throw new Error(`List HTTP ${res.status}`);
    list = await res.json();
  } catch (err) {
    result.ok = false;
    result.errors.push(`List fetch failed: ${String(err)}`);
    return result;
  }

  const schemeIds = (list.NewFundOffer ?? []).flatMap((group) => group.items.map((i) => i.Scheme_Id));
  result.found = schemeIds.length;

  for (const schemeId of schemeIds) {
    try {
      const res = await fetch(`${AMFI_SIF_NFO_BASE}?Scheme_Id=${encodeURIComponent(schemeId)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Detail HTTP ${res.status}`);
      const detail: NfoDetailResponse = await res.json();
      const item = detail.NewFundOffer?.[0]?.items?.[0];
      if (!item) throw new Error("No item in detail response");

      const amc = item.Specialized_Investment_Fund;
      const name = item.Investment_Strategy;
      const openDate = item.New_Fund_Launch_Date ? new Date(item.New_Fund_Launch_Date) : null;
      const closeDate = item.New_Fund_Offer_Closure_Date
        ? new Date(item.New_Fund_Offer_Closure_Date)
        : item.New_Fund_Earliest_Closure_Date
          ? new Date(item.New_Fund_Earliest_Closure_Date)
          : null;

      if (!openDate || !closeDate) throw new Error(`Missing open/close date for ${schemeId}`);

      const existing = await Nfo.findOne({ externalSchemeId: schemeId });

      const syncedFields = {
        amc,
        name,
        category: categoryFor(item.Category),
        structure: structureFor(item.Type),
        objective: (item.Objective_of_Investment_Strategy || "").replace(/\s+/g, " ").trim(),
        openDate,
        closeDate,
        minInvestment: parseMinInvestment(item.Minimum_Subscription_Amount),
        subscriptionPrice: parseSubscriptionPrice(item.Offer_Price_Rs),
        docs: item.infoDocumentUrl
          ? [{ title: "Investment Strategy Information Document (ISID)", href: item.infoDocumentUrl }]
          : [],
      };

      if (existing) {
        await Nfo.updateOne({ _id: existing._id }, { $set: syncedFields });
        result.updated++;
      } else {
        let slug = slugify(name);
        if (await Nfo.exists({ slug })) slug = `${slug}-${schemeId.toLowerCase()}`;

        await Nfo.create({
          slug,
          externalSchemeId: schemeId,
          amcShort: amcShortFor(amc),
          avatar: avatarFor(amc),
          published: true,
          ...syncedFields,
        });
        result.created++;
      }
    } catch (err) {
      result.errors.push(`${schemeId}: ${String(err)}`);
    }
  }

  if (result.errors.length > 0) result.ok = false;
  return result;
}
