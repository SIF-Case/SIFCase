/**
 * Generate May 2026 Performance Report Data
 * 
 * This script fetches all SIF schemes and computes performance metrics
 * for the comprehensive performance table (Section 07) of the monthly report.
 */

import { connectDB } from "../src/lib/mongodb";
import mongoose from "mongoose";

interface NavRecord {
  nav: number;
  navDate: Date;
}

interface SchemePerformance {
  schemeName: string;
  fundName: string;
  category: string;
  amc: string;
  return1M: string;
  return3M: string;
  return6M: string;
  return1Y: string;
  returnSI: string;
  sinceDate: string;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", " '");
}

function subMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() - months;
  d.setMonth(targetMonth);
  const expected = ((targetMonth % 12) + 12) % 12;
  if (d.getMonth() !== expected) d.setDate(0);
  return d;
}

function subYears(date: Date, years: number): Date {
  return subMonths(date, years * 12);
}

function lastIdxOnOrBefore(records: NavRecord[], cutoff: Date): number {
  let idx = -1;
  for (let i = 0; i < records.length; i++) {
    if (records[i].navDate <= cutoff) idx = i;
    else break;
  }
  return idx;
}

function pct(current: number, base: number): number {
  return +(((current - base) / base) * 100).toFixed(2);
}

function annualizedReturn(current: number, base: number, startDate: Date, endDate: Date): number {
  const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years <= 1) return pct(current, base);
  return +((Math.pow(current / base, 1 / years) - 1) * 100).toFixed(2);
}

function fmtReturn(val: number | null): string {
  if (val === null) return "N/A";
  return (val >= 0 ? "+" : "") + val.toFixed(2) + "%";
}

function strategyToCategory(strategy: string): string {
  if (/hybrid/i.test(strategy) || /active\s*asset/i.test(strategy)) return "Hybrid L-S";
  if (/sector.*rotation/i.test(strategy)) return "Sector R L-S";
  if (/ex.*top.*100/i.test(strategy)) return "Ex-100 L-S";
  return "Equity L-S";
}

