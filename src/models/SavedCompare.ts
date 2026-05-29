import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedCompare extends Document {
  userId: string;
  name: string;
  schemeCodes: string[];
  period: string;
  createdAt: Date;
}

const SavedCompareSchema = new Schema<ISavedCompare>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    schemeCodes: [String],
    period: { type: String, default: "SI" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const SavedCompare: Model<ISavedCompare> =
  mongoose.models.SavedCompare || mongoose.model<ISavedCompare>("SavedCompare", SavedCompareSchema);
export default SavedCompare;
