# 09 — Fund Details fields & data sources revamp

Status: **field removals done and verified. TER sync + `terMax` removal outstanding.**

Replaces the current "finapi fills everything" model with explicit per-field
ownership across four sources, adds the AMFI SSD and TER feeds, and deletes the dead
fields.

---

## 1. Verified findings

Everything below was fetched live on 2026-07-21, not assumed.

**TER API** — `GET https://www.amfiindia.com/api/sif-populate-te-rdata-revised`

- `Month=07-2026&strCat=-1&strType=-1&page=1&pageSize=550` → HTTP 200, 297 KB
- `meta: {total: 545, pageCount: 1}` — single page at pageSize 550
- Row shape: `SIF_Id`, `Scheme_Name`, `NSDLSchemeCode`, `SchemeCat_Desc`,
  `TER_Year`, `TER_Date`, and a full split: `R_BER`, `R_BrokerageCost`,
  `R_TransactionCost`, `R_StatutoryLevies`, `R_TER` (Regular) plus the `D_*`
  equivalents (Direct).
- 15 distinct `SIF_Id`: 3, 13, 17, 20, 22, 25, 27, 37, 45, 47, 48, 61, 62, 70, 83.
- This is strictly better than the `amfiindia.com/sif/ter-of-sif` page the sheet
  names for `terSlabs` — it is JSON, it is per-scheme, and it splits Regular vs
  Direct. Scrape nothing.

**Scheme id bridge** — `GET /api/populate-investment-strategy?sif_id=<SIF_Id>`

- All 15 ids fetched → **28 schemes, 28 distinct `scheme_id`**.
- `scheme_id` is therefore **globally unique**, not namespaced per AMC. This is
  the single most important finding: a bare `schemeId` column is a safe key.
- Returns `{SIF_Id, scheme_name, scheme_id}` only — no ISIN, as you said.

**SSD XML** — `GET https://portal.amfiindia.com/spages/SSD_<scheme_id>.xml`

- **24 of 28 resolve. 4 return 404: `S-5`, `S-22`, `S-26`, `S-28`.**
- **The 24 arrive in THREE different XML schemas**, so the parser needs three
  adapters, not one:
  - A · `SchemeSummaryDocument`, named elements — 14
  - B · SpreadsheetML `Workbook`, index/label/value rows — 9
  - C · `<root type="object">`, typed elements — 1 (`S-4`, Magnum Hybrid)
  All three carry the same 53 fields in the same order, so normalise on field
  index and the adapters stay thin.
- `S-22` is Altiva Equity Ex-Top 100 Long-Short — a fund already live on the
  site. So SSD coverage is partial *for funds that matter*, permanently or
  temporarily. The sync must treat a 404 as "no news", never as "no value".
- 53 fields per doc. All 24 carry ISINs.

**Your DB**

- `funddetails`: 28 docs.
- Name match against AMFI, normalised (lowercase, strip non-alphanumeric):
  27 clean matches.
- **Duplicate:** `"DynaSIF Active Asset Allocator Long- Short Fund"` and
  `"DynaSIF Active Asset Allocator Long-Short Fund"` differ by one space and
  collapse to the same key.
- **Missing:** `S-25` RedHex Hybrid Long-Short Fund exists at AMFI, not in your DB.

---

## 2. The join problem, and why it is solvable

The bridge endpoint gives no ISIN, so the first hop *must* be a name match. But
the SSD document that name match unlocks **contains the ISINs**. That inverts the
risk:

1. Normalised name match `funddetails.fundName` → `scheme_id`. (27/28 today.)
2. Fetch `SSD_<scheme_id>.xml`, parse its `ISINs` field.
3. Compare against the ISINs already on your `SIFScheme` rows.
4. Match → mark the mapping `verified`, persist, **never name-match that fund
   again**. Mismatch → mark `conflict`, write nothing, surface for review.

So the fuzzy step happens once per fund, is machine-checked against a hard key,
and then freezes. A renamed fund upstream can no longer silently repoint a
mapping, because the mapping is already pinned by `schemeId`.

