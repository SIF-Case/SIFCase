# SIFcase — Codebase Context

> Generated context map of the whole repository. Purpose: give any agent or new developer
> a complete mental model of the system without reading every file.
> Repo: `/Users/roshanajith/Documents/Products/allsif` · Branch `main` · ~41.7k LOC of TS/TSX across 365 files.

---

## 1. What This Product Is

**SIFcase** (`sif-case.vercel.app`) is a public research and comparison platform for **SIFs — Specialised Investment Funds**, a SEBI fund category in India. It ingests official data (AMFI NAV files, AMFI AUM/NFO APIs, AMFI riskometer XML, a third-party FinAPI fund service, RSS news feeds, and AMC factsheet PDFs), normalises it into MongoDB, and serves:

- Public fund discovery, performance, comparison, fund-house and NFO pages
- An education hub (SIF 101, articles, FAQs, quizzes)
- Monthly performance reports (DOCX + PDF)
- A permissioned admin back-office for data curation, CRM, and AI-assisted extraction

Design language is documented separately in `DESIGN.md` ("Wealth Trust" theme: Navy + Blue + Emerald, source badges for data provenance, tabular numerals, no hype copy). **`DESIGN.md` is the authoritative UI reference.**

---

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js **16.2.6**, App Router, Turbopack |
| Runtime | React **19.2.4**, TypeScript |
| Hosting | Vercel (`vercel.json` defines crons; `@vercel/analytics`, `@vercel/blob`) |
| Database | MongoDB via **Mongoose 9** |
| Auth | **NextAuth v5 beta** (JWT sessions) — Google OAuth + 4 Credentials providers |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), `clsx` + `tailwind-merge` via `cn()` |
| Charts | Recharts, d3-hierarchy, d3-voronoi-treemap |
| Rich text | TipTap 3 (article editor) |
| AI | Vercel **AI SDK v6** (`ai`) + `@ai-sdk/google` (Gemini), Zod-validated `generateObject` |
| Docs/PDF | `docxtemplater` + `pizzip` (report DOCX), `pdfjs-dist` / `pdf-parse` / `pdf2json` (PDF parsing) |
| Media | Cloudinary (logos, article images), Vercel Blob (report PDFs) |
| Messaging | Nodemailer over Hostinger SMTP (email OTP), Fast2SMS (phone OTP) |
| Validation | Zod 3 |

`next.config.ts` notables: `serverExternalPackages: ["pdfjs-dist"]` (bundling breaks its fake-worker fallback), wide-open `images.remotePatterns` so admins can paste any AMC CDN URL, and two redirects (legacy `/read/...` SIF explainer → `/sif-101/...`, `/suitability` → `/sif-101/quiz`).

---

## 3. Directory Map

```
src/
  auth.ts              NextAuth config (all providers + callbacks)
  proxy.ts             Next proxy/middleware — matcher ["/"] only
  app/                 App Router: public pages, /admin, /api
  components/
    layout/            Navbar, Footer, SearchModal
    sections/          25 homepage/feature sections (Hero, CompareLab, UniverseMap, …)
    ui/                Reusable primitives (FundCard, RiskMeter, SourceBadge, Sparkline, …)
    admin/             DataQualityPanel
    auth/              AuthModal
    editor/            ArticleEditor, RichEditor, ImageUploader (TipTap)
    UserTracker.tsx    Client-side page-visit logging
  lib/                 Data access, fetchers, auth helpers, utils
  lib/reports/         Monthly report pipeline
  models/              29 Mongoose models
  hooks/               useWatchlist
  types/               next-auth.d.ts, d3-voronoi-treemap.d.ts
  reports/             monthly-template.docx
scripts/               ~30 one-off Node/TS maintenance & export scripts
tests/                 ts-node tests for the report pipeline + AMFI fixtures
```

Architecturally the graph detects 23 communities; the largest are `fund-details-admin` (161 nodes), `ui-group` (120), `analyse-post` (113), `sections-chart` (97), `routes-panel` (95), `lib-access` (67). Known hotspot: **75 CALLS edges from `ui-group` → `lib-export`** — UI components lean heavily on the shared lib layer.

---

## 4. Data Model (`src/models/`, 29 collections)

