# 06 — Give the Account Conversion a Moment

> **Status:** Not started · **Fidelity:** Intent · **Depends on:** 03 · **Blocks:** 08, 05
> **Written against:** commit `29b97f8` (main), 2026-07-20
> **Spine:** Q11 (what's my shortlist?), Q12 (how do I act?) · **Execution order: 5th**

> **Intent tier.** Goals, constraints, and acceptance criteria are binding. Structure is deliberately deferred — the right shape depends on what `CompareSurface` (03) actually becomes. **Expand this into a full spec via a fresh brainstorming session when its turn arrives; do not implement directly from it.**

## Pre-flight

- [ ] `03-compare-surface` has landed — this spec's central moment lives inside it
- [ ] `phone-otp` in `src/auth.ts` still auto-creates users (lines ~76-99)
- [ ] `Watchlist`, `SavedCompare`, `RecentlyViewed` still exist and are still written
- [ ] `/dashboard` still exists; check whether anything currently drives users to it
- [ ] Measure: how many users have a populated `Watchlist` or any `SavedCompare`? That number is the baseline this spec moves

## Problem

Two conversions were chosen for this product (`PRODUCT.md` §6). One has a moment; the other does not.

**Callback** has `CallbackPopup`, `FundCTAModal`, `NavActionCard`, and `/api/public/callback` → `Client`. A clear, deliberate act.

**Engaged account** has every ingredient and no act:

| Ingredient | State |
|---|---|
| `Watchlist` | model exists |
| `SavedCompare` | model exists |
| `RecentlyViewed` | model exists, written by `UserTracker` |
| `/dashboard` | route exists |

Nothing drives toward any of them. `/dashboard` is a place you land, not a place you are led.

**Root cause — accounts happen *to* people.** The `phone-otp` provider in `src/auth.ts` auto-creates a `User` when an unrecognised phone completes OTP:

```ts
let user = await User.findOne({ phone });
if (!user) { user = await User.create({ phone, name: phone }); }
```

Frictionless, and therefore meaningless. There is no moment where the user decides to have an account, no value exchanged for it, and consequently nothing they feel ownership of afterwards. An account acquired without a decision produces no retention, which is precisely what the empty `Watchlist` and `SavedCompare` tables reflect.

This blocks the primary conversion for three personas: Diversifier, Passive Diversifier, and Analyst all convert to an account and never to a callback (`personas.md` §2, §3, §6).

## Goals

1. Create a deliberate moment where a user chooses an account in exchange for something concrete.
2. Make that moment **save real work the user has already done** — never an interstitial.
3. Give the account continuing value so return visits happen.
4. Do not degrade the callback conversion.

## Constraints

- **Never gate evaluation behind signup.** All twelve questions must be answerable anonymously. Gating Q1-11 to harvest accounts would destroy the Passive Diversifier and Analyst journeys, both of which require extended anonymous evaluation before any commitment.
- **The value exchange must be honest and immediate.** Not "sign up for updates." Something the user can see they are getting, at the moment they get it.
- Anonymous work must survive the transition — a user who built a comparison then signed in keeps it. Precedent exists: `/api/suitability/response` upserts by `sessionId` and attaches `userId` when a session appears. Reuse that pattern.

## Direction

**The moment is saving work, not creating an account.** The user builds a comparison (03) or completes suitability (04), then saves it. Account creation is the mechanism, not the ask. The prompt should read as *"save this"* and never as *"create an account."*

Candidate ongoing value, to be settled at expansion time:
- Monthly report **scoped to saved funds** — `PerformanceReport` infrastructure already exists
- NAV movement on watchlist funds
- NFO alerts for tracked strategies (dependency for spec 08)
- Suitability result retained and revisitable

**Fix the auto-create defect.** Options range from keeping auto-create but adding an explicit save-and-claim moment afterwards, to requiring a deliberate act before user creation. This is the main open question for expansion, and it has an auth-flow blast radius — `AUTH_FLOW_CHANGES_SUMMARY.md` documents prior churn here, so read it first.

⚠️ Auth changes are the highest-risk work in these eight specs. `src/auth.ts` carries five providers and a phone↔Google linking flow with cookie state. Whatever is chosen must not disturb linking. Expansion should treat auth modification as a last resort — prefer adding a moment *around* the existing flow to changing the flow itself.

**`/dashboard` becomes a destination with a reason.** Today it is reachable and pointless. It should be where saved work lives and where the return visit lands.

## Open questions for expansion

1. Does auto-create stay, with a claim moment layered on, or is it removed?
2. What exactly is the ongoing value? Report scoping is cheapest and likeliest.
3. Does anonymous saved work migrate on sign-in, and over what window?
4. Does the account moment appear in the homepage's constrained `CompareSurface` instance, or only on `/compare`?

## Verification

- [ ] All twelve spine questions answerable without an account
- [ ] Saving a comparison prompts account creation framed as saving work, not signup
- [ ] Anonymous work built before sign-in is present after sign-in
- [ ] `/dashboard` shows saved comparisons, watchlist, and suitability result
- [ ] Callback conversion rate does not regress — measure before and after
- [ ] Phone↔Google linking still works end to end (regression suite for `src/auth.ts`)
- [ ] Baseline metric from pre-flight has moved
- [ ] `question-depth-matrix.md` Q11 and Q12 updated
