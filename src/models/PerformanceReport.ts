import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPerformanceReport extends Document {
  monthKey: string;
  slug: string;
  label: string;
  summary: string;
  niftyReturn: number | null;
  pdfUrl: string;
  pdfFilename: string;
  published: boolean;
  // Homepage banner copy. Blank means "use the built-in default" — see
  // BANNER_DEFAULTS in components/sections/PerformanceReportBanner.tsx.
  bannerTitle: string;
  unlockHeading: string;
  unlockSubtext: string;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceReportSchema = new Schema<IPerformanceReport>(
  {
    monthKey: { type: String, required: true, unique: true, index: true }, // e.g. "2026-05"
    slug: { type: String, required: true, unique: true, index: true },     // e.g. "may-2026"
    label: { type: String, required: true, trim: true },                   // e.g. "May 2026"
    summary: { type: String, default: "" },
    niftyReturn: { type: Number, default: null },
    pdfUrl: { type: String, default: "" },
    pdfFilename: { type: String, default: "" },
    published: { type: Boolean, default: false },
    bannerTitle: { type: String, default: "" },
    unlockHeading: { type: String, default: "" },
    // May contain the {count} token, replaced with the live SIF count.
    unlockSubtext: { type: String, default: "" },
  },
  { timestamps: true },
);

const PerformanceReport: Model<IPerformanceReport> =
  mongoose.models.PerformanceReport || mongoose.model<IPerformanceReport>("PerformanceReport", PerformanceReportSchema);

export default PerformanceReport;
