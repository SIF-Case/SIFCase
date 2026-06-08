import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRolePagePermission {
  pageKey: string;
  view: boolean;
  edit: boolean;
}

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: IRolePagePermission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RolePagePermissionSchema = new Schema<IRolePagePermission>(
  {
    pageKey: { type: String, required: true },
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
  },
  { _id: false },
);

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    permissions: { type: [RolePagePermissionSchema], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);

export default Role;
