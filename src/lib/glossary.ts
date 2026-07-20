// Glossary backing the inline <Term> affordance.
// Contract from docs/product/refactor/02-content-consolidation.md:
//
//   `short` is the 10-second answer — 140 chars max, and it must contain no
//   jargon of its own. A definition that requires a second lookup has failed.
//   `full` is the 10-minute answer, still without leaving the surface.
//
// Seeded from terms already rendered on evaluation surfaces (FundDetails field
// labels, TopFunds period selectors, RiskMeter) and from CALCULATION_FORMULAS.md.

export interface GlossaryTerm {
  term: string;
  short: string;
  full?: string;
  articleSlug?: string;
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  nav: {
    term: "NAV",
    short: "The per-unit price of a fund, published at the end of each trading day.",
    full: "Net Asset Value is everything the fund holds, minus what it owes, divided by the number of units. You buy and sell at this price, not at a market price — SIF units are not traded on an exchange.",
  },
  "risk-band": {
    term: "SEBI Risk Band",
    short: "A 1-to-5 rating set by SEBI rules, where 1 is the lowest risk and 5 the highest.",
    full: "The band comes from the fund's own holdings and is recalculated as they change, so it can move over time. It measures the character of the portfolio, not the chance of losing money in any given year.",
  },
  "exit-load": {
    term: "Exit load",
    short: "A fee charged if you sell your units before a stated holding period.",
    full: "Usually a percentage of the amount withdrawn, and usually zero after the period passes. It exists to discourage short holding, which forces the manager to sell positions at bad moments.",
  },
  ter: {
    term: "TER",
    short: "The yearly cost of owning the fund, as a percentage of your money.",
    full: "Total Expense Ratio covers management, administration, and distribution. It is already deducted from the NAV you see, so a reported return is always after this cost — you never pay it separately.",
  },
  aum: {
    term: "AUM",
    short: "The total amount of money the fund currently manages.",
    full: "Assets Under Management. Useful as a rough signal of scale, but larger is not automatically better — some strategies get harder to run well as they grow, particularly concentrated ones.",
  },
  benchmark: {
    term: "Benchmark",
    short: "The index a fund measures itself against, so its return has something to be compared to.",
    full: "Beating the benchmark is the usual definition of the manager adding value. Check that the benchmark actually resembles what the fund holds — a mismatched one flatters or unfairly punishes the result.",
  },
  drawdown: {
    term: "Drawdown",
    short: "The largest peak-to-trough fall the fund has had, as a percentage.",
    full: "It answers 'how bad did this get?' rather than 'what did it earn?'. Often the more useful number of the two, because it is the one that decides whether you would actually have held on.",
  },
  "long-short": {
    term: "Long-short",
    short: "A strategy that bets on some holdings rising and others falling, at the same time.",
    full: "Buying is 'long'; betting against is 'short'. Mutual funds are barred from meaningful shorting, and this is the main thing a SIF can do that a mutual fund cannot. It can cushion falling markets, and it can lose on both sides at once.",
  },
  cagr: {
    term: "CAGR",
    short: "The average yearly return, smoothed as if growth were identical every year.",
    full: "Compound Annual Growth Rate. It makes different holding periods comparable, but hides the ride — two funds with the same CAGR can have felt completely different to hold.",
  },
  "rolling-returns": {
    term: "Rolling returns",
    short: "Returns measured from many different start dates, not just one.",
    full: "A single start date can flatter or damn a fund purely by luck of timing. Rolling returns show the spread of outcomes across every starting point, which is a fairer test of consistency.",
  },
  "si-return": {
    term: "Since inception",
    short: "The return from the day the fund launched to today.",
    full: "For SIFs this is usually a short window, because the category is new. Treat a since-inception figure covering under a year as information, not evidence — and never as a yearly rate.",
  },
  "gross-exposure": {
    term: "Gross exposure",
    short: "The fund's total market position, counting both its bets for and against.",
    full: "A fund can hold positions worth more than the money invested in it. Gross exposure reveals that, where a simple holdings list does not. SEBI caps it for SIFs.",
  },
};
