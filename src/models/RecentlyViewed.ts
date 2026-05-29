import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecentlyViewed extends Document {
  userId: string;
  schemeCode: string;
  schemeName: string;
  viewedAt: Date;
}

const RecentlyViewedSchema = new Schema<IRecentlyViewed>({
  userId: { type: String, required: true, index: true },
  schemeCode: { type: String, required: true },
  schemeName: { type: String, required: true },
  viewedAt: { type: Date, default: Date.now },
});
RecentlyViewedSchema.index({ userId: 1, schemeCode: 1 }, { unique: true });

const RecentlyViewed: Model<IRecentlyViewed> =
  mongoose.models.RecentlyViewed || mongoose.model<IRecentlyViewed>("RecentlyViewed", RecentlyViewedSchema);
export default RecentlyViewed;
