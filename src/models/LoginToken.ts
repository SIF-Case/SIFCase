import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILoginToken extends Document {
  phone: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const LoginTokenSchema = new Schema<ILoginToken>(
  {
    phone: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

LoginTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const LoginToken: Model<ILoginToken> =
  mongoose.models.LoginToken || mongoose.model<ILoginToken>("LoginToken", LoginTokenSchema);

export default LoginToken;
