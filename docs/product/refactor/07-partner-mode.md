# 07 — Partner Mode for Intermediaries

> **Status:** Not started · **Fidelity:** Full · **Depends on:** 03 · **Blocks:** 05
> **Written against:** commit `29b97f8` (main), 2026-07-20
> **Spine:** Q8, Q10, Q12 (from an intermediary's seat) · **Execution order: 6th**

## Pre-flight

- [ ] `03-compare-surface` has landed — shareable comparisons depend on it
- [ ] `Client` still has `source`, `assignedTo`, `stage`, `estimatedAumLakhs`, `riskProfile`, `linkedUserId`
- [ ] `PipelineStages` still configurable at `/api/admin/pipeline-stages`
- [ ] `Role` + `ADMIN_PAGES` permission model unchanged (`src/lib/adminAuth.ts`)
- [ ] Confirm the advisory desk is still first-party — this spec's entire premise

## Problem

MFDs and RIAs with HNI clients arrive because a client asked about SIFs. They use SIFcase as a research and client-explanation tool: screenshotting comparisons, forwarding the monthly report, citing category averages in review meetings.

**The advisory desk is first-party.** `Client` carries `assignedTo`, `stage`, and configurable `PipelineStages` — there is a real sales operation behind this site. That makes the intermediary a **lead channel, not a competitor**. Their conversion is *handing over a client*.

**Today there is no door.** The CRM models partner-sourced leads (`Client.source` is a free string) but the public product exposes nothing: no share, no co-brand, no referral, no attribution. An intermediary who wants to send you a client has to do it by email.

This is the **highest-leverage unserved persona on the site** — one intermediary can deliver many qualified leads, each pre-screened for the ₹10L floor by someone who already knows the client's finances.

## Goals

1. Make comparison output shareable with a client.
2. Give intermediaries a first-class referral action with attribution.
3. Let an intermediary run suitability *for* a client, not just themselves.
4. Route referred clients correctly through the existing CRM.

## Non-goals

- Commission tracking, payouts, or any settlement. Out of scope, and probably out of product.
- A separate partner app or subdomain. Partner mode is a capability on the existing product.
- Full white-label. Co-branding only — see constraint below.
- Partner self-serve onboarding. Manual admin approval this pass.

## Target state

### Shareable comparisons

A comparison built in `CompareSurface` (03) produces a stable public URL. `/compare` already accepts `?funds=CODE1,CODE2` — extend rather than invent:

- Share link renders read-only, no tray, no editing
- Optional partner attribution line ("Prepared by <name>")
- Dated, because fund data moves — a shared comparison must show its as-of date or it becomes misleading the day after
- No login required for the recipient. The client is not your user yet, and requiring signup to view what their advisor sent is hostile

⚠️ **Track-record rules from spec 03 apply doubly here.** A shared comparison is used in a client meeting and may be treated as advice. Inception dates visible, no annualised sub-year returns, comparable window stated.

### Referral with attribution

A "refer this client" action writing to `Client`:

```ts
source: "partner"
referredByUserId: ObjectId   // new field → User
referredAt: Date             // new field
assignedTo: <desk routing>
stage: <first stage from PipelineStages>
```

Carry context where it exists: `suitabilityResponseId` and `riskProfile` from spec 04, and the shared comparison. A referral arriving with the client's profile and shortlist is worth far more to the desk than a name and number.

**Consent is required.** The intermediary is handing over a third party's contact details. The referral form must require explicit confirmation that the client has agreed to be contacted, and that confirmation must be stored on the `Client` record with a timestamp. This is not optional — it is a real obligation under Indian data protection law and a genuine one regardless.

### Partner identity

Partners are `User`s with a partner marker. Reuse the existing `Role` machinery (`src/lib/adminAuth.ts`) rather than inventing a parallel permission system:

- A `partner` role granting partner capabilities and **no** admin page access
- `isInternalStaff()` must continue to return the correct answer — a partner is **not** internal staff, and must never see `/admin`
- Manual admin approval to grant the role

⚠️ Verify carefully that partner-role users cannot reach `/admin` or any admin API. `requirePageAccess` redirects on missing permissions, but `hasAnyPageAccess` is permissive across page sets — audit both against a partner-role user before shipping. A partner seeing another advisor's client list would be a serious breach.

### Multi-client suitability

An intermediary running `/suitability` for a client needs the result labelled and retrievable, not overwriting their own. `SuitabilityResponse` is keyed by `sessionId` with a nullable `userId` (spec 04), which accommodates this: a partner-initiated run gets its own `sessionId` plus a client label. Do not overload the partner's own `userId` row.

### Co-branding limit

Partner name and logo on shared artifacts. SIFcase attribution and data-source badges (`SourceBadge`) **always remain**. Never allow a shared artifact to appear to originate from the partner — the data provenance is yours, the liability follows the provenance, and `DESIGN.md`'s source-badge discipline exists precisely for this.

## Verification

- [ ] Share URL renders read-only for a logged-out recipient
- [ ] Shared comparison shows as-of date and inception dates; no annualised sub-year returns
- [ ] Referral writes `source: "partner"`, `referredByUserId`, `referredAt`, and routes via `PipelineStages`
- [ ] Referral carries `suitabilityResponseId` and `riskProfile` when available
- [ ] Client consent confirmation required and persisted with timestamp
- [ ] Partner-role user cannot reach `/admin` or any `/api/admin/*` route — test explicitly
- [ ] `isInternalStaff()` returns `false` for partner-role users
- [ ] Partner cannot see any `Client` they did not refer
- [ ] SIFcase attribution and source badges present on all shared artifacts
- [ ] Partner-run suitability does not overwrite the partner's own result
