# 05 — Rebuild the Homepage as the Spine

> **Status:** Not started · **Fidelity:** Intent · **Depends on:** 01, 02, 03, 04, 06, 07, 08 — **all of them**
> **Written against:** commit `29b97f8` (main), 2026-07-20
> **Spine:** all twelve · **Execution order: 8th — LAST**

> **Intent tier.** Goals and acceptance criteria are binding. Structure is deliberately deferred: this surface *composes* the other seven specs and cannot be correctly designed before they exist. **Expand into a full spec via a fresh brainstorming session once specs 01-04 and 06-08 have landed. Do not implement from this document.**

## Why this is last

The homepage is the most visible surface, so it attracts attention first. Building it first guarantees building it twice.

Every slot below renders something the other seven specs create: the qualification card (01), the consolidated `CompareSurface` (03), the suitability entry (04), the account moment (06), the express-lane entries (08). Designing its composition before those exist means designing against seven predictions.

**This is the single most common sequencing error on a redesign of this shape.** Resist it.

## Pre-flight

- [ ] Specs 01, 02, 03, 04, 06, 07, 08 all landed and verified
- [ ] `question-depth-matrix.md` shows no ❌ or 🔻 rows remaining
- [ ] `src/proxy.ts` still matches `["/"]` — the ISR constraint below still binds
- [ ] Re-inventory `src/components/sections/` — the count will have changed
- [ ] Pull homepage scroll-depth and section-engagement data if available

## Problem

> **Corrected 2026-07-20 after reading `src/app/page.tsx`.** The original problem statement here claimed ~25 sections, four comparison components, two news surfaces, and "an inventory, not a funnel." **All of that was wrong** — inferred from a listing of `src/components/sections/` rather than from the page. Most of those 25 files serve `/sifs`, `/compare`, `/fund-houses`, and `/nfos`. Treat the corrected assessment below as the real one.

The homepage renders **nine content sections**, and its Act ordering is already close to correct:

| Section | Spine | Act |
|---|---|---|
| `Hero` (+ `HeroHeatmap`) | Q2 payoff | I |
| `WhySIFcase` | Q4 legitimacy, Q3 gap | II |
| `MarketSnapshot` | Q6 universe | III |
| `PerformanceReportBanner` | Q8 evidence | III |
| `TopFunds` | Q8 | III |
| `BuildYourCompare` | Q8 compare | III |
| `FAQSection` | Q4, Q5, Q9 | II/III |
| `CTABand` | Q12 | IV |

`BuildYourCompare` is already `dynamic()`-imported to keep recharts out of the initial bundle. `FAQSection` immediately before `CTABand` is objection-handling before the ask — correct placement, not late.

**The homepage does not need structural reordering.** Its problems are absences, and they live in other specs:

| Gap | Owner | Status |
|---|---|---|
| Q1 eligibility unanswered | `01` | ✅ **Done** — `QualificationCard` landed 2026-07-20 |
| Q10 portfolio fit absent | `04` | blocked |
| Q11 shortlist / save absent | `06` | blocked |
| Q3 weak — one `WhySIFcase` bullet, no compare-vs-owned | `03` | blocked |

**This changes why the spec is last.** Not "you would build it twice" — there is little to restructure. It is last because its remaining value is entirely gated on specs 03, 04, and 06 producing the components its empty slots need.

⚠️ `NotReadyToInvest.tsx` is an **empty stub** — three unused `useState` hooks returning `<section className=""></section>`. It was removed from `page.tsx` on 2026-07-20 and is now unreferenced. The file was left in place rather than deleted; decide whether to delete it.

## Goals

1. Homepage maps to **Acts**, not to available components.
2. Act I lands in the first viewport — payoff visible before any scroll.
3. Express-lane entries are discoverable without cluttering the spine.
4. Section count materially reduced.
5. ISR caching preserved.

## Non-goals

- Changing the visual language. `DESIGN.md` governs.
- Server-side personalisation. See the constraint.
- Deleting sections whose content has no home elsewhere — relocate rather than discard.

## Direction — five slots

| Slot | Act | Answers | Composes |
|---|---|---|---|
| 1 | I | Q1, Q2 | Qualification card (01) + payoff visual |
| 2 | II | Q3, Q4, Q5 | Gap framing, compare-vs-owned entry (03) |
| 3 | III | Q6, Q7, Q8 | Universe + constrained `CompareSurface` (03) |
| 4 | IV | Q10, Q11 | Suitability entry (04) + save/account moment (06) |
| 5 | — | — | Express-lane entries (08), news, footer |

Slot 1 must carry the payoff **above the fold**. `PRODUCT.md` §3: top-down, never curricular. The Diversifier decides whether to stay based on whether they see data or marketing in the first viewport — currently they see hero copy.

## Binding constraints

⚠️ **ISR.** `src/proxy.ts` matches `["/"]` *specifically* so `/` never calls `auth()` and stays statically cacheable. Any adaptation must be **client-side after hydration**. Do not add server-side personalisation to `/`. This constraint has survived every other spec and must survive this one — it is the reason the homepage is fast.

⚠️ **No self-identification gate.** `PRODUCT.md` §4. Never ask "which best describes you?" A self-ID gate before the user has a reason to care is a drop-off cliff. Infer depth from behaviour: did they expand the primer, did they go straight to compare, did they scroll past slot 1.

⚠️ **Compression, not branching.** One page, variable depth. Not five persona homepages. Every slot needs a 10-second and a 10-minute layer, collapsed by default.

## Open questions for expansion

1. Where do the two news surfaces go — merged into slot 5, or off the homepage entirely?
2. Do express lanes get homepage real estate or only navigation presence? They serve high-intent users who arrive knowing what they want, which argues for nav.
3. What is the client-side signal for depth preference, and is it worth it at all versus a good static progressive-disclosure design?
4. Which of the ~25 sections have content with no other home, and where does it go?
5. Does the homepage embed the account moment (06), or is that only on `/compare`?

## Verification

- [ ] Every slot maps to named spine questions; no section exists without one
- [ ] Payoff data visible above the fold without scrolling
- [ ] `/` still serves from ISR — cache headers unchanged, `proxy.ts` untouched, `auth()` not called
- [ ] No self-identification prompt anywhere on the page
- [ ] Every slot has both depth layers, collapsed by default
- [ ] Section count materially reduced; record before and after
- [ ] No orphaned content — everything removed has a documented destination
- [ ] All six personas can complete their journey from the homepage without a dead end
- [ ] `question-depth-matrix.md` fully ✅ across all twelve questions
