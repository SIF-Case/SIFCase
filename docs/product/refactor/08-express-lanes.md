# 08 — Express Lanes: NFO Alerts and Public Data Export

> **Status:** Not started · **Fidelity:** Full · **Depends on:** 06 · **Blocks:** 05
> **Written against:** commit `29b97f8` (main), 2026-07-20
> **Spine:** bypasses it — these personas skip the spine by design · **Execution order: 7th**

## Pre-flight

- [ ] `06-account-moment` has landed — both lanes key off an account
- [ ] `CLOSING_SOON_DAYS = 7` still in `src/lib/nfoQueries.ts`
- [ ] `unpublish-expired-nfos` cron still scheduled (`vercel.json`, 06:00 UTC)
- [ ] `Watchlist` still has no notification path
- [ ] `sendOtpEmail` / `sendOtpSms` still work — the alert lane reuses these transports
- [ ] `SifAum.byAmc` still populated; `scripts/export_fund_details_excel.js` still runs

## Problem

Two personas do not travel the spine at all (`PRODUCT.md` §5). Both are currently underserved despite the infrastructure existing.

### NFO Opportunist — polls manually

Already invests in SIFs, PMS, or AIFs. Watches launches like IPOs. Zero education need, extreme time-sensitivity.

The data layer already serves them: `CLOSING_SOON_DAYS = 7`, `daysLeft` computed in `toNFOData`, `isClosingSoon`, the `unpublish-expired-nfos` cron, and `startOfToday()` correctly keeping an NFO open through its close date.

**But `Watchlist` has no notification path.** There is no email or SMS on a closing window. The user must remember to check. `personas.md` §5 marks the failure: *missing a close date is catastrophic and they do not return.* A subscription window that closes is not recoverable — unlike every other failure mode on this site, this one is permanent.

### Family-Office Analyst — cannot export

Analyst at a family office, mandated to produce a "should we allocate to SIFs" memo for an investment committee. Needs the full universe, AUM trends, AMC breakdown, NAV history, and a citable monthly source.

Everything they need exists — `SifAum.byAmc`, `scripts/export_fund_details_excel.js`, `scripts/export_funds_nav.js`, `sif_nav_history.xlsx`, `PerformanceReport` with `niftyReturn` — **entirely behind admin scripts.** The public site offers no export.

They will not use an on-site tool; they will model in their own spreadsheet. Optimising for on-site analysis misreads the persona. **Optimise for export quality.**

## Goals

1. NFO alerts on a schedule that makes missing a window unlikely.
2. Public, structured data export.
3. Published methodology so figures are citable.
4. Neither lane requires traversing the spine.

## Non-goals

- A public API with keys and rate limits. File export this pass.
- Real-time NAV push. Daily cadence matches the `fetch-nav` cron.
- Making the Analyst a callback lead. See constraint below.

## Target state

### NFO alerts

Extend `Watchlist` to cover NFOs, or add a parallel `NfoWatch` — decide at implementation based on how `Watchlist` is keyed (it is scheme-code oriented; NFOs may not have one until allotment).

Schedule, driven by `closeDate`:

| Trigger | Channel |
|---|---|
| New NFO opens matching a tracked strategy or AMC | email |
| **T-3 days** before `closeDate` | email + SMS |
| **T-1 day** before `closeDate` | email + SMS |

Reuse `sendOtpEmail` / `sendOtpSms` transports (`src/lib/mailer.ts`, `src/lib/sms.ts`). A new cron alongside `unpublish-expired-nfos` — it already runs daily against `closeDate`, so the query shape exists.

⚠️ **Idempotency is mandatory.** Cron retries and Vercel's at-least-once semantics mean a naive implementation double-sends. Persist a sent-marker per `(user, nfo, trigger)` and check before dispatch. Double-texting someone about their money is a serious trust failure and the most likely defect in this spec.

⚠️ **Alerts are opt-in per channel.** SMS especially — it costs money and carries regulatory weight (`FAST2SMS_*` config). Never default SMS on.

`CLOSING_SOON_DAYS = 7` governs the public "closing soon" flag; alert triggers are separate constants. Do not conflate them.

### Public data export

Authenticated (account, per spec 06), not gated behind a callback.

| Export | Source | Format |
|---|---|---|
| Fund universe + details | `SIFScheme` + `FundDetails` | CSV, XLSX |
| NAV history | `SIFNav` | CSV |
| AUM by AMC and period | `SifAum.byAmc` | CSV |
| Monthly report | `PerformanceReport` | PDF (exists) |

`xlsx` is already a dependency and the admin scripts already produce these shapes — largely a matter of exposing existing generation behind an authenticated route.

Every export must carry: generation timestamp, as-of date for the data, and a source attribution line. An undated export is uncitable, which defeats the purpose.

⚠️ Exports run against the same Mongo instance serving the site. Bound them — cap row counts, prefer streaming over buffering full result sets, and rate-limit per user. An unbounded NAV history export could pull hundreds of thousands of documents.

### Published methodology

`CALCULATION_FORMULAS.md` exists in the repo root and is not public. An analyst cannot cite a return figure whose derivation is undocumented, and an investment committee will ask.

Publish it as a public page: return calculation, the right-alignment approach in `navPerformance.ts` and `categoryAverages.ts`, category assignment via `shortCategoryOf`, and AMFI as the data source. This is cheap and it is the difference between being cited and being ignored.

### Do not treat the Analyst as a lead

`personas.md` §6: routing them to a callback alienates them. They convert indirectly, slowly, and at the largest ticket sizes on the site — via a memo that names you as a source. Gate exports behind an account at most. **Never behind a phone call.**

## Verification

- [ ] Tracking an NFO produces T-3 and T-1 alerts on the configured channels
- [ ] Cron re-run does **not** re-send — verify the sent-marker by forcing a double run
- [ ] SMS defaults off; both channels independently opt-in
- [ ] An NFO closing today still alerts correctly (UTC-midnight semantics per `startOfToday()`)
- [ ] Each export downloads with generation timestamp, as-of date, and attribution
- [ ] Exports are row-capped and rate-limited; a large NAV export does not degrade site response times
- [ ] Exports require an account and **never** a callback
- [ ] Methodology page is public and reachable from every export and report
