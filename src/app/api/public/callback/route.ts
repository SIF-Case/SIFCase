import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Client from "@/models/Client";
import { auth } from "@/auth";
import { sendLeadNotificationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, email, message, fundName, schemeCode, strategy, amountLakhs } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const source = fundName ? "fund_cta_popup" : "callback_popup";

    // Labelled lines rather than one run-on sentence — the drawer renders notes
    // with whitespace preserved, so this stays scannable at a glance.
    const noteLines = [
      fundName ? "Callback requested from a fund page." : "Callback requested from the site.",
      fundName ? `Fund: ${fundName}${schemeCode ? ` (${schemeCode})` : ""}` : null,
      strategy ? `Strategy: ${strategy}` : null,
      typeof amountLakhs === "number" ? `Planning to invest: ₹${amountLakhs}L` : null,
      message && String(message).trim() ? `Message: ${String(message).trim()}` : null,
    ].filter(Boolean);

    const client = await Client.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : undefined,
      stage: "call_req",
      source,
      tags: fundName ? ["Investor"] : [],
      investmentInterest: fundName ? [String(fundName)] : [],
      estimatedAumLakhs: typeof amountLakhs === "number" ? amountLakhs : null,
      notes: [
        {
          text: noteLines.join("\n"),
          authorName: "System",
          createdAt: new Date(),
        } as any,
      ],
    });

    // Best-effort: knowing which signed-in account submitted is a nice-to-have,
    // and auth() can throw outside a normal request scope. Resolve it in its own
    // try so a failure here can never cost us the lead alert below.
    let accountEmail: string | undefined;
    try {
      const session = await auth();
      accountEmail = session?.user?.email ?? undefined;
    } catch (authError) {
      console.error("Callback lead: session lookup failed (continuing):", authError);
    }

    // Notify the sales desk. The lead is already persisted at this point, so an
    // SMTP outage must never fail the user's submission — log and move on.
    try {
      const result = await sendLeadNotificationEmail({
        clientId: String(client._id),
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: email ? String(email).trim() : undefined,
        message: message ? String(message).trim() : undefined,
        fundName: fundName ? String(fundName) : undefined,
        schemeCode: schemeCode ? String(schemeCode) : undefined,
        strategy: strategy ? String(strategy) : undefined,
        amountLakhs: typeof amountLakhs === "number" ? amountLakhs : null,
        accountEmail,
        source,
      });
      console.log(
        `Callback lead ${client._id}: alert ${result.sent ? "sent" : "not sent"} (${result.reason})`,
        result.recipients,
      );
    } catch (mailError) {
      console.error("Callback lead notification email failed:", mailError);
    }

    return NextResponse.json({ ok: true, id: client._id });
  } catch (error: any) {
    console.error("Callback API error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
