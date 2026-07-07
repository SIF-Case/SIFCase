# Risk Band Extraction & Leaderboard Display Plan

## Current Status ✅

The riskometer (risk band) functionality is **already implemented** in the codebase:

### 1. Data Model (src/lib/sifData.ts)
- `FundRow` interface includes `riskBand: 1 | 2 | 3 | 4 | 5 | null`
- Data is fetched from MongoDB `funddetails` collection
- Normalization function handles both string and numeric formats:
  - String: "Low Risk", "Low to Moderate Risk", "Moderate Risk", "Moderately High Risk", "High Risk"
  - Numeric: 1-5
  - Maps to standardized 1-5 scale

### 2. Leaderboard Display (src/components/sections/TopFunds.tsx)
- Line 264: `{fund.riskBand != null && <SEBIRiskometer level={fund.riskBand} size="xs" />}`
- Risk meter displays below the sparkline chart in each fund card
- Uses `SEBIRiskometer` component for visual representation

### 3. Hero Heatmap (src/components/sections/HeroHeatmap.tsx)
- Lines 106-108: Generates risk bars for top performer card
- Shows 5-bar visual indicator based on risk band level

## Document Fields Mapping

Based on your example XLS (SSD-S-3.xls), field #5 contains:

```
Field 5: Riskometer (as on Date) → Risk Band Level 1
```

This maps to:
- **Database field**: `funddetails.riskBand`
- **Possible values**: 1, 2, 3, 4, or 5
- **Display name**: "Risk Band Level X" where X is the numeric value

## Data Flow

```
PDF/XLS Document (Field #5)
    ↓
MongoDB funddetails.riskBand
    ↓
_getTopFunds() fetches & normalizes
    ↓
FundRow.riskBand (1-5)
    ↓
TopFunds component → SEBIRiskometer display
```

## What You Need To Do

### If riskBand data is missing from funddetails collection:

1. **Extract from PDF/XLS documents**:
   - Parse field #5 "Riskometer (as on Date)"
   - Extract the numeric value (1-5) or text description
   - Store in `funddetails.riskBand` field

2. **Update existing scripts** (if they exist):
   - Check `.agent/scripts/` for any document parsing scripts
   - Add field #5 extraction logic
   - Map fund name to match records in database

3. **Import script template**:
```javascript
// Example extraction from XLS/PDF
const riskBandMap = {
  "Risk Band Level 1": 1,
  "Risk Band Level 2": 2,
  "Risk Band Level 3": 3,
  "Risk Band Level 4": 4,
  "Risk Band Level 5": 5,
  "Low Risk": 1,
  "Low to Moderate Risk": 2,
  "Moderate Risk": 3,
  "Moderately High Risk": 4,
  "High Risk": 5
};

// Parse document field #5
const riskBandText = extractField(document, 5);
const riskBandValue = riskBandMap[riskBandText] || parseInt(riskBandText);

// Update MongoDB
await db.collection('funddetails').updateOne(
  { fundName: fundNameFromDocument },
  { $set: { riskBand: riskBandValue } },
  { upsert: true }
);
```

### If riskBand is already in database:
✅ **Nothing to do!** The leaderboard already displays it automatically.

## Verification Checklist

- [ ] Check if `funddetails` collection has `riskBand` field populated
- [ ] Verify risk meter appears in leaderboard fund cards
- [ ] Test that all 5 risk levels display correctly
- [ ] Ensure hero heatmap shows risk bars for top performer
- [ ] Validate data matches source documents (Field #5)

## UI Components

### SEBIRiskometer Component
Location: `src/components/ui/RiskMeter.tsx` (assumed)
- Displays visual risk meter
- Size variants: "xs", "sm", "md", "lg"
- Color-coded by risk level

### Display Locations
1. **Leaderboard cards** (TopFunds.tsx) - below sparkline
2. **Hero heatmap** (HeroHeatmap.tsx) - 5-bar indicator
3. **Fund detail page** - likely shows full risk meter

## Next Steps

1. **Check database**: Query MongoDB to see if riskBand exists
   ```javascript
   db.funddetails.find({ riskBand: { $exists: true } }).limit(5)
   ```

2. **If missing**: Create/update document parser to extract Field #5

3. **If present**: Verify leaderboard displays correctly

4. **Optional enhancements**:
   - Add risk band filter to leaderboard
   - Show risk level in fund comparison
   - Add risk band to search/filter criteria
