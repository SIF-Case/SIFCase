import { NextRequest, NextResponse } from "next/server";
import { consumeEmailOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";
  if (!email || !otp) return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });

  const result = await consumeEmailOtp({ purpose: "verify", key: email, otp });
  if (!result.ok) {
    const message =
      result.reason === "not-found" ? "No code found for this email" :
      result.reason === "expired" ? "Code expired, request a new one" :
      result.reason === "too-many-attempts" ? "Too many failed attempts" :
      "Invalid code";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
