import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFaqCategory extends Document {
  categories: string[];
}

const FaqCategorySchema = new Schema<IFaqCategory>(
  {
    categories: { type: [String], default: ["General"] },
  },
  { timestamps: true },
);

const FaqCategory: Model<IFaqCategory> =
  mongoose.models.FaqCategory || mongoose.model<IFaqCategory>("FaqCategory", FaqCategorySchema);

export default FaqCategory;
