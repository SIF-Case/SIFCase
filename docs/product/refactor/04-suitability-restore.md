# 04 — Restore Suitability as a Distinct Instrument

> **Status:** Not started · **Fidelity:** Full · **Depends on:** — · **Blocks:** 05
> **Written against:** commit `29b97f8` (main), 2026-07-20
> **Spine:** Q10 (does it fit my portfolio?) · **Execution order: 1st**

## Pre-flight

- [ ] `next.config.ts` still contains the `/suitability` → `/sif-101/quiz` redirect
- [ ] `src/app/suitability/page.tsx` and `SuitabilityClient.tsx` still exist and compile
- [ ] `SuitabilityQuestion` still has `dimension` / `dimensionOrder` / `value`
- [ ] Both `SuitabilityResponse` and `SuitabilityQuizResponse` still exist
- [ ] Admin still has `/admin/suitability` authoring questions, and questions exist in the DB

## Problem

A complete feature ships but is unreachable.

`src/app/suitability/page.tsx` is fully built — renders `SuitabilityClient`, metadata *"Find My Ideal SIF — SIFcase"*, loads ticker navs. `next.config.ts` shadows it:

```ts
{ source: "/suitability", destination: "/sif-101/quiz", permanent: false }
```

Next.js resolves redirects before routing, so the page is dead code that still builds and deploys.

The redirect target is the **wrong instrument**. These measure different things:

| | `SuitabilityQuestion` | `KnowledgeQuiz` |
|---|---|---|
| Fields | `dimension`, `dimensionOrder`, `value` | `isCorrect`, `points` |
| Measures | who you are | what you know |
| Output | a fit recommendation | a pass/fail score |
| Spine question | **Q10** | Q7 |

Sending a user who asks *"does this fit my portfolio?"* to a literacy test answers a question they did not ask, and withholds the one they did.

⚠️ **Two competing persistence models store the same answers:**

| Model | File | Keyed by | Holds |
|---|---|---|---|
| `SuitabilityResponse` | `models/SuitabilityResponse.ts` | `sessionId`, `userId` nullable | `answers[]` w/ `dimension`, `selectedValue`, `completedAt` |
| `SuitabilityQuizResponse` | `models/QuizResponse.ts:57-73` | `userId` **required** | `totalScore`, **`recommendation`** (`:69`) |

`/api/suitability/response` writes the first (upsert by `sessionId`, attaches `userId` when a session exists — good, supports anonymous completion). The second holds the output field but cannot be written by an anonymous user. Neither alone supports *complete anonymously → see result → convert*, which is exactly the flow this feature needs. Both declare `strict: false`, so shape drift is silent.

## Goals

1. `/suitability` reachable and functional.
2. One persistence model for suitability answers, supporting anonymous completion.
3. The instrument outputs a **recommendation**, not a score.
4. The recommendation is actionable — it seeds a shortlist and a context-carrying callback.
5. `/sif-101/quiz` remains a separate literacy instrument, untouched.

## Non-goals

- Redesigning question content or dimensions (admin-authored at `/admin/suitability`).
- Any AI-generated recommendation. Deterministic mapping only, this pass.
- Touching `KnowledgeQuiz` / `KnowledgeQuizResponse`.

## Target state

**Route.** Remove the redirect from `next.config.ts`. `/suitability` serves its own page. Add prominent cross-links: `/suitability` → *"want to test your knowledge instead?"* → `/sif-101/quiz`, and the reverse. Two instruments, clearly distinguished, mutually discoverable.

**Model — consolidate onto `SuitabilityResponse`.** It is the one that supports anonymous completion, which is non-negotiable: forcing signup before the result destroys the conversion. Extend it:

```ts
// models/SuitabilityResponse.ts
dimensionScores: { type: Map, of: Number, default: {} }, // dimension → summed selectedValue
totalScore:      { type: Number, default: 0 },
recommendation:  { type: String, default: "" },          // profile key, not prose
recommendedAt:   { type: Date, default: null },
```

Deprecate `SuitabilityQuizResponse`. Leave the export in place with an `@deprecated` docblock pointing here; do not delete until a follow-up confirms zero reads. Check `/api/user/quiz-history` and `/api/admin/suitability` for readers before removing.

Set `strict: true` on the extended schema.

**Scoring — deterministic, in `src/lib/suitability.ts` (new).**

```ts
export function scoreDimensions(answers): Record<string, number>
export function deriveProfile(scores): ProfileKey
export function fundsForProfile(profile, funds): FundRow[]
```

`ProfileKey` is a small closed union (e.g. `"conservative-income" | "balanced-satellite" | "growth-satellite" | "not-yet-suitable"`). Keep the mapping table in one place; it will be tuned.

**Output surface.** On completion the user sees, in order:
1. Their profile in plain language — one sentence, no score, no percentage.
2. **2-3 named funds** matched to it, as `FundCard`s, with one line each on why.
3. Dual exit: *Save this shortlist* (→ account, spec 06) and *Talk to an advisor* (→ callback, carrying profile + shortlist).

**Callback context.** `/api/public/callback` must accept and persist a `suitabilityResponseId`, written onto `Client` (extend `Client` with `suitabilityResponseId?: ObjectId` and set `riskProfile` from the derived profile — `Client.riskProfile` already exists). An advisor opening the lead should see what the person answered.

## Honest exit

`"not-yet-suitable"` is a first-class outcome and must be shown plainly — no dark pattern, no soft-pedalling into a callback. Route those users to the same honest exit as spec 01 (`NotReadyToInvest`), with the report-subscription option so the door stays open. This is required by `PRODUCT.md` §7.4, and it is the mechanism by which the other outcomes become believable.

## Verification

- [ ] `/suitability` returns 200; no redirect in the response chain
- [ ] `/sif-101/quiz` still reachable and scores knowledge independently
- [ ] Anonymous user completes the flow and sees a recommendation without signing up
- [ ] Completing while logged out then signing in attaches the response to the user (`sessionId` → `userId`)
- [ ] Recommendation renders named funds, never a bare score or percentage
- [ ] A callback from this flow writes `suitabilityResponseId` and `riskProfile` onto `Client`
- [ ] `"not-yet-suitable"` renders the honest exit and does **not** surface a callback CTA
- [ ] `grep -rn "SuitabilityQuizResponse" src/` returns only the deprecated definition
- [ ] `question-depth-matrix.md` Q10 updated from 🔻 to ✅
