import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { issuePhoneOtp } from "@/lib/otp";

// Sends an SMS OTP for the phone-gate step. Requires an authenticated session
// (the user is already logged in via email/Google and is now adding a phone).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!/^\+\d{7,15}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
  }

  await connectDB();
  // Reject a phone already attached to a different account (phone is unique).
  const taken = await User.findOne({ phone, _id: { $ne: session.user.id } }).lean();
  if (taken) return NextResponse.json({ error: "This phone number is already in use" }, { status: 409 });

  try {
    const result = await issuePhoneOtp(phone);
    if (!result.ok) {
      return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't send the code, try again" }, { status: 500 });
  }
}
