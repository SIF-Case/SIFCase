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
  portfolioByIndustry: { industry: string; percentage: number }[];
  portfolioByRatingClass: { ratingClass: string; percentage: number }[];
  topHoldings: { name: string; percentage: number; sector?: string; rating?: string }[];
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
    portfolioByIndustry: [{ industry: String, percentage: Number }],
    portfolioByRatingClass: [{ ratingClass: String, percentage: Number }],
    topHoldings: [{ name: String, percentage: Number, sector: String, rating: String }],
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
  },
  { timestamps: true },
);

const FundDetails: Model<IFundDetails> =
  mongoose.models.FundDetails ||
  mongoose.model<IFundDetails>("FundDetails", FundDetailsSchema);

export default FundDetails;
