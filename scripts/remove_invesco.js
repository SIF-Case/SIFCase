require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  
  // 1. Remove Invesco Mutual Fund in fundhouses
  const res1 = await db.collection('fundhouses').deleteOne({ brandName: 'Invesco Mutual Fund' });
  console.log('Removed from fundhouses:', res1.deletedCount);
  
  // 2. Remove the dummy scheme from sifschemes
  const res2 = await db.collection('sifschemes').deleteOne({ schemeCode: 'INV-NFO-001' });
  console.log('Removed from sifschemes:', res2.deletedCount);

  await client.close();
}

main().catch(console.error);
