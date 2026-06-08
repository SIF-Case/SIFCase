import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Role from "@/models/Role";
import { ADMIN_PAGES } from "@/lib/adminPages";

const PAGE_KEYS = new Set(ADMIN_PAGES.map(p => p.key));

function sanitizePermissions(input: unknown): { pageKey: string; view: boolean; edit: boolean }[] {
  if (!Array.isArray(input)) return [];
  const result: { pageKey: string; view: boolean; edit: boolean }[] = [];
  for (const entry of input) {
    if (!entry || typeof entry.pageKey !== "string" || !PAGE_KEYS.has(entry.pageKey)) continue;
    const edit = !!entry.edit;
    result.push({ pageKey: entry.pageKey, view: !!entry.view || edit, edit });
  }
  return result;
}

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const roles = await Role.find().sort({ name: 1 }).lean();
  return NextResponse.json({ roles, canEdit: true });
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const { name, description } = body;
  if (!name || !String(name).trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const permissions = sanitizePermissions(body.permissions);

  try {
    const role = await Role.create({
      name: String(name).trim(),
      description: description || "",
      permissions,
      isSystem: false,
    });
    return NextResponse.json({ ok: true, id: role._id });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
