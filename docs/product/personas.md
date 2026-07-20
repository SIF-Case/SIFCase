# Personas & Journeys

> **Reference document.** Load for motivation, copy, and microcopy work. For structural work load `PRODUCT.md` + `question-depth-matrix.md` instead — this file is long and mostly irrelevant to layout decisions.
> All six journeys traverse the same twelve questions (`PRODUCT.md` §3). They differ in **compression**, not in path.
> Surfaces marked *(build)* do not exist yet; see `refactor/`.

---

## 1. The Qualified Novice

**35, senior engineer or physician, ₹40-80L income. ~₹25L accumulated in mutual funds and FDs, largely by default — an SIP started in 2019 and never revisited.** Heard "SIF" from a colleague or a finfluencer clip. Cannot define alpha, drawdown, or TER without guessing.

**The reframe that matters: this person is jargon-naive, not wealth-naive.** They already qualify. They do not know they qualify. Every instinct to write "beginner investor" copy for them is wrong and will read as condescension to someone who out-earns the copywriter.

Core fear: *looking stupid in front of a professional, or being quietly taken.* Motivated — genuinely wants to learn, which is rare and should be rewarded with substance, not simplification.

**Hook: "You already qualify for a room you didn't know existed."**

| Q | Beat | Surface | Drop-off risk | Mitigation |
|---|---|---|---|---|
| 1 | *"Wait — I'm eligible?"* | Qualification moment *(build 01)* | Reads ₹10L as a barrier and leaves | Frame as door, not gate. Show it against *their* number, not in the abstract |
| 2 | Sees a real strategy doing something MFs can't | `HeroHeatmap`, `TopFunds` | Numbers mean nothing yet | Pair every figure with one plain sentence. No metric appears naked |
| 3 | *"My MFs can't do that?"* | Compare-vs-owned *(build 03)* | Feels called out for past choices | Never disparage their existing portfolio. Additive framing only |
| 4 | Relief — SEBI, real AMC, real trustee | `/sebi`, fund-house brand | Assumes anything unfamiliar is a scam | Lead with the AMC name they already own funds from |
| 5 | Learns Equity / Hybrid / Debt, long-short | `/sif-101` consolidated *(02)* | Hits a wall of terms | Inline definitions *(02)*. Never send them off-surface to learn |
| 6 | Sees the whole universe is small and knowable | `/sifs`, `UniverseMap` | Overwhelm | Lead with the count. "Thirty-odd funds" is reassuring; a grid of 30 cards is not |
| 7 | Learns to read one fund | Inline learning *(02)* | Abandons at metric literacy — **the single biggest drop point for this persona** | Teach exactly three metrics, not twelve. Defer the rest |
| 8 | First real opinion forms | `/compare` consolidated *(03)* | Analysis paralysis | Cap default comparison at 3 funds |
| 9 | Confronts downside honestly | Risk view *(gap, Q9)* | Fear spike → freeze | Give downside a number and a horizon. Vague risk language is scarier than specific loss figures |
| 10 | *"Does this fit me?"* | `/suitability` restored *(04)* | — | Output must be a recommendation, not a score |
| 11 | Names 2-3 funds | Save comparison → account *(06)* | Loses work, never returns | Saving is the account moment. Value exchange is explicit |
| 12 | Asks for a human | `CallbackPopup` | Embarrassed to admit gaps | Frame the call as normal for this ticket size, not remedial |

**Primary conversion: callback.** Secondary: account. This persona wants a person.

---

## 2. The Diversifier

**48, ₹2-5cr portfolio across mutual funds, direct equity, possibly PMS and real estate.** Fluent: CAGR, Sharpe, rolling returns, expense ratio, exit load. Time-poor. Evaluates in one session, at night, on a laptop, with tabs open.

Will bounce off anything resembling a course. Their real question is not "what is a SIF" — it is **"is this genuinely differentiated, or repackaged beta with a new fee?"** Answer that fast and honestly or lose them.

**Hook: data density on arrival. Comparison, not curriculum.**

| Q | Beat | Surface | Drop-off risk | Mitigation |
|---|---|---|---|---|
| 1 | Eligibility is a non-event | Qualification *(01)* | Patronised by an onboarding flow | Must be skippable in one action. Never block |
| 2 | Wants the return stream, not the concept | `HeroHeatmap` | Sees a marketing page and closes the tab | Numbers above the fold. No hero copy before data |
| 3 | *"How is this not my PMS?"* | Compare-vs-owned *(03)* | Concludes "repackaged," leaves permanently | Answer directly and early — long-short mechanics, gross exposure, what MFs are barred from |
| 4 | Four-second legitimacy check | AMC name on card | — | Brand visible without a click |
| 5 | Skips to what differs | `FundDetails.howItWorks` | Forced through a primer | Primer collapsed by default at this depth |
| 6 | Scans the universe | `/sifs` | Weak filtering | Filter by strategy, AMC, risk band, inception |
| 7 | Already literate | — | Inline definitions clutter the view | Definitions on demand only, never expanded by default |
| 8 | **The main event** | `/compare` *(03)* | Missing metric → goes to a competitor | Rolling returns, drawdown, benchmark delta, category average, TER |
| 9 | Reads exit load, lock-in, tax | `FundDetails` fields | Buried fine print | Assemble into one risk view. Do not scatter |
| 10 | Sizes an allocation | `/suitability` *(04)* | Won't take a quiz | Offer a direct sizing tool; quiz optional |
| 11 | Shortlists 2-3 | `SavedCompare` *(06)* | — | Save without friction; account on the save |
| 12 | Acts alone | Account, monthly report | Callback CTA reads as a sales trap | Make self-directed the primary path. Callback secondary and quiet |

