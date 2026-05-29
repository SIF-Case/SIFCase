/**
 * One-time seed script: imports SIF data from AUREVA SIF DATA/ into MongoDB.
 *
 * Run: npx ts-node --project tsconfig.json scripts/importHistorical.ts
 *
 * Phase 1: latest_nav_restructured (1).xlsx  → seeds sifschemes + sifnavs (latest NAV)
 * Phase 2: AUREVA SIF DATA/NAV Data/**\/*.xlsx → seeds sifnavs (historical NAV per fund)
 *
 * Idempotent: uses bulkWrite with upsert, safe to re-run.
 */

import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import mongoose, { type AnyBulkWriteOperation } from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Inline model definitions to avoid Next.js import issues in Node script context
import {
  parsePlanFromName,
  parseOptionFromName,
  parseStrategyFromName,
} from "../src/models/SIFScheme";
import { excelSerialToDate } from "../src/models/SIFNav";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not set in .env");
  process.exit(1);
}

// ── Mongoose schemas (inline to avoid Next.js-only imports) ──────────────────

const SIFSchemeSchema = new mongoose.Schema(
  {
    schemeCode: { type: String, required: true, unique: true, index: true },
    schemeName: { type: String, required: true },
    amc: { type: String, required: true },
    fundType: { type: String, default: "Open Ended Scheme" },
    isinGrowth: { type: String, default: "" },
    isinReinvestment: { type: String, default: null },
    plan: { type: String, enum: ["Regular", "Direct"], required: true },
    option: {
      type: String,
      enum: [
        "Growth",
        "IDCW",
        "Monthly IDCW",
        "Quarterly IDCW",
        "IDCW Payout",
        "IDCW Reinvestment",
      ],
      required: true,
    },
    strategy: {
      type: String,
      enum: [
        "Equity Long-Short",
        "Hybrid Long-Short",
        "Equity Ex-Top 100 Long-Short",
        "Active Asset Allocator Long-Short",
        "Sector Rotation Long-Short",
        "Market Neutral",
      ],
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SIFNavSchema = new mongoose.Schema({
  schemeCode: { type: String, required: true, index: true },
  nav: { type: Number, required: true },
  repurchasePrice: { type: Number, default: null },
  salePrice: { type: Number, default: null },
  navDate: { type: Date, required: true, index: true },
  source: {
    type: String,
    enum: ["history_import", "latest_nav_import", "amfi_txt_fetch"],
    required: true,
  },
  fetchedAt: { type: Date, default: Date.now },
});
SIFNavSchema.index({ schemeCode: 1, navDate: 1 }, { unique: true });

const SIFScheme =
  mongoose.models.SIFScheme ||
  mongoose.model("SIFScheme", SIFSchemeSchema);
const SIFNav =
  mongoose.models.SIFNav || mongoose.model("SIFNav", SIFNavSchema);

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAllXlsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllXlsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".xlsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Phase 1: latest_nav_restructured (1).xlsx ────────────────────────────────

async function importLatestNav(filePath: string) {
  console.log("\n[Phase 1] Importing latest NAV from:", path.basename(filePath));

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

  const headers = rows[0] as string[];
  console.log("  Columns:", headers);

  const dataRows = rows.slice(1).filter((r) => r[0]); // skip empty rows

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schemeOps: AnyBulkWriteOperation<any>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navOps: AnyBulkWriteOperation<any>[] = [];
  let skipped = 0;

  for (const row of dataRows) {
    const [code, amc, fundType, schemeName, isinGrowth, isinReinvestment, navRaw, dateRaw] =
      row as [string, string, string, string, string, string, number | string, string];

    if (!code || !schemeName) { skipped++; continue; }

    const nav = typeof navRaw === "number" ? navRaw : parseFloat(String(navRaw));
    if (isNaN(nav)) { skipped++; continue; }

    let navDate: Date;
    if (typeof dateRaw === "string") {
      navDate = new Date(dateRaw);
    } else if (typeof dateRaw === "number") {
      navDate = excelSerialToDate(dateRaw);
    } else {
      skipped++;
      continue;
    }
    if (isNaN(navDate.getTime())) { skipped++; continue; }

    schemeOps.push({
      updateOne: {
        filter: { schemeCode: String(code).trim() },
        update: {
          $set: {
            schemeCode: String(code).trim(),
            schemeName: String(schemeName).trim(),
            amc: String(amc ?? "").trim(),
            fundType: String(fundType ?? "Open Ended Scheme").trim(),
            isinGrowth: String(isinGrowth ?? "").trim(),
            isinReinvestment:
              String(isinReinvestment ?? "").trim() === "-"
                ? null
                : String(isinReinvestment ?? "").trim(),
            plan: parsePlanFromName(String(schemeName)),
            option: parseOptionFromName(String(schemeName)),
            strategy: parseStrategyFromName(String(schemeName)),
            isActive: true,
          },
        },
        upsert: true,
      },
    });

    navOps.push({
      updateOne: {
        filter: { schemeCode: String(code).trim(), navDate },
        update: {
          $setOnInsert: {
            schemeCode: String(code).trim(),
            nav,
            repurchasePrice: null,
            salePrice: null,
            navDate,
            source: "latest_nav_import",
            fetchedAt: new Date(),
          },
        },
        upsert: true,
      },
    });
  }

  const schemeResult = await SIFScheme.bulkWrite(schemeOps, { ordered: false });
  const navResult = await SIFNav.bulkWrite(navOps, { ordered: false });

  console.log(
    `  Schemes — upserted: ${schemeResult.upsertedCount}, modified: ${schemeResult.modifiedCount}, skipped: ${skipped}`
  );
  console.log(
    `  NAVs    — upserted: ${navResult.upsertedCount}, skipped: ${navResult.matchedCount}`
  );
}

// ── Phase 2: Per-fund history files ─────────────────────────────────────────

// Build a map of schemeName (lowercase) → schemeCode from DB after phase 1
async function buildSchemeNameMap(): Promise<Map<string, string>> {
  const schemes = await SIFScheme.find({}, { schemeCode: 1, schemeName: 1 }).lean();
  const map = new Map<string, string>();
  for (const s of schemes) {
    map.set((s.schemeName as string).toLowerCase().trim(), s.schemeCode as string);
  }
  return map;
}

async function importHistoryFiles(navDataDir: string) {
  console.log("\n[Phase 2] Importing historical NAV files from:", navDataDir);

  const files = getAllXlsxFiles(navDataDir);
  console.log(`  Found ${files.length} history files`);

  const schemeNameMap = await buildSchemeNameMap();
  let totalUpserted = 0;
  let totalSkippedFiles = 0;

  for (const filePath of files) {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

    if (rows.length < 5) { totalSkippedFiles++; continue; }

    // Row 3 (index 3) = full scheme name with plan+option
    const fullSchemeName = String(rows[3]?.[0] ?? "").trim();
    if (!fullSchemeName) { totalSkippedFiles++; continue; }

    // Look up schemeCode by matching against DB (try exact, then fuzzy)
    let schemeCode = schemeNameMap.get(fullSchemeName.toLowerCase());

    if (!schemeCode) {
      // Try partial match (history file names may differ slightly from AMFI names)
      const baseName = fullSchemeName.toLowerCase();
      for (const [dbName, code] of schemeNameMap) {
        if (dbName.includes(baseName.substring(0, 30)) || baseName.includes(dbName.substring(0, 30))) {
          schemeCode = code;
          break;
        }
      }
    }

    if (!schemeCode) {
      console.warn(`  [WARN] No scheme match for: "${fullSchemeName}" (${path.basename(filePath)})`);
      totalSkippedFiles++;
      continue;
    }

    // Data rows start at index 5 (row 4 = headers)
    const dataRows = rows.slice(5).filter((r) => r[0] !== null && r[0] !== undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navOps: AnyBulkWriteOperation<any>[] = [];

    for (const row of dataRows) {
      const [navRaw, repurchaseRaw, saleRaw, dateRaw] = row as [
        number | null,
        number | null,
        number | null,
        number,
      ];

      if (navRaw === null || navRaw === undefined) continue;
      if (typeof dateRaw !== "number") continue;

      const nav = Number(navRaw);
      if (isNaN(nav)) continue;

      const navDate = excelSerialToDate(dateRaw);
      if (isNaN(navDate.getTime())) continue;

      navOps.push({
        updateOne: {
          filter: { schemeCode, navDate },
          update: {
            $setOnInsert: {
              schemeCode,
              nav,
              repurchasePrice: repurchaseRaw ?? null,
              salePrice: saleRaw ?? null,
              navDate,
              source: "history_import",
              fetchedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    }

    if (navOps.length > 0) {
      const result = await SIFNav.bulkWrite(navOps, { ordered: false });
      totalUpserted += result.upsertedCount;
    }
  }

  console.log(`  History import complete — total upserted: ${totalUpserted}, skipped files: ${totalSkippedFiles}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("Connected.");

  const dataRoot = path.resolve(__dirname, "../AUREVA SIF DATA");
  const latestNavFile = path.join(dataRoot, "latest_nav_restructured (1).xlsx");
  const navDataDir = path.join(dataRoot, "NAV Data");

  if (!fs.existsSync(latestNavFile)) {
    console.error("latest_nav_restructured (1).xlsx not found at:", latestNavFile);
    process.exit(1);
  }

  await importLatestNav(latestNavFile);

  if (fs.existsSync(navDataDir)) {
    await importHistoryFiles(navDataDir);
  } else {
    console.warn("[Phase 2] NAV Data directory not found, skipping historical import.");
  }

  await mongoose.disconnect();
  console.log("\nDone. Disconnected from MongoDB.");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
