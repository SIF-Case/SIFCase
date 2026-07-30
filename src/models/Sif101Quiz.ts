import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISif101QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface ISif101Quiz extends Document {
  topicSlug: string; // Article.slug this quiz belongs to
  questions: ISif101QuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const Sif101QuizQuestionSchema = new Schema<ISif101QuizQuestion>(
  {
    q: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: Number, required: true },
    explain: { type: String, default: "" },
  },
  { _id: false }
);

const Sif101QuizSchema = new Schema<ISif101Quiz>(
  {
    topicSlug: { type: String, required: true, unique: true, index: true },
    questions: { type: [Sif101QuizQuestionSchema], default: [] },
  },
  { timestamps: true }
);

const Sif101Quiz: Model<ISif101Quiz> =
  mongoose.models.Sif101Quiz || mongoose.model<ISif101Quiz>("Sif101Quiz", Sif101QuizSchema);

export default Sif101Quiz;
