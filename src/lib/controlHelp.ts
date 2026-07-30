import type { HelpCopy } from "@/components/ui/HelpTip";

// Plain-language explanations for the controls on the comparison lab and the
// fund detail page. Kept out of the components so the copy can be reviewed as
// copy — see docs/product/PRODUCT.md §4 on jargon-naive but not wealth-naive
// readers: explain the mechanic, never the concept of investing.

// ── Homepage: "Build your comparison" / multi-fund performance lab ────────────

export const COMPARE_VIEW_HELP: Record<string, HelpCopy> = {
  Cumulative: {
    title: "Cumulative return.",
    body: "Total % gained or lost since day one. A line at +10% means ₹100 invested at the start is worth ₹110 today.",
  },
  Drawdown: {
    title: "Drawdown.",
    body: "The biggest fall from a fund's peak value — the worst dip an investor would have felt before it recovered.",
  },
  Rolling: {
    title: "Rolling returns.",
    body: "Returns measured over a moving window instead of one fixed start date — better for judging consistency over time.",
  },
  Volatility: {
    title: "Volatility.",
    body: "How much returns swing up and down day to day. Higher volatility means a bumpier ride, not necessarily a worse outcome.",
  },
};

export const COMPARE_PERIOD_HELP: Record<string, HelpCopy> = {
  "1M": { body: "Shows only the last 1 month of NAV history on the chart." },
  "3M": { body: "Shows only the last 3 months of NAV history on the chart." },
  "6M": { body: "Shows only the last 6 months of NAV history on the chart." },
  "1Y": { body: "Shows the last 1 year of NAV history on the chart." },
  SI: {
    title: "Since inception.",
    body: "The fund's entire history, starting from its very first NAV.",
  },
};

// SI ("Since Inception") return-period pill, used wherever a fund's returns
// table lets you pick 1M/3M/6M/1Y/SI (Leaderboard, Explore funds, Performance
// Lab, Quick Compare, fund-house cards) — SI is the only period abbreviation
// not self-evident, so it's the only one that gets a tooltip.
export const SI_PERIOD_HELP: HelpCopy = {
  title: "Since inception.",
  body: "Return from the fund's very first NAV to today.",
};

// Return-period pills where the period picks *which return* is shown (Leaderboard,
// Explore funds table, Quick Compare) — as opposed to COMPARE_PERIOD_HELP, where the
// period zooms a chart. Kept separate so the copy can say "return" rather than "chart".
export const RETURN_PERIOD_HELP: Record<string, HelpCopy> = {
  "1M": { body: "Return over the last 1 month." },
  "3M": { body: "Return over the last 3 months." },
  "6M": { body: "Return over the last 6 months." },
  "1Y": { body: "Return over the last 1 year." },
  SI: SI_PERIOD_HELP,
};

// Jargon metric labels shown as short column headers or stat tiles — Leaderboard
// cards, Explore funds table, Quick Compare, comparison table.
export const METRIC_HELP: Record<string, HelpCopy> = {
  NAV: { title: "NAV.", body: "Net Asset Value — the price of one unit of the fund today." },
  AUM: { title: "AUM.", body: "Assets Under Management — the total money the fund currently manages." },
  Sharpe: { title: "Sharpe ratio.", body: "Return earned per unit of risk taken. Higher is better — above 1 is generally considered good." },
  Drawdown: { title: "Max drawdown.", body: "The biggest fall from the fund's peak value to its lowest point after." },
  Volatility: { title: "Volatility.", body: "How much returns swing up and down day to day. Higher means a bumpier ride, not necessarily a worse outcome." },
  Category: { title: "Category.", body: "Whether the fund invests mainly in equities, a mix of equity and debt (hybrid), or fixed income (debt)." },
  Return: { title: "Return.", body: "% gained or lost over the selected period, before tax." },
};

// Category filter pills (All/Equity/Hybrid/Debt) — Leaderboard, Explore funds,
// Universe Map.
export const CATEGORY_FILTER_HELP: Record<string, HelpCopy> = {
  All: { body: "Shows every SIF, regardless of category." },
  Equity: { title: "Equity.", body: "Predominantly invest in equities/equity-related instruments, using strategies like long-short, sector rotation, or ex-Top 100 long-short, with short exposure capped at 25% via derivatives." },
  Hybrid: { title: "Hybrid.", body: "Combine equity, debt, and other asset classes (including REITs/InvITs and commodity derivatives) through active, dynamic asset allocation, with long-short positions on both sides." },
  Debt: { title: "Debt.", body: "Predominantly invest in fixed-income instruments like bonds and credit, with strategies such as sectoral debt long-short, aimed at investors seeking relative stability." },
};

