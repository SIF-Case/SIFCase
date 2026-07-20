# 03 — Consolidate Comparison into One Surface

> **Status:** Not started · **Fidelity:** Interface · **Depends on:** — · **Blocks:** 06, 07, 05
> **Written against:** commit `29b97f8` (main), 2026-07-20
> **Spine:** Q3 (what can't my current money do?), Q8 (which are actually good?) · **Execution order: 3rd**

> **Interface tier:** data contracts, public interface, and verification are complete and binding. Internal component layout is deliberately not specified — settle it in implementation against the code as it stands then.

## Pre-flight

- [ ] All four components still exist at the sizes below
- [ ] `src/app/page.tsx` and `src/app/compare/ComparePageClient.tsx` are still the only consumers
- [ ] Graph still reports `ui-group` → `lib-export` as the top coupling hotspot (`get_architecture_overview`)
- [ ] `SavedCompare` still stores `{ userId, name, period }` + fund set
- [ ] `getTopFunds()` still backs `/compare`

## Problem

**Four components do comparison:**

| Component | Lines |
|---|---|
| `sections/CompareLab.tsx` | 482 |
| `sections/BuildYourCompare.tsx` | 372 |
| `sections/CompareFunds.tsx` | 221 |
| `sections/SIFComparisonTable.tsx` | 115 |
| **Total** | **1,190** |

Consumed by `src/app/page.tsx` and `src/app/compare/ComparePageClient.tsx`.

Two symptoms, one defect:

1. **UX** — the user meets several different comparison affordances with different capabilities and no clear canonical one. Q8 is the Diversifier's main event and the Analyst's core work; fragmentation costs both.
2. **Code health** — the knowledge graph flags `ui-group` → `lib-export` at **75 CALLS edges**, the worst coupling in the codebase. These four components are a large part of it: four implementations each reaching independently into `sifData` / `categoryAverages`.

**And the capability that matters most is missing.** All four compare SIF-to-SIF. Nothing compares a SIF to **what the user already owns**.

- The **Passive Diversifier** cannot be served at all without it. Their thesis is non-correlation, not alpha (`personas.md` §3); "fund A beat fund B" is irrelevant to someone who does not believe in manager selection. Q3 is their entire journey.
- The **Diversifier**'s decisive question is *"how is this not my PMS?"* — also Q3.
- The **Intermediary** positions against a client's existing book — Q3 again.

Three of six personas are blocked on one absent capability.

## Goals

1. One comparison surface, one implementation, one entry point.
2. Add **compare-vs-owned** — the missing Q3 capability.
3. Cut the `ui-group` → `lib-export` edge count materially.
4. Preserve every capability currently reachable in any of the four.

## Non-goals

- Redesigning the visual language. `DESIGN.md` governs; this is structural.
- Portfolio import, broker integration, or holdings sync. Owned holdings are **user-entered and client-side** — see below.
- Changing `sifData` read functions or cache tags.

## Target state

**One `CompareSurface` with explicit modes.**

| Mode | Answers | Consumer |
|---|---|---|
| `pick` | choose funds to compare | entry, tray |
| `funds` | SIF vs SIF (today's behaviour) | Q8 |
| `owned` | SIF vs what I hold | **Q3 — new** |
| `category` | SIF vs category average | Q8, uses `getCategoryAverageSeries` |

Homepage embeds a constrained instance (`pick` + `funds`, capped at 3 — see cognitive-load note). `/compare` mounts the full surface. **One component, two configurations** — not two components.

### Compare-vs-owned — data contract

**Owned holdings never leave the browser** unless the user explicitly saves them to their account. A user's portfolio is the most sensitive thing they could give this site, the site has no need for it, and asking for it server-side changes the trust relationship. Default: `localStorage` only.

```ts
interface OwnedHolding {
  kind: "mutual-fund" | "index-fund" | "etf" | "direct-equity" | "pms" | "other";
  label: string;        // user-entered, free text
  category?: string;    // optional, drives the comparison basis
  allocationPct?: number;
}
```

Entry is coarse by design — the user picks categories and rough weights, not ISINs. Precision here is false precision and a data-entry tax that will lose the user.

The comparison output must lead with **overlap and correlation**, not returns:
- what the SIF does that the held categories structurally cannot (long-short, derivatives beyond hedging, concentrated positions)
- where exposure already overlaps
- `FundDetails.mfEquivalent` and `FundDetails.portfolioFit` — the right content, currently stranded as free text on a fund page

⚠️ Do **not** present this as a returns comparison. Against an index fund over the available window a SIF will often look worse, and that framing loses the Passive Diversifier on a true statement badly framed. The honest and persuasive frame is *different return stream*, not *better returns*.

### Track-record honesty

SIF is a new category; inception dates are recent. Binding rules for every mode:
- Show inception date wherever a return is shown
- **Never annualise a sub-one-year return**
- When funds have different histories, state the comparable window explicitly

`navPerformance.ts` and `categoryAverages.ts` already right-align series; make the resulting window visible in the UI rather than implicit.

### Coupling

All four currently reach into the lib layer independently. Consolidate reads behind one hook or module boundary so `CompareSurface` has a single dependency edge into `sifData` / `categoryAverages`. Re-run `get_architecture_overview` after and record the delta.

### Cognitive load

Default to **3 funds**, not 4. `/compare` metadata advertises 4; 4-way comparison is where the Qualified Novice hits analysis paralysis (`personas.md` §1, Q8). Allow 4 as an explicit opt-in, default 3.

## Migration

1. Build `CompareSurface` alongside the existing four.
2. Move `/compare` (`ComparePageClient`) to it. Verify parity.
3. Move `src/app/page.tsx` to the constrained instance.
4. Delete all four only when `grep -rn` shows no remaining references.

Do not delete before both consumers are migrated. Steps 2 and 3 are separately revertible.

## Verification

- [ ] Every capability of the four components is reachable in `CompareSurface`
- [ ] `grep -rn "CompareLab\|CompareFunds\|BuildYourCompare\|SIFComparisonTable" src/` → no hits after migration
- [ ] `owned` mode works with zero network calls carrying holdings data — verify in the network panel
- [ ] Owned holdings persist across reload via `localStorage`; nothing is sent to any endpoint unless explicitly saved
- [ ] Inception dates render alongside every return figure
- [ ] No sub-one-year return is annualised anywhere in the surface
- [ ] `ui-group` → `lib-export` edge count measurably reduced; record before/after
- [ ] Homepage instance defaults to 3 funds
- [ ] `question-depth-matrix.md` Q3 and Q8 updated
