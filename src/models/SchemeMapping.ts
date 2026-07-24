import mongoose, { Schema, Document, Model } from "mongoose";

// Join table between our funddetails records and AMFI's SIF scheme ids.
//
// The bridge endpoint (/api/populate-investment-strategy) exposes no ISIN, so the
// first match has to be made on scheme name. The SSD that the match unlocks does
// carry ISINs, which lets the guess be machine-checked and then frozen:
//
//   unverified  — matched by name only; SSD not fetched yet, or has no ISINs
//   verified    — SSD ISINs intersect this fund's known ISINs; never re-matched
//   conflict    — SSD ISINs disagree with the fund we matched; writes are blocked
//
// scheme_id is globally unique across all 15 SIF providers (verified 2026-07-21:
// 28 schemes, 28 distinct ids), so it is safe as a bare key with no SIF_Id.

export type SchemeMappingStatus = "unverified" | "verified" | "conflict";
export type SsdAvailability = "available" | "not_published" | "unchecked";

export interface ISchemeMapping extends Document {
  schemeId: string;
  sifId: string;
  /** AMFI's scheme_name, stored verbatim for diffing when they rename things. */
  schemeName: string;
  /** funddetails.fundName this resolved to, or "" when AMFI lists a fund we lack. */
  matchedFundName: string;
  status: SchemeMappingStatus;
  /** ISINs parsed out of the SSD. Empty for format C, which ships them blank. */
  isins: string[];
  nsdlSchemeCode: string;
  ssdAvailability: SsdAvailability;
  ssdFormat: string;
  /** Last time the SSD resolved. Null means it has never been retrievable. */
  ssdLastSeenAt: Date | null;
  ssdCheckedAt: Date | null;
  ssdMissReason: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const SchemeMappingSchema = new Schema<ISchemeMapping>(
  {
    schemeId: { type: String, required: true, unique: true, index: true },
    sifId: { type: String, default: "" },
    schemeName: { type: String, default: "" },
    matchedFundName: { type: String, default: "", index: true },
    status: { type: String, default: "unverified" },
    isins: { type: [String], default: [] },
    nsdlSchemeCode: { type: String, default: "" },
    ssdAvailability: { type: String, default: "unchecked" },
    ssdFormat: { type: String, default: "" },
    ssdLastSeenAt: { type: Date, default: null },
    ssdCheckedAt: { type: Date, default: null },
    ssdMissReason: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

const SchemeMapping: Model<ISchemeMapping> =
  mongoose.models.SchemeMapping ||
  mongoose.model<ISchemeMapping>("SchemeMapping", SchemeMappingSchema);

export default SchemeMapping;