// Every row label in the side-by-side comparison table (/compare) — this table
// is the densest jargon surface on the site, so every non-obvious label gets one.
export const COMPARE_ROW_HELP: Record<string, HelpCopy> = {
  ISIN: { title: "ISIN.", body: "The unique 12-character code that identifies this exact fund and plan, used on official documents and platforms." },
  Strategy: { title: "Strategy.", body: "The specific SIF approach this fund follows — e.g. Equity Long-Short, Sector Rotation." },
  Category: METRIC_HELP.Category,
  Plan: { title: "Plan.", body: "Regular plans are bought through a distributor (who earns a trail commission); Direct plans are bought straight from the AMC at a lower expense ratio." },
  Option: { title: "Option.", body: "Growth reinvests profits into the NAV; IDCW pays out profits periodically as cash." },
  "Scheme Category": { title: "Scheme category.", body: "The SEBI-defined sub-category this SIF is registered under." },
  "Inception Date": { body: "The date the fund first started, and its first published NAV." },
  Benchmark: { title: "Benchmark.", body: "The index this fund's performance is measured against." },
  "Fund Manager(s)": { body: "Who runs the fund day to day." },
  Sponsor: { title: "Sponsor.", body: "The entity that set up the fund — usually the AMC's parent company." },
  Trustee: { title: "Trustee.", body: "The independent body legally responsible for protecting investors' interests in this fund." },
  Registrar: { title: "Registrar (RTA).", body: "The agency that maintains investor records and processes transactions on the AMC's behalf." },
  "Latest NAV": { title: "NAV.", body: "Net Asset Value — the price of one unit of the fund today." },
  "1M Return": RETURN_PERIOD_HELP["1M"],
  "3M Return": RETURN_PERIOD_HELP["3M"],
  "6M Return": RETURN_PERIOD_HELP["6M"],
  "1Y Return": RETURN_PERIOD_HELP["1Y"],
  "Since Inception": SI_PERIOD_HELP,
  "Sharpe (SI)": METRIC_HELP.Sharpe, "Sharpe (3M)": METRIC_HELP.Sharpe,
  "Max Drawdown (SI)": METRIC_HELP.Drawdown, "Max Drawdown (3M)": METRIC_HELP.Drawdown,
  Risk: { title: "Risk.", body: "The fund's SEBI riskometer rating, from Low to Very High." },
  "Risk Band": { title: "Risk band.", body: "The numeric SEBI riskometer level (1 = Low, 5 = Very High) behind the risk label." },
  "Expense Ratio (TER)": { title: "Expense ratio (TER).", body: "The Total Expense Ratio — the % of your investment the AMC charges each year for running the fund." },
  "Exit Load": { title: "Exit load.", body: "A fee charged if you redeem before a set holding period, deducted from your redemption amount." },
  "Min Investment": { title: "Minimum investment.", body: "The smallest amount you can invest to start, set by SEBI's ₹10 lakh SIF rule unless the AMC sets it higher." },
  "Additional Investment": { body: "The smallest amount you can add to an existing investment in this fund." },
  Taxation: { body: "How gains from this fund are taxed, based on its underlying asset mix." },
  AUM: METRIC_HELP.AUM,
  "P/E": { title: "P/E ratio.", body: "Price-to-Earnings — how expensive the fund's holdings are relative to their profits. Higher can mean pricier, growth-oriented stocks." },
  "P/B": { title: "P/B ratio.", body: "Price-to-Book — how the fund's holdings are priced relative to their net asset value on the books." },
  "Dividend Yield": { body: "The average annual dividend income from the fund's holdings, as a % of their price." },
  ROE: { title: "ROE.", body: "Return on Equity — how efficiently the fund's holdings turn shareholder capital into profit." },
  "# Holdings": { body: "The number of distinct securities the fund currently holds." },
  "Top 5 Stocks Weight": { body: "% of the fund invested in its five largest holdings — higher means more concentrated." },
  "Top 10 Stocks Weight": { body: "% of the fund invested in its ten largest holdings — higher means more concentrated." },
  "Top 3 Sector Weight": { body: "% of the fund invested in its three largest sectors — higher means less sector diversification." },
  "Large Cap %": { body: "% invested in large, well-established companies — typically steadier but slower-growing." },
  "Mid Cap %": { body: "% invested in mid-sized companies — a middle ground on growth potential and risk." },
  "Small Cap %": { body: "% invested in smaller companies — higher growth potential but typically more volatile." },
  "Redemption Frequency": { body: "How often you're allowed to withdraw money from this fund — SIFs can restrict redemptions to set windows." },
  "Suitable For": { body: "The kind of investor profile the AMC considers a good fit for this fund." },
  "Not Suitable For": { body: "The kind of investor profile the AMC advises against this fund." },
};

