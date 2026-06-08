import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ClientStage = "lead" | "contacted" | "qualified" | "proposal" | "onboarded" | "lost";

export const CLIENT_STAGES: ClientStage[] = ["lead", "contacted", "qualified", "proposal", "onboarded", "lost"];

export interface IClientNote {
  text: string;
  authorId: Types.ObjectId;
  authorName: string;
  createdAt: Date;
}

export interface IClient extends Document {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage: ClientStage;
  source: string;
  assignedTo?: Types.ObjectId;
  investmentInterest: string[];
  estimatedAumLakhs?: number | null;
  riskProfile?: "Conservative" | "Moderate" | "Aggressive" | null;
  linkedUserId?: Types.ObjectId | null;
  notes: IClientNote[];
  lastContactedAt?: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ClientNoteSchema = new Schema<IClientNote>(
  {
    text: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
);

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, sparse: true },
    phone: { type: String, sparse: true },
    company: { type: String, default: "" },
    stage: { type: String, enum: CLIENT_STAGES, default: "lead", index: true },
    source: { type: String, default: "" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    investmentInterest: { type: [String], default: [] },
    estimatedAumLakhs: { type: Number, default: null },
    riskProfile: { type: String, enum: ["Conservative", "Moderate", "Aggressive"], default: null },
    linkedUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, sparse: true, index: true },
    notes: { type: [ClientNoteSchema], default: [] },
    lastContactedAt: { type: Date, default: null },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

ClientSchema.index({ assignedTo: 1, stage: 1 });

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);

export default Client;