**Fund core**
- `SIFScheme` — canonical scheme record: `schemeCode`, `schemeName`, `amc`, `fundType`, `isinGrowth`/`isinReinvestment`, `plan`, `companyName`(+`_short`), `brandName`, `fundName`, `isActive`. Exports parse helpers (`parsePlanFromName`, `parseOptionFromName`, `parseStrategyFromName`, `deriveCompanyNameShort`, `deriveBrandName`, `deriveFundName`).
- `SIFNav` — daily NAV: `schemeCode`, `nav`, `repurchasePrice`, `salePrice`, `navDate`, `fetchedAt`.
- `FundDetails` — the big curated/AI-extracted record (~40 fields): risk band, exit load, AUM (current/aggregate/end), min & additional investment, benchmark (name/risk band/details), scheme category & nature, inception, redemption mechanics (frequency, NAV cutoff, payout days, notice period, penal interest), PAN/accredited-investor thresholds, TER, taxation, gross exposure & derivatives limits, alpha approach, entity names (sponsor/AMC/trustee/registrar), narrative fields (`suitableFor`, `notSuitableFor`, `bullMarket`, `bearMarket`, `sidewaysMarket`, `howItWorks`, `mfEquivalent`, `portfolioFit`), plus `isin`, `externalSchemeCode`, `lastSyncedFromFinApi`.
- `SifAum` — AMFI average AUM by financial year/period, with `byAmc` breakdown.
- `FundHouse` — `brandName`, `logoUrl`, `overview`.
- `Nfo` — new fund offers: dates (open/close/allotment/reopen), min investment, subscription price, exit load, benchmark, risk level/colour, `published`, plus sub-schemas for allocation bands, strategy points, managers, docs.

**Content**
- `Article` (full SEO surface: slug, category/subcategory, order, status, author, read time, seoTitle, metaDescription, canonicalUrl, robotsIndex, ogImage, keywords), `ArticleOptions`, `Faq`, `FaqCategory`, `NewsItem` (+ `aiSummary`, `promotedArticleId`), `NewsConfig` (RSS feeds with `enabled`, `maxItemsPerFetch`, `retentionDays`), `PerformanceReport` (`monthKey`, `slug`, `label`, `summary`, `niftyReturn`, `pdfUrl`, `published`).

**Quizzes**
- `KnowledgeQuiz` + `SuitabilityQuestion` (question/options/dimension/order/published), answered into `QuizResponse` (knowledge: correctness, points, percentage, passed) and `SuitabilityResponse` (dimension-scored, session- or user-keyed).

**Users, access, CRM**
- `User` — name/email/emailVerified/image/phone/passwordHash/googleId/`isAdmin`/`isBlocked`/`role`→Role.
- `Role` — named permission set: `permissions[{ pageKey, view, edit }]`, `isSystem`.
- `Client` — CRM record: stage, source, assignedTo, investmentInterest, estimatedAumLakhs, riskProfile, `linkedUserId`, embedded `notes`, `pageVisits`, `activities`, follow-up dates, tags.
- `PipelineStages` — configurable CRM stage lists.
- `Watchlist`, `SavedCompare`, `RecentlyViewed` — per-user saved state.

**Infra**
- `EmailOtp`, `PhoneOtp`, `LoginToken` (hashed secrets + `expiresAt` + attempt counters), `CronLog` (`job`, `status`, `message`, `fundsUpdated`, `duration`), `AISetting` (per-usage AI provider/model/apiKey, `usages[]`).

---

## 5. Auth & Access Control

**`src/auth.ts`** — NextAuth v5, `session.strategy = "jwt"`, `trustHost: true`, sign-in page `/`. Providers:

1. `google` — OAuth.
2. `email-password` — bcrypt against `User.passwordHash`.
3. `email-otp` — `consumeEmailOtp({ purpose: "login" })`, marks `emailVerified`.
4. `phone-otp` — `consumePhoneOtp`; **auto-creates the user** if the phone is new, and logs a "Create User" activity.
5. `phone-post-link` — `consumeLoginToken`, used to resume a session after account linking.

