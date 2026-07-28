import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import NotificationSetting, { LEAD_CHANNEL } from "@/models/NotificationSetting";
import { envLeadRecipients, parseRecipients } from "@/lib/mailer";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const doc = await NotificationSetting.findOne({ channel: LEAD_CHANNEL }).lean();
  return NextResponse.json({
    setting: {
      enabled: doc ? doc.enabled !== false : true,
      recipients: doc?.recipients ?? [],
      updatedAt: doc?.updatedAt ?? null,
      // Shown in the UI so admins can see what the site falls back to while no
      // list is saved.
      envFallback: envLeadRecipients(),
      configured: !!doc?.recipients?.length,
    },
  });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const rawRecipients = Array.isArray(body.recipients)
    ? body.recipients.join(",")
    : String(body.recipients ?? "");
  const recipients = parseRecipients(rawRecipients);
  const enabled = body.enabled !== false;

  if (enabled && !recipients.length) {
    return NextResponse.json(
      { error: "Add at least one valid email address, or turn lead alerts off." },
      { status: 400 },
    );
  }

  await connectDB();
  const doc = await NotificationSetting.findOneAndUpdate(
    { channel: LEAD_CHANNEL },
    { $set: { enabled, recipients } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return NextResponse.json({
    setting: {
      enabled: doc!.enabled !== false,
      recipients: doc!.recipients,
      updatedAt: doc!.updatedAt,
      envFallback: envLeadRecipients(),
      configured: !!doc!.recipients.length,
    },
  });
}
