/**
 * Re-derives the `strategy` field for every scheme in sifschemes by running
 * the canonical parseStrategyFromName() logic on the stored schemeName, then
 * updates any record whose stored strategy doesn't match.
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/fixActiveAssetStrategy.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { parseStrategyFromName } from "../src/models/SIFScheme";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set");

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const schemes = db.collection("sifschemes");

  const all = await schemes.find({}, { projection: { schemeCode: 1, schemeName: 1, strategy: 1 } }).toArray();
  console.log(`Checking ${all.length} schemes...`);

  // Fix known name typos first so parseStrategyFromName runs on the corrected name
  const nameTypos: Record<string, string> = {
    "Actice": "Active",
  };
  let nameFixed = 0;
  for (const doc of all) {
    let correctedName = doc.schemeName as string;
    for (const [typo, fix] of Object.entries(nameTypos)) {
      correctedName = correctedName.replace(new RegExp(typo, "g"), fix);
    }
    if (correctedName !== doc.schemeName) {
      console.log(`  NAME FIX  "${doc.schemeName}" → "${correctedName}"`);
      await schemes.updateOne({ _id: doc._id }, { $set: { schemeName: correctedName } });
      doc.schemeName = correctedName;
      nameFixed++;
    }
  }
  if (nameFixed > 0) console.log(`Fixed ${nameFixed} name typo(s).\n`);

  let fixed = 0;
  for (const doc of all) {
    const correct = parseStrategyFromName(doc.schemeName as string);
    if (doc.strategy !== correct) {
      console.log(`  FIX  ${doc.schemeCode}  "${doc.schemeName}"`);
      console.log(`       "${doc.strategy}" → "${correct}"`);
      await schemes.updateOne({ _id: doc._id }, { $set: { strategy: correct } });
      fixed++;
    }
  }

  if (fixed === 0) console.log("All strategies are already correct — nothing to fix.");
  else console.log(`\nFixed ${fixed} of ${all.length} records.`);

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