The `signIn` callback implements **phone↔Google linking**: if a `linking_phone` cookie is present, the Google identity is attached to (or creates) that phone user, then the cookie is deleted. Otherwise, normal Google sign-in creates the user on first login or backfills `googleId`. The `jwt` callback hydrates `isAdmin` and `role` from Mongo (on sign-in, on Google login, and on `trigger === "update"`), and `session` projects `id`, `phone`, `isAdmin`, `role` onto `session.user` (typed in `src/types/next-auth.d.ts`).

**`src/proxy.ts`** — matcher is **only `/`**. It exists so the homepage route itself never calls `cookies()`/`auth()` (which would force it out of static/ISR caching). If the visitor is staff (super-admin or any permission), it redirects `/` → `/admin`.

**`src/lib/adminAuth.ts`** — the permission layer on top of `isAdmin`:
- `ADMIN_PAGES` (in `src/lib/adminPages.ts`) is the page registry: `dashboard, users, clients, funds, navRecords, schemes, fundDetails, fundHouses, nfos, articles, news, faqs, suitability, logs` — each with `label`, `href`, `icon`, `editable`.
- `getEffectiveAccess(userId)` is React-`cache`d per request: blocked users → `null`; `isAdmin` → super-admin with every page (`edit` where `editable`); otherwise the user's `Role.permissions` map.
- Server components use `requireAdmin()`, `requirePageAccess(pageKey, action)`, `requirePageAccessDetailed(pageKey)` (returns `canView`/`canEdit` to pass into client components).
- Route handlers use `isAdminRequest(req)`, `hasPageAccess(req, pageKey, action)`, `hasAnyPageAccess(req, pageKeys, action)` — the last one for APIs shared by several pages (e.g. funds + schemes).
- `isInternalStaff(user)` distinguishes staff from plain clients.

**OTP** (`src/lib/otp.ts`): `generateOtp`, `maskEmail`, `issue/consumeEmailOtp`, `issue/consumePhoneOtp`, `issue/consumeLoginToken` — all store hashes with expiry and attempt limits. Delivery via `src/lib/mailer.ts` (`sendOtpEmail`, Hostinger SMTP) and `src/lib/sms.ts` (`sendOtpSms`, Fast2SMS).

---

## 6. Data Ingestion Pipelines

All ingestion lives in `src/lib/*Fetcher.ts`, is invoked by `/api/cron/*` routes (guarded by `CRON_SECRET`) or by admin trigger routes, and writes a `CronLog`.

| Fetcher | Source | Notes |
|---|---|---|
| `navFetcher.fetchAndStoreSIFNav()` | `https://portal.amfiindia.com/spages/SIF_NAVAll.txt` | Parses `26-May-2026`-style dates to **UTC midnight** to avoid IST shift; upserts `SIFScheme` + `SIFNav`; returns `{fetched, filtered, upserted, errors}`. On success the cron calls `revalidateTag('sif-data')`. |
| `aumFetcher.fetchAndStoreSifAum()` | `https://www.amfiindia.com/api/sif-average-aum-fundwise` | Walks financial years → periods → AUM table; stores totals + per-AMC breakdown. |
| `nfoFetcher.fetchAndSyncNfos()` | `https://www.amfiindia.com/api/sif-nfo` | Lists and details NFOs, upserts `Nfo` by `externalSchemeId`. |
| `riskBandFetcher.fetchAndStoreRiskBands()` | AMFI scheme-performance XML (`xml2js`) | Maps text risk bands → 1–5 integers. Also `scrapeRiskBandFromAMFI(schemeCode)`. |
| `newsFetcher.fetchAndStoreNews()` | RSS feeds configured in `NewsConfig` | Hand-rolled RSS/XML parser (no dependency) with CDATA handling; honours per-feed `maxItemsPerFetch` and `retentionDays`. |
| `finApiClient.fetchFundByIsin(isin)` | `https://api.finapi.upvaly.com/api/mf/isin` | Returns rolling returns, ranks, risk conclusions, holdings; `mapFinApiToFundDetails()` maps it onto `FundDetails`. |

**Vercel cron schedule (`vercel.json`, UTC):**
```
/api/cron/fetch-nav                 20:30, 23:30, 03:30 daily
/api/cron/fetch-news                02:00
/api/cron/fetch-aum                 04:00
/api/cron/fetch-nfos                05:00
/api/cron/unpublish-expired-nfos    06:00
```
`/api/cron/fetch-risk-bands` and `/api/cron/warm-cache` exist as routes but are not on the schedule (manual/ad-hoc).

