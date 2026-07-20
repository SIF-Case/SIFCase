# Question × Depth Matrix

> **The bridge from journey intent to code.** Twelve questions every user must answer before moving ₹10 lakh. Every cell is a file path or a gap ticket.
> Read `PRODUCT.md` first for the spine and the compression rule.
> **Written against:** commit `29b97f8` (main), 2026-07-20.

## How to use this

Each question needs **both** a 10-second surface and a 10-minute surface (the depth-pair invariant, `PRODUCT.md` §7). A missing cell is a build ticket. When you add or move a surface, update the row.

Legend — **✅** covered · **⚠️** partial or wrong voice · **❌** missing · **🔻** regression (built then broken)

---

## Act I — The Payoff

### Q1. Does this apply to me?
| | Surface | State |
|---|---|---|
| 10-sec | `QualificationCard` headline (`/`, below `Hero`) | ✅ |
| 10-min | `QualificationCard` expandable — why the floor exists, MF/PMS/AIF tiers, per-AMC scope | ✅ |

**Closed 2026-07-20** by `src/components/sections/QualificationCard.tsx`. Client-side (preserves ISR per `proxy.ts`), `localStorage` only, no net-worth figure collected or stored. Includes the honest exit for the "not yet" branch — no callback CTA on that path, per `PRODUCT.md` §7.4.

Prior state, for reference: ₹10L appeared only in `CTABand.tsx:59` (disclaimer voice, page bottom) and as one `WhySIFcase.tsx:28` bullet. Per-fund `minInvestment` still renders via `NavActionCard.tsx:61` and `FundDetailsSection.tsx:506` — unchanged.

### Q2. What's the payoff?
| | Surface | State |
|---|---|---|
| 10-sec | `Hero`, `HeroHeatmap`, `TopFunds` | ✅ |
| 10-min | `WhySIFcase`, `/sif-101` | ⚠️ |

**Problem:** the 10-minute answer is generic category explanation, not a payoff. Diversifier and Passive personas need "what return stream does this add," not "what is a SIF."

---

## Act II — The Gap

### Q3. What can't my current money do?
| | Surface | State |
|---|---|---|
| 10-sec | `WhySIFcase.tsx:28` ("PMS- and AIF-style strategies") | ⚠️ |
| 10-min | — | ❌ |

**Current:** `FundDetails.mfEquivalent` and `FundDetails.portfolioFit` hold exactly the right content — as free text on a fund page, never as a comparison.
**Problem:** all four comparison components compare SIF-to-SIF. Nothing compares SIF to what the user already owns. For the Passive Diversifier this is not a feature, it is their entire reason to be here — the only argument that lands on an indexer is **non-correlation, not alpha**.
**Gap:** 10-min tool missing. → `refactor/03-compare-surface.md`

### Q4. Is it legitimate?
| | Surface | State |
|---|---|---|
| 10-sec | `FundHouse` brand + logo on fund cards | ✅ |
| 10-min | `/sebi`, `FundDetails.sponsorName`/`amcName`/`trusteeName`/`registrarName` | ✅ |

Adequate. Lowest-priority row.

### Q5. What are the flavours?
| | Surface | State |
|---|---|---|
| 10-sec | `FundDetails.schemeCategory`, `Nfo.category` (Equity/Hybrid/Debt) | ✅ |
| 10-min | `/sif-101/[topicId]`, `/read/[slug]`, `/docs/[section]/[article]`, `FundDetails.howItWorks` | ⚠️ |

**Problem:** **three parallel content systems** answer this question. `next.config.ts` already redirects one legacy `/read/...` explainer to `/sif-101/...` — consolidation started by instinct but never finished.
**Gap:** fragmentation. → `refactor/02-content-consolidation.md`

---

## Act III — The Machinery

### Q6. What's the universe?
| | Surface | State |
|---|---|---|
| 10-sec | `MarketSnapshot`, `getSnapshotStats` (totalSchemes, uniqueAMCs, totalAUM, categoryBreakdown) | ✅ |
| 10-min | `/sifs`, `/fund-houses`, `UniverseMap`, `SifAum.byAmc` | ✅ |

Strongest row on the site. Leave alone.

### Q7. How do I judge one?
| | Surface | State |
|---|---|---|
| 10-sec | — | ❌ |
| 10-min | `/sif-101`, `/read`, `/docs` | ⚠️ |

**Problem:** metrics literacy exists only as **destination learning**. To understand a term on `/compare`, the user must leave `/compare`. Leaving is where they do not come back. There is no inline "what does this mean?" affordance anywhere.
**Gap:** 10-sec inline layer missing entirely. → `refactor/02-content-consolidation.md`

### Q8. Which are actually good?
| | Surface | State |
|---|---|---|
| 10-sec | `TopFunds`, `PulseStrip`, `TickerRibbon` | ✅ |
| 10-min | `/compare`, `/performance/[slug]`, `categoryAverages`, `PerformanceReport` | ⚠️ |

