# Fund Details AI Analysis - Complete Flow Documentation

## Overview
The Fund Details AI Analysis system extracts structured data from factsheets, KIMs, PPTs, and Excel files to populate fund details records in the database.

---

## System Architecture

### 1. Data Model (`src/models/FundDetails.ts`)

**80+ Fields Organized in Categories:**

#### Core Fund Information
- `riskBand`: SEBI risk level (1-5)
- `schemeType`: Strategy type (e.g., "Hybrid Long-Short Fund")
- `exitLoad`: Exit load terms
- `aumCurrent`: Month-end AUM in ₹ Crore
- `aumAggregate`: Monthly Average AUM
- `minInvestment`: Initial minimum (usually ₹10,00,000)
- `additionalInvestment`: Top-up amount

#### Fund Managers
- Array of: `{ name, designation, experienceYears, managingSince }`

#### Benchmark
- `benchmarkName`: Full benchmark index name
- `benchmarkRiskBand`: Benchmark SEBI risk level (1-5)
- `benchmarkDetails`: Composition description

#### Portfolio Composition
- `assetAllocation[]`: `{ assetClass, percentage }` (totals only)
- `portfolioByIndustry[]`: `{ industry, percentage }`
- `portfolioByRatingClass[]`: `{ ratingClass, percentage }`
- `topHoldings[]`: `{ name, percentage, sector, rating }` (includes long equity, short futures, bonds, T-bills, cash)

#### Fund Structure (from KIM)
- `schemeCategory`: SEBI classification
- `schemeNature`: "Open Ended" or "Interval"
- `inceptionDate`: Launch date
- `planCodes[]`: `{ planName, isin }`

#### Redemption & Liquidity (from KIM)
- `redemptionFrequency`: When redemptions are processed
- `navCutoffTime`: Cut-off time for redemption requests
- `redemptionPayoutDays`: Days to settle redemptions
- `redemptionNoticePeriod`: Advance notice required
- `penalInterestRate`: Penalty for delayed payouts

#### Investment Limits (from KIM)
- `panInvestmentThreshold`: Min at PAN level
- `accreditedInvestorMinInvestment`: Min for accredited investors
- `sipDetails[]`: `{ frequency, minAmount, minInstallments }`

#### Expenses & Taxation (from KIM)
- `terMax`: Maximum TER percentage
- `terSlabs[]`: `{ aumSlab, ter }` (TER by AUM slab)
- `taxationSummary`: Tax treatment description

#### Strategy Details (from PPT)
- `derivativeStrategies[]`: `{ name, description }`
- `alphaGenerationApproach`: How fund generates alpha
- `assetAllocationRanges[]`: `{ assetClass, min, max }` (permitted ranges)
- `grossExposureLimit`: Max exposure including derivatives
- `derivativesRestrictions`: Caps and restrictions

#### Fund Administration (from KIM)
- `sponsorName`, `amcName`, `trusteeName`, `registrarName`

#### Investor Suitability (AI-inferred)
- `suitableFor`: Target investor profile
- `notSuitableFor`: Who should avoid
- `bullMarket`, `bearMarket`, `sidewaysMarket`: Performance in different markets
- `howItWorks`: Strategy explanation
- `mfEquivalent`: Comparable mutual fund category
- `portfolioFit`: Where it fits in a portfolio

#### Document Attachments
- `factsheets[]`: `{ url, filename, documentType, uploadedAt }`

---

## User Flow

### Step 1: Select Fund
1. Admin opens `/admin/fund-details`
2. Dropdown shows all fund houses (from `sifschemes` collection)
3. Select fund house → Filters funds to that AMC
4. Select specific fund → Loads existing data if any

### Step 2: Upload Documents
1. Click "Upload PDF/Excel"
2. Choose file (factsheet, KIM, Excel, PPT)
3. File uploaded to Cloudinary via `/api/admin/fund-details/upload-pdf`
4. URL added to `factsheets[]` array
5. **Set Document Type** for each file:
   - **Factsheet** (primary source for portfolio, AUM, managers)
   - **KIM** (Key Information Memorandum - regulatory details)
   - **Excel** / **XLS - Summary Document** (SIP details)
   - **PPT** (strategy narrative)

### Step 3: AI Analysis
1. Click "Analyse Factsheet" button
2. **AI Provider Selection:**
   - Uses centrally-configured provider from Admin → AI Settings if available
   - Otherwise, manually select: DeepSeek / Gemini / OpenRouter
   - Enter API key (stored in browser localStorage)
   - Select model

