import mongoose, { Schema, Document, Model } from "mongoose";

// Schema for Knowledge Quiz responses
export interface IKnowledgeQuizResponse extends Document {
  userId: Schema.Types.ObjectId;
  quizType: "knowledge";
  answers: {
    questionId: Schema.Types.ObjectId;
    selectedOptionId: string;
    isCorrect: boolean;
    pointsEarned: number;
  }[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  completedAt: Date;
  createdAt: Date;
}

// Schema for Suitability Quiz responses
export interface ISuitabilityQuizResponse extends Document {
  userId: Schema.Types.ObjectId;
  quizType: "suitability";
  answers: {
    questionId: Schema.Types.ObjectId;
    selectedOptionId: string;
    optionValue: number;
  }[];
  totalScore: number;
  recommendation: string;
  completedAt: Date;
  createdAt: Date;
}

const KnowledgeQuizResponseSchema = new Schema<IKnowledgeQuizResponse>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quizType: { type: String, enum: ["knowledge"], default: "knowledge", required: true },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "KnowledgeQuiz", required: true },
        selectedOptionId: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        pointsEarned: { type: Number, required: true },
      },
    ],
    totalScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true, strict: false }
);

const SuitabilityQuizResponseSchema = new Schema<ISuitabilityQuizResponse>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quizType: { type: String, enum: ["suitability"], default: "suitability", required: true },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "SuitabilityQuestion", required: true },
        selectedOptionId: { type: String, required: true },
        optionValue: { type: Number, required: true },
      },
    ],
    totalScore: { type: Number, required: true },
    recommendation: { type: String },
    completedAt: { type: Date, required: true },
  },
  { timestamps: true, strict: false }
);

// Indexes
KnowledgeQuizResponseSchema.index({ userId: 1, completedAt: -1 });
KnowledgeQuizResponseSchema.index({ quizType: 1 });

SuitabilityQuizResponseSchema.index({ userId: 1, completedAt: -1 });
SuitabilityQuizResponseSchema.index({ quizType: 1 });

// Models
export const KnowledgeQuizResponse: Model<IKnowledgeQuizResponse> =
  mongoose.models.KnowledgeQuizResponse ||
  mongoose.model<IKnowledgeQuizResponse>("KnowledgeQuizResponse", KnowledgeQuizResponseSchema);

export const SuitabilityQuizResponse: Model<ISuitabilityQuizResponse> =
  mongoose.models.SuitabilityQuizResponse ||
  mongoose.model<ISuitabilityQuizResponse>("SuitabilityQuizResponse", SuitabilityQuizResponseSchema);
