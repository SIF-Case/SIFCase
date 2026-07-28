import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAllocationBand {
  name: string;
  range: string;
  percent: number;
  color: string;
}

export interface IStrategyPoint {
  title: string;
  desc: string;
  icon: "pulse" | "clock" | "shield" | "chart" | "lock";
}

export interface INfoManager {
  name: string;
  role: string;
  cred: string;
  avatar: string;
}

export interface INfoDocument {
  title: string;
  href: string;
}

export interface INfo extends Document {
  slug: string;
  externalSchemeId: string | null;
  amc: string;
  amcShort: string;
  avatar: string;
  name: string;
  category: "Equity" | "Hybrid";
  structure: "Open-ended" | "Close-ended";
  objective: string;
  openDate: Date;
  closeDate: Date;
  allotmentDate: Date | null;
  reopenDate: Date | null;
  minInvestment: number;
  subscriptionPrice: number;
  exitLoad: string;
  benchmark: string;
  riskLevel: string;
  riskColor: string;
  published: boolean;
  allocationBands: IAllocationBand[];
  strategyPoints: IStrategyPoint[];
  managers: INfoManager[];
  docs: INfoDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const AllocationBandSchema = new Schema<IAllocationBand>(
  { name: String, range: String, percent: Number, color: String },
  { _id: false },
);

const StrategyPointSchema = new Schema<IStrategyPoint>(
  {
    title: String,
    desc: String,
    icon: { type: String, enum: ["pulse", "clock", "shield", "chart", "lock"], default: "pulse" },
  },
  { _id: false },
);

const NfoManagerSchema = new Schema<INfoManager>(
  { name: String, role: String, cred: String, avatar: String },
  { _id: false },
);

const NfoDocumentSchema = new Schema<INfoDocument>(
  { title: String, href: String },
  { _id: false },
);

const NfoSchema = new Schema<INfo>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    // AMFI's Scheme_Id (e.g. "S-30") for NFOs synced from amfiindia.com/sif/new-fund-offer.
    // Null for NFOs created manually in the admin panel.
    externalSchemeId: { type: String, default: null, unique: true, sparse: true },
    amc: { type: String, required: true },
    amcShort: { type: String, default: "" },
    avatar: { type: String, default: "" },
    name: { type: String, required: true },
    category: { type: String, enum: ["Equity", "Hybrid"], required: true },
    structure: { type: String, enum: ["Open-ended", "Close-ended"], default: "Open-ended" },
    objective: { type: String, default: "" },
    openDate: { type: Date, required: true },
    closeDate: { type: Date, required: true },
    allotmentDate: { type: Date, default: null },
    reopenDate: { type: Date, default: null },
    minInvestment: { type: Number, required: true },
    subscriptionPrice: { type: Number, required: true },
    exitLoad: { type: String, default: "" },
    benchmark: { type: String, default: "" },
    riskLevel: { type: String, default: "" },
    riskColor: { type: String, default: "var(--danger)" },
    published: { type: Boolean, default: true },
    allocationBands: { type: [AllocationBandSchema], default: [] },
    strategyPoints: { type: [StrategyPointSchema], default: [] },
    managers: { type: [NfoManagerSchema], default: [] },
    docs: { type: [NfoDocumentSchema], default: [] },
  },
  { timestamps: true },
);

// Every public NFO surface (homepage, /nfos, the detail page's static params)
// runs the same "published, still open, soonest-closing first" query — this
// covers the filter and the sort in one index.
NfoSchema.index({ published: 1, closeDate: 1 });

const Nfo: Model<INfo> = mongoose.models.Nfo || mongoose.model<INfo>("Nfo", NfoSchema);

export default Nfo;
