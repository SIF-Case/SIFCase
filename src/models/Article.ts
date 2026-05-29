import mongoose, { Schema, Document, Model } from "mongoose";

export interface IArticle extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML from TipTap
  coverDesktop: string; // URL
  coverMobile: string;  // URL (optional)
  useSeparateMobile: boolean;
  category: string;
  tags: string[];
  status: "draft" | "published";
  authorName: string;
  readTime: number; // minutes
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    coverDesktop: { type: String, default: "" },
    coverMobile: { type: String, default: "" },
    useSeparateMobile: { type: Boolean, default: false },
    category: { type: String, default: "General" },
    tags: [String],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    authorName: { type: String, default: "SIFcase Team" },
    readTime: { type: Number, default: 3 },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Article: Model<IArticle> =
  mongoose.models.Article || mongoose.model<IArticle>("Article", ArticleSchema);
export default Article;
