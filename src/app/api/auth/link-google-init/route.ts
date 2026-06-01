import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  void req;
  const res = NextResponse.json({ ok: true });
  // Short-lived cookie — read in the Google signIn callback to link accounts
  res.cookies.set("linking_user_id", session.user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 300, // 5 minutes
    sameSite: "lax",
  });
  return res;
}
