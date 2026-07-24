import { NextRequest, NextResponse } from "next/server";
import { issueEmailOtp, maskEmail } from "@/lib/otp";

// Email-first login entry. Sends a login OTP to the given email — works for both
// existing and brand-new addresses (a new address gets an account created at the
// verify step). OTP is keyed by the email itself.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  try {
    const result = await issueEmailOtp({ purpose: "login", key: email, email });
    if (!result.ok) {
      return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 });
    }
    return NextResponse.json({ ok: true, masked: maskEmail(email) });
  } catch {
    return NextResponse.json({ error: "Couldn't send the code, try again" }, { status: 500 });
  }
}
