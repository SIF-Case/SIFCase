import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { consumePhoneOtp } from "@/lib/otp";
import { logClientActivity } from "@/lib/activityLogger";

const ERROR_MESSAGES: Record<string, string> = {
  "not-found": "No code was requested — start again",
  "expired": "This code has expired — request a new one",
  "too-many-attempts": "Too many attempts — request a new code",
  "mismatch": "Incorrect code",
};

// Verifies the SMS OTP and attaches the phone to the logged-in user's account.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";
  if (!phone || !otp) return NextResponse.json({ error: "Phone and code required" }, { status: 400 });

  const result = await consumePhoneOtp(phone, otp);
  if (!result.ok) {
    return NextResponse.json({ error: ERROR_MESSAGES[result.reason] ?? "Verification failed" }, { status: 400 });
  }

  await connectDB();
  // Guard against a race where the number got taken between send and attach.
  const taken = await User.findOne({ phone, _id: { $ne: session.user.id } }).lean();
  if (taken) return NextResponse.json({ error: "This phone number is already in use" }, { status: 409 });

  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  user.phone = phone;
  await user.save();

  try {
    await logClientActivity(user._id.toString(), "Update User", "Added phone number via phone gate");
  } catch (err) {
    console.error("Phone attach client logger error:", err);
  }

  return NextResponse.json({ ok: true });
}