**Primary conversion: engaged account.** This persona does not want a phone call.

---

## 3. The Passive Diversifier

**43, ₹1-3cr overwhelmingly in index funds and ETFs. Bogle orthodoxy, held with conviction.** Prior belief: *active management loses to the index after fees.* That belief is well-evidenced and they know it.

**The hardest and most interesting persona.** Pitching them alpha fails by construction — their entire worldview rejects it, and attempting it marks you as unserious. The only door is that a long-short strategy produces a **different return stream**, which is a *diversification* argument an indexer already accepts. Correlation, not outperformance.

Their journey must also be genuinely willing to end in *"SIF isn't for you."* The credibility of that exit is what makes the preceding eleven steps trustworthy.

**Hook: portfolio math. Non-correlation, not alpha.**

| Q | Beat | Surface | Drop-off risk | Mitigation |
|---|---|---|---|---|
| 1 | Eligibility trivially met | Qualification *(01)* | — | Skippable |
| 2 | **Correlation, not returns** | Correlation view *(build, Q3)* | Any alpha claim ends the session immediately | Lead with return-stream difference. Never lead with outperformance |
| 3 | *"My index funds are all one bet"* | Compare-vs-owned *(03)* | — | **This is the whole journey for this persona.** Everything else is support |
| 4 | Checks regulatory reality | `/sebi` | — | — |
| 5 | Long-short mechanics | `howItWorks` | Suspects complexity hides fees | Show TER next to mechanics, unprompted |
| 6 | Universe scan | `/sifs` | Small universe reads as immature | State it plainly: new category, thin track record. Owning the weakness buys the trust |
| 7 | Already literate, adversarially so | — | — | — |
| 8 | Interrogates evidence | `/performance`, `categoryAverages` | **Short track record** — the genuine, unfixable objection | Never extrapolate. Show inception dates prominently. Do not annualise sub-year returns |
| 9 | Hunts for hidden risk | Risk view *(gap)* | Finds something undisclosed → total trust loss | Disclose derivatives limits, gross exposure, leverage before being asked |
| 10 | Runs the portfolio math | Suitability + sizing *(04)* | — | Support a small satellite allocation, 5-10%. Do not push more |
| 11 | Small position or none | `SavedCompare` *(06)* | — | A 5% allocation is a **win**, not a failure |
| 12 | Decides slowly, alone | Monthly report subscription | Rushed → permanent exit | **Let them leave well.** Report subscription keeps the door open for a year |

**Primary conversion: monthly report + account.** Callback is counterproductive here. Expect a long, honest sales cycle — and accept "no" as a legitimate outcome that preserves reputation.

---

## 4. The Intermediary (MFD / RIA) — **partner**

**Independent distributor or advisor with HNI clients who are asking about SIFs.** Needs literacy fast because a client raised it and "I'll get back to you" costs credibility. Uses SIFcase as a research and client-explanation tool: screenshots comparisons, forwards the monthly report, cites category averages in review meetings.

**The advisory desk is first-party** (`Client` w/ `assignedTo`, pipeline stages), so this persona is a **lead channel, not a competitor.** Their conversion is *handing you a client.* Today the product has no door for that — the CRM models it, the public site does not expose it.

**Hook: "Be the person in the room who understands SIFs."**

| Q | Beat | Surface | Drop-off risk | Mitigation |
|---|---|---|---|---|
| 1 | Eligibility is client-side knowledge | Qualification *(01)* | — | Frame as a client-screening tool |
| 2 | Needs an explainable payoff | `HeroHeatmap` | Can't re-explain it to a client | Optimise for *retellability*, not just comprehension |
| 3 | Positions vs. client's existing book | Compare-vs-owned *(03)* | — | Highest-value surface for this persona |
| 4 | Compliance-grade legitimacy | `/sebi` | Regulatory ambiguity | Cite framework and dates precisely |
| 5-7 | **Deep, once.** Then fluent forever | `/sif-101` *(02)* | — | One coherent path, completable in a sitting |
| 8 | Repeated evaluation, per client | `/compare` *(03)* | Can't share output | **Shareable comparison links** *(07)* |
| 9 | Must disclose risk accurately | Risk view *(gap)* | Liability exposure | Exportable, dated, citable |
| 10 | Runs suitability *for* a client | `/suitability` *(04)* | Single-user assumption | Multi-client mode *(07)* |
| 11 | Builds a client shortlist | Partner workspace *(07)* | — | Saved sets per client |
| 12 | **Hands off the client** | Refer action → `Client{source:"partner"}` *(07)* | **No door exists today** | First-class referral with attribution |

