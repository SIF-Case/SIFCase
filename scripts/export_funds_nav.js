import { MongoClient } from 'mongodb';
import fs from 'fs';

const uri = "mongodb+srv://sifcase_db_user:vszkb5iz9u8p81vd@cluster0.mmdo9jc.mongodb.net/test?retryWrites=true&w=majority";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const schemesColl = db.collection("sifschemes");
    const navsColl = db.collection("sifnavs");

    console.log("Connected. Calculating launch dates from NAVs...");

    // 1. Get the first NAV date for each scheme
    const pipeline = [
      { $sort: { navDate: 1 } },
      { $group: { _id: "$schemeCode", launchDate: { $first: "$navDate" } } },
      { $sort: { launchDate: 1 } }
    ];

    const launchData = await navsColl.aggregate(pipeline).toArray();
    
    if (launchData.length === 0) {
      console.log("No NAVs found.");
      return;
    }

    // 2. Select the oldest, and 3 more ~14 days apart
    const selectedSchemeCodes = [];
    const selectedLaunchDates = [];

    // First fund
    let currentFund = launchData[0];
    selectedSchemeCodes.push(currentFund._id);
    selectedLaunchDates.push(new Date(currentFund.launchDate));
    console.log(`Selected fund 1: ${currentFund._id} (Launched: ${currentFund.launchDate})`);

    let targetDate = new Date(currentFund.launchDate);

    for (let i = 0; i < 3; i++) {
      targetDate.setDate(targetDate.getDate() + 14);

      let bestCandidate = null;
      let minDiff = Infinity;

      for (const ld of launchData) {
        if (selectedSchemeCodes.includes(ld._id)) continue;
        
        const d = new Date(ld.launchDate);
        const diff = Math.abs(d.getTime() - targetDate.getTime());
        
        if (diff < minDiff) {
          minDiff = diff;
          bestCandidate = ld;
        }
      }

      if (bestCandidate) {
        selectedSchemeCodes.push(bestCandidate._id);
        const bestDate = new Date(bestCandidate.launchDate);
        selectedLaunchDates.push(bestDate);
        targetDate = new Date(bestDate);
        console.log(`Selected fund ${i+2}: ${bestCandidate._id} (Launched: ${bestCandidate.launchDate}, Diff: ${Math.round(minDiff / (1000 * 3600 * 24))} days from target)`);
      }
    }

    // 3. Fetch scheme names
    const schemes = await schemesColl.find({ schemeCode: { $in: selectedSchemeCodes } }).toArray();
    const schemeMap = {};
    for (const s of schemes) {
      schemeMap[s.schemeCode] = s.schemeName;
    }

    // 4. Fetch all NAVs for the selected 4 funds
    const navs = await navsColl.find({ schemeCode: { $in: selectedSchemeCodes } }).sort({ navDate: 1 }).toArray();

    // 5. Generate CSV
    const csvRows = [];
    csvRows.push(["Scheme Code", "Scheme Name", "Date", "NAV"].join(","));

    for (const nav of navs) {
      const name = schemeMap[nav.schemeCode] || "Unknown Scheme";
      const navDate = new Date(nav.navDate).toISOString().split('T')[0];
      const row = [
        nav.schemeCode,
        `"${name}"`,
        navDate,
        nav.nav
      ];
      csvRows.push(row.join(","));
    }

    const outputPath = "/Users/roshanajith/.gemini/antigravity-ide/brain/7ec2cdcc-f5e6-4b9a-90a3-73ced8462613/scratch/funds_nav_data.csv";
    fs.writeFileSync(outputPath, csvRows.join("\n"));
    console.log(`Exported data to ${outputPath}`);

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
