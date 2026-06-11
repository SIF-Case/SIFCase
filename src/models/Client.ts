import mongoose, { Schema, Document, Model, Types } from "mongoose";

// Pipeline stages are configurable at runtime via the PipelineStages model
// (see /api/admin/pipeline-stages). Stage values are arbitrary string keys.
export type ClientStage = string;

export interface IClientNote {
  text: string;
  authorId: Types.ObjectId;
  authorName: string;
  createdAt: Date;
  nextFollowUpAt?: Date | null;
}

export interface IPageVisit {
  path: string;
  visitedAt: Date;
}

export interface IUserActivity {
  action: string;
  description: string;
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
  pageVisits: IPageVisit[];
  activities: IUserActivity[];
  lastContactedAt?: Date | null;
  nextFollowUpAt?: Date | null;
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
    nextFollowUpAt: { type: Date, default: null },
  },
);

const PageVisitSchema = new Schema<IPageVisit>(
  {
    path: { type: String, required: true },
    visitedAt: { type: Date, default: Date.now },
  },
);

const UserActivitySchema = new Schema<IUserActivity>(
  {
    action: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
);

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, sparse: true },
    phone: { type: String, sparse: true },
    company: { type: String, default: "" },
    stage: { type: String, default: "lead", index: true },
    source: { type: String, default: "" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    investmentInterest: { type: [String], default: [] },
    estimatedAumLakhs: { type: Number, default: null },
    riskProfile: { type: String, enum: ["Conservative", "Moderate", "Aggressive"], default: null },
    linkedUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, sparse: true, index: true },
    notes: { type: [ClientNoteSchema], default: [] },
    pageVisits: { type: [PageVisitSchema], default: [] },
    activities: { type: [UserActivitySchema], default: [] },
    lastContactedAt: { type: Date, default: null },
    nextFollowUpAt: { type: Date, default: null, index: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

ClientSchema.index({ assignedTo: 1, stage: 1 });
ClientSchema.index({ createdAt: -1 });
ClientSchema.index({ stage: 1, createdAt: -1 });
ClientSchema.index({ name: "text", email: "text", phone: "text", company: "text" });

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);

export default Client;
