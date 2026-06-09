import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRssFeed {
  name: string;
  url: string;
  enabled: boolean;
}

export interface INewsConfig extends Document {
  keywords: string[];
  rssFeeds: IRssFeed[];
  aiPrompt: string;
  maxItemsPerFetch: number;
  retentionDays: number;
  updatedAt: Date;
}

const RssFeedSchema = new Schema<IRssFeed>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const NewsConfigSchema = new Schema<INewsConfig>(
  {
    keywords: { type: [String], default: ["Specialised Investment Fund India", "SIF SEBI", "SIF NAV"] },
    rssFeeds: { type: [RssFeedSchema], default: [] },
    aiPrompt: {
      type: String,
      default:
        "You are a financial news summariser for SIFcase, an Indian SIF (Specialised Investment Fund) education platform. Summarise the following news item in 1-2 concise sentences. Focus on what matters to SIF investors. Be factual, professional, and avoid hype.",
    },
    maxItemsPerFetch: { type: Number, default: 30 },
    retentionDays: { type: Number, default: 30 },
  },
  { timestamps: true },
);

const NewsConfig: Model<INewsConfig> =
  mongoose.models.NewsConfig || mongoose.model<INewsConfig>("NewsConfig", NewsConfigSchema);

export default NewsConfig;
