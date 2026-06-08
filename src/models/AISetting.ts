import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAISetting extends Document {
  label: string;
  provider: "deepseek" | "gemini" | "openrouter";
  modelName: string;
  apiKey: string;
  usages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AISettingSchema = new Schema<IAISetting>(
  {
    label: { type: String, required: true, trim: true },
    provider: { type: String, enum: ["deepseek", "gemini", "openrouter"], required: true },
    modelName: { type: String, required: true, trim: true },
    apiKey: { type: String, required: true },
    usages: { type: [String], default: [] },
  },
  { timestamps: true },
);

const AISetting: Model<IAISetting> =
  mongoose.models.AISetting || mongoose.model<IAISetting>("AISetting", AISettingSchema);

export default AISetting;
