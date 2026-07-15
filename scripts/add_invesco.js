require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  
  const now = new Date();
  
  // 1. Upsert Invesco Mutual Fund in fundhouses
  await db.collection('fundhouses').updateOne(
    { brandName: 'Invesco Mutual Fund' },
    {
      $set: {
        brandName: 'Invesco Mutual Fund',
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now,
        logoUrl: '',
        overview: 'Invesco Mutual Fund offers Specialised Investment Funds designed to generate alpha and manage downside risk.'
      }
    },
    { upsert: true }
  );
  
  // 2. We need Invesco Mutual Fund to appear in `getFundHouses()` which aggregates over `sifschemes`.
  // Wait, sifschemes needs an entry with brandName = "Invesco Mutual Fund", plan="Regular", option="Growth"
  // Let's add a dummy scheme for the NFO or just the NFO scheme into sifschemes so it aggregates correctly.
  
  const nfoSchemeCode = 'INV-NFO-001';
  await db.collection('sifschemes').updateOne(
    { schemeCode: nfoSchemeCode },
    {
      $set: {
        schemeCode: nfoSchemeCode,
        fundName: 'Summit Equity Long-Short Fund (NFO)',
        amc: 'Invesco Mutual Fund',
        brandName: 'Invesco Mutual Fund',
        companyName: 'Invesco Asset Management (India) Private Limited',
        category: 'Equity',
        plan: 'Regular',
        option: 'Growth',
        nav: 10,
        aum: 0,
        isin: 'INF000000000',
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  console.log("Upserted Invesco Mutual Fund and dummy sifscheme.");
  await client.close();
}

main().catch(console.error);
