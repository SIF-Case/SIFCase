import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISuitabilityQuestion extends Document {
  question: string;
  options: { text: string; value: number }[];
  dimension: string;
  dimensionOrder: number;
  context: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SuitabilityQuestionSchema = new Schema<ISuitabilityQuestion>(
  {
    question: { type: String, required: true, trim: true },
    options: [
      {
        text: { type: String, required: true },
        value: { type: Number, required: true, default: 0 },
      },
    ],
    dimension: { type: String, default: "", trim: true },
    dimensionOrder: { type: Number, default: 0 },
    context: { type: String, default: "" },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const SuitabilityQuestion: Model<ISuitabilityQuestion> =
  mongoose.models.SuitabilityQuestion ||
  mongoose.model<ISuitabilityQuestion>("SuitabilityQuestion", SuitabilityQuestionSchema);

export default SuitabilityQuestion;
