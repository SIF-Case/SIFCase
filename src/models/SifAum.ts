import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISifAumByAmc {
  amc: string;
  aumLakhs: number | null;
  averageAumLakhs: number | null;
}

export interface ISifAum extends Document {
  fyId: string;
  periodId: string;
  periodLabel: string;
  financialYear: string;
  totalAumLakhs: number;
  totalAverageAumLakhs: number | null;
  byAmc: ISifAumByAmc[];
  fetchedAt: Date;
}

const SifAumByAmcSchema = new Schema<ISifAumByAmc>(
  { amc: String, aumLakhs: Number, averageAumLakhs: Number },
  { _id: false },
);

const SifAumSchema = new Schema<ISifAum>({
  fyId: { type: String, required: true },
  periodId: { type: String, required: true },
  periodLabel: { type: String, required: true },
  financialYear: { type: String, required: true },
  totalAumLakhs: { type: Number, required: true },
  totalAverageAumLakhs: { type: Number, default: null },
  byAmc: { type: [SifAumByAmcSchema], default: [] },
  fetchedAt: { type: Date, default: Date.now },
});

SifAumSchema.index({ fyId: 1, periodId: 1 }, { unique: true });

const SifAum: Model<ISifAum> = mongoose.models.SifAum || mongoose.model<ISifAum>("SifAum", SifAumSchema);

export default SifAum;
