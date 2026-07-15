require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("sifcase");
    const count = await db.collection("sifschemes").countDocuments();
    console.log("Total sifschemes:", count);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
