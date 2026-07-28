import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import PageSeo from "@/models/PageSeo";
import { SEO_PAGES, getSeoPageDef } from "@/lib/seoRegistry";
import { PAGE_SEO_TAG } from "@/lib/pageSeo";

export async function GET(req: NextRequest) {
  if (!(await hasPageAccess(req, "seo", "view")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const rows = await PageSeo.find({}).lean();
  const byPath = new Map(rows.map((r) => [r.path, r]));

  // Every registry page comes back, whether or not it has been overridden —
  // the admin edits one list, not "defaults" and "overrides" side by side.
  const pages = SEO_PAGES.map((def) => {
    const row = byPath.get(def.path);
    return {
      path: def.path,
      label: def.label,
      group: def.group,
      tokens: def.tokens ?? [],
      defaults: { title: def.title, description: def.description },
      title: row?.title ?? "",
      description: row?.description ?? "",
      canonicalUrl: row?.canonicalUrl ?? "",
      ogImage: row?.ogImage ?? "",
      imageAlt: row?.imageAlt ?? "",
      robotsIndex: row?.robotsIndex !== false,
      overridden: Boolean(row),
    };
  });

  return NextResponse.json({ pages });
}

export async function PUT(req: NextRequest) {
  if (!(await hasPageAccess(req, "seo", "edit")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  try {
    const body = await req.json();
    const { path, title, description, canonicalUrl, ogImage, imageAlt, robotsIndex } = body;

    if (!path || !getSeoPageDef(path)) {
      return NextResponse.json({ error: "Unknown page path" }, { status: 400 });
    }

    await PageSeo.findOneAndUpdate(
      { path },
      {
        path,
        title: (title ?? "").trim(),
        description: (description ?? "").trim(),
        canonicalUrl: (canonicalUrl ?? "").trim(),
        ogImage: (ogImage ?? "").trim(),
        imageAlt: (imageAlt ?? "").trim(),
        robotsIndex: robotsIndex !== false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
    revalidateTag(PAGE_SEO_TAG);
    // Pattern rows ("/sifs/[code]") have no single path to purge — the tag
    // above covers the data read, and each page's own ISR window picks it up.
    if (!path.includes("[")) revalidatePath(path);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/seo] save failed", err);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await hasPageAccess(req, "seo", "edit")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const path = new URL(req.url).searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  await PageSeo.deleteOne({ path });
  // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
  revalidateTag(PAGE_SEO_TAG);
  if (!path.includes("[")) revalidatePath(path);

  return NextResponse.json({ ok: true });
}
