import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISIFNav extends Document {
  schemeCode: string;
  nav: number;
  repurchasePrice: number | null;
  salePrice: number | null;
  navDate: Date;
  source: "history_import" | "latest_nav_import" | "amfi_txt_fetch";
  fetchedAt: Date;
}

const SIFNavSchema = new Schema<ISIFNav>({
  schemeCode: { type: String, required: true, index: true },
  nav: { type: Number, required: true },
  repurchasePrice: { type: Number, default: null },
  salePrice: { type: Number, default: null },
  navDate: { type: Date, required: true, index: true },
  source: {
    type: String,
    enum: ["history_import", "latest_nav_import", "amfi_txt_fetch"],
    required: true,
  },
  fetchedAt: { type: Date, default: Date.now },
});

// Prevent duplicate (schemeCode, navDate) pairs
SIFNavSchema.index({ schemeCode: 1, navDate: 1 }, { unique: true });

export function excelSerialToDate(serial: number): Date {
  // Excel serial 1 = Jan 1, 1900. Adjust for Excel's leap year bug (treats 1900 as leap year).
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

const SIFNav: Model<ISIFNav> =
  mongoose.models.SIFNav ||
  mongoose.model<ISIFNav>("SIFNav", SIFNavSchema);

export default SIFNav;