async function generateMay2026ReportData() {
  console.log("🔄 Connecting to database...");
  await connectDB();
  
  const db = mongoose.connection.db!;
  const schemes = db.collection("sifschemes");
  const navs = db.collection("sifnavs");

  console.log("📊 Fetching all Direct Plan Growth schemes...");
  
  const allSchemes = await schemes
    .find(
      { plan: "Direct", option: "Growth" },
      { projection: { schemeCode: 1, schemeName: 1, fundName: 1, amc: 1, companyName: 1, strategy: 1, _id: 0 } }
    )
    .sort({ amc: 1, schemeName: 1 })
    .toArray();

  console.log(`✅ Found ${allSchemes.length} schemes`);

  const codes = allSchemes.map((s: any) => s.schemeCode);

  console.log("📈 Fetching NAV history for all schemes...");
  
  // Get NAVs up to May 31, 2026
  const mayEnd = new Date("2026-05-31T23:59:59Z");
  
  const allNavRecords = await navs
    .find(
      { schemeCode: { $in: codes }, navDate: { $lte: mayEnd } },
      { projection: { schemeCode: 1, nav: 1, navDate: 1, _id: 0 } }
    )
    .sort({ navDate: 1 })
    .toArray();

  console.log(`✅ Fetched ${allNavRecords.length} NAV records`);

  const navsByCode = new Map<string, NavRecord[]>();
  for (const r of allNavRecords) {
    const code = r.schemeCode as string;
    if (!navsByCode.has(code)) navsByCode.set(code, []);
    navsByCode.get(code)!.push({ nav: r.nav as number, navDate: new Date(r.navDate) });
  }

  const performances: SchemePerformance[] = [];

  console.log("🧮 Computing returns for each scheme...");

  for (const s of allSchemes) {
    const code = s.schemeCode as string;
    const records = navsByCode.get(code) ?? [];
    
    if (records.length === 0) continue;

    const latest = records[records.length - 1];
    const first = records[0];
    const latestDate = latest.navDate;

    // Calculate cutoff dates
    const ago1m = subMonths(latestDate, 1);
    const ago3m = subMonths(latestDate, 3);
    const ago6m = subMonths(latestDate, 6);
    const ago1y = subYears(latestDate, 1);

    const idx1m = lastIdxOnOrBefore(records, ago1m);
    const idx3m = lastIdxOnOrBefore(records, ago3m);
    const idx6m = lastIdxOnOrBefore(records, ago6m);
    const idx1y = lastIdxOnOrBefore(records, ago1y);

    // For the May 2026 report cutoff, calculate returns based on available data
    // Remove minimum record requirements - if we have data for the period, show it
    const return1M = idx1m >= 0 ? pct(latest.nav, records[idx1m].nav) : null;
    const return3M = idx3m >= 0 ? pct(latest.nav, records[idx3m].nav) : null;
    const return6M = idx6m >= 0 ? pct(latest.nav, records[idx6m].nav) : null;
    const return1Y = idx1y >= 0 ? pct(latest.nav, records[idx1y].nav) : null;
    const returnSI = records.length > 1 
      ? annualizedReturn(latest.nav, first.nav, first.navDate, latestDate)
      : null;

    const fundName = (s.fundName as string) || (s.schemeName as string);
    const cleanName = fundName
      .replace(/\s*-\s*(Direct|Regular)\s*Plan.*$/i, "")
      .replace(/\s*-\s*Growth.*$/i, "")
      .trim();

    performances.push({
      schemeName: cleanName,
      fundName: cleanName,
      category: strategyToCategory(s.strategy as string),
      amc: (s.companyName as string) || (s.amc as string),
      return1M: fmtReturn(return1M),
      return3M: fmtReturn(return3M),
      return6M: fmtReturn(return6M),
      return1Y: fmtReturn(return1Y),
      returnSI: fmtReturn(returnSI),
      sinceDate: formatMonthYear(first.navDate),
    });
  }

  // Sort by Since Inception return (descending)
  performances.sort((a, b) => {
    const ra = a.returnSI === "N/A" ? -Infinity : parseFloat(a.returnSI);
    const rb = b.returnSI === "N/A" ? -Infinity : parseFloat(b.returnSI);
    return rb - ra;
  });

  console.log("\n📋 COMPREHENSIVE PERFORMANCE TABLE — ALL ACTIVE SCHEMES (May 2026)\n");
  console.log("=" .repeat(140));
  console.log(
    "Scheme Name".padEnd(50) +
    "Category".padEnd(15) +
    "AMC".padEnd(25) +
    "1M".padEnd(10) +
    "3M".padEnd(10) +
    "6M".padEnd(10) +
    "1Y".padEnd(10) +
    "SI".padEnd(10) +
    "Since"
  );
  console.log("=".repeat(140));

  for (const p of performances) {
    console.log(
      p.fundName.padEnd(50).substring(0, 50) +
      p.category.padEnd(15) +
      p.amc.padEnd(25).substring(0, 25) +
      p.return1M.padEnd(10) +
      p.return3M.padEnd(10) +
      p.return6M.padEnd(10) +
      p.return1Y.padEnd(10) +
      p.returnSI.padEnd(10) +
      p.sinceDate
    );
  }

  console.log("=".repeat(140));
  console.log(`\n✅ Total schemes: ${performances.length}`);

  // Generate JSON output
  const outputData = {
    reportMonth: "May 2026",
    generatedAt: new Date().toISOString(),
    totalSchemes: performances.length,
    schemes: performances,
  };

  const fs = require("fs");
  const outputPath = "./may_2026_comprehensive_table.json";
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  
  console.log(`\n💾 Data exported to: ${outputPath}`);
  console.log("\n✨ Use this data to populate Section 07 of the PDF report\n");

  await mongoose.connection.close();
}

generateMay2026ReportData().catch(console.error);