The 4 SSD-404 funds can never reach `verified` — they stay `unverified`, usable
for TER (which matches on its own `Scheme_Name`/`SIF_Id`) but barred from writing
SSD-owned fields.

---

## 3. Field disposition

From `Fund_Details_Fieldsv2.xlsx`, 62 rows.

**SSD-owned (13)** — `fundName`, `riskBand`, `exitLoad`, `minInvestment`,
`additionalInvestment`, `benchmarkName`, `benchmarkRiskBand`, `benchmarkDetails`,
`redemptionFrequency`, `assetAllocationRanges`, `sponsorName`, `trusteeName`,
`registrarName`

**finapi-owned (9)** — `aumCurrent`, `fundManagers`, `assetAllocation`,
`portfolioByIndustry`, `topHoldings`, `inceptionDate`, `marketCapWeightage`,
`concentration`, `fundamentals`

**AMFI TER API (1)** — `terSlabs` (replacing `terMax`)

**Internal (6)** — `schemeType`, `schemeCategory`, `amcName`, `isin`, `peers`,
`amcOtherFunds`

**Derived from NAV (2)** — `rollingReturns`, `categoryRanks`

**Manual upload (9)** — `factsheets`, `taxationSummary`, `suitableFor`,
`notSuitableFor`, `bullMarket`, `bearMarket`, `sidewaysMarket`, `mfEquivalent`,
`portfolioFit`

**Remove (21, not 22 — earlier count was wrong)** — of these, `aumAggregate` and
`aumEnd` were kept on review (AUM fallback chain + "Monthly AAUM" stat), and
`terMax` is deferred until TER sync lands, since `sifData.ts` maps it straight
onto `FundRow.expenseRatio`. The other 18 are removed. Full list:
`aumAggregate`, `aumEnd`, `portfolioByRatingClass`,
`schemeNature`, `planCodes`, `navCutoffTime`, `redemptionPayoutDays`,
`redemptionNoticePeriod`, `penalInterestRate`, `panInvestmentThreshold`,
`accreditedInvestorMinInvestment`, `sipDetails`, `terMax`, `grossExposureLimit`,
`derivativesRestrictions`, `derivativeStrategies`, `alphaGenerationApproach`,
`howItWorks`, `externalSchemeCode`, `riskMetricsConclusions`,
`lastSyncedFromFinApi`

---

## 4. Schema changes

New `SchemeMapping` collection — one doc per AMFI scheme, the join table:

```
schemeId        "S-10"        unique index
sifId           47
schemeName      AMFI's string, verbatim
nsdlSchemeCode  from TER feed
isins           [String]      parsed out of SSD
status          "verified" | "unverified" | "conflict"
matchedFundName your funddetails.fundName
ssdLastSeenAt   Date | null   null = never resolved (the 4 404s)
```

On `FundDetails`, add `schemeId` (indexed) and drop the 22 dead fields.

**Field ownership must be data, not execution order.** A `FIELD_OWNER` map keyed
by field name, consulted by every writer. Two consequences:


- A sync only ever `$set`s paths it owns. The 9 manual-upload fields are owned by
  nobody, so no job can touch them. `fundDetailsSync.ts` does `$set: base` where
  `base = mapFinApiToFundDetails(raw)` — **checked: that only ever contains
  finapi-mapped keys, so manual-upload fields were never at risk.** The concern
  raised in an earlier draft of this doc was unfounded.
- `riskBand` moving from finapi to SSD is a one-line ownership change, not a
  cron-ordering puzzle.

---

## 5. Cron design

**One job, three ordered phases — not three crons.** Phase 2 depends on phase 1's
output, and three separate crons would race. Total work is ~44 HTTP requests, far
inside `maxDuration = 300`.

`/api/cron/sync-amfi` — daily, `0 8 * * *` (after `sync-fund-details` at 07:00, so
SSD-owned fields land last).

