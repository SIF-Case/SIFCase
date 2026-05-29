import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISIFScheme extends Document {
  schemeCode: string;
  schemeName: string;
  amc: string;
  fundType: string;
  isinGrowth: string;
  isinReinvestment: string | null;
  plan: "Regular" | "Direct";
  option:
    | "Growth"
    | "IDCW"
    | "Monthly IDCW"
    | "Quarterly IDCW"
    | "IDCW Payout"
    | "IDCW Reinvestment";
  strategy:
    | "Equity Long-Short"
    | "Hybrid Long-Short"
    | "Equity Ex-Top 100 Long-Short"
    | "Active Asset Allocator Long-Short"
    | "Sector Rotation Long-Short"
    | "Market Neutral";
  companyName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SIFSchemeSchema = new Schema<ISIFScheme>(
  {
    schemeCode: { type: String, required: true, unique: true, index: true },
    schemeName: { type: String, required: true },
    amc: { type: String, required: true },
    fundType: { type: String, default: "Open Ended Scheme" },
    isinGrowth: { type: String, default: "" },
    isinReinvestment: { type: String, default: null },
    plan: { type: String, enum: ["Regular", "Direct"], required: true },
    option: {
      type: String,
      enum: [
        "Growth",
        "IDCW",
        "Monthly IDCW",
        "Quarterly IDCW",
        "IDCW Payout",
        "IDCW Reinvestment",
      ],
      required: true,
    },
    strategy: {
      type: String,
      enum: [
        "Equity Long-Short",
        "Hybrid Long-Short",
        "Equity Ex-Top 100 Long-Short",
        "Active Asset Allocator Long-Short",
        "Sector Rotation Long-Short",
        "Market Neutral",
      ],
      required: true,
    },
    companyName: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export function parsePlanFromName(name: string): "Regular" | "Direct" {
  if (/direct/i.test(name)) return "Direct";
  return "Regular";
}

export function parseOptionFromName(name: string): ISIFScheme["option"] {
  if (/monthly\s+idcw/i.test(name)) return "Monthly IDCW";
  if (/quarterly\s+idcw/i.test(name)) return "Quarterly IDCW";
  if (/idcw\s+reinvestment/i.test(name)) return "IDCW Reinvestment";
  if (/idcw\s+payout/i.test(name)) return "IDCW Payout";
  if (/idcw/i.test(name)) return "IDCW";
  return "Growth";
}

export function parseStrategyFromName(name: string): ISIFScheme["strategy"] {
  if (/equity\s+ex[- ]top\s+100/i.test(name))
    return "Equity Ex-Top 100 Long-Short";
  if (/active\s+asset\s+allocator/i.test(name))
    return "Active Asset Allocator Long-Short";
  if (/sector\s+rotation/i.test(name)) return "Sector Rotation Long-Short";
  if (/market\s+neutral/i.test(name)) return "Market Neutral";
  if (/hybrid/i.test(name)) return "Hybrid Long-Short";
  return "Equity Long-Short";
}

const SIFScheme: Model<ISIFScheme> =
  mongoose.models.SIFScheme ||
  mongoose.model<ISIFScheme>("SIFScheme", SIFSchemeSchema);

export default SIFScheme;
