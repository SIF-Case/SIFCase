import { NextRequest, NextResponse } from "next/server";
import { issueEmailOtp } from "@/lib/otp";

// Sends an email OTP to any address, no login/session involved.
// Used to verify email ownership on public lead-capture forms.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) return NextResponse.json({ error: "Email address required" }, { status: 400 });

  try {
    const result = await issueEmailOtp({ purpose: "verify", key: email, email });
    if (!result.ok) return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't send the code, try again" }, { status: 500 });
  }
}
