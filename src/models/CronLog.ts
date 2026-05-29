import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICronLog extends Document {
  job: string;
  status: "success" | "error";
  message: string;
  fundsUpdated?: number;
  duration?: number;
  createdAt: Date;
}

const CronLogSchema = new Schema<ICronLog>(
  {
    job: { type: String, required: true },
    status: { type: String, enum: ["success", "error"], required: true },
    message: { type: String, required: true },
    fundsUpdated: { type: Number },
    duration: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const CronLog: Model<ICronLog> =
  mongoose.models.CronLog || mongoose.model<ICronLog>("CronLog", CronLogSchema);

export default CronLog;
