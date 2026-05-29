## Goal

Turn `/market` (the "SIFs Universe" tab) from a static gainers/losers board into a **live ecosystem terminal** that answers *"What is happening in the SIF universe right now?"* — maximum analytical density in optimum space. Only widgets that add a unique read; no decoration.

---

## Page structure (single scroll, no tabs)

```text
1. Hero · Regime Strip          (status of the ecosystem in one glance)
2. Smart Metrics                (8 SIF-native KPIs, not Nifty/Sensex)
3. Strategy Flows Map           (where money is moving this month)
4. SIF Heatmap                  (single dense grid: every fund, color-coded)
5. Top Discoveries              (6 lenses, tabbed, one row each)
6. AMC Leaderboard              (institutional comparison)
7. Universe Explorer            (chip-driven progressive filter)
8. AI Insights                  (3 generated reads, regenerated on timeframe)
9. Footer CTA → /explore        (full screener handoff)
```

Global **timeframe selector** (1M · 3M · 6M · 1Y) lives in the hero and drives every widget that reads returns/flows. No per-widget timeframe pickers.

---

## 1. Hero · Regime Strip

Compact, one band — replaces current `<h1>` block.

- Left: "SIFs Universe" eyebrow + timestamp ("Live · updated 2 min ago").
- Right: 4 status pills, color-coded:
  - **Market Regime** — Risk-On / Neutral / Risk-Off (derived from avg 1M return + vol)
  - **Long-Short Flows** — Increasing / Stable / Declining
  - **Cash Allocation** — Elevated / Normal / Low
  - **Volatility** — Calm / Stable / Elevated
- Below: timeframe segmented control (1M · 3M · 6M · 1Y).

Single row, ~88px tall. No big H1.

## 2. Smart Metrics (replaces the current Nifty/Sensex strip)

8 SIF-native cells, 4×2 grid on desktop, 2×4 mobile:

| Cell | Source |
|---|---|
| Total SIF AUM | sum FUNDS.aum |
| Net Monthly Inflows | computed from `flows` (new field) |
| Active SIFs | FUNDS.length |
| Highest Flow Strategy | top strategy by inflow |
| Avg Sharpe | mean metrics.sharpe |
| Avg Cash Allocation | mean of new `cashPct` field |
| Hedge Activity | derived (Elevated / Normal / Low) |
| New Launches (30d) | count from UPCOMING + recent |

Each cell: label (mono caps), value (tabular), delta vs prior period (tiny).

## 3. Strategy Flows Map

Single horizontal stacked bar **plus** a ranked list — together in one card.

- Top: 100%-stacked bar across strategies (Long-Short, Market Neutral, Multi-Asset, Quant, Event Driven, Arbitrage, Credit Opps), colored by strategy.
- Below: ranked rows with `███ 42% · +₹820Cr` style — % share + absolute net flow + tiny arrow.
- Hover any segment → row highlights and vice-versa.

One widget, two reads (distribution + magnitude). No separate pie.

## 4. SIF Heatmap

The signature widget. Dense grid of every fund as a tile.

- Tile size ∝ AUM (treemap-style, simple flex/grid bucket — not a true D3 treemap; group by strategy, size proportionally inside group).
- Tile color = chosen metric (selector inside card header): **Return** (default) · **Sharpe** · **Drawdown** · **Net Flow**.
- Green → strong / Red → weak, neutral grey at zero. Uses existing `--color-positive` / `--color-negative` with opacity stops.
- Hover: tooltip with name, AMC, metric value, AUM, 1Y.
- Click: navigate `/fund/$id`.
- Group headers (strategy name + count) above each bucket.

Replaces the old gainers/losers split — same intel, far denser, scannable in 2 seconds.

## 5. Top Discoveries

Tabbed strip with 7 lenses; each tab shows top 5 as compact rows (name · AMC · the relevant metric · sparkline).

Tabs: Top Performers · Lowest Drawdown · Highest Sharpe · Most Consistent · Highest Inflows · New Launches · Rising Strategies.

"Most Consistent" = lowest std-dev of monthly returns (derive from sparkline). "Rising Strategies" shows strategies (not funds) with biggest flow delta.

One card, switches in-place — no vertical bloat.

## 6. AMC Leaderboard

Compact table, sortable by column header:

```text
AMC | Funds | AUM | Avg 1Y | Avg Sharpe | Net Flow | Trend (sparkline)
```

10 rows max, scrollable. Tiny AMC initial badge in first column. Click row → filtered `/explore?amc=...` (deep link).

## 7. Universe Explorer

Chip cloud (existing visual language). Chips:

`Long-Short · Quant · Low Volatility · High Alpha · New Funds · High Cash · Defensive · Aggressive · Top Quartile · High Sharpe`

Each chip has logic (e.g. *Defensive* = drawdown > -10% & vol < 12%). Clicking applies a filter and renders a horizontally-scrolling fund strip beneath the chips (10–12 cards from shared `FundCard`). Multi-select with AND. "Clear all" pill when active.

Progressive discovery in <60px when idle, expanding when used.

## 8. AI Insights

3 short generated reads in a single card (mono label "INSTITUTIONAL INSIGHT", body text). Dummy strings derived from current metrics (e.g. "Cash-heavy long-short funds are gradually increasing directional exposure amid improving midcap breadth."). Regenerate when timeframe changes. Subtle "AI" badge.

## 9. Footer CTA

One-line band: "Explore all 142 SIFs →" → `/explore`. Done.

---

## Data shape additions (`src/lib/data.ts`)

Append to each `Fund`:
- `flows: { m1: number; m3: number; ytd: number }`  // ₹Cr net flow
- `cashPct: number`  // 0–100
- `launchDate: string`  // ISO, for "New Launches"

Add module:
- `STRATEGY_FLOWS` — pre-computed strategy-level aggregates by timeframe (1M/3M/6M/1Y).
- `REGIME` — function deriving regime pills from FUNDS + timeframe.
- `AI_INSIGHTS` — array of templated insight generators keyed by timeframe.

All dummy data; shape locked for later DB swap.

---

## Files

**New**
- `src/components/market/RegimeStrip.tsx`
- `src/components/market/SmartMetrics.tsx`
- `src/components/market/StrategyFlowsMap.tsx`
- `src/components/market/SifHeatmap.tsx`
- `src/components/market/TopDiscoveries.tsx`
- `src/components/market/AmcLeaderboard.tsx`
- `src/components/market/UniverseExplorer.tsx`
- `src/components/market/AiInsights.tsx`
- `src/hooks/use-timeframe.ts` — shared `1M|3M|6M|1Y` state via URL search param

**Edited**
- `src/routes/market.tsx` — full rewrite, just composes the 8 sections
- `src/lib/data.ts` — add `flows`, `cashPct`, `launchDate`, `STRATEGY_FLOWS`, `REGIME`, `AI_INSIGHTS`

---

## Design rules

- Reuse existing tokens (`--color-positive`, `--color-negative`, `--color-gold`, `surface`, `border`). No new colors.
- Mono caps eyebrows, tabular numerals everywhere financial.
- Every widget fits in ≤ one viewport height on desktop where possible. Heatmap is the only tall one.
- All values, regime pills, insights re-derive from the global timeframe (URL param `tf`, default `1M`) so deep links share state.
- Keyboard-accessible chips, sortable headers with `aria-sort`.

## Out of scope

- Real backend / websockets (all "live" is dummy + `setInterval` jitter on 2–3 cells max).
- True D3 treemap (bucketed flex grid is enough and faster).
- Saved views, alerts, user accounts.