**Problem:** **four** comparison components — `CompareLab`, `CompareFunds`, `BuildYourCompare`, `SIFComparisonTable`. Fragmented UX, and the graph flags `ui-group`→`lib-export` at 75 CALLS edges, the codebase's worst coupling hotspot. Same defect, two symptoms.
**Gap:** consolidation. → `refactor/03-compare-surface.md`

### Q9. What could go wrong?
| | Surface | State |
|---|---|---|
| 10-sec | `RiskMeter`, `FundDetails.riskBand` | ✅ |
| 10-min | `exitLoad`, `taxationSummary`, `derivativesRestrictions`, `grossExposureLimit`, `penalInterestRate`, `redemptionNoticePeriod`, `bearMarket` | ⚠️ |

**Problem:** the data is unusually complete; the *narrative* is scattered across unrelated field renders. No single "what could go wrong" view. Passive Diversifier and Analyst both need drawdown and downside framing that no surface assembles.

---

## Act IV — The Commitment

### Q10. Does it fit my portfolio?
| | Surface | State |
|---|---|---|
| 10-sec | `FundDetails.portfolioFit` (free text) | ⚠️ |
| 10-min | `/suitability` | 🔻 |

**Regression — a fully built feature is unreachable.**

`src/app/suitability/page.tsx` exists and is complete (renders `SuitabilityClient`, metadata *"Find My Ideal SIF — SIFcase"*). `next.config.ts` shadows it:

```ts
{ source: "/suitability", destination: "/sif-101/quiz", permanent: false }
```

Next.js redirects resolve before routing, so the page is **dead code that still ships**. The Q10 portfolio-fit tool is pointed at a Q7 literacy test.

The instruments are distinct and correctly modelled:
- `SuitabilityQuestion` — `dimension`, `dimensionOrder`, `value` → **profiling**
- `KnowledgeQuiz` — `isCorrect`, `points`, `passed` → **literacy test**

⚠️ **Two competing persistence models for the same answers:**

| Model | File | Keyed by | Has |
|---|---|---|---|
| `SuitabilityResponse` | `models/SuitabilityResponse.ts` | `sessionId` (anonymous-capable), `userId` nullable | `answers[]` w/ `dimension`, `selectedValue` |
| `SuitabilityQuizResponse` | `models/QuizResponse.ts:57-73` | `userId` **required** | `totalScore`, **`recommendation`** (`:69`) |

`/api/suitability/response` writes the first. The second holds the output field but requires a logged-in user. Neither alone supports "complete anonymously, then convert." Both use `strict: false`.

**Gap:** un-shadow the route **and** reconcile the two models. → `refactor/04-suitability-restore.md` **(highest value/effort ratio on the board)**

### Q11. What's my shortlist?
| | Surface | State |
|---|---|---|
| 10-sec | `CompareTray` | ✅ |
| 10-min | `Watchlist`, `SavedCompare`, `RecentlyViewed`, `/dashboard` | ⚠️ |

**Problem:** every ingredient of the engaged-account conversion exists, and nothing drives toward it. `/dashboard` is a place you land, not a place you are led.
→ `refactor/06-account-moment.md`

### Q12. How do I act?
| | Surface | State |
|---|---|---|
| 10-sec | `CallbackPopup`, `FundCTAModal`, `NavActionCard` | ✅ |
| 10-min | `/api/public/callback` → `Client` | ✅ (callback only) |

**Problem:** two conversions were chosen; one has a moment. `phone-otp` in `src/auth.ts` **auto-creates users**, so accounts happen without a decision or a value exchange. Conversion 2 has no deliberate act.
→ `refactor/06-account-moment.md`

---

## Gap Summary — ranked by value ÷ effort

| Rank | Gap | Question | Spec |
|---|---|---|---|
| 1 | `/suitability` redirected away from its own instrument | Q10 | `04` |
| 2 | No qualification moment | Q1 | `01` |
| 3 | Four comparison components; no compare-vs-owned | Q3, Q8 | `03` |
| 4 | Three content systems; no inline learning | Q5, Q7 | `02` |
| 5 | Account conversion has no deliberate moment | Q11, Q12 | `06` |
| 6 | Partner handoff unmodelled in public product | — | `07` |
| 7 | NFO alerting and public data export absent | — | `08` |
| 8 | Homepage is an inventory, not a funnel | all | `05` |

## Persona coverage check

Which personas are **blocked** by an unfilled cell today:

- **Qualified Novice** — blocked at Q1 (no qualification) and Q7 (no inline learning). Cannot start, then cannot proceed.
- **Passive Diversifier** — blocked at Q3. Their entire thesis needs a correlation/fit tool that does not exist.
- **Intermediary** — blocked at Q12. No share, no co-brand, no client handoff.
- **NFO Opportunist** — partially served; no alerting, must poll manually.
- **Family-Office Analyst** — blocked at Q12. Export exists only as admin scripts (`scripts/export_*.js`).
- **Diversifier** — least blocked. The one persona the current site genuinely serves.