3. **API Call:** `POST /api/admin/fund-details/analyse`
   - Sends array of `{ url, documentType }` for each uploaded file
   - Sends provider, model, apiKey (if manual override)

---

## AI Processing Pipeline

### Provider: **Gemini** (Recommended - Native PDF Support)

**Multi-File Processing with Document-Type-Specific Schemas:**

#### Document 1: Factsheet
- **Schema**: `FactsheetExtractionSchema` (50+ fields)
- **Method**: `generateObject()` with native PDF file input
- **Extracts**:
  - Risk bands (fund + benchmark) from riskometer dials
  - AUM, exit load, scheme type
  - Fund managers with experience
  - Asset allocation TOTALS (not individual stocks)
  - Portfolio by industry
  - Portfolio by rating class
  - **Top Holdings (EXHAUSTIVE)**:
    - Long equity positions (positive %)
    - Short equity futures (negative %)
    - Index futures/options
    - Corporate bonds with ratings
    - Treasury bills (Sovereign)
    - Government securities
    - Cash equivalents
  - Plan codes with ISINs
  - Investor suitability (AI-inferred from strategy)
  - Market scenario performance (bull/bear/sideways)
  - How it works explanation
  - MF equivalent category
  - Portfolio fit description

#### Document 2: KIM (Key Information Memorandum)
- **Schema**: `KimExtractionSchema` (20+ fields)
- **Method**: `generateObject()` with native PDF input
- **Extracts**:
  - Scheme category, nature, inception date
  - Redemption frequency, cut-off time, payout days
  - Notice period, penal interest rate
  - PAN threshold, accredited investor minimums
  - TER max and slabs
  - Taxation summary
  - Asset allocation permitted ranges (min/max %)
  - Gross exposure limit
  - Derivatives restrictions
  - Sponsor, AMC, trustee, registrar names

#### Document 3: PPT (Presentation)
- **Schema**: `PptExtractionSchema` (2 fields)
- **Method**: `generateObject()` with native PDF input
- **Extracts**:
  - Derivative strategies array (name + description)
  - Alpha generation approach

#### Document 4: Excel / XLS Summary Document
- **Schema**: `ExcelExtractionSchema` (1 field)
- **Method**: Extract to tab-separated text → `generateObject()` with text input
- **Extracts**:
  - **SIP Details** (complex parsing):
    - Parses "SIP-- Monthly/Monthly/Quarterly/..." frequency list
    - Parses "SIP-- 1000.00/1000.00/1000.00/..." amount list  
    - Parses "SIP-- 12/6/6/4/..." installments list
    - Zips them by position into separate rows
    - Example: 6 frequencies → 6 separate SIP option rows

**Merging Logic:**
- Each file extraction returns partial data
- Results merged with `mergeResults()`:
  - Non-null values overwrite null
  - Non-empty strings overwrite empty
  - Non-empty arrays overwrite empty
  - Preserves best data from each source

---

### Provider: **DeepSeek / OpenRouter** (Text-Based Fallback)

**Single Combined Text Extraction:**

#### Step 1: PDF → Text Conversion
Uses `pdf2json` library with custom structured extraction:

1. **Metadata Section** (left column, x < 17):
   - NAV, AUM, scheme type, exit load
   - Fund manager names
   - Benchmark details

2. **Risk Levels Section**:
   - Extracts "RISK-LEVEL X" or "Risk Level X" text
   - Left dial = Fund risk
   - Right dial = Benchmark risk

3. **Holdings Table** (right side, x >= 12):
   - **Long Equity** (x: 12-19):
     - Name column (x: 12.4-13.6)
     - Industry column (x: 17-19.5)
     - Percentage column (x: 21.5-23.5, positive %)
     - Groups items by Y-coordinate proximity
     - Creates equity→sector mapping
   
   - **Short Futures** (x: 22-23):
     - Above "Equity Futures Total" line
     - Name with expiry date (strips date)
     - Negative percentage
   
   - **Bonds & T-Bills** (x > 23):
     - Below "Equity Futures Total" line
     - Name, rating, percentage columns
     - Separates by Y-coordinate ranges

4. **Industry Allocation Table** (y: 31-41):
   - Names (x: 12.5-13.5)
   - Percentages (x: 22.0-22.5)
   - Directly populates `portfolioByIndustry[]`

5. **Rating Class Table** (y: 38-41):
   - Names (x: 28-30)
   - Percentages (x: 29-30.5)
   - Directly populates `portfolioByRatingClass[]`

#### Step 2: Excel → Text Conversion
Uses `xlsx` library:
- Reads all sheets
- Converts to tab-separated text
- Joins with sheet headers