**Primary conversion: referred client.** Highest leverage per user on the entire site — one intermediary can deliver many qualified leads.

---

## 5. The NFO Opportunist

**Already invests in SIFs, PMS, or AIFs. Watches new launches the way IPO investors watch IPOs.** Wants open subscription windows, days remaining, allotment dates, subscription price. Zero education need, extreme time-sensitivity.

The codebase already serves them structurally — `CLOSING_SOON_DAYS = 7`, `daysLeft`, the `unpublish-expired-nfos` cron — but they must **poll manually.** `Watchlist` exists with no notification path.

**Hook: "Every open SIF NFO in India, one page, with a countdown."**

| Q | Beat | Surface | Drop-off risk | Mitigation |
|---|---|---|---|---|
| 1-4 | Instant. Already qualified and convinced | — | Any onboarding friction | Express lane bypasses the spine entirely |
| 5-6 | Knows the category and universe | `/nfos` | Stale or incomplete listings | Completeness is the entire value proposition |
| 7 | Fluent | — | — | — |
| 8 | Judges *this* NFO vs. existing funds | `/nfos/[slug]` → `/compare` | NFO has no track record by definition | Compare against category and AMC history instead |
| 9 | Exit load, lock-in, allotment terms | `Nfo` fields | — | Surface above the fold |
| 10 | Sizing against an existing book | — | — | — |
| 11 | Tracks several open windows | Watchlist + **alerts** *(08)* | **Misses a close date — catastrophic, never returns** | Email/SMS on T-3 and T-1 |
| 12 | Acts fast, often self-directed | Account, or callback if urgent | Slow path loses the window | One-click callback flagged urgent |

**Primary conversion: engaged account with alerts enabled.** Highest intent on the site; currently the least supported.

---

## 6. The Family-Office Analyst

**26-32, analyst at a family office or MFO, handed a mandate: "should we allocate to SIFs?"** Output is a memo for an investment committee. Needs the full universe, AUM trends, AMC-level breakdown, historical NAV series, and a **citable** monthly source.

Wants a CSV, not a conversation. `SifAum.byAmc`, `scripts/export_fund_details_excel.js`, `sif_nav_history.xlsx`, and `PerformanceReport` with `niftyReturn` serve exactly this need — all of it locked behind admin scripts.

**Hook: rigour, completeness, and "cite us."**

| Q | Beat | Surface | Drop-off risk | Mitigation |
|---|---|---|---|---|
| 1-2 | Institutional context; minimum is irrelevant | — | — | Skip the spine |
| 3 | Frames SIF vs. AIF vs. PMS for the committee | Category comparison *(gap)* | No institutional framing anywhere | Add a category-level positioning page |
| 4 | Regulatory citation with dates | `/sebi` | Imprecision fails committee review | Cite circulars and dates exactly |
| 5-6 | **Exhaustive universe work** | `/sifs`, `SifAum.byAmc` | Can't export | **Public data export** *(08)* |
| 7 | Fluent; needs methodology | Methodology page *(gap)* | Unexplained calculations are unciteable | Publish return methodology. `CALCULATION_FORMULAS.md` exists — make it public |
| 8 | Full history, all funds | `/performance`, NAV series | Sampled or truncated data | Complete series or clearly state limits |
| 9 | Risk framework | Risk view *(gap)* | — | — |
| 10 | Allocation modelling | Export → own model | Won't use your tool anyway | Optimise for export quality, not for on-site tooling |
| 11 | Recommends a set in the memo | — | — | — |
| 12 | **Downloads. Cites. Returns monthly** | Report + export *(08)* | Treated as a lead → alienated | **Do not gate exports behind a callback.** Gate behind an account at most |

**Primary conversion: engaged account + recurring report.** Never a callback. Converts to the largest ticket sizes on the site, indirectly and slowly.

---

## Considered and cut

| Candidate | Why cut |
|---|---|
| **NRI investor** | Genuine segment with real needs (FEMA, repatriation, DTAA). But `FundDetails.taxationSummary` is generic and there is **zero** NRI-specific surface in the codebase. Writing this persona would be fiction. Revisit if NRI content is ever built. |
| **Journalist / researcher** | Uses the data, never converts, no product decision changes because of them. |
| **AMC product manager** | Real traffic, competitive intelligence, zero conversion. Arguably should be rate-limited rather than served. |
| **Retail investor below ₹10L** | Structurally ineligible. Correctly served by the honest exit in `refactor/01`, not by a journey. |
