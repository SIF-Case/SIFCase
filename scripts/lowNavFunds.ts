import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!;

  const navCounts = await db.collection("sifnavs").aggregate([
    { $group: { _id: "$schemeCode", count: { $sum: 1 } } },
    { $match: { count: { $lte: 5 } } },
    { $sort: { count: 1 } },
  ]).toArray();

  const codes = navCounts.map((n) => n._id as string);
  const schemes = await db.collection("sifschemes")
    .find({ schemeCode: { $in: codes } }, { projection: { schemeCode: 1, schemeName: 1 } })
    .toArray();

  const map = Object.fromEntries(schemes.map((s) => [s.schemeCode as string, s.schemeName as string]));
  navCounts.forEach((n) => console.log(`${n.count} records | ${n._id} | ${map[n._id as string] ?? "?"}`));
  await mongoose.disconnect();
}

main().catch(console.error);
