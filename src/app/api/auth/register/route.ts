import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { logClientActivity } from "@/lib/activityLogger";

export async function POST(req: NextRequest) {
  const { name, email, password, phoneUserId } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();

  // If linking email to an existing phone account
  if (phoneUserId) {
    const phoneUser = await User.findById(phoneUserId);
    if (!phoneUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Check the target email isn't already on a different account
    const emailTaken = await User.findOne({ email, _id: { $ne: phoneUser._id } });
    if (emailTaken) {
      return NextResponse.json({ error: "Email already registered to another account" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    phoneUser.email = email;
    phoneUser.passwordHash = passwordHash;
    if (name && phoneUser.name === phoneUser.phone) {
      // Replace placeholder name (phone number) with real name
      phoneUser.name = name;
    } else if (name) {
      phoneUser.name = name;
    }
    await phoneUser.save();
    return NextResponse.json({ ok: true });
  }

  // Normal registration (no phone linking)
  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name || email.split("@")[0], email, passwordHash });

  try {
    await logClientActivity(user._id.toString(), "Create User", "Registered user account via email/password");
  } catch (err) {
    console.error("Failed to log Client registration activity:", err);
  }

  return NextResponse.json({ ok: true });
}
