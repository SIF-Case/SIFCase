/**
 * Backfills companyName_short and brandName for all existing sifschemes.
 * Run once: npx ts-node -r tsconfig-paths/register scripts/backfillDerivedFields.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import { deriveCompanyNameShort, deriveBrandName, deriveFundName } from "../src/models/SIFScheme";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const col = mongoose.connection.db!.collection("sifschemes");

  const schemes = await col.find({}, { projection: { _id: 1, schemeName: 1, companyName: 1 } }).toArray();
  console.log(`Backfilling ${schemes.length} schemes…`);

  let updated = 0;
  for (const s of schemes) {
    const companyName_short = deriveCompanyNameShort(s.companyName ?? "");
    const brandName = deriveBrandName(s.schemeName ?? "");
    const fundName = deriveFundName(s.schemeName ?? "");
    await col.updateOne(
      { _id: s._id },
      { $set: { companyName_short, brandName, fundName } },
    );
    updated++;
    console.log(`  brand="${brandName}"  fundName="${fundName}"  short="${companyName_short}"`);
  }

  console.log(`\nDone — ${updated} records updated.`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