---

## 7. Read Path & Caching — `src/lib/sifData.ts` (1,296 lines, the core module)

Every public data function is wrapped in Next's `unstable_cache` with **TTL 2h** and the shared tag **`sif-data`**, so `revalidateTag('sif-data')` after a NAV import busts everything at once.

Exported readers: `getSnapshotStats`, `getSIFsWithReturns`, `getFundHouseBySlug`, `getTopFunds`, `getTickerNavs`, `getMonthlyHeatmapData`, `getFundDetailsForName`, `getFundDetail`, `getMonthlyPerformanceData`, `getLatestPublishedReport`, `getPublishedFaqs`.
Helpers: `normaliseRiskBand`, `monthKeyToLabel`, `monthKeyToSlug`, `currentMonthKey`.
Key types: `SnapshotStats`, `SIFRow`, `FundRow`, `PeriodKey` (`1M|3M|6M|1Y|SI`), `FundHouseInfo`, `FundDetail`, `FundDetailsData`, `MonthlyPerformanceData`, `LatestReportSummary`, `FaqGroup`.

⚠️ **Join-key gotcha, stated in the source:** `FundRow.fundName` is display-formatted by `formatFundName`. Joining `funddetails` must use **`fundNameRaw`** (the raw DB value). Using `fundName` as a join key silently mismatches.

