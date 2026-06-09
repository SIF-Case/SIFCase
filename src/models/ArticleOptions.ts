import mongoose, { Schema, Document, Model } from "mongoose";

export interface IArticleOptions extends Document {
  categories: string[];
  subcategories: Record<string, string[]>;
}

const ArticleOptionsSchema = new Schema<IArticleOptions>(
  {
    categories: { type: [String], default: ["General", "Fund Houses", "Interviews"] },
    subcategories: {
      type: Schema.Types.Mixed,
      default: {
        General: ["Market Insights", "SIF Education", "Strategy", "Regulatory", "Derivative Strategies"],
        "Fund Houses": [],
        Interviews: [],
      },
    },
  },
  { timestamps: true },
);

const ArticleOptions: Model<IArticleOptions> =
  mongoose.models.ArticleOptions || mongoose.model<IArticleOptions>("ArticleOptions", ArticleOptionsSchema);

export default ArticleOptions;
