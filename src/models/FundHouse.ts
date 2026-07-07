import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFundHouse extends Document {
  brandName: string;   // unique key — matches brandName in sifschemes
  logoUrl: string;     // Cloudinary / CDN URL for the AMC logo
  overview: string;    // Rich paragraph describing the AMC's SIF platform
  createdAt: Date;
  updatedAt: Date;
}

const FundHouseSchema = new Schema<IFundHouse>(
  {
    brandName: { type: String, required: true, unique: true, index: true },
    logoUrl:   { type: String, default: "" },
    overview:  { type: String, default: "" },
  },
  { timestamps: true },
);

const FundHouse: Model<IFundHouse> =
  mongoose.models.FundHouse ||
  mongoose.model<IFundHouse>("FundHouse", FundHouseSchema);

export default FundHouse;
