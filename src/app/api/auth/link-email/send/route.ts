import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { issueEmailOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  
  if (!phone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Enter your name" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  await connectDB();
  const taken = await User.findOne({ email }).lean();
  if (taken) return NextResponse.json({ error: "This email is already in use" }, { status: 409 });

  try {
    // Use phone as key since user is not logged in yet
    const result = await issueEmailOtp({ purpose: "link", key: phone, email, name });
    if (!result.ok) return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't send the code, try again" }, { status: 500 });
  }
}
