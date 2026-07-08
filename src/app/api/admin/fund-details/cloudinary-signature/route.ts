// app/api/admin/fund-details/cloudinary-signature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    if (!await hasPageAccess(req, "fundDetails", "edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const timestamp = Math.round(Date.now() / 1000);

    // Mirrors the options your old upload_stream call used.
    // Everything here gets signed, so the client can't tamper with folder/resource_type.
    const paramsToSign = {
      timestamp,
      folder: "sifcase/factsheets",
      use_filename: true,
      unique_filename: true,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: paramsToSign.folder,
      useFilename: paramsToSign.use_filename,
      uniqueFilename: paramsToSign.unique_filename,
    });
  } catch (err) {
    console.error("cloudinary-signature error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}