import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Client from "@/models/Client";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, email, message, fundName, schemeCode, amountLakhs } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const client = await Client.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : undefined,
      stage: "call_req",
      source: fundName ? "fund_cta_popup" : "callback_popup",
      tags: fundName ? ["Investor"] : [],
      investmentInterest: fundName ? [String(fundName)] : [],
      estimatedAumLakhs: typeof amountLakhs === "number" ? amountLakhs : null,
      notes: [
        {
          text: fundName
            ? `Requested to get started with ${fundName}${schemeCode ? ` (${schemeCode})` : ""}.${amountLakhs ? ` Planning to invest ₹${amountLakhs}L.` : ""}${message ? ` Message: ${String(message).trim()}` : ""}`
            : `User requested a callback.${message ? ` Message: ${String(message).trim()}` : ""}`,
          authorName: "System",
          createdAt: new Date(),
        } as any,
      ],
    });

    return NextResponse.json({ ok: true, id: client._id });
  } catch (error: any) {
    console.error("Callback API error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
