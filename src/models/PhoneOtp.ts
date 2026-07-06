import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPhoneOtp extends Document {
  phone: string;
  otpHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const PhoneOtpSchema = new Schema<IPhoneOtp>(
  {
    phone: { type: String, required: true, unique: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

PhoneOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PhoneOtp: Model<IPhoneOtp> =
  mongoose.models.PhoneOtp || mongoose.model<IPhoneOtp>("PhoneOtp", PhoneOtpSchema);

export default PhoneOtp;
