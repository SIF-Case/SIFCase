import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/allsif";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const docs = await db.collection("funddetails").find({}).limit(5).toArray();
  docs.forEach(d => {
    console.log(d.fundName, d.factsheets);
  });
  process.exit(0);
}
run();