Supporting: `src/lib/categoryAverages.ts` (`toCumulative`, `getCategoryAverages`, `getCategoryAverageSeries` — rebases each fund's sparkline to 100 and right-aligns series before averaging, requires ≥2 funds), `src/lib/nfoQueries.ts` (`getOpenNfos`, `getNfoBySlug`, `getOpenNfoSlugs`, `unpublishExpiredNfos`; NFOs closing **today** stay open until end of day, `CLOSING_SOON_DAYS = 7`), `src/lib/schemeHelpers.ts`, `src/lib/staticData.ts` (`SourceVariant` for provenance badges), `src/lib/utils.ts` (`cn`, `formatFundName`), `src/lib/activityLogger.ts` (`logClientActivity`, `logClientPageVisit`).

---

## 8. Monthly Report Pipeline — `src/lib/reports/`

Produces the monthly SIF performance report as a DOCX rendered from `src/reports/monthly-template.docx`.

```
monthMeta.ts      monthMetaFromDate(toDate) → labels/keys for the reporting month
amfiUniverse.ts   fetchUniverse(toDate) → downloads AMFI PDF, extractPdfLines() via pdfjs-dist,
                  parseUniverseText() → UniverseData (category counts, NSR schemes)
navPerformance.ts computeSchemeReturns(), shortCategoryOf(strategy),
                  computeReportPerformance(toDate) → PerformanceData
aiProse.ts        generateProse() via Gemini; fallbackProse() when AI is unavailable
buildReportData.ts buildReportModel(toDate) → ReportModel; reportFileName(toDate)
renderDocx.ts     renderReport(model) → Buffer (docxtemplater + pizzip)
types.ts          CategoryKey, UniverseData, PerformanceData, Prose, *Display, ReportModel
```

Tests live in `tests/reports/` (`amfiUniverse`, `navPerformance`, `renderDocx`, `monthMeta`, `aiProse`) with real AMFI fixtures for Mar–Jun 2026 in `tests/fixtures/`. Run with `npm test <file>` (ts-node + tsconfig-paths).

Reports are published as `PerformanceReport` docs with a Vercel Blob-hosted PDF, surfaced at `/performance/[slug]`, `/api/reports/latest`, and `/api/reports/[slug]/download`.

---

## 9. AI Usage

Configured per use-case in `AISetting` (provider, model, API key, `usages[]`); valid keys are declared in `src/lib/aiUsages.ts` (`AI_USAGES`, `isValidAiUsage`). Current AI surfaces:

- **`/api/admin/fund-details/analyse`** — the biggest one. Uploads an AMC factsheet PDF, then uses `generateObject` with `@ai-sdk/google` against a large Zod `FactsheetExtractionSchema`: scheme type, AUM (current/aggregate), min & additional investment, fund managers (name/designation/experience/managing-since), benchmark + risk band, asset allocation, portfolio by industry and rating class, top holdings (including negative-% short futures), plan codes → ISIN, and the narrative fields (`suitableFor`, `notSuitableFor`, bull/bear/sideways behaviour, `howItWorks`, `mfEquivalent`, `portfolioFit`). Gated by `hasPageAccess(..., "fundDetails")`.
- `/api/admin/fund-details/generate-narrative` — regenerates narrative prose fields.
- `/api/admin/articles/generate-meta` — SEO title/meta/keyword generation.
- `/api/admin/news-items/generate-articles` — promotes news items into draft articles.
- `src/lib/reports/aiProse.ts` — report commentary, with a deterministic fallback.

Related routes: `/api/admin/fund-details/upload-pdf`, `/cloudinary-signature`, `/save`, `/sync-isin` (FinAPI refresh).

---

## 10. Routes

### Public pages (`src/app`)
`/` · `/about` · `/compare` · `/dashboard` · `/disclaimer` · `/privacy` · `/terms` · `/sebi`
`/sifs`, `/sifs/[code]` · `/fund-houses`, `/fund-house/[slug]` · `/nfos`, `/nfos/[slug]`
`/performance/[slug]` · `/news`, `/news/[slug]` · `/read`, `/read/[slug]`, `/read/subcategory/[slug]`
`/sif-101`, `/sif-101/[topicId]`, `/sif-101/quiz` · `/suitability` (redirects to the quiz) · `/docs/[section]/[article]`
Plus `layout.tsx`, `providers.tsx`, `robots.ts`, `sitemap.ts`.

### Admin pages (`/admin/*`)
`dashboard` · `users` · `clients` (+ `[id]`) · `funds` · `nav-records` · `schemes` · `fund-details` · `fund-houses` · `nfos` · `articles` (+ `new`, `[id]/edit`) · `news` · `faqs` · `knowledge-quiz` · `suitability` · `reports` · `settings` · `logs`.

### API (84 route handlers)
- **`/api/admin/*`** — CRUD for ai-settings, amcs, articles (+reorder, generate-meta, article-options), clients, faqs (+categories), fund-details (+analyse/save/sync-isin/upload-pdf/generate-narrative/cloudinary-signature), fund-houses, funds (+`[code]`), knowledge-quiz, logs, nav-records (+report), nav-trigger, news-config, news-items (+generate-articles), news-trigger, nfos, pipeline-stages, reports (+upload-pdf), roles (+seed), staff, stats, suitability, users.
- **`/api/auth/*`** — `[...nextauth]`, `register`, `start`, `verify-phone-only`, `link-email/{send,verify}`, `link-google-init`.
- **`/api/public/*`** — `stats`, `callback` (lead capture), `verify-email/{start,check}`, `verify-phone/start`.
- **`/api/user/*`** — `profile`, `activity`, `recent`, `watchlist`, `compares`, `quiz-history` (+`[id]`).
- **`/api/cron/*`** — `fetch-nav`, `fetch-news`, `fetch-aum`, `fetch-nfos`, `fetch-risk-bands`, `unpublish-expired-nfos`, `warm-cache`.
- **Other** — `/api/search`, `/api/upload`, `/api/fund-houses`, `/api/knowledge-quiz` (+`/check`), `/api/suitability/{questions,response}`, `/api/reports/latest`, `/api/reports/[slug]/download`, `/api/revalidate-sif-101`.

---

## 11. Components of Note

**`sections/`** — `Hero`, `HeroHeatmap`, `MarketSnapshot`, `PulseStrip`, `TickerRibbon`, `TopFunds`, `UniverseMap` (voronoi treemap), `CompareLab`, `CompareFunds`, `BuildYourCompare`, `SIFComparisonTable`, `FundDetailPanel`, `FundDetailsSection`, `FundHouseCard`, `FundHousesNewsClient`, `SIFNewsSection`, `LearnSection`, `FAQSection`, `NFOPreview`, `PerformanceReportBanner`, `DownloadReportButton`, `NavActionCard`, `NotReadyToInvest`, `CTABand`, `WhySIFcase`.

**`ui/`** — `FundCard`, `FundListRow`, `FundTabs`, `CompareTray`, `RiskMeter`, `SourceBadge` (data-provenance chip; see `DESIGN.md` → "Field → Source Badge Mapping"), `Sparkline`, `DateRangePicker`, `FundCTAModal`, `CallbackPopup`, `mini-navbar`.

**Others** — `layout/{Navbar,Footer,SearchModal}`, `auth/AuthModal`, `editor/{ArticleEditor,RichEditor,ImageUploader}`, `admin/DataQualityPanel`, `UserTracker`.

---

## 12. Environment Variables

```
MONGODB_URI                              Mongo connection (pooled 2–10, 5s server selection)
AUTH_SECRET, NEXTAUTH_URL                NextAuth
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   Google OAuth
CRON_SECRET                              Guards /api/cron/*
SMTP_HOST, SMTP_PORT, SMTP_USER,         Hostinger SMTP for OTP email
SMTP_PASSWORD, SMTP_FROM
FAST2SMS_API_KEY, FAST2SMS_SENDER_ID,    Phone OTP
FAST2SMS_MESSAGE_ID
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET                    Image uploads
BLOB_READ_WRITE_TOKEN                    Vercel Blob (report PDFs)
```

---

## 13. Scripts & Tooling

`npm run dev` (binds `0.0.0.0`) · `build` · `start` · `import:historical` · `generate:may-report` · `test` (ts-node runner — pass a test file path).

`scripts/` holds ~30 maintenance utilities: admin creation (`createAdmin.js`, `makeAdmin.js`), seeding (`seedSifEducation.js`, `seed_nfos.js`), backfills (`backfill_sif_nav.js`, `sync_all_fund_details.js`), Excel/CSV exports (`export_fund_details_excel.js`, `export_funds_nav.js`, `export_may_report.js`), riskometer extraction (`extract_riskometer.{js,py}`), report-template building (`build-report-template.ts`), and a family of DOCX formatting fixers (`apply_format*.js`, `fix_*.js`).

Repo root also carries substantial written documentation worth consulting before changing the relevant subsystem: `DESIGN.md`, `CALCULATION_FORMULAS.md`, `DOCUMENT_UPLOAD_FLOW.md`, `FUND_DETAILS_AI_ANALYSIS_FLOW.md`, `ADMIN_FUND_DETAILS_FIELD_MAPPING.md`, `AUTH_FLOW_CHANGES_SUMMARY.md`, `RISK_BAND_EXTRACTION_PLAN.md`, `SIF_101_QUIZ_IMPLEMENTATION.md`, `JUNE_2026_REPORT_SETUP.md`, plus raw factsheets/spreadsheets used as fixtures.

A **code knowledge graph** (`.code-review-graph`, `code-review-graph` MCP server) indexes the repo — 1,649 nodes / 14,523 edges. Per `CLAUDE.md`, query it (`semantic_search_nodes`, `query_graph`, `get_impact_radius`, `detect_changes`) **before** falling back to Grep/Glob/Read.

---

## 14. Conventions & Gotchas

1. **Cache invalidation is tag-based.** Anything reading fund data goes through `unstable_cache(..., { tags: ["sif-data"], revalidate: 7200 })`. Write paths that change fund data must `revalidateTag('sif-data')`.
2. **Never join on `fundName`** — it's display-formatted. Use `fundNameRaw`.
3. **Dates are stored at UTC midnight** for date-only values (NAV dates, NFO close dates) to dodge IST off-by-one. `nfoQueries.startOfToday()` encodes this.
4. **Permissions are per-page, two-level** (`view`/`edit`), and `isAdmin` short-circuits to super-admin. New admin pages must be registered in `ADMIN_PAGES` or they are unreachable for role-based staff.
5. **`proxy.ts` deliberately matches only `/`** so the homepage stays statically cacheable. Widening the matcher would deopt caching across the site.
6. **`pdfjs-dist` must stay in `serverExternalPackages`** — bundling it breaks PDF parsing in the report route.
7. **AI extraction is Zod-schema-driven.** The Zod schema in `analyse/route.ts` is the single source of truth for what gets extracted; extend it there rather than post-processing.
8. **Provenance matters in the UI.** Fields display a `SourceBadge`; when adding a data field, decide and wire its source variant (`src/lib/staticData.ts`).
9. Copy style: no hype, tabular numerals for figures — see `DESIGN.md`.
