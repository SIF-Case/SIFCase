import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMediaMention extends Document {
  outlet: string;
  url: string;
  title: string;
  tag: string;
  imageUrl: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaMentionSchema = new Schema<IMediaMention>(
  {
    outlet: { type: String, required: true },
    url: { type: String, required: true },
    title: { type: String, default: "" },
    tag: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MediaMention: Model<IMediaMention> =
  mongoose.models.MediaMention || mongoose.model<IMediaMention>("MediaMention", MediaMentionSchema);

export default MediaMention;