export const COMPARE_FUND_TAG_HELP: HelpCopy = {
  body: "One fund in your comparison. Click the ✕ to remove it from the chart.",
};

export const COMPARE_ADD_FUND_HELP: HelpCopy = {
  body: "Add another SIF to this chart. You can compare up to 5 funds side by side.",
};

// ── Fund detail page ─────────────────────────────────────────────────────────

export const FUND_OPTION_HELP: Record<string, HelpCopy> = {
  Growth: {
    title: "Growth option.",
    body: "Profits stay invested and compound inside the fund. The NAV rises over time; you only realise gains when you redeem.",
  },
  IDCW: {
    title: "IDCW (Income Distribution cum Capital Withdrawal).",
    body: "The fund periodically pays out gains to you as cash instead of reinvesting them. NAV drops after each payout.",
  },
  "IDCW Payout": {
    title: "IDCW payout.",
    body: "Distributions are paid to your bank account as cash. NAV drops by the amount paid out.",
  },
  "IDCW Reinvestment": {
    title: "IDCW reinvestment.",
    body: "Distributions buy you more units of the same fund instead of paying out cash.",
  },
  "Monthly IDCW": {
    title: "Monthly IDCW.",
    body: "The IDCW option with distributions considered every month, when the fund has surplus to pay out.",
  },
  "Quarterly IDCW": {
    title: "Quarterly IDCW.",
    body: "The IDCW option with distributions considered every quarter, when the fund has surplus to pay out.",
  },
};

export const FUND_TAB_HELP: Record<string, HelpCopy> = {
  performance: {
    body: "Return history, the NAV chart, and how this fund stacks up against its category average.",
  },
  risk: {
    body: "Deeper risk numbers — volatility, drawdown, Sharpe ratio — to judge how bumpy the fund's ride has been for its returns.",
  },
  portfolio: {
    body: "What the fund actually holds right now — its current stock and asset positions.",
  },
  manager: {
    body: "Who runs the fund day to day, and their background managing money.",
  },
  documents: {
    body: "Official scheme paperwork — KIM, SID, factsheets — the legal fine print behind the fund.",
  },
};

export const FUND_CATEGORY_AVG_HELP: HelpCopy = {
  body: "Overlays the average NAV performance of all funds in the same category, so you can see if this fund is beating its peers.",
};

export const FUND_CHART_PERIOD_HELP: Record<string, HelpCopy> = {
  "1M": { body: "Zooms the chart to just the last 1 month." },
  "3M": { body: "Zooms the chart to just the last 3 months." },
  "6M": { body: "Zooms the chart to just the last 6 months." },
  "1Y": { body: "Zooms the chart to just the last 1 year." },
  All: { body: "Shows the fund's entire NAV history, from launch to today." },
  Custom: { body: "Pick your own start and end dates to check returns for a specific window." },
};

// No transaction path on this site (PRODUCT.md §2) — the CTA opens a callback
// request, so the copy must not imply the investment completes here.
export const FUND_INVEST_HELP: HelpCopy = {
  body: "Request a callback to start investing in this fund through the AMC or your distributor. SIFs require a minimum investment of ₹10 lakh.",
};

export const FUND_ADD_COMPARE_HELP: HelpCopy = {
  body: "Adds this fund to the multi-fund comparison tool so you can chart it against other SIFs.",
};
