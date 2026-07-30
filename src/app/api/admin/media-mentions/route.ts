import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import MediaMention from "@/models/MediaMention";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  if (!(await hasPageAccess(req, "mediaMentions", "view"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const mentions = await MediaMention.find().sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json(mentions);
}

export async function POST(req: NextRequest) {
  if (!(await hasPageAccess(req, "mediaMentions", "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();
  const { outlet, url, title, tag, imageUrl, order, published } = body;

  if (!outlet?.trim()) return NextResponse.json({ error: "Outlet name required" }, { status: 400 });
  if (!url?.trim()) return NextResponse.json({ error: "URL required" }, { status: 400 });
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "URL is not valid" }, { status: 400 });
  }

  const mention = await MediaMention.create({
    outlet: outlet.trim(),
    url: url.trim(),
    title: title.trim(),
    tag: tag?.trim() || "",
    imageUrl: imageUrl?.trim() || "",
    order: order || 0,
    published: published !== false,
  });

  revalidatePath("/");
  return NextResponse.json({ ok: true, id: mention._id });
}
