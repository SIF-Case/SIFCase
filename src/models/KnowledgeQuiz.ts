import mongoose, { Schema, Document, Model } from "mongoose";

export interface IKnowledgeQuiz extends Document {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  context: string; // Explanation shown after answering
  points: number; // Points awarded for correct answer
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeQuizSchema = new Schema<IKnowledgeQuiz>(
  {
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    context: { type: String, default: "" },
    points: { type: Number, default: 10 },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const KnowledgeQuiz: Model<IKnowledgeQuiz> =
  mongoose.models.KnowledgeQuiz ||
  mongoose.model<IKnowledgeQuiz>("KnowledgeQuiz", KnowledgeQuizSchema);

export default KnowledgeQuiz;