#### Step 3: AI Extraction
- Combines all text (max 30,000-60,000 chars)
- Sends to DeepSeek/OpenRouter API
- **Prompt**: `EXTRACTION_PROMPT` (detailed field rules)
- **Response format**: JSON object
- Returns all fields in single response

#### Step 4: Post-Extraction Enhancement
- Restores sector names from direct PDF parse for equity holdings
- Restores full bond names from direct PDF parse
- Matches by percentage proximity

---

## Post-Processing (`postProcess()`)

Applied to AI output before returning to frontend:

1. **Risk Band Normalization**:
   - Converts "Risk Level 3" → 3
   - Converts "Moderate Risk" → 3
   - Rounds decimals to integers

2. **Fund Manager Defaults**:
   - Sets null designations to "Fund Manager"

3. **Additional Investment Cleanup**:
   - Removes `additionalInvestment = 1` (meaningless "Re 1/-")

4. **Asset Allocation Null Handling**:
   - If one category has null %
   - Computes as `100 - sum(known categories)`

5. **Top Holdings Enhancement**:
   - Moves credit ratings from sector to rating field
   - Infers sector from name if rating was in sector
   - Treasury bills → "Treasury Bill" sector
   - G-Secs → "Government Securities" sector
   - Bonds → "Corporate Bond" sector
   - Filters out zero-percentage holdings
   - Injects "Net Cash" from asset allocation if missing

6. **Sector Assignment**:
   - Uses direct PDF parse equity→sector map (DeepSeek/OpenRouter only)
   - Matches bond names from direct parse

---

## Field Mapping by Document Type

| Field | Factsheet | KIM | PPT | Excel | AI-Inferred |
|-------|-----------|-----|-----|-------|-------------|
| `riskBand` | ✅ | | | | |
| `benchmarkRiskBand` | ✅ | | | | |
| `schemeType` | ✅ | | | | |
| `exitLoad` | ✅ | | | | |
| `aumCurrent` | ✅ | | | | |
| `minInvestment` | ✅ | | | | |
| `fundManagers` | ✅ | | | | |
| `benchmarkName` | ✅ | | | | |
| `assetAllocation` | ✅ | | | | |
| `portfolioByIndustry` | ✅ | | | | |
| `portfolioByRatingClass` | ✅ | | | | |
| `topHoldings` | ✅ | | | | |
| `planCodes` | ✅ | | | | |
| `schemeCategory` | | ✅ | | | |
| `schemeNature` | | ✅ | | | |
| `inceptionDate` | | ✅ | | | |
| `redemptionFrequency` | | ✅ | | | |
| `navCutoffTime` | | ✅ | | | |
| `redemptionPayoutDays` | | ✅ | | | |
| `redemptionNoticePeriod` | | ✅ | | | |
| `penalInterestRate` | | ✅ | | | |
| `panInvestmentThreshold` | | ✅ | | | |
| `accreditedInvestorMinInvestment` | | ✅ | | | |
| `terMax` | | ✅ | | | |
| `terSlabs` | | ✅ | | | |
| `taxationSummary` | | ✅ | | | |
| `assetAllocationRanges` | | ✅ | | | |
| `grossExposureLimit` | | ✅ | | | |
| `derivativesRestrictions` | | ✅ | | | |
| `sponsorName` | | ✅ | | | |
| `amcName` | | ✅ | | | |
| `trusteeName` | | ✅ | | | |
| `registrarName` | | ✅ | | | |
| `derivativeStrategies` | | | ✅ | | |
| `alphaGenerationApproach` | | | ✅ | | |
| `sipDetails` | | | | ✅ | |
| `suitableFor` | | | | | ✅ |
| `notSuitableFor` | | | | | ✅ |
| `bullMarket` | | | | | ✅ |
| `bearMarket` | | | | | ✅ |
| `sidewaysMarket` | | | | | ✅ |
| `howItWorks` | | | | | ✅ |
| `mfEquivalent` | | | | | ✅ |
| `portfolioFit` | | | | | ✅ |

---

## Frontend UX

### Step 4: Review AI Results

After analysis completes, UI shows AI-extracted values as **blue badges** below each field:

```
┌─ Risk Band ────────────────┐
│ [  3  ] (current value)    │
│                            │
│ ┌────────────────────────┐│
│ │ 🪄 AI: 4     [✓ Apply]││ ← AI-extracted value
│ └────────────────────────┘│
└────────────────────────────┘
```

- **Individual Apply**: Click `✓ Apply` on any field badge
- **Apply All**: Click "Apply All" button at top

### Step 5: Manual Edits

