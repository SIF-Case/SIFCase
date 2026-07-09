import type { IFundDetails } from "@/models/FundDetails";
import { normaliseRiskBand } from "@/lib/sifData";

const FINAPI_BASE = "https://api.finapi.upvaly.com/api/mf/isin";

// ── Raw response shape ──────────────────────────────────────────────────────

interface FinApiRollingReturn {
  timeframe: string;
  averageReturn: number; medianReturn: number;
  minReturn: number; minPeriod: string; maxReturn: number; maxPeriod: string;
  standardDeviation: number; downsideDeviation: number;
  positiveRatio: number; negativeRatio: number; consistencyScore: number;
}

interface FinApiRank {
  timeframe: string;
  annualizedReturn: number;
  categoryAverage: number;
  rankInCategory: string;
}

interface FinApiRiskConclusion {
  info: string;
  timeframes: { timeframe: string; conclusion: string }[];
}

interface FinApiHolding {
  name: string;
  sector?: string;
  marketValue: string;
  weightage: string;
  change1M?: string;
}

interface FinApiSector {
  sector: string;
  marketValue: string;
  weightage: string;
  change1M?: string;
}

interface FinApiPeer {
  schemeCode: string;
  isin: string;
  schemeName: string;
  schemeNameShort: string;
  aum?: string;
  pe?: string;
  pb?: string;
  dividendYield?: string;
  expenseRatio?: string;
  returns?: Record<string, string>;
}

interface FinApiAmcScheme {
  schemeCode: string;
  isin: string;
  schemeName: string;
  schemeShortName: string;
  morningstarRating?: number;
  aum?: string;
  returns?: Record<string, string>;
}

export interface FinApiFundData {
  schemeCode: string;
  schemeName: string;
  schemeCategory: string;
  planName: string;
  optionName: string;
  benchmarkIndex: string;
  inceptionDate: string;
  aum: string;
  expenseRatio: string;
  exitLoadMessage: string;
  companyName: string;
  isinDivPayout: string;
  isinDivPayoutOrGrowth: string;
  fundHouse: string;
  schemeStructure: string;
  schemeCategoryLabel: string;
  schemeRisk: string;
  latestNav: number;
  latestNavDate: string;
  previousNav: number;
  previousNavDate: string;
  schemeFundManagers: string;
  rollingReturns: FinApiRollingReturn[];
  ranks: FinApiRank[];
  portfolio: {
    assetAllocation: { equityAllocation: string; debtAllocation: string; cashAllocation: string; otherAllocation: string };
    marketCapWeightage: { largeCap: string; midCap: string; smallCap: string; others: string };
    concentration: { numberOfHoldings: number; averageMarketCap: string; top3SectorWeight: string; top5StocksWeight: string; top10StocksWeight: string };
  };
  fundamentals: {
    pe: string; categoryAveragePe: string;
    pb: string; categoryAveragePb: string;
    priceToSale: string; categoryAveragePriceToSale: string;
    priceToCashFlow: string; categoryAveragePriceToCashFlow: string;
    dividendYield: string; categoryAverageDividendYield: string;
    roe: string; categoryAverageRoe: string;
  };
  riskMetrics: {
    returns: FinApiRiskConclusion;
    riskStandardDeviation: FinApiRiskConclusion;
    sharpRatio: FinApiRiskConclusion;
    sortinoRatio: FinApiRiskConclusion;
    beta: FinApiRiskConclusion;
  };
  holdings: FinApiHolding[];
  sectors: FinApiSector[];
  peers: FinApiPeer[];
  moreFundsFromAmc: { companyName: string; schemeList: FinApiAmcScheme[] };
  "52WeekLowNav"?: number;
  "52WeekLowNavDate"?: string;
  "52WeekHighNav"?: number;
  "52WeekHighNavDate"?: string;
}

export interface FinApiFundResponse {
  status: string;
  statusCode: number;
  message: string;
  data: FinApiFundData;
}

