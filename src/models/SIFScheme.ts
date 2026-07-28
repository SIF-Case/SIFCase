import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISIFScheme extends Document {
  fundName: string;
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
  companyName_short: string;
  brandName: string;
  /** AMFI scheme id (e.g. "S-4"), stamped by the sync-amfi cron. "" until matched. */
  schemeId: string;
  /** AMFI SIF_Id (the AMC), stamped alongside schemeId. "" until matched. */
  sifId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Derived field helpers (re-exported from lib for client-safe imports) ──────
export { deriveFundName, deriveCompanyNameShort, deriveBrandName } from "@/lib/schemeHelpers";
import { deriveFundName, deriveCompanyNameShort, deriveBrandName } from "@/lib/schemeHelpers";

// ── Schema ────────────────────────────────────────────────────────────────────

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
    companyName_short: { type: String, default: "" },
    brandName: { type: String, default: "" },
    fundName: { type: String, default: "" },
    schemeId: { type: String, default: "", index: true },
    sifId: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SIFSchemeSchema.pre("save", function () {
  if (this.isModified("companyName") || !this.companyName_short) {
    this.companyName_short = deriveCompanyNameShort(this.companyName);
  }
  if (this.isModified("schemeName") || !this.brandName) {
    this.brandName = deriveBrandName(this.schemeName);
  }
  if (this.isModified("schemeName") || !this.fundName) {
    this.fundName = deriveFundName(this.schemeName);
  }
});

export function parsePlanFromName(name: string): "Regular" | "Direct" {
  if (/direct/i.test(name)) return "Direct";
  return "Regular";
}

// AMFI scheme names use either the "IDCW" abbreviation or the expanded
// "Income Distribution cum Capital Withdrawal" wording — Magnum spells it out.
// Matching only the abbreviation silently fell through to "Growth", so an IDCW
// scheme was indistinguishable from its fund's real Growth plan and showed up
// as a second copy of the fund in every {plan, option} listing query.
const IDCW = "(?:idcw|income\\s+distribution(?:\\s+cum\\s+capital\\s+withdrawal)?)";

export function parseOptionFromName(name: string): ISIFScheme["option"] {
  const has = (pattern: string) => new RegExp(pattern, "i").test(name);

  if (has(`monthly\\s+${IDCW}`)) return "Monthly IDCW";
  if (has(`quarterly\\s+${IDCW}`)) return "Quarterly IDCW";
  if (has(`${IDCW}[\\s-]+reinvest`)) return "IDCW Reinvestment";
  if (has(`${IDCW}[\\s-]+payout`)) return "IDCW Payout";
  if (has(IDCW)) return "IDCW";
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
