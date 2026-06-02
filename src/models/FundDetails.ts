import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFundDetails extends Document {
  fundName: string;
  riskBand: string;
  schemeType: string;
  exitLoad: string;
  aumCurrent: number | null;
  aumAggregate: number | null;
  aumEnd: number | null;
  minInvestment: number;
  additionalInvestment: number;
  fundManagers: { name: string; designation?: string }[];
  benchmarkName: string;
  benchmarkRiskBand: string;
  benchmarkDetails: string;
  assetAllocation: { assetClass: string; percentage: number }[];
  portfolioByIndustry: { industry: string; percentage: number }[];
  portfolioByRatingClass: { ratingClass: string; percentage: number }[];
  topHoldings: { name: string; percentage: number; sector?: string; rating?: string }[];
  factsheets: { url: string; filename: string; uploadedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const FundDetailsSchema = new Schema<IFundDetails>(
  {
    fundName: { type: String, required: true, unique: true, index: true },
    riskBand: { type: String, default: "" },
    schemeType: { type: String, default: "" },
    exitLoad: { type: String, default: "" },
    aumCurrent: { type: Number, default: null },
    aumAggregate: { type: Number, default: null },
    aumEnd: { type: Number, default: null },
    minInvestment: { type: Number, default: 1_000_000 },
    additionalInvestment: { type: Number, default: 10_000 },
    fundManagers: [{ name: String, designation: String }],
    benchmarkName: { type: String, default: "" },
    benchmarkRiskBand: { type: String, default: "" },
    benchmarkDetails: { type: String, default: "" },
    assetAllocation: [{ assetClass: String, percentage: Number }],
    portfolioByIndustry: [{ industry: String, percentage: Number }],
    portfolioByRatingClass: [{ ratingClass: String, percentage: Number }],
    topHoldings: [{ name: String, percentage: Number, sector: String, rating: String }],
    factsheets: [{ url: String, filename: String, uploadedAt: { type: Date, default: Date.now } }],
  },
  { timestamps: true },
);

const FundDetails: Model<IFundDetails> =
  mongoose.models.FundDetails ||
  mongoose.model<IFundDetails>("FundDetails", FundDetailsSchema);

export default FundDetails;
