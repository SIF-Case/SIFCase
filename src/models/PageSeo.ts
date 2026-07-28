import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Editable SEO overrides for pages whose metadata is otherwise hardcoded in the
 * route file. Keyed by `path`: either a literal route ("/privacy") or a route
 * pattern ("/sifs/[code]") whose title/description may contain {token}
 * placeholders filled per-render — see src/lib/pageSeo.ts.
 *
 * Article and news pages are NOT managed here: they already carry per-record
 * seoTitle/metaDescription fields edited alongside the article itself.
 */
export interface IPageSeo extends Document {
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage: string;
  imageAlt: string;
  robotsIndex: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const PageSeoSchema = new Schema<IPageSeo>(
  {
    path: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
    robotsIndex: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const PageSeo: Model<IPageSeo> =
  mongoose.models.PageSeo || mongoose.model<IPageSeo>("PageSeo", PageSeoSchema);
export default PageSeo;
