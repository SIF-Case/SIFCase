import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const ALLOWED_TYPES = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ]);
    if (!ALLOWED_TYPES.has(file.type) && !file.name.match(/\.(pdf|xlsx|xls)$/i)) {
      return NextResponse.json({ error: "PDF or Excel files only (.pdf, .xlsx, .xls)" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Max 20MB" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; original_filename: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "sifcase/factsheets",
          resource_type: "raw",
          use_filename: true,
          unique_filename: true,
        },
        (err, res) => err ? reject(err) : resolve(res as { secure_url: string; original_filename: string }),
      ).end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      filename: file.name || result.original_filename,
    });
  } catch (err) {
    console.error("upload-pdf error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
