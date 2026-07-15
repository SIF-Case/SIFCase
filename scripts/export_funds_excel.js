import { MongoClient } from 'mongodb';
import fs from 'fs';
import * as xlsx from 'xlsx';

const uri = "mongodb+srv://sifcase_db_user:vszkb5iz9u8p81vd@cluster0.mmdo9jc.mongodb.net/test?retryWrites=true&w=majority";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const schemesColl = db.collection("sifschemes");
    const navsColl = db.collection("sifnavs");

    console.log("Connected. Calculating launch dates from NAVs...");

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

    const selectedSchemeCodes = [];
    const selectedLaunchDates = [];

    // First fund
    let currentFund = launchData[0];
    selectedSchemeCodes.push(currentFund._id);
    selectedLaunchDates.push(new Date(currentFund.launchDate));
    
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
      }
    }

    // Fetch scheme names
    const schemes = await schemesColl.find({ schemeCode: { $in: selectedSchemeCodes } }).toArray();
    const schemeMap = {};
    for (const s of schemes) {
      schemeMap[s.schemeCode] = s.schemeName;
    }

    // Create a new Excel workbook
    const workbook = xlsx.utils.book_new();

    // Fetch all NAVs for the selected 4 funds and create sheets
    for (const code of selectedSchemeCodes) {
        const navs = await navsColl.find({ schemeCode: code }).sort({ navDate: 1 }).toArray();
        const sheetName = (schemeMap[code] || code).replace(/[\\/?*\[\]]/g, "").substring(0, 31); // Max 31 chars for sheet name

        const rows = [];
        let srNo = 1;
        for (const nav of navs) {
            rows.push({
                "Sr no": srNo++,
                "Date": new Date(nav.navDate).toISOString().split('T')[0],
                "Nav Record": nav.nav
            });
        }

        const worksheet = xlsx.utils.json_to_sheet(rows);
        xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    const outputPath = "/Users/roshanajith/.gemini/antigravity-ide/brain/7ec2cdcc-f5e6-4b9a-90a3-73ced8462613/scratch/funds_nav_data.xlsx";
    xlsx.writeFile(workbook, outputPath);
    console.log(`Exported data to ${outputPath}`);

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
