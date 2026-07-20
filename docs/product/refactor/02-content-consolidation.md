# 02 — Consolidate Content, Make Learning Inline

> **Status:** Not started · **Fidelity:** Interface · **Depends on:** — · **Blocks:** 05
> **Written against:** commit `29b97f8` (main), 2026-07-20
> **Spine:** Q5 (what are the flavours?), Q7 (how do I judge one?) · **Execution order: 4th**

> **Interface tier:** the taxonomy, the glossary contract, and verification are binding. Exact URL structure and redirect map are settled in implementation against live analytics and Search Console.

## Pre-flight

- [ ] All three content systems still exist: `/sif-101/[topicId]`, `/read/[slug]` + `/read/subcategory/[slug]`, `/docs/[section]/[article]`
- [ ] `next.config.ts` still carries the legacy `/read/what-is-a-specialized-investment-fund...` → `/sif-101/...` redirect
- [ ] `Article` still has `category` / `subcategory` / `order` / `status`
- [ ] `/api/revalidate-sif-101` still exists
- [ ] Pull current traffic per content route before deciding the canonical taxonomy

## Problem

### Three parallel content systems

| Route | Backing |
|---|---|
| `/sif-101`, `/sif-101/[topicId]` | education topics |
| `/read`, `/read/[slug]`, `/read/subcategory/[slug]` | `Article` |
| `/docs/[section]/[article]` | docs |

They overlap in purpose. `next.config.ts` already permanently redirects one legacy explainer from `/read/...` to `/sif-101/...` — **consolidation started by instinct and was never finished.** Costs: split SEO authority, ambiguous authoring target for admins, three navigation models, and no single answer to "where does this topic live?"

### Learning is a destination, not a layer

The deeper problem. Metrics literacy (Q7) exists **only** as pages the user must navigate to. To understand a term on `/compare`, the user leaves `/compare`.

**Leaving is where they do not come back.** For the Qualified Novice, `personas.md` §1 marks Q7 as the single biggest drop point in their journey — and the current architecture guarantees that drop by making the remedy an exit.

There is no inline definition affordance anywhere in the codebase.

### The compression conflict

`PRODUCT.md` §4: every question needs a 10-second and a 10-minute answer on the same surface. Q7 has only the 10-minute answer, on a different surface. The Novice needs the term explained where they meet it; the Diversifier needs it invisible. One destination page cannot do both — **an inline, on-demand layer does both by construction.**

## Goals

1. One content taxonomy, one canonical URL shape, no lost SEO.
2. An inline glossary affordance available on every evaluation surface.
3. Definitions collapsed by default — zero cost to a fluent user.
4. One authoring target for admins.

## Non-goals

- Rewriting content. This is architecture and delivery.
- Changing the admin article editor (TipTap) beyond adding a term-tagging affordance.
- AI-generated definitions. Glossary terms are authored.

## Target state

### One taxonomy

Consolidate to a single system. **`/sif-101` is the likely canonical root** — it is the redirect target already chosen, it is semantically the right name, and it holds the SEO the legacy redirect points at. Confirm against traffic in pre-flight before committing.

Migration rules:
- Every retired URL gets a `permanent: true` redirect. No 404s — some of these rank.
- Preserve `Article.category` / `subcategory` / `order` as the taxonomy backbone; they already model a hierarchy.
- One admin authoring surface. Consolidate `/admin/articles` and note in the admin UI where each piece surfaces publicly.

⚠️ Audit `sitemap.ts`, `robots.ts`, and `Article.canonicalUrl` in the same pass. Consolidating routes without updating canonicals actively harms rankings — worse than leaving it alone.

### The inline glossary — the load-bearing part

A term store, and a UI affordance that renders it in place.

```ts
interface GlossaryTerm {
  slug: string;          // "drawdown"
  term: string;          // "Drawdown"
  short: string;         // ≤140 chars — the 10-second answer
  full?: string;         // the 10-minute answer
  articleSlug?: string;  // deep link into consolidated content
  aliases?: string[];    // "max drawdown", "MDD"
}
```

Rules:

1. **Collapsed by default, always.** Fluent users must see no change. A dotted underline or equivalent per `DESIGN.md`; expansion is opt-in.
2. **Expands in place.** Never navigates away. This is the entire point — an inline definition that routes the user off-surface has reimplemented the current problem.
3. **`short` is the 10-second answer.** ≤140 characters, plain language, no jargon inside the definition (a definition that requires another lookup has failed).
4. **`full` and `articleSlug` are the 10-minute answer** — progressive, still without leaving.
5. **Available on every evaluation surface**: `CompareSurface` (03), `/sifs/[code]`, `/performance/[slug]`, `/suitability` (04), fund detail sections.

Seed the glossary from terms already in the codebase: `riskBand`, `exitLoad`, `TER`, `AUM` / `AAUM`, `NAV`, `benchmark`, `drawdown`, `rolling returns`, `CAGR`, `long-short`, `gross exposure`, `derivatives restrictions`, `lock-in`, `redemption notice period`, `alpha`. `FundDetails` field names and `CALCULATION_FORMULAS.md` are the source list.

### Coverage as a check

Jargon coverage is a `PRODUCT.md` §7.3 invariant and is mechanically checkable: enumerate rendered field labels on evaluation surfaces, assert each has a glossary entry or is on an explicit plain-language allowlist. Worth a script — it will catch every future field addition.

## Verification

- [ ] One canonical content root; all retired URLs `permanent: true` redirect, zero 404s
- [ ] `sitemap.ts` emits only canonical URLs; `Article.canonicalUrl` consistent
- [ ] Glossary term expands **in place** on `/compare` with no navigation
- [ ] Collapsed state is visually unobtrusive; fluent-user view unchanged
- [ ] Every `short` is ≤140 chars and contains no undefined jargon
- [ ] Coverage check passes on all evaluation surfaces
- [ ] Admins author in one place
- [ ] `question-depth-matrix.md` Q5 and Q7 updated — Q7 gains its missing 10-second layer
