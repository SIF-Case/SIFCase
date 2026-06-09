import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INewsItem extends Document {
  title: string;
  url: string;
  source: string;
  originalExcerpt: string;
  aiSummary: string;
  imageUrl: string;
  publishedAt: Date;
  fetchedAt: Date;
  isVisible: boolean;
  promotedArticleId: Types.ObjectId | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NewsItemSchema = new Schema<INewsItem>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true, unique: true, index: true },
    source: { type: String, default: "" },
    originalExcerpt: { type: String, default: "" },
    aiSummary: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    publishedAt: { type: Date, default: Date.now },
    fetchedAt: { type: Date, default: Date.now },
    isVisible: { type: Boolean, default: true, index: true },
    promotedArticleId: { type: Schema.Types.ObjectId, ref: "Article", default: null },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

NewsItemSchema.index({ publishedAt: -1 });
NewsItemSchema.index({ isVisible: 1, publishedAt: -1 });

const NewsItem: Model<INewsItem> =
  mongoose.models.NewsItem || mongoose.model<INewsItem>("NewsItem", NewsItemSchema);

export default NewsItem;
