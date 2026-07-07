/**
 * Extract Riskometer (Risk Band) from XLS/XLSX Scheme Summary Documents
 * 
 * This script:
 * 1. Reads XLS/XLSX files containing Scheme Summary Documents
 * 2. Extracts Field #5: "Riskometer (as on Date)"
 * 3. Updates funddetails collection with riskBand values (1-5)
 * 
 * Usage:
 *   node scripts/extract_riskometer.js <path-to-xls-folder>
 *   node scripts/extract_riskometer.js SSD-files/
 */

const XLSX = require('xlsx');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sifcase';

// Risk band mapping - handles various text formats
const RISK_BAND_MAP = {
  'Risk Band Level 1': 1,
  'Risk Band Level 2': 2,
  'Risk Band Level 3': 3,
  'Risk Band Level 4': 4,
  'Risk Band Level 5': 5,
  'Low Risk': 1,
  'Low to Moderate Risk': 2,
  'Moderate Risk': 3,
  'Moderately High Risk': 4,
  'High Risk': 5,
};

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Extract fund name and riskometer from XLS file
 * Expected format: Field/Value pairs in columns A and B
 * Field 1: Fund Name
 * Field 5: Riskometer (as on Date)
 */
function extractFromXLS(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    let fundName = null;
    let riskBand = null;
    
    // Look for field numbers and their values
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fieldLabel = String(row[0] || '').trim();
      const fieldValue = String(row[1] || '').trim();
      
      // Field 1: Fund Name
      if (fieldLabel === '1' || fieldLabel.toLowerCase().includes('fund name')) {
        fundName = fieldValue;
      }
      
      // Field 5: Riskometer (as on Date)
      if (fieldLabel === '5' || fieldLabel.toLowerCase().includes('riskometer') && fieldLabel.toLowerCase().includes('as on')) {
        // Try to extract numeric value or map from text
        const numericMatch = fieldValue.match(/(\d)/);
        if (numericMatch) {
          riskBand = parseInt(numericMatch[1]);
        } else if (RISK_BAND_MAP[fieldValue]) {
          riskBand = RISK_BAND_MAP[fieldValue];
        }
      }
    }
    
    // Clean fund name
    if (fundName) {
      fundName = fundName
        .replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, '')
        .replace(/\s*-\s*Growth.*/i, '')
        .replace(/\s*-\s*IDCW.*/i, '')
        .trim();
    }
    
    return { fundName, riskBand, fileName: path.basename(filePath) };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return { fundName: null, riskBand: null, fileName: path.basename(filePath) };
  }
}

/**
 * Process all XLS files in a directory
 */
async function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`✗ Directory not found: ${dirPath}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(dirPath)
    .filter(f => f.match(/\.(xlsx?|xls)$/i))
    .map(f => path.join(dirPath, f));
  
  if (files.length === 0) {
    console.log('✗ No XLS/XLSX files found in directory');
    process.exit(1);
  }
  
  console.log(`Found ${files.length} XLS/XLSX files\n`);
  
  const results = [];
  
  for (const file of files) {
    const data = extractFromXLS(file);
    if (data.fundName && data.riskBand) {
      results.push(data);
      console.log(`✓ ${data.fileName}`);
      console.log(`  Fund: ${data.fundName}`);
      console.log(`  Risk Band: ${data.riskBand}`);
    } else {
      console.log(`⚠ ${data.fileName} - Missing data (fundName: ${!!data.fundName}, riskBand: ${!!data.riskBand})`);
    }
  }
  
  return results;
}

/**
 * Update MongoDB with extracted risk bands
 */
async function updateDatabase(results) {
  const db = mongoose.connection.db;
  const fundDetails = db.collection('funddetails');
  
  let updated = 0;
  let notFound = 0;
  let failed = 0;
  
  console.log(`\nUpdating database...`);
  
  for (const { fundName, riskBand, fileName } of results) {
    try {
      // Try exact match first
      let result = await fundDetails.updateOne(
        { fundName: fundName },
        { $set: { riskBand: riskBand } }
      );
      
      // If not found, try case-insensitive regex match
      if (result.matchedCount === 0) {
        const regex = new RegExp(`^${fundName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        result = await fundDetails.updateOne(
          { fundName: regex },
          { $set: { riskBand: riskBand } }
        );
      }
      
      if (result.matchedCount > 0) {
        updated++;
        console.log(`  ✓ Updated: ${fundName} → Risk Band ${riskBand}`);
      } else {
        notFound++;
        console.log(`  ⚠ Not found in DB: ${fundName} (from ${fileName})`);
      }
    } catch (error) {
      failed++;
      console.error(`  ✗ Error updating ${fundName}:`, error.message);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total processed: ${results.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Failed: ${failed}`);
}

/**
 * Main execution
 */
async function main() {
  const dirPath = process.argv[2];
  
  if (!dirPath) {
    console.log('Usage: node scripts/extract_riskometer.js <path-to-xls-folder>');
    console.log('Example: node scripts/extract_riskometer.js ./SSD-files/');
    process.exit(1);
  }
  
  console.log('=== Riskometer Extraction Tool ===\n');
  
  // Extract from XLS files
  const results = await processDirectory(dirPath);
  
  if (results.length === 0) {
    console.log('✗ No valid data extracted from XLS files');
    process.exit(1);
  }
  
  // Connect to MongoDB and update
  await connectDB();
  await updateDatabase(results);
  
  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
