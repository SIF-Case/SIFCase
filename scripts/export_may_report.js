/**
 * May 2026 SIF Report Data Export Script
 * Matches the exact return calculation logic from src/lib/sifData.ts
 * Run: node scripts/export_may_report.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Report cutoff: May 31, 2026 23:59:59 UTC
const REPORT_CUTOFF = new Date("2026-05-31T23:59:59Z");

// ── Helper Functions (matching src/lib/sifData.ts) ─────────────────────────

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function formatMonthYear(d) {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", " '");
}

/**
 * Safe month subtraction — clamps to last day of month to avoid JS Date overflow
 * e.g. May 31 - 1 month → April 30, not May 1
 */
function subMonths(date, months) {
  const d = new Date(date);
  const targetMonth = d.getMonth() - months;
  d.setMonth(targetMonth);
  const expected = ((targetMonth % 12) + 12) % 12;
  if (d.getMonth() !== expected) d.setDate(0);
  return d;
}

function subYears(date, years) {
  return subMonths(date, years * 12);
}

/**
 * Returns index of the last record whose navDate <= cutoff.
 * If cutoff falls on a weekend/holiday, this gives the last trading day before it.
 */
function lastIdxOnOrBefore(records, cutoff) {
  let idx = -1;
  for (let i = 0; i < records.length; i++) {
    if (records[i].navDate <= cutoff) idx = i;
    else break;
  }
  return idx;
}

function pct(current, base) {
  return +(((current - base) / base) * 100).toFixed(2);
}

/**
 * Annualised (CAGR) return for periods longer than 1 year; absolute return otherwise.
 */
function annualizedReturn(current, base, startDate, endDate) {
  const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years <= 1) return pct(current, base);
  return +((Math.pow(current / base, 1 / years) - 1) * 100).toFixed(2);
}

function fmtReturn(val) {
  if (val === null) return "N/A";
  return (val >= 0 ? "+" : "") + val.toFixed(2) + "%";
}

function strategyToCategory(strategy) {
  if (/hybrid/i.test(strategy) || /active\s*asset/i.test(strategy)) return "Hybrid L-S";
  if (/sector.*rotation/i.test(strategy)) return "Sector R L-S";
  if (/ex.*top.*100/i.test(strategy)) return "Ex-100 L-S";
  return "Equity L-S";
}

