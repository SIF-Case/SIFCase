import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  
  if (!phone) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }
  
  const res = NextResponse.json({ ok: true });
  // Store phone number in cookie for Google OAuth callback to link account
  res.cookies.set("linking_phone", phone, {
    httpOnly: true,
    path: "/",
    maxAge: 300, // 5 minutes
    sameSite: "lax",
  });
  return res;
}
