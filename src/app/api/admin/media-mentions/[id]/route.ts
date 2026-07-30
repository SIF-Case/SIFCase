import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import MediaMention from "@/models/MediaMention";
import { revalidatePath } from "next/cache";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await hasPageAccess(req, "mediaMentions", "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const rawBody = await req.json();

  // Allowlist fields so a stray client key can't write anything unexpected,
  // and so a full-form save can't silently blank a required field.
  const FIELDS = ["outlet", "url", "title", "tag", "imageUrl", "order", "published"] as const;
  const body: Record<string, unknown> = {};
  for (const key of FIELDS) {
    if (rawBody[key] !== undefined) body[key] = rawBody[key];
  }

  if (body.url !== undefined) {
    try {
      new URL(body.url as string);
    } catch {
      return NextResponse.json({ error: "URL is not valid" }, { status: 400 });
    }
  }
  if (body.outlet !== undefined && !String(body.outlet).trim()) {
    return NextResponse.json({ error: "Outlet name can't be empty" }, { status: 400 });
  }
  if (body.title !== undefined && !String(body.title).trim()) {
    return NextResponse.json({ error: "Title can't be empty" }, { status: 400 });
  }

  await connectDB();
  const updated = await MediaMention.findByIdAndUpdate(id, { $set: body }, { new: true });
  if (!updated) {
    return NextResponse.json({ error: "Mention not found — it may have been deleted" }, { status: 404 });
  }
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await hasPageAccess(req, "mediaMentions", "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  await MediaMention.findByIdAndDelete(id);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
