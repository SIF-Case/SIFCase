# 01 — The Qualification Moment

> **Status:** ✅ **Landed 2026-07-20** — `src/components/sections/QualificationCard.tsx`, mounted in `src/app/page.tsx` below `Hero`
> **Fidelity:** Full · **Depends on:** — · **Blocks:** 05
> **Written against:** commit `29b97f8` (main), 2026-07-20
> **Spine:** Q1 (does this apply to me?) · **Execution order: 2nd**

## Pre-flight

- [ ] `FundDetails.minInvestment` still defaults to `1_000_000`
- [ ] `CTABand.tsx` still carries the ₹10L sentence (line ~59)
- [ ] `NotReadyToInvest.tsx` still exists and is rendered somewhere
- [ ] `/api/public/callback` still accepts leads
- [ ] `proxy.ts` still matches only `["/"]` — the ISR constraint below still applies

## Problem

The ₹10 lakh minimum is the single most important qualifying fact on the site. It determines whether a visitor can act at all. Today it appears:

- `src/components/sections/CTABand.tsx:59` — *"SIFs require a minimum investment of ₹10 lakh and are designed for sophisticated investors."* In **disclaimer voice, at the bottom of the page**, adjacent to a not-investment-advice notice.
- `src/components/sections/WhySIFcase.tsx:28` — *"from Rs. 10 lakh minimum"*, one bullet among several.
- Per-fund, via `NavActionCard.tsx:61` and `FundDetailsSection.tsx:506`.

**Nothing tells a user they qualify.** Two failures follow:

1. **The Qualified Novice never starts.** They read ₹10L as a barrier — the same shape as a wealth-management minimum they assume excludes them — and leave, despite qualifying. `PRODUCT.md` §1: this persona is jargon-naive, not wealth-naive. The fact that they *already qualify* is the strongest possible opening and it is buried in fine print.
2. **Ineligible visitors travel the whole funnel** and hit the wall at the callback, having spent time and generated a lead nobody can serve.

Both are the same defect: eligibility is answered last instead of first.

## Goals

1. Answer Q1 in the first screen of the journey, at both depths.
2. Frame eligibility as a **door**, not a gate.
3. Give ineligible visitors an honest, useful exit that preserves the relationship.
4. Never block or gate any route — the Diversifier and NFO personas must dismiss it in one action.

## Non-goals

- Collecting or storing a net-worth figure. Do **not** ask for a number; do not persist one.
- Any hard eligibility check. There is no verification, and attempting one is both hostile and unenforceable.
- Accredited-investor handling. `FundDetails.accreditedInvestorMinInvestment` exists but is out of scope.

## Target state

**A dismissible qualification card, self-assessed, never persisted.**

10-second layer — a single line, high on the page, plain voice:
> *"SIFs start at ₹10 lakh. If you have that to invest, you qualify — here's what it opens up."*

10-minute layer — expandable, answering what a genuine novice needs: why the floor exists (SEBI framework), what sits below it (mutual funds) and above it (PMS at ₹50L, AIF at ₹1cr), and that ₹10L is the *total* across an AMC's SIF strategies, not per fund.

**Self-assessment, two outcomes, no input field:**

- **"Yes, that's within reach"** → dismiss, proceed into the spine. Persist a client-side flag only (`localStorage`), so it never re-prompts.
- **"Not yet"** → the honest exit.

**The honest exit.** ⚠️ **Corrected 2026-07-20:** this spec originally said *"`NotReadyToInvest` is already the seed of that branch — promote it, don't rebuild it."* That was wrong. `NotReadyToInvest.tsx` is an **empty stub** — three unused `useState` hooks returning `<section className=""></section>`. The name was the only thing that existed. The honest exit was built from scratch inside `QualificationCard`. Requirements it must satisfy:
- State plainly that SIFs are not currently available to them. No hedging.
- Point to the mutual-fund path as a legitimate route, not a consolation.
- Offer the monthly report subscription — the only capture, and an honest one.
- **Not** surface a callback CTA. An advisor cannot serve this person today.

This is required by `PRODUCT.md` §7.4. It is also load-bearing for trust: a site willing to tell you it is not for you is a site whose recommendations mean something. The Passive Diversifier is reading for exactly this signal.

⚠️ **ISR constraint.** `src/proxy.ts` matches `["/"]` specifically so `/` never calls `auth()` and stays statically cacheable. This card must render **client-side after hydration**, reading `localStorage`. Do **not** add server-side personalisation to `/` — it breaks static caching for every visitor to save a single render for one.

## Placement

| Surface | Treatment |
|---|---|
| `/` | Client-side, high on the page, dismissible, once per browser |
| `/sifs`, `/compare` | Not shown. A user this deep has self-selected |
| `/suitability` | Reuse the "not yet" branch for `"not-yet-suitable"` (spec 04) |
| Fund pages | Per-fund `minInvestment` already renders. Leave it |

## Copy constraints

- Never *"do you qualify?"* — interrogative and exclusionary. Use *"SIFs start at ₹10 lakh."* Declarative, and it lets the reader conclude.
- Never imply exclusivity, prestige, or membership. `DESIGN.md` prohibits hype copy; this is exactly where a writer will reach for it.
- No scarcity or urgency. Eligibility is a fact, not an offer.

## Verification

- [ ] ₹10L eligibility is visible above the fold on `/` without scrolling
- [ ] Dismissible in one action; stays dismissed across reloads
- [ ] `/` still serves from ISR — confirm cache headers unchanged and `proxy.ts` untouched
- [ ] "Not yet" path reaches the honest exit with **no** callback CTA present
- [ ] No net-worth figure is collected, transmitted, or stored anywhere
- [ ] `CTABand.tsx` disclaimer retained for compliance, but is no longer the first mention
- [ ] `question-depth-matrix.md` Q1 updated from ❌❌ to ✅✅
