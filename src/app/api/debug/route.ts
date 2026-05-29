import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "?code= required" }, { status: 400 });

  await connectDB();
  const db = mongoose.connection.db!;
  const navs = db.collection("sifnavs");

  const records = await navs
    .find({ schemeCode: code }, { projection: { nav: 1, navDate: 1, _id: 0 } })
    .sort({ navDate: 1 })
    .toArray();

  if (records.length === 0) return NextResponse.json({ error: "No records found" });

  // Compute daily returns
  const riskFreeAnnual = 0.065;
  const returns: number[] = [];
  for (let i = 1; i < records.length; i++) {
    const r = (records[i].nav - records[i - 1].nav) / records[i - 1].nav;
    returns.push(r);
  }

  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const sharpe = (mean - riskFreeAnnual / 252) / stdDev * Math.sqrt(252);

  return NextResponse.json({
    schemeCode: code,
    totalRecords: records.length,
    returnsUsed: n,
    firstDate: records[0].navDate,
    firstNav: records[0].nav,
    lastDate: records[records.length - 1].navDate,
    lastNav: records[records.length - 1].nav,
    meanDailyReturn: mean,
    stdDev,
    sharpe: +sharpe.toFixed(4),
    first5: records.slice(0, 5),
    last5: records.slice(-5),
  });
}
