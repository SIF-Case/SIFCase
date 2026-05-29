import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWatchlist extends Document {
  userId: string;
  schemeCodes: string[];
  updatedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>(
  { userId: { type: String, required: true, unique: true, index: true }, schemeCodes: [String] },
  { timestamps: true },
);

const Watchlist: Model<IWatchlist> =
  mongoose.models.Watchlist || mongoose.model<IWatchlist>("Watchlist", WatchlistSchema);
export default Watchlist;
