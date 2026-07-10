import { NextRequest, NextResponse } from "next/server";
import { issuePhoneOtp } from "@/lib/otp";

// Sends an SMS OTP to any phone number, no login/session involved.
// Used to verify phone ownership on public lead-capture forms.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!phone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

  try {
    const result = await issuePhoneOtp(phone);
    if (!result.ok) return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't send the code, try again" }, { status: 500 });
  }
}
