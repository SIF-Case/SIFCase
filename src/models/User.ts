import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email?: string;
  emailVerified?: Date;
  image?: string;
  phone?: string;
  passwordHash?: string;
  googleId?: string;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, sparse: true, unique: true },
    emailVerified: { type: Date },
    image: { type: String },
    phone: { type: String, sparse: true, unique: true },
    passwordHash: { type: String },
    googleId: { type: String, sparse: true, unique: true },
    isAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
