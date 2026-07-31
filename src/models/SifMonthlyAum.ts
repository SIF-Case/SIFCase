import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISifMonthlyAum extends Document {
  year: number;
  month: number; // 1-12
  periodLabel: string; // e.g. "June 2026"
  totalAumCr: number | null;
  docFound: boolean;
  sourceUrl: string;
  message: string | null;
  fetchedAt: Date;
}

const SifMonthlyAumSchema = new Schema<ISifMonthlyAum>({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  periodLabel: { type: String, required: true },
  totalAumCr: { type: Number, default: null },
  docFound: { type: Boolean, required: true, default: false },
  sourceUrl: { type: String, required: true },
  message: { type: String, default: null },
  fetchedAt: { type: Date, default: Date.now },
});

SifMonthlyAumSchema.index({ year: 1, month: 1 }, { unique: true });

const SifMonthlyAum: Model<ISifMonthlyAum> =
  mongoose.models.SifMonthlyAum || mongoose.model<ISifMonthlyAum>("SifMonthlyAum", SifMonthlyAumSchema);

export default SifMonthlyAum;
