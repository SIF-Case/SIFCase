import { NextRequest, NextResponse } from "next/server";
import { consumePhoneOtp } from "@/lib/otp";

/**
 * Verify phone OTP WITHOUT creating a session.
 * Used for new user registration flow where email is required before login.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, otp } = body;

  if (!phone || !otp) {
    return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });
  }

  const result = await consumePhoneOtp(phone, otp);

  if (!result.ok) {
    const message =
      result.reason === "not-found" ? "No code found for this number" :
      result.reason === "expired" ? "Code expired, request a new one" :
      result.reason === "too-many-attempts" ? "Too many failed attempts" :
      "Invalid code";
    
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // OTP is valid, but don't create session
  // Return success so frontend can proceed to email collection
  return NextResponse.json({ ok: true, phone });
}
