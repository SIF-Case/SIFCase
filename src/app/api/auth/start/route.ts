import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { issueEmailOtp, maskEmail } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!phone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  await connectDB();
  const user = await User.findOne({ phone }).lean();

  if (user?.email) {
    try {
      const result = await issueEmailOtp({ purpose: "login", key: phone, email: user.email });
      if (!result.ok) return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 });
      return NextResponse.json({ channel: "email", masked: maskEmail(user.email) });
    } catch {
      return NextResponse.json({ error: "Couldn't send the code, try again" }, { status: 500 });
    }
  }

  return NextResponse.json({ channel: "phone" });
}
