import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { consumeEmailOtp } from "@/lib/otp";

const ERROR_MESSAGES: Record<string, string> = {
  "not-found": "No code was requested — start again",
  "expired": "This code has expired — request a new one",
  "too-many-attempts": "Too many attempts — request a new code",
  "mismatch": "Incorrect code",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";
  if (!otp) return NextResponse.json({ error: "Enter the code" }, { status: 400 });

  const result = await consumeEmailOtp({ purpose: "link", key: session.user.id, otp });
  if (!result.ok) {
    return NextResponse.json({ error: ERROR_MESSAGES[result.reason] ?? "Verification failed" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  user.email = result.email;
  user.emailVerified = new Date();
  if (result.name && (!user.name || user.name === user.phone)) user.name = result.name;
  await user.save();

  return NextResponse.json({ ok: true });
}
