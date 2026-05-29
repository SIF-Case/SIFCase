import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const search = searchParams.get("q") ?? "";

  const query = search
    ? { $or: [{ email: { $regex: search, $options: "i" } }, { name: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(query, "-passwordHash").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, action } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "Missing id or action" }, { status: 400 });

  await connectDB();
  const allowed = ["setAdmin", "removeAdmin", "block", "unblock"];
  if (!allowed.includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const update =
    action === "setAdmin"    ? { isAdmin: true }   :
    action === "removeAdmin" ? { isAdmin: false }  :
    action === "block"       ? { isBlocked: true } :
                               { isBlocked: false };

  await User.findByIdAndUpdate(id, update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await connectDB();
  await User.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
