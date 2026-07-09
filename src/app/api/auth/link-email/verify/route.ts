import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { consumeEmailOtp, issueLoginToken } from "@/lib/otp";

const ERROR_MESSAGES: Record<string, string> = {
  "not-found": "No code was requested — start again",
  "expired": "This code has expired — request a new one",
  "too-many-attempts": "Too many attempts — request a new code",
  "mismatch": "Incorrect code",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  
  if (!phone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  if (!otp) return NextResponse.json({ error: "Enter the code" }, { status: 400 });

  // Use phone as key since user is not logged in yet
  const result = await consumeEmailOtp({ purpose: "link", key: phone, otp });
  if (!result.ok) {
    return NextResponse.json({ error: ERROR_MESSAGES[result.reason] ?? "Verification failed" }, { status: 400 });
  }

  await connectDB();
  
  // Find or create user with this phone number
  let user = await User.findOne({ phone });
  if (!user) {
    // Create new user
    user = await User.create({
      phone,
      email: result.email,
      emailVerified: new Date(),
      name: result.name || phone,
    });
  } else {
    // Update existing user
    user.email = result.email;
    user.emailVerified = new Date();
    if (result.name && (!user.name || user.name === user.phone)) {
      user.name = result.name;
    }
    await user.save();
  }

  // Issue a short-lived single-use login token (2 min TTL)
  // Frontend uses this with signIn("phone-post-link") to create a session
  const loginToken = await issueLoginToken(phone);

  return NextResponse.json({ ok: true, loginToken });
}