export async function fetchFundByIsin(isin: string): Promise<FinApiFundData> {
  const res = await fetch(`${FINAPI_BASE}/${encodeURIComponent(isin)}`, {
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`finapi request failed: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as FinApiFundResponse;
  if (body.status !== "success" || !body.data) {
    throw new Error(`finapi returned non-success: ${body.message ?? "unknown error"}`);
  }
  return body.data;
}

// ── Mapping ──────────────────────────────────────────────────────────────────

function toNumOrNull(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

function mapAssetAllocation(a: FinApiFundData["portfolio"]["assetAllocation"]): { assetClass: string; percentage: number }[] {
  return [
    { assetClass: "Equity", percentage: toNumOrNull(a.equityAllocation) ?? 0 },
    { assetClass: "Debt", percentage: toNumOrNull(a.debtAllocation) ?? 0 },
    { assetClass: "Cash", percentage: toNumOrNull(a.cashAllocation) ?? 0 },
    { assetClass: "Other", percentage: toNumOrNull(a.otherAllocation) ?? 0 },
  ];
}

export function mapFinApiToFundDetails(raw: FinApiFundData): Partial<IFundDetails> {
  const fundManagers = (raw.schemeFundManagers || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

  const mc = raw.portfolio?.marketCapWeightage;
  const conc = raw.portfolio?.concentration;
  const f = raw.fundamentals;
  const rm = raw.riskMetrics;

  return {
    amcName: raw.companyName ?? "",
    benchmarkName: raw.benchmarkIndex ?? "",
    exitLoad: raw.exitLoadMessage ?? "",
    schemeCategory: raw.schemeCategoryLabel || raw.schemeCategory || "",
    schemeNature: raw.schemeCategory ?? "",
    schemeType: raw.schemeStructure ?? "",
    inceptionDate: raw.inceptionDate ?? "",
    aumCurrent: toNumOrNull(raw.aum),
    terMax: raw.expenseRatio ?? "",
    riskBand: normaliseRiskBand(raw.schemeRisk),
    fundManagers,
    assetAllocation: raw.portfolio?.assetAllocation ? mapAssetAllocation(raw.portfolio.assetAllocation) : [],
    portfolioByIndustry: (raw.sectors ?? []).map((s) => ({
      industry: s.sector,
      percentage: toNumOrNull(s.weightage) ?? 0,
      marketValue: toNumOrNull(s.marketValue),
      change1M: toNumOrNull(s.change1M),
    })),
    topHoldings: (raw.holdings ?? []).map((h) => ({
      name: h.name,
      percentage: toNumOrNull(h.weightage) ?? 0,
      sector: h.sector,
      rating: undefined,
      marketValue: toNumOrNull(h.marketValue),
      change1M: toNumOrNull(h.change1M),
    })),
    // finapi returns one plan/option per ISIN call — record this row; other plan
    // variants only get added if/when their own ISIN is synced separately.
    planCodes: raw.planName && raw.isinDivPayoutOrGrowth
      ? [{ planName: `${raw.planName}${raw.optionName ? ` - ${raw.optionName}` : ""}`, isin: raw.isinDivPayoutOrGrowth }]
      : [],

    isin: raw.isinDivPayoutOrGrowth ?? raw.isinDivPayout ?? "",
    externalSchemeCode: raw.schemeCode ?? "",
    marketCapWeightage: mc
      ? {
          largeCap: toNumOrNull(mc.largeCap),
          midCap: toNumOrNull(mc.midCap),
          smallCap: toNumOrNull(mc.smallCap),
          others: toNumOrNull(mc.others),
        }
      : null,
    concentration: conc
      ? {
          numberOfHoldings: conc.numberOfHoldings ?? null,
          averageMarketCap: conc.averageMarketCap ?? "",
          top3SectorWeight: toNumOrNull(conc.top3SectorWeight),
          top5StocksWeight: toNumOrNull(conc.top5StocksWeight),
          top10StocksWeight: toNumOrNull(conc.top10StocksWeight),
        }
      : null,
    fundamentals: f
      ? {
          pe: toNumOrNull(f.pe), categoryAveragePe: toNumOrNull(f.categoryAveragePe),
          pb: toNumOrNull(f.pb), categoryAveragePb: toNumOrNull(f.categoryAveragePb),
          priceToSale: toNumOrNull(f.priceToSale), categoryAveragePriceToSale: toNumOrNull(f.categoryAveragePriceToSale),
          priceToCashFlow: toNumOrNull(f.priceToCashFlow), categoryAveragePriceToCashFlow: toNumOrNull(f.categoryAveragePriceToCashFlow),
          dividendYield: toNumOrNull(f.dividendYield), categoryAverageDividendYield: toNumOrNull(f.categoryAverageDividendYield),
          roe: toNumOrNull(f.roe), categoryAverageRoe: toNumOrNull(f.categoryAverageRoe),
        }
      : null,
    riskMetricsConclusions: rm
      ? {
          returns: { info: rm.returns?.info ?? "", timeframes: rm.returns?.timeframes ?? [] },
          riskStandardDeviation: { info: rm.riskStandardDeviation?.info ?? "", timeframes: rm.riskStandardDeviation?.timeframes ?? [] },
          sharpRatio: { info: rm.sharpRatio?.info ?? "", timeframes: rm.sharpRatio?.timeframes ?? [] },
          sortinoRatio: { info: rm.sortinoRatio?.info ?? "", timeframes: rm.sortinoRatio?.timeframes ?? [] },
          beta: { info: rm.beta?.info ?? "", timeframes: rm.beta?.timeframes ?? [] },
        }
      : null,
    rollingReturns: (raw.rollingReturns ?? []).map((r) => ({
      timeframe: r.timeframe,
      averageReturn: toNumOrNull(r.averageReturn),
      medianReturn: toNumOrNull(r.medianReturn),
      minReturn: toNumOrNull(r.minReturn),
      minPeriod: r.minPeriod ?? "",
      maxReturn: toNumOrNull(r.maxReturn),
      maxPeriod: r.maxPeriod ?? "",
      standardDeviation: toNumOrNull(r.standardDeviation),
      downsideDeviation: toNumOrNull(r.downsideDeviation),
      positiveRatio: toNumOrNull(r.positiveRatio),
      negativeRatio: toNumOrNull(r.negativeRatio),
      consistencyScore: toNumOrNull(r.consistencyScore),
    })),
    categoryRanks: (raw.ranks ?? []).map((r) => ({
      timeframe: r.timeframe,
      annualizedReturn: toNumOrNull(r.annualizedReturn),
      categoryAverage: toNumOrNull(r.categoryAverage),
      rankInCategory: r.rankInCategory ?? "",
    })),
    peers: (raw.peers ?? []).map((p) => ({
      schemeCode: p.schemeCode ?? "",
      isin: p.isin ?? "",
      schemeName: p.schemeName ?? "",
      schemeNameShort: p.schemeNameShort ?? "",
      aum: p.aum ?? "",
      pe: p.pe ?? "",
      pb: p.pb ?? "",
      dividendYield: p.dividendYield ?? "",
      expenseRatio: p.expenseRatio ?? "",
    })),
    amcOtherFunds: raw.moreFundsFromAmc
      ? {
          companyName: raw.moreFundsFromAmc.companyName ?? "",
          schemeList: (raw.moreFundsFromAmc.schemeList ?? []).map((s) => ({
            schemeCode: s.schemeCode ?? "",
            isin: s.isin ?? "",
            schemeName: s.schemeName ?? "",
            schemeShortName: s.schemeShortName ?? "",
            morningstarRating: s.morningstarRating,
            aum: s.aum ?? "",
            returns: s.returns ?? {},
          })),
        }
      : null,
    lastSyncedFromFinApi: new Date(),
  };
}
