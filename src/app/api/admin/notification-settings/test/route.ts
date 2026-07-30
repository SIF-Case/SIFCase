import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { sendLeadNotificationEmail, parseRecipients, getLeadRecipientConfig } from "@/lib/mailer";

/**
 * Sends a sample lead alert so an admin can confirm the address list and the
 * SMTP setup without waiting for a real callback request. Accepts an optional
 * `recipients` override to test an address before saving it.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const override = parseRecipients(
    Array.isArray(body.recipients) ? body.recipients.join(",") : String(body.recipients ?? ""),
  );

  let to = override;
  if (!to.length) {
    const config = await getLeadRecipientConfig();
    to = config.recipients;
  }
  if (!to.length) {
    return NextResponse.json({ error: "No recipients to send to. Add an address first." }, { status: 400 });
  }

  try {
    await sendLeadNotificationEmail(
      {
        clientId: "000000000000000000000000",
        name: "Test Investor",
        phone: "+919999999999",
        email: "test.investor@example.com",
        message: "This is a sample message from an admin test send.",
        fundName: "qsif Equity Long Short Fund",
        schemeCode: "SIF-105",
        strategy: "Equity Long-Short",
        amountLakhs: 30,
        source: "admin_test",
        isTest: true,
      },
      to,
    );
    return NextResponse.json({ ok: true, recipients: to });
  } catch (error: any) {
    console.error("Lead notification test send failed:", error);
    return NextResponse.json({ error: error?.message || "Send failed" }, { status: 500 });
  }
}
