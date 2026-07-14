# June 2026 Report Setup Guide

## Overview
This guide walks you through switching from May 2026 to June 2026 monthly performance report.

## Changes Already Made ✅

1. **PDF uploaded**: `public/reports/SIF-Monthly-Report-June2026.pdf`
2. **Download route updated**: `src/app/api/reports/[slug]/download/route.ts` now handles `june-2026` slug

## Simple Switch (Recommended) - Just Update Existing Entry

### Step 1: Update Database Entry

Run the simple update script:

```bash
node scripts/update_to_june_report.js
```

This will:
- Find the existing May 2026 report
- Update it to June 2026 (change monthKey, slug, label)
- No new entries created - just updates the existing one

**What happens:**
The existing report entry is updated in-place. Since there's only one published report, it will always show on the homepage.

### Step 2: Verify PDF File Exists

Check that the PDF is in place:

```bash
ls -lh public/reports/SIF-Monthly-Report-June2026.pdf
```

If missing, place your PDF at: `public/reports/SIF-Monthly-Report-June2026.pdf`

### Step 3: Clear Next.js Cache

For development:
```bash
# Stop and restart your dev server
# Ctrl+C, then:
npm run dev
```

For production:
```bash
npm run build
```

### Step 4: Test the Changes

1. **Homepage Banner**: Visit `/` and verify it shows "MONTHLY REPORT · June 2026"
2. **Download Button**: Click "Download PDF" - should download `SIF-Monthly-Report-June2026.pdf`
3. **Report Page**: Visit `/performance/june-2026` (if you have a report detail page)

## How It Works

### Database Query
```typescript
// src/lib/sifData.ts line ~1229
const report = await PerformanceReport.findOne({ published: true })
  .sort({ monthKey: -1 })  // ← Descending = latest first
  .lean();
```

With the update:
- Before: `monthKey: "2026-05"`, `slug: "may-2026"`, `label: "May 2026"`
- After: `monthKey: "2026-06"`, `slug: "june-2026"`, `label: "June 2026"`

### Download Route Logic
```typescript
// src/app/api/reports/[slug]/download/route.ts
if (slug === "june-2026") {
  const filePath = path.join(process.cwd(), "public", "reports", "SIF-Monthly-Report-June2026.pdf");
  // Serve the file directly from filesystem
}
```

## Alternative: Keep Both Reports (Optional)

If you want to keep BOTH May and June reports accessible:

1. Run `node scripts/create_june_report_db.js` instead
2. This creates a NEW entry for June 2026
3. Both reports will exist in database
4. The latest (June) will show on homepage
5. May will still be accessible at `/performance/may-2026`

## Optional: Generate June Report Data (For Future Use)

If you want to create a JSON data file with scheme-by-scheme performance for June:

```bash
npx tsx scripts/generate_june_2026_report_data.ts
```

This creates `june_2026_report_data.json` with:
- All Direct Growth schemes
- Returns for 1M, 3M, 6M, 1Y, SI
- Ranked by 1-month performance

**Note**: This is optional - only needed if you're building a detailed report analysis page like `/performance/june-2026/page.tsx`.

## Troubleshooting

### Issue: Still showing "May 2026" on homepage

**Cause**: Next.js cache hasn't been cleared

**Fix**:
```bash
# Development
rm -rf .next
npm run dev

# Production
npm run build
```

### Issue: Download returns 404

**Check**:
1. PDF file exists at correct path: `public/reports/SIF-Monthly-Report-June2026.pdf`
2. File name matches exactly (case-sensitive)
3. Route slug matches: `/api/reports/june-2026/download`

**Debug**:
```bash
# Check file exists
ls -l public/reports/SIF-Monthly-Report-June2026.pdf

# Check Next.js can access public folder
curl http://localhost:3000/reports/SIF-Monthly-Report-June2026.pdf
```

### Issue: "Sign in required" error

**Cause**: User not authenticated

**Fix**: This is expected behavior. Users must sign in to download reports. The download route checks:
```typescript
const session = await auth();
if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
```

## Database Schema

The `performancereports` collection documents look like:

```javascript
{
  _id: ObjectId("..."),
  monthKey: "2026-06",        // Used for sorting (YYYY-MM format)
  slug: "june-2026",          // Used in URLs
  label: "June 2026",         // Display name
  summary: "...",             // Optional description
  niftyReturn: null,          // Benchmark return (add manually)
  published: true,            // Must be true to appear
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## File Structure

```
your-project/
├── public/
│   └── reports/
│       ├── SIF-Monthly-Report-May2026.pdf    ← Old
│       └── SIF-Monthly-Report-June2026.pdf   ← New ✅
├── scripts/
│   ├── generate_june_2026_report_data.ts     ← New ✅
│   └── create_june_report_db.js              ← New ✅
└── src/
    └── app/
        └── api/
            └── reports/
                └── [slug]/
                    └── download/
                        └── route.ts          ← Updated ✅
```

## Summary of Changes

| File | Change |
|------|--------|
| `src/app/api/reports/[slug]/download/route.ts` | Added `june-2026` slug handler |
| `public/reports/SIF-Monthly-Report-June2026.pdf` | PDF file uploaded |
| `scripts/update_to_june_report.js` | Simple update script created |
| MongoDB `performancereports` collection | Existing entry updated (not new) |

## Next Month (July 2026)

When creating July report, follow same pattern:

1. Place PDF: `public/reports/SIF-Monthly-Report-July2026.pdf`
2. Update download route: Add `july-2026` case
3. Run DB script (modify monthKey to `2026-07`, slug to `july-2026`)
4. Clear cache

The system will automatically show the latest report based on `monthKey` descending sort.

## Questions?

- Check that `published: true` in database
- Verify `monthKey` format is `YYYY-MM`
- Ensure slug matches in download route and database
- Check PDF filename matches exactly
