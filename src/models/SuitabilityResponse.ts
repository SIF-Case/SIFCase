import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISuitabilityResponse extends Document {
  sessionId: string;           // anonymous or userId
  userId: string | null;       // if logged in
  answers: {
    questionId: string;
    question: string;
    selectedOption: string;
    dimension: string;
  }[];
  completedAt: Date;
  createdAt: Date;
}

const SuitabilityResponseSchema = new Schema<ISuitabilityResponse>(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, default: null },
    answers: [
      {
        questionId: { type: String, required: true },
        question: { type: String, required: true },
        selectedOption: { type: String, required: true },
        selectedValue: { type: Number, default: 0 },
        dimension: { type: String, required: true },
      },
    ],
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const SuitabilityResponse: Model<ISuitabilityResponse> =
  mongoose.models.SuitabilityResponse ||
  mongoose.model<ISuitabilityResponse>("SuitabilityResponse", SuitabilityResponseSchema);

export default SuitabilityResponse;
