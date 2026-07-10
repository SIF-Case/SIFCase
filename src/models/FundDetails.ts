import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFundDetails extends Document {
  fundName: string;
  riskBand: 1 | 2 | 3 | 4 | 5 | null;
  schemeType: string;
  exitLoad: string;
  aumCurrent: number | null;
  aumAggregate: number | null;
  aumEnd: number | null;
  minInvestment: number;
  additionalInvestment: number;
  fundManagers: { name: string; designation?: string; experienceYears?: string; managingSince?: string }[];
  benchmarkName: string;
  benchmarkRiskBand: 1 | 2 | 3 | 4 | 5 | null;
  benchmarkDetails: string;
  assetAllocation: { assetClass: string; percentage: number }[];
  portfolioByIndustry: { industry: string; percentage: number; marketValue?: number | null; change1M?: number | null }[];
  portfolioByRatingClass: { ratingClass: string; percentage: number }[];
  topHoldings: { name: string; percentage: number; sector?: string; rating?: string; marketValue?: number | null; change1M?: number | null }[];
  factsheets: { url: string; filename: string; documentType?: string; uploadedAt: Date }[];
  // Fund Structure
  schemeCategory: string;
  schemeNature: string;
  inceptionDate: string;
  planCodes: { planName: string; isin: string }[];
  // Redemption & Liquidity
  redemptionFrequency: string;
  navCutoffTime: string;
  redemptionPayoutDays: string;
  redemptionNoticePeriod: string;
  penalInterestRate: string;
  // Investment Limits
  panInvestmentThreshold: string;
  accreditedInvestorMinInvestment: number | null;
  sipDetails: { frequency: string; minAmount: number; minInstallments: number }[];
  // Expenses & Taxation
  terMax: string;
  terSlabs: { aumSlab: string; ter: string }[];
  taxationSummary: string;
  // Asset Allocation Ranges
  assetAllocationRanges: { assetClass: string; min: number; max: number }[];
  // Derivatives & Risk Controls
  grossExposureLimit: string;
  derivativesRestrictions: string;
  // Strategy Detail
  derivativeStrategies: { name: string; description: string }[];
  alphaGenerationApproach: string;
  // Fund Administration
  sponsorName: string;
  amcName: string;
  trusteeName: string;
  registrarName: string;
  // Investor Suitability
  suitableFor: string;
  notSuitableFor: string;
  // Market Scenarios
  bullMarket: string;
  bearMarket: string;
  sidewaysMarket: string;
  // Fund Fit
  howItWorks: string;
  mfEquivalent: string;
  portfolioFit: string;
  // ── finapi.upvaly.com sync (owned exclusively by sync-isin route) ─────────
  isin: string;
  externalSchemeCode: string;
  marketCapWeightage: { largeCap: number | null; midCap: number | null; smallCap: number | null; others: number | null } | null;
  concentration: {
    numberOfHoldings: number | null;
    averageMarketCap: string;
    top3SectorWeight: number | null;
    top5StocksWeight: number | null;
    top10StocksWeight: number | null;
  } | null;
  fundamentals: {
    pe: number | null; categoryAveragePe: number | null;
    pb: number | null; categoryAveragePb: number | null;
    priceToSale: number | null; categoryAveragePriceToSale: number | null;
    priceToCashFlow: number | null; categoryAveragePriceToCashFlow: number | null;
    dividendYield: number | null; categoryAverageDividendYield: number | null;
    roe: number | null; categoryAverageRoe: number | null;
  } | null;
  riskMetricsConclusions: {
    returns: { info: string; timeframes: { timeframe: string; conclusion: string }[] };
    riskStandardDeviation: { info: string; timeframes: { timeframe: string; conclusion: string }[] };
    sharpRatio: { info: string; timeframes: { timeframe: string; conclusion: string }[] };
    sortinoRatio: { info: string; timeframes: { timeframe: string; conclusion: string }[] };
    beta: { info: string; timeframes: { timeframe: string; conclusion: string }[] };
  } | null;
  rollingReturns: {
    timeframe: string; averageReturn: number | null; medianReturn: number | null;
    minReturn: number | null; minPeriod: string; maxReturn: number | null; maxPeriod: string;
    standardDeviation: number | null; downsideDeviation: number | null;
    positiveRatio: number | null; negativeRatio: number | null; consistencyScore: number | null;
  }[];
  categoryRanks: { timeframe: string; annualizedReturn: number | null; categoryAverage: number | null; rankInCategory: string }[];
  peers: { schemeCode: string; isin: string; schemeName: string; schemeNameShort: string; aum: string; pe: string; pb: string; dividendYield: string; expenseRatio: string }[];
  amcOtherFunds: {
    companyName: string;
    schemeList: { schemeCode: string; isin: string; schemeName: string; schemeShortName: string; morningstarRating?: number; aum: string; returns: Record<string, string> }[];
  } | null;
  lastSyncedFromFinApi: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FundDetailsSchema = new Schema<IFundDetails>(
  {
    fundName: { type: String, required: true, unique: true, index: true },
    riskBand: { type: Number, default: null },
    schemeType: { type: String, default: "" },
    exitLoad: { type: String, default: "" },
    aumCurrent: { type: Number, default: null },
    aumAggregate: { type: Number, default: null },
    aumEnd: { type: Number, default: null },
    minInvestment: { type: Number, default: 1_000_000 },
    additionalInvestment: { type: Number, default: 10_000 },
    fundManagers: [{ name: String, designation: String, experienceYears: String, managingSince: String }],
    benchmarkName: { type: String, default: "" },
    benchmarkRiskBand: { type: Number, default: null },
    benchmarkDetails: { type: String, default: "" },
    assetAllocation: [{ assetClass: String, percentage: Number }],
    portfolioByIndustry: [{ industry: String, percentage: Number, marketValue: Number, change1M: Number }],
    portfolioByRatingClass: [{ ratingClass: String, percentage: Number }],
    topHoldings: [{ name: String, percentage: Number, sector: String, rating: String, marketValue: Number, change1M: Number }],
    factsheets: [{ url: String, filename: String, documentType: String, uploadedAt: { type: Date, default: Date.now } }],
    // Fund Structure
    schemeCategory: { type: String, default: "" },
    schemeNature: { type: String, default: "" },
    inceptionDate: { type: String, default: "" },
    planCodes: [{ planName: String, isin: String }],
    // Redemption & Liquidity
    redemptionFrequency: { type: String, default: "" },
    navCutoffTime: { type: String, default: "" },
    redemptionPayoutDays: { type: String, default: "" },
    redemptionNoticePeriod: { type: String, default: "" },
    penalInterestRate: { type: String, default: "" },
    // Investment Limits
    panInvestmentThreshold: { type: String, default: "" },
    accreditedInvestorMinInvestment: { type: Number, default: null },
    sipDetails: [{ frequency: String, minAmount: Number, minInstallments: Number }],
    // Expenses & Taxation
    terMax: { type: String, default: "" },
    terSlabs: [{ aumSlab: String, ter: String }],
    taxationSummary: { type: String, default: "" },
    // Asset Allocation Ranges
    assetAllocationRanges: [{ assetClass: String, min: Number, max: Number }],
    // Derivatives & Risk Controls
    grossExposureLimit: { type: String, default: "" },
    derivativesRestrictions: { type: String, default: "" },
    // Strategy Detail
    derivativeStrategies: [{ name: String, description: String }],
    alphaGenerationApproach: { type: String, default: "" },
    // Fund Administration
    sponsorName: { type: String, default: "" },
    amcName: { type: String, default: "" },
    trusteeName: { type: String, default: "" },
    registrarName: { type: String, default: "" },
    suitableFor: { type: String, default: "" },
    notSuitableFor: { type: String, default: "" },
    bullMarket: { type: String, default: "" },
    bearMarket: { type: String, default: "" },
    sidewaysMarket: { type: String, default: "" },
    howItWorks: { type: String, default: "" },
    mfEquivalent: { type: String, default: "" },
    portfolioFit: { type: String, default: "" },
    // ── finapi.upvaly.com sync ─────────────────────────────────────────────
    isin: { type: String, default: "", index: true },
    externalSchemeCode: { type: String, default: "" },
    marketCapWeightage: {
      type: { largeCap: Number, midCap: Number, smallCap: Number, others: Number },
      default: null,
    },
    concentration: {
      type: {
        numberOfHoldings: Number,
        averageMarketCap: String,
        top3SectorWeight: Number,
        top5StocksWeight: Number,
        top10StocksWeight: Number,
      },
      default: null,
    },
    fundamentals: {
      type: {
        pe: Number, categoryAveragePe: Number,
        pb: Number, categoryAveragePb: Number,
        priceToSale: Number, categoryAveragePriceToSale: Number,
        priceToCashFlow: Number, categoryAveragePriceToCashFlow: Number,
        dividendYield: Number, categoryAverageDividendYield: Number,
        roe: Number, categoryAverageRoe: Number,
      },
      default: null,
    },
    riskMetricsConclusions: {
      type: {
        returns: { info: String, timeframes: [{ timeframe: String, conclusion: String }] },
        riskStandardDeviation: { info: String, timeframes: [{ timeframe: String, conclusion: String }] },
        sharpRatio: { info: String, timeframes: [{ timeframe: String, conclusion: String }] },
        sortinoRatio: { info: String, timeframes: [{ timeframe: String, conclusion: String }] },
        beta: { info: String, timeframes: [{ timeframe: String, conclusion: String }] },
      },
      default: null,
    },
    rollingReturns: [{
      timeframe: String, averageReturn: Number, medianReturn: Number,
      minReturn: Number, minPeriod: String, maxReturn: Number, maxPeriod: String,
      standardDeviation: Number, downsideDeviation: Number,
      positiveRatio: Number, negativeRatio: Number, consistencyScore: Number,
    }],
    categoryRanks: [{ timeframe: String, annualizedReturn: Number, categoryAverage: Number, rankInCategory: String }],
    peers: [{ schemeCode: String, isin: String, schemeName: String, schemeNameShort: String, aum: String, pe: String, pb: String, dividendYield: String, expenseRatio: String }],
    amcOtherFunds: {
      type: {
        companyName: String,
        schemeList: [{ schemeCode: String, isin: String, schemeName: String, schemeShortName: String, morningstarRating: Number, aum: String, returns: Schema.Types.Mixed }],
      },
      default: null,
    },
    lastSyncedFromFinApi: { type: Date, default: null },
  },
  { timestamps: true },
);

const FundDetails: Model<IFundDetails> =
  mongoose.models.FundDetails ||
  mongoose.model<IFundDetails>("FundDetails", FundDetailsSchema);

export default FundDetails;