async function main() {
  console.log("🔄 Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  
  const db = client.db();
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

  const codes = allSchemes.map(s => s.schemeCode);

  console.log("📈 Fetching NAV history (up to May 31, 2026)...");
  
  // CRITICAL: Only fetch NAVs up to report cutoff date
  const allNavRecords = await navs
    .find(
      { schemeCode: { $in: codes }, navDate: { $lte: REPORT_CUTOFF } },
      { projection: { schemeCode: 1, nav: 1, navDate: 1, _id: 0 } }
    )
    .sort({ navDate: 1 })
    .toArray();

  console.log(`✅ Fetched ${allNavRecords.length} NAV records`);

  const navsByCode = new Map();
  for (const r of allNavRecords) {
    if (!navsByCode.has(r.schemeCode)) navsByCode.set(r.schemeCode, []);
    navsByCode.get(r.schemeCode).push({ nav: r.nav, navDate: new Date(r.navDate) });
  }

  const performances = [];

  console.log("🧮 Computing returns for each scheme (matching sifData.ts logic)...\n");

  for (const s of allSchemes) {
    const records = navsByCode.get(s.schemeCode) || [];
    
    if (records.length === 0) continue;

    const latest = records[records.length - 1];
    const first = records[0];
    const latestDate = latest.navDate;

    // IMPORTANT: Use lastIdxOnOrBefore to handle weekend/holiday gaps correctly
    const ago1m = subMonths(latestDate, 1);
    const ago3m = subMonths(latestDate, 3);
    const ago6m = subMonths(latestDate, 6);
    const ago1y = subYears(latestDate, 1);

    const idx1m = lastIdxOnOrBefore(records, ago1m);
    const idx3m = lastIdxOnOrBefore(records, ago3m);
    const idx6m = lastIdxOnOrBefore(records, ago6m);
    const idx1y = lastIdxOnOrBefore(records, ago1y);

    // Report logic: show return whenever we have a valid NAV point for that period.
    // No minimum record count guards — if idx >= 0 the period NAV exists, so show it.
    // (The live site's sifData.ts uses >= 20/60/120/240 guards for brand-new schemes;
    //  for the May 26 report we want every available data point.)
    const return1M = idx1m >= 0
      ? pct(latest.nav, records[idx1m].nav)
      : null;

    const return3M = idx3m >= 0
      ? pct(latest.nav, records[idx3m].nav)
      : null;

    const return6M = idx6m >= 0
      ? pct(latest.nav, records[idx6m].nav)
      : null;

    const return1Y = idx1y >= 0
      ? pct(latest.nav, records[idx1y].nav)
      : null;

    // SI return: annualized if > 1 year, absolute otherwise
    const returnSI = records.length > 1 
      ? annualizedReturn(latest.nav, first.nav, first.navDate, latestDate)
      : null;

    // Clean scheme name (remove plan/option suffixes)
    const fundName = s.fundName || s.schemeName;
    const cleanName = fundName
      .replace(/\s*-\s*(Direct|Regular)\s*Plan.*$/i, "")
      .replace(/\s*-\s*Growth.*$/i, "")
      .trim();

    performances.push({
      schemeName: cleanName,
      category: strategyToCategory(s.strategy),
      amc: s.companyName || s.amc,
      return1M: fmtReturn(return1M),
      return3M: fmtReturn(return3M),
      return6M: fmtReturn(return6M),
      return1Y: fmtReturn(return1Y),
      returnSI: fmtReturn(returnSI),
      sinceDate: formatMonthYear(first.navDate),
      latestNavDate: formatDate(latestDate),
      recordCount: records.length,
    });
  }

  // Sort by SI return descending (matching getTopFunds logic)
  performances.sort((a, b) => {
    const ra = a.returnSI === "N/A" ? -Infinity : parseFloat(a.returnSI);
    const rb = b.returnSI === "N/A" ? -Infinity : parseFloat(b.returnSI);
    return rb - ra;
  });

  console.log("📋 COMPREHENSIVE PERFORMANCE TABLE — May 2026\n");
  console.log("=".repeat(150));
  console.log(
    "Scheme Name".padEnd(50) +
    "Cat".padEnd(15) +
    "AMC".padEnd(25) +
    "1M %".padEnd(10) +
    "3M %".padEnd(10) +
    "6M %".padEnd(10) +
    "1Y %".padEnd(10) +
    "SI %".padEnd(10) +
    "Since".padEnd(12) +
    "Records"
  );
  console.log("=".repeat(150));

  for (const p of performances) {
    console.log(
      p.schemeName.padEnd(50).substring(0, 50) +
      p.category.padEnd(15) +
      p.amc.padEnd(25).substring(0, 25) +
      p.return1M.padEnd(10) +
      p.return3M.padEnd(10) +
      p.return6M.padEnd(10) +
      p.return1Y.padEnd(10) +
      p.returnSI.padEnd(10) +
      p.sinceDate.padEnd(12) +
      p.recordCount
    );
  }

  console.log("=".repeat(150));
  console.log(`\n✅ Total schemes with data: ${performances.length}\n`);

  // Export to JSON
  const fs = require("fs");
  const outputData = {
    reportMonth: "May 2026",
    monthKey: "2026-05",
    reportCutoff: REPORT_CUTOFF.toISOString(),
    generatedAt: new Date().toISOString(),
    totalSchemes: performances.length,
    dataSource: "sifcase database (matching src/lib/sifData.ts logic)",
    schemes: performances,
  };

  fs.writeFileSync("./may_2026_report_data.json", JSON.stringify(outputData, null, 2));
  console.log("💾 Data saved to: may_2026_report_data.json");
  
  // Generate CSV for easy copy-paste into PDF editor
  const csvLines = [
    "Scheme Name,Category,AMC,1M %,3M %,6M %,1Y %,SI %,Since,Latest NAV Date,Record Count"
  ];
  
  for (const p of performances) {
    csvLines.push(
      `"${p.schemeName}","${p.category}","${p.amc}",${p.return1M},${p.return3M},${p.return6M},${p.return1Y},${p.returnSI},${p.sinceDate},${p.latestNavDate},${p.recordCount}`
    );
  }
  
  fs.writeFileSync("./may_2026_report_data.csv", csvLines.join("\n"));
  console.log("💾 CSV saved to: may_2026_report_data.csv");
  
  // Generate top/bottom performers for Section 06
  console.log("\n📊 MONTHLY PERFORMANCE HIGHLIGHTS\n");
  
  const withValidReturns = performances.filter(p => p.return1M !== "N/A");
  
  if (withValidReturns.length > 0) {
    // Sort by 1M return for monthly highlights
    const by1M = [...withValidReturns].sort((a, b) => {
      return parseFloat(b.return1M) - parseFloat(a.return1M);
    });
    
    console.log("🏆 Top 3 Performers — 1-Month Return:");
    by1M.slice(0, 3).forEach((p, i) => {
      console.log(`${i + 1}. ${p.schemeName.substring(0, 45).padEnd(45)} ${p.return1M.padStart(8)} (SI: ${p.returnSI})`);
    });
    
    console.log("\n📉 Bottom 3 Performers — 1-Month Return:");
    by1M.slice(-3).reverse().forEach((p, i) => {
      console.log(`${i + 1}. ${p.schemeName.substring(0, 45).padEnd(45)} ${p.return1M.padStart(8)} (SI: ${p.returnSI})`);
    });
  } else {
    console.log("⚠️  No schemes have 1-month returns yet (NAV history does not reach back 1 month from May 31, 2026 — all schemes launched in May '26)");
  }
  
  console.log("\n✨ Report data ready for PDF population!\n");
  console.log("📄 Data cutoff: May 31, 2026");
  console.log("📐 Logic matches: src/lib/sifData.ts");
  console.log("🎯 Use the CSV file to populate Section 07 of the report\n");

  await client.close();
}

main().catch(console.error);
