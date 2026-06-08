import mongoose, { Schema, Document, Model } from "mongoose";

export interface IArticle extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverDesktop: string;
  coverMobile: string;
  useSeparateMobile: boolean;
  category: string;
  subcategory: string;
  order: number;
  tags: string[];
  status: "draft" | "published";
  authorName: string;
  authorBio: string;
  readTime: number;
  publishedAt: Date | null;
  updatedAt: Date;
  // SEO fields
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  ogImage: string;
  primaryKeyword: string;
  focusKeyphrase: string;
  createdAt: Date;
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
    subcategory: { type: String, default: "" },
    order: { type: Number, default: 0 },
    tags: [String],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    authorName: { type: String, default: "SIFcase Team" },
    authorBio: { type: String, default: "" },
    readTime: { type: Number, default: 3 },
    publishedAt: { type: Date, default: null },
    // SEO
    seoTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
    robotsIndex: { type: Boolean, default: true },
    ogImage: { type: String, default: "" },
    primaryKeyword: { type: String, default: "" },
    focusKeyphrase: { type: String, default: "" },
  },
  { timestamps: true },
);

const Article: Model<IArticle> =
  mongoose.models.Article || mongoose.model<IArticle>("Article", ArticleSchema);
export default Article;
