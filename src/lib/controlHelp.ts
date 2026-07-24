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