- Review AI-populated fields
- Edit any incorrect values
- Add/remove array items (managers, holdings, etc.)
- Fill missing fields manually

### Step 6: Save

- Click "Save" button
- Sends to `/api/admin/fund-details/save`
- Converts strings to numbers
- Filters out empty array items
- Upserts to MongoDB `funddetails` collection

---

## Key Technical Details

### Document Type Importance
**Critical**: Setting the document type determines which extraction schema is used (Gemini only)
- Factsheet without type → Uses Factsheet schema (default)
- KIM without type → Misses redemption/tax fields
- Excel without type → Uses Factsheet schema, misses SIP details

### Top Holdings Exhaustiveness
- Factsheet has 50+ holdings → Should extract 50+ rows
- Includes long, short, bonds, T-bills, cash
- Short futures have negative percentages
- Same company can appear twice (long equity + short future)

### Risk Band Extraction
- **Must** read from PDF riskometer dials
- **Never** infer from strategy name or Excel data
- Left dial = Fund risk, Right dial = Benchmark risk
- Values: 1=Low, 2=Low to Moderate, 3=Moderate, 4=Moderately High, 5=High

### SIP Details Parsing (Excel)
- Complex: Multiple frequencies with different installment counts
- Example: "Monthly" appears twice with 12 and 6 installments
- Creates separate rows, not collapsed
- Only parses "SIP--" section, ignores "STP--"

---

## API Endpoints

### GET `/api/admin/fund-details?list=1`
Returns: `{ fundNames[], brandNames[] }`

### GET `/api/admin/fund-details?list=1&brand=ABC`
Returns: `{ fundNames[] }` filtered by brand

### GET `/api/admin/fund-details?fundName=ABC%20Fund`
Returns: `{ detail: { ...all 80+ fields } }`

### POST `/api/admin/fund-details/upload-pdf`
Body: FormData with `file`
Returns: `{ url, filename }`
Uploads to Cloudinary, returns CDN URL

### GET `/api/admin/fund-details/analyse`
Returns: `{ config: { label, provider, modelName } | null }`
Gets centrally-configured AI provider from Admin → AI Settings

### POST `/api/admin/fund-details/analyse`
Body:
```json
{
  "files": [
    { "url": "https://...", "documentType": "Factsheet" },
    { "url": "https://...", "documentType": "KIM" }
  ],
  "provider": "gemini",  // optional override
  "model": "gemini-2.5-flash",
  "apiKey": "..."
}
```
Returns:
```json
{
  "extracted": { ...80+ fields },
  "warnings": ["file 1: parse error", ...]  // optional
}
```

### POST `/api/admin/fund-details/save`
Body: All 80+ fields
Returns: `{ ok: true }`
Upserts to MongoDB

---

## Provider Comparison

| Feature | Gemini | DeepSeek/OpenRouter |
|---------|--------|---------------------|
| **PDF Support** | Native | Text extraction |
| **Multi-file** | Yes, merged | Single text blob |
| **Document-specific schemas** | Yes | No |
| **Accuracy** | Higher | Good |
| **Holdings exhaustiveness** | Excellent | Requires PDF parse enhancement |
| **Risk band extraction** | From visual dials | From text patterns |
| **KIM fields** | Separate schema | Same prompt |
| **Cost** | Low (Flash model) | Variable |

**Recommendation**: Use Gemini for production

---

## Common Issues & Solutions

### Issue: Risk band always null
**Cause**: Document type not set to "Factsheet", or PDF doesn't have riskometer
**Solution**: Set document type, use Gemini provider

### Issue: Missing bond names (generic "Corporate Bond Total")
**Cause**: AI couldn't parse bond table text
**Solution**: DeepSeek/OpenRouter uses direct PDF coordinate extraction to restore names

### Issue: Holdings incomplete (10 instead of 50)
**Cause**: AI stopped early or summarized
**Solution**: Gemini prompt emphasizes "EXHAUSTIVE - extract EVERY row"

### Issue: SIP details not extracted
**Cause**: Excel file not marked as "Excel" document type
**Solution**: Set document type to "Excel" or "XLS - Summary Document"

### Issue: Redemption fields empty
**Cause**: KIM document not marked as "KIM" type
**Solution**: Upload KIM and set document type

---

## Summary

1. **Upload** factsheet, KIM, PPT, Excel files
2. **Set document types** for each file
3. **Click "Analyse"** with Gemini (or DeepSeek/OpenRouter)
4. **Review** AI-extracted values in blue badges
5. **Apply** individual fields or all at once
6. **Edit** manually as needed
7. **Save** to database

**Result**: 80+ fields populated from 1-4 documents in ~10 seconds
