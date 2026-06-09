import mongoose, { Schema, Document, Model, Types } from "mongoose";

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
  role?: Types.ObjectId | null;
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
    role: { type: Schema.Types.ObjectId, ref: "Role", default: null, index: true },
  },
  { timestamps: true },
);

UserSchema.index({ createdAt: -1 });
UserSchema.index({ isAdmin: 1 });
UserSchema.index({ isBlocked: 1 });
UserSchema.index({ name: "text", email: "text", phone: "text" });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