- **Phase 1 — mapping.** 15 calls. Discover new schemes, name-match unmapped
  funds, upgrade to `verified` when SSD ISINs agree. Never re-match a `verified`
  row. New AMFI schemes with no DB counterpart (RedHex today) get a mapping row
  and are reported, not auto-created.
- **Phase 2 — SSD.** One call per `verified` mapping. Parse, write SSD-owned
  fields.
- **Phase 3 — TER.** One call. Match on `SIF_Id` + `Scheme_Name`, write `terSlabs`.

**Staleness policy — the rule that matters most.** A phase writes a field only
when the source returned a usable value. 404, timeout, malformed XML, or empty
element → leave the stored value untouched and bump nothing. Data on the site
goes stale before it goes blank. `ssdLastSeenAt` makes staleness visible so it
does not hide forever.

**TER month rollover.** `Month=MM-YYYY`. On the 1st, the new month may not be
published. Try current month; if `meta.total == 0`, retry the previous month.
Assert `meta.pageCount == 1` and alert if it ever exceeds 1, rather than silently
reading page 1 of many.

Follow the existing cron shape exactly: `Bearer ${CRON_SECRET}` gate, `CronLog`
row, `revalidateTag("sif-data")` only when something actually changed.

---

## 6. Sequencing

1. **Dedup DynaSIF first.** Two docs collapse to one key; a unique index on
   `schemeId` will fail or silently pick a winner until this is resolved. Blocks
   everything.
2. `SchemeMapping` model + phase 1, run in **dry-run** mode. Read the report
   before any write.
3. Phase 2 (SSD) behind the `verified` gate.
4. Phase 3 (TER).
5. `FIELD_OWNER` map + repoint `riskBand`/`exitLoad`/etc. to SSD.
6. Field removals **last** — after the new sources are proven, so there is no
   window where a field is both unsourced and undeleted.

Removals touch `FundRow` in `sifData.ts`, which feeds the homepage, `/sifs`, and
the detail page. Step 6 needs its own typecheck-and-render pass.

---

## 7. Open decisions

- **RedHex (S-25):** auto-create a `funddetails` doc from SSD, or hold for manual
  review? Auto-create keeps the site current; review keeps a human in front of
  new funds.
- **`benchmarkDetails`, `assetAllocationRanges`:** SSD has `Benchmark_Tier_1`/
  `Tier_2` and a free-text `Stated_Asset_Allocation` (`"Debt & Money Market Instruments - 35 % to 65%"`). Store as raw strings, or parse to structured
  ranges? Parsing is brittle against free text.
- **The 4 SSD-404 funds:** accept indefinite staleness, or add a manual override
  path so an editor can fill SSD-owned fields for them?

  PROFILINGS SIF REPPRTS DOCS


---

## 8. What has been done (2026-07-21)

18 fields removed across model, mappings, API routes, and UI. `tsc --noEmit`
clean, `npm run build` clean, and `/`, `/sifs`, `/compare` and a fund detail page
all serve 200 on a cold `.next` with zero serialization warnings.

Two removals were adjusted rather than executed blind:

- **`lastSyncedFromFinApi`** drove `orderByStaleness`, which lets a truncated sync
  resume at the stalest funds instead of redoing the same ones daily. Deleting it
  outright would have silently broken tail coverage. Staleness now rides on the
  schema's own `updatedAt`. Caveat recorded in code: an admin edit also bumps
  `updatedAt`, so a hand-edited fund reads as fresh for a day.
- **`aumAggregate` / `aumEnd`** kept — they back the AUM fallback chain and the
  "Monthly AAUM" stat.

Also removed as a consequence: the `riskMetricsConclusions` form state in the
admin page (10 `risk*` fields), the now-empty PPT extraction path's fields, and
orphaned types/imports.

**Still outstanding:** `SchemeMapping` + the three sync phases, and `terMax`
removal behind the TER feed. The DynaSIF dedup (§6 step 1) is also still open.
