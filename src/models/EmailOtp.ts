import mongoose, { Schema, Document, Model } from "mongoose";

export type EmailOtpPurpose = "login" | "link" | "verify";

export interface IEmailOtp extends Document {
  purpose: EmailOtpPurpose;
  key: string;
  email: string;
  name?: string;
  otpHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const EmailOtpSchema = new Schema<IEmailOtp>(
  {
    purpose: { type: String, enum: ["login", "link", "verify"], required: true },
    key: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

EmailOtpSchema.index({ key: 1, purpose: 1 }, { unique: true });
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp: Model<IEmailOtp> =
  mongoose.models.EmailOtp || mongoose.model<IEmailOtp>("EmailOtp", EmailOtpSchema);

export default EmailOtp;
