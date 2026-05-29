/**
 * Grant admin access to a user by email or phone.
 * Run: npx ts-node --project tsconfig.scripts.json scripts/makeAdmin.ts aurevacapital@gmail.com
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set");

async function main() {
  const identifier = process.argv[2];
  if (!identifier) { console.error("Usage: makeAdmin.ts <email|phone>"); process.exit(1); }

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const users = db.collection("users");

  const query = identifier.startsWith("+")
    ? { phone: identifier }
    : { email: identifier };

  const result = await users.updateOne(query, { $set: { isAdmin: true } }, { upsert: false });

  if (result.matchedCount === 0) {
    console.log(`No user found with identifier: ${identifier}`);
    console.log("Sign in first, then run this script.");
  } else {
    console.log(`✓ Admin granted to: ${identifier}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
