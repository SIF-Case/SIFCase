# SIFcase — Product Logic

> **Authoritative reference for who SIFcase is for, what sequence they move through, and what counts as success.**
> Peer document to `DESIGN.md`. The seam: **DESIGN.md is how it looks. PRODUCT.md is who it's for and what it must do.**
> Load this before any product, UX, content, or information-architecture work. Do not load `personas.md` unless the task is about motivation or copy.

---

## 1. The Constraint That Defines Everything

**SIFs require a minimum investment of ₹10 lakh** (SEBI framework; accredited investors exempt). Encoded in `FundDetails.minInvestment` (default `1_000_000`) and stated in `src/components/sections/CTABand.tsx:59`.

Consequences that must never be forgotten:

1. **There is no beginner investor on this site.** Everyone who can act has ₹10L+ of investable surplus. A user may be *jargon-naive*, never *wealth-naive*. Never write copy that addresses a first-time investor.
2. **The audience is roughly the top 1-2% of Indian households.** Volume strategies are wrong. Depth and trust beat reach.
3. **Eligibility is the first question, not the last.** Today it lives in disclaimer voice at the bottom of the page. It belongs at the top, framed as a door.

## 2. Hard Constraints

| Constraint | Where | Implication |
|---|---|---|
| ₹10L minimum | `FundDetails.minInvestment`, `CTABand.tsx:59` | See above |
| **No transaction path** | No broker integration anywhere | The site never completes an investment. Every journey ends in a handoff or a saved intent. Never imply "invest now." |
| Homepage must stay ISR-cacheable | `src/proxy.ts` matches `["/"]` *specifically* so `/` never calls `auth()` | Homepage personalisation must be **client-side after hydration**. Server-side adaptation on `/` breaks static caching. |
| Public data is cache-tagged | `unstable_cache`, tag `sif-data`, TTL 2h (`src/lib/sifData.ts`) | Any write path changing fund data must `revalidateTag('sif-data')` |
| Advisory desk is first-party | `Client` model w/ `assignedTo`, `stage`, pipeline stages | Intermediaries (MFDs/RIAs) are **partners and a lead channel**, not competitors |

## 3. The Spine — 12 Questions

Every person must answer the same twelve questions before moving ₹10 lakh. This is the product's backbone.

| # | Question | Act |
|---|---|---|
| 1 | Does this apply to me? | I — Payoff |
| 2 | What's the payoff? | I — Payoff |
| 3 | What can't my current money do? | II — Gap |
| 4 | Is it legitimate? | II — Gap |
| 5 | What are the flavours? | II — Gap |
| 6 | What's the universe? | III — Machinery |
| 7 | How do I judge one? | III — Machinery |
| 8 | Which are actually good? | III — Machinery |
| 9 | What could go wrong? | III — Machinery |
| 10 | Does it fit my portfolio? | IV — Commitment |
| 11 | What's my shortlist? | IV — Commitment |
| 12 | How do I act? | IV — Commitment |

**Act structure is top-down (Minto), not curricular.** Lead with the destination; never build up to it.

- **Act I (Q1-2) — The Payoff.** Show the screenshot-worthy thing first. Never open with "what is a SIF."
- **Act II (Q3-5) — The Gap.** Productive dissonance: what the user's current portfolio *cannot* do. **Curiosity, not fear.** Fear converts once and poisons trust.
- **Act III (Q6-9) — The Machinery.** The real evaluation work. Normally where people leave; here the destination is already visible and the gap already felt, so the tax is pre-paid.
- **Act IV (Q10-12) — The Commitment.** Land a conversion.

## 4. The Compression Rule

**Nobody skips a question. They compress it.**

A fluent investor does not skip "is it legitimate" — they answer it in four seconds by reading *"SEBI framework, run by an AMC I already own."* A jargon-naive investor needs a full page for the identical question. Same question, ~100× depth difference.

**Therefore: every one of the 12 questions needs both a 10-second answer and a 10-minute answer, on the same surface.** Progressive disclosure is the core UI primitive, not a nicety.

A persona is a **compression profile**, not a different path:

| Persona | Q1-4 | Q5-7 | Q8-9 | Q10-12 |
|---|---|---|---|---|
| Qualified Novice | deep | deep | medium | assisted |
| Diversifier | fast | skip-to-difference | deep | self-directed |
| Passive Diversifier | fast | fast | deep + adversarial | slow, may exit |
| Intermediary (partner) | medium | deep once | deep, repeated | hands off a client |
| NFO Opportunist | instant | skip | fast | urgent |
| Family-Office Analyst | fast | fast | exhaustive | downloads, doesn't call |

**Never ask the user "which best describes you?"** A self-identification gate placed before you have given anyone a reason to care is a drop-off cliff. Infer depth preference from behaviour: did they open the explainer, did they go straight to `/compare`, did they scroll past the primer.

## 5. Architecture: One Spine, Two Express Lanes, One Partner Mode

- **Spine** — one information architecture, variable depth, serves four of six personas.
- **Express lane: NFO** — event-driven with a deadline. A feed, not a journey. (`CLOSING_SOON_DAYS = 7`, `unpublish-expired-nfos` cron.)
- **Express lane: Data** — terminal action is a download, not a conversation.
- **Partner mode** — same content plus shareability and a first-class client handoff into the advisory desk.

## 6. The Two Conversions

Both count. Neither is optional.

1. **Callback lead** — `CallbackPopup` → `/api/public/callback` → `Client`. Human advisory handoff. Serves assisted personas.
2. **Engaged account** — registered, watchlist populated, comparison saved. Serves self-directed personas and creates the return loop.

**Known defect:** the `phone-otp` provider in `src/auth.ts` **auto-creates users**. Accounts happen *to* people — no decision, no value exchange. That is why conversion 2 never fires despite `Watchlist`, `SavedCompare`, `RecentlyViewed`, and `/dashboard` all existing. See `refactor/06-account-moment.md`.

## 7. Invariants — check these on any product change

1. **Depth-pair.** Every question in `question-depth-matrix.md` has both a 10-second and a 10-minute surface. A missing cell is a build ticket, not an acceptable state.
2. **Conversion reachability.** Both conversions reachable from any public route in ≤2 deliberate actions.
3. **Jargon coverage.** Every term in the glossary has an inline definition available on evaluation surfaces. Learning is inline and dismissible, never a destination the user must leave for.
4. **Honest exit.** A user who does not qualify, or for whom SIF is genuinely wrong, must be told so plainly. The credibility of that exit is what makes the other eleven steps trustworthy — and it is the only argument that works on the Passive Diversifier.
5. **No fear-selling.** Act II is a curiosity gap. Scarcity and loss-framing are prohibited outside the NFO express lane, where deadlines are factual.

## 8. Map

- `question-depth-matrix.md` — the bridge from journey intent to code. Twelve rows, every cell a path or a gap.
- `personas.md` — six narratives. Reference only; load for motivation and copy work.
- `refactor/00-index.md` — eight specs, dependency graph, execution order.
