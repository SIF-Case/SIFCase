# Risk Band & Exit Load Extraction Update

## Summary
Updated the fund details extraction logic to extract **Risk Band** and **Exit Load** from the **XLS Summary Document** instead of the factsheet PDF, while keeping all other extraction logic intact.

## Changes Made

### 1. Schema Updates

#### `FactsheetExtractionSchema` (src/app/api/admin/fund-details/analyse/route.ts)
**REMOVED:**
- `riskBand` field
- `exitLoad` field

These fields are no longer extracted from the factsheet PDF.

#### `ExcelExtractionSchema` (src/app/api/admin/fund-details/analyse/route.ts)
**ADDED:**
- `riskBand`: Extracted from "Riskometer (as on Date)" row in XLS Summary
- `exitLoad`: Extracted from "Exit Load (if applicable)" row in XLS Summary

### 2. Prompt Updates

#### `FACTSHEET_PROMPT`
**REMOVED:**
- Instructions for extracting `riskBand` from PDF riskometer
- Instructions for extracting `benchmarkRiskBand` from PDF (kept in schema but removed from scalar fields section)
- Instructions for extracting `exitLoad` from PDF

#### `EXCEL_PROMPT`
**ADDED:**
- **RISK BAND section**: Instructions to extract risk band from "Riskometer (as on Date)" row
  - Looks for "Risk Level 1" through "Risk Level 5" text
  - Maps to integer values 1-5
  - Returns null if not found

- **EXIT LOAD section**: Instructions to extract exit load from "Exit Load (if applicable)" row
  - Extracts exact value text (e.g., "Nil", "1% if redeemed within 30 days")
  - Returns null if not found

#### `EXTRACTION_PROMPT` (Legacy DeepSeek/OpenRouter)
**REMOVED:**
- `riskBand` field extraction instructions
- `exitLoad` field extraction instructions
- Updated JSON schema to remove these fields

### 3. Data Source Mapping

| Field | Previous Source | New Source |
|-------|----------------|------------|
| Risk Band | Factsheet PDF (riskometer dial) | XLS Summary Document ("Riskometer (as on Date)" row) |
| Exit Load | Factsheet PDF ("Exit Load" label) | XLS Summary Document ("Exit Load (if applicable)" row) |

### 4. Extraction Flow (Unchanged)

The extraction logic flow remains the same:
1. Multiple documents can be uploaded (Factsheet, KIM, PPT, XLS Summary)
2. Each document is processed with its specific schema
3. Results are merged using `mergeResults()` function
4. Post-processing normalizes the data
5. All other fields continue to be extracted from their original sources

### 5. Risk Band Normalization (Intact)

The existing risk band normalization logic in `postProcess()` remains unchanged:
- Converts text like "Risk Level 1", "Low Risk" to integer 1-5
- Uses the `RISK_MAP` constant for mapping
- Applied after extraction, so works with XLS-sourced data

### 6. No Breaking Changes

✅ All other extraction logic remains intact