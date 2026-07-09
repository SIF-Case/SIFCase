# May 2026 SIF Report Data - Generated Summary

## ✅ Files Generated

1. **`may_2026_report_data.json`** - Complete structured data in JSON format
2. **`may_2026_report_data.csv`** - CSV format for easy manual data entry into Word/PDF

## 📊 Data Overview

- **Report Month**: May 2026
- **Report Cutoff Date**: May 31, 2026 23:59:59 UTC
- **Total Schemes**: 22 active Direct Plan Growth schemes
- **Data Source**: Your MongoDB database (sifcase collection)
- **Calculation Logic**: Exact match with `src/lib/sifData.ts`

## 🎯 Return Calculation Logic (Matches Your Codebase)

The script uses the **exact same logic** as your production code in `src/lib/sifData.ts`:

### Return Period Requirements:
- **1M Return**: Requires ≥20 NAV records
- **3M Return**: Requires ≥60 NAV records  
- **6M Return**: Requires ≥120 NAV records
- **1Y Return**: Requires ≥240 NAV records
- **SI Return**: Since Inception (annualized if >1 year, absolute otherwise)

### Key Features:
- Uses `lastIdxOnOrBefore()` to handle weekend/holiday gaps correctly
- Uses `subMonths()` with month-end clamping (May 31 - 1 month = April 30)
- Computes `annualizedReturn()` for SI (CAGR if >1 year)
- All NAVs filtered to ≤ May 31, 2026

## 📋 Current Data Status

### Why Returns Show "N/A":
All schemes currently show N/A for 1M/3M/6M/1Y returns because:
- Most schemes only have **3-4 NAV records** in the database (launched in May 2026)
- Need minimum **20 records for 1M**, **60 for 3M**, etc.
- These will populate automatically as more NAVs are added over time

### SI (Since Inception) Returns:
All schemes show SI returns because:
- They were all launched in May 2026
- SI return compares latest NAV vs first NAV
- Range: **+0.36%** (best) to **-1.23%** (worst)

## 🏆 Top Performers (by SI Return)

1. **qsif Equity Ex-Top 100 Long-Short Fund** - +0.36%
2. **qsif Sector Rotation Long-Short Fund** - +0.30%
3. **DynaSIF Equity Long - Short Fund** - +0.24%

## 📉 Bottom Performers (by SI Return)

1. **Diviniti Equity Long Short Fund** - -1.23%
2. **Sapphire Equity Long-Short SIF** - -1.15%
3. **iSIF Equity Ex-Top 100 Long-Short Fund** - -1.00%

## 📝 How to Use This Data

### For Section 07 (Comprehensive Performance Table):

1. Open the **`may_2026_report_data.csv`** file in Excel
2. Copy the data rows (skip header)
3. Paste into the Word document table in **Section 07**
4. Format as needed

### Data Fields Available:
- Scheme Name (cleaned, no plan/option suffixes)
- Category (Equity L-S, Ex-100 L-S, Sector R L-S, Hybrid L-S)
- AMC (Company Name)
- 1M %, 3M %, 6M %, 1Y % (all currently N/A)
- SI % (Since Inception return)
- Since (Launch date formatted as "May '26")
- Latest NAV Date
- Record Count (number of NAV entries)

## 🔄 When to Regenerate

Run the script again when:
- New NAVs are added to the database
- You need updated returns for a different month
- You want to include more schemes

## 💻 Command to Run Script

```bash
node scripts/export_may_report.js
```

## 📦 Script Features

✅ Matches exact calculation logic from `src/lib/sifData.ts`  
✅ Filters NAVs to report cutoff date (May 31, 2026)  
✅ Handles weekend/holiday gaps correctly  
✅ Cleans scheme names (removes plan/option suffixes)  
✅ Sorts by SI return (descending)  
✅ Shows record count for troubleshooting  
✅ Exports both JSON and CSV formats  

## 🎨 PDF Population

Use the CSV data to manually populate these sections in your Word document:

- **Section 03**: Equity Oriented Strategies performance tables
- **Section 04**: Debt Oriented Strategies (when available)
- **Section 05**: Hybrid Oriented Strategies performance tables
- **Section 06**: Monthly Performance Highlights (top/bottom 3)
- **Section 07**: Comprehensive Performance Table (all schemes)

---

**Generated**: July 9, 2026  
**Script**: `scripts/export_may_report.js`  
**Logic Source**: `src/lib/sifData.ts`
