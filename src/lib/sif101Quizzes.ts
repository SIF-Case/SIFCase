// Per-topic "test your readiness" quizzes for SIF 101, keyed by article slug.
// Four questions per topic, sourced from the SIF 101 course content.

export type Sif101QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

export const SIF101_QUIZZES: Record<string, Sif101QuizQuestion[]> = {
  "specialised-investment-fund-sif-meaning-features-benefits-and-restrictions": [
    {
      q: "A SIF is best described as a product that sits between:",
      options: ["Fixed deposits and mutual funds", "Mutual funds and Portfolio Management Services (PMS)", "PMS and Alternative Investment Funds (AIFs)", "Insurance products and mutual funds"],
      answer: 1,
      explain: "SIFs bridge mutual funds and PMS — for investors who find MFs too restrictive but aren't ready for PMS-level capital.",
    },
    {
      q: "What is the maximum unhedged short position a fund manager can take, as a % of a strategy's net assets?",
      options: ["10%", "15%", "25%", "50%"],
      answer: 2,
      explain: "SEBI permits up to 25% unhedged short exposure of a strategy's net assets.",
    },
    {
      q: "What is the minimum investment threshold for a regular (non-accredited) investor in a SIF?",
      options: ["₹1 lakh", "₹5 lakh", "₹10 lakh", "₹50 lakh"],
      answer: 2,
      explain: "Every investor needs a minimum ₹10 lakh investment, calculated cumulatively at the PAN level.",
    },
    {
      q: "What is the maximum NAV exposure permitted to AAA-rated paper from a single issuer?",
      options: ["12%", "16%", "20%", "25%"],
      answer: 2,
      explain: "SEBI caps single-issuer exposure at 20% for AAA-rated paper (16% AA, 12% A and below).",
    },
  ],
  "sif-vs-mutual-funds-vs-pms-where-does-it-actually-fit": [
    {
      q: "What is the typical minimum investment required for a PMS?",
      options: ["₹10 lakh", "₹25 lakh", "₹50 lakh", "₹1 crore"],
      answer: 2,
      explain: "PMS typically requires a minimum of ₹50 lakh, versus ₹10 lakh for a SIF.",
    },
    {
      q: "How is a SIF structured, in contrast to PMS?",
      options: ["Segregated account, like PMS", "Pooled scheme, under its own brand", "Trust-only structure with no AMC involvement", "Direct equity holding by the investor"],
      answer: 1,
      explain: "Like mutual funds, a SIF is a pooled scheme — but under the SIF's own distinct brand.",
    },
    {
      q: "Can regular mutual funds take unhedged short positions?",
      options: ["Yes, up to 25% of net assets", "Yes, but only in debt instruments", "No, this is not permitted", "Yes, without limit"],
      answer: 2,
      explain: "Mutual funds cannot take unhedged short positions — that flexibility is reserved for SIFs (up to 25%) and PMS.",
    },
    {
      q: "Which regulatory framework governs PMS, as opposed to SIFs and mutual funds?",
      options: ["SEBI (Mutual Funds) Regulations", "SEBI (PMS Regulations)", "RBI guidelines", "Companies Act, 2013"],
      answer: 1,
      explain: "PMS operates under SEBI's separate PMS Regulations, while SIFs remain under the Mutual Funds Regulations.",
    },
  ],
  "who-can-invest-in-a-sif-eligibility-minimum-investment-and-accredited-investors": [
    {
      q: "At what level is the ₹10 lakh minimum investment threshold calculated?",
      options: ["Per scheme", "Per folio", "Per PAN, cumulatively across all strategies under one SIF", "Per financial year"],
      answer: 2,
      explain: "The threshold is cumulative at the PAN level across all strategies under one SIF — not per scheme.",
    },
    {
      q: "If a 'passive breach' drops your holding below ₹10 lakh due to market movement, what typically happens?",
      options: ["You must immediately top up the shortfall", "The AMC forcibly redeems the entire holding", "You aren't forced to top up, but are typically restricted to full (not partial) redemption until regularised", "Nothing — passive breaches are ignored entirely"],
      answer: 2,
      explain: "A passive breach doesn't force a top-up, but usually restricts you to full, not partial, redemption until regularised.",
    },
    {
      q: "Who is exempt from the ₹10 lakh minimum investment requirement?",
      options: ["First-time mutual fund investors", "Senior citizens", "Accredited investors", "NRIs"],
      answer: 2,
      explain: "Accredited investors, certified for higher net worth/income/asset criteria, are exempt from the threshold.",
    },
    {
      q: "Does the ₹10 lakh SIF threshold include holdings in regular mutual fund schemes of the same AMC?",
      options: ["Yes, always", "No — it applies exclusively to SIF investments", "Only for equity mutual funds", "Only if the AMC opts in"],
      answer: 1,
      explain: "The SIF threshold applies exclusively to SIF investments and excludes money held separately in regular mutual funds.",
    },
  ],
  "understanding-investment-strategies-under-sif-equity-debt-and-hybrid": [
    {
      q: "Under the SIF framework, what term officially replaces 'scheme'?",
      options: ["Fund", "Investment Strategy", "Portfolio", "Mandate"],
      answer: 1,
      explain: "SIF products are officially called 'Investment Strategies,' each with its own mandate and disclosure document.",
    },
    {
      q: "How many strategies can an AMC launch per approved category under a SIF?",
      options: ["Unlimited", "Only one", "Up to three", "Up to five"],
      answer: 1,
      explain: "Each AMC may launch only one strategy per approved category, keeping the lineup focused.",
    },
    {
      q: "Which bucket does an 'Active Asset Allocator' strategy fall under?",
      options: ["Equity-oriented", "Debt-oriented", "Hybrid", "Sector rotation"],
      answer: 2,
      explain: "Active Asset Allocator strategies dynamically blend equity and debt, making them hybrid strategies.",
    },
    {
      q: "What technique do equity-oriented SIF strategies use that regular equity mutual funds cannot?",
      options: ["Investing in international stocks", "Taking bearish/short positions alongside long positions", "Holding cash indefinitely", "Investing only in large-cap stocks"],
      answer: 1,
      explain: "Equity-oriented SIF strategies can take bearish, long-short positions — unavailable to regular equity mutual funds.",
    },
  ],
  "understanding-risk-bands-in-sifs-1783401715069": [
    {
      q: "How many risk bands does SEBI's classification system use for SIF strategies?",
      options: ["Three", "Four", "Five", "Seven"],
      answer: 2,
      explain: "SEBI classifies every SIF strategy into one of five risk bands, from lower to higher risk.",
    },
    {
      q: "What factors determine a strategy's risk band?",
      options: ["Only its historical returns", "Asset classes, derivative usage, concentration limits, and volatility profile", "Only the fund manager's tenure", "Only the size of the AMC"],
      answer: 1,
      explain: "Risk bands are based on asset classes, derivative usage, concentration limits, and volatility profile.",
    },
    {
      q: "Is a strategy's risk band fixed at launch and unchanging thereafter?",
      options: ["Yes, fixed for the life of the strategy", "No — it's reviewed and disclosed on an ongoing basis and can shift", "It only changes once a year", "It changes only if SEBI orders a review"],
      answer: 1,
      explain: "Risk bands are reviewed and disclosed on an ongoing basis since a strategy's risk profile can shift.",
    },
    {
      q: "Two strategies share the same risk band. Does this guarantee identical behaviour?",
      options: ["Yes, same band means identical risk", "No — instruments and sector exposure can still differ meaningfully", "Yes, but only for equity strategies", "No, risk bands are meaningless"],
      answer: 1,
      explain: "Two strategies in the same band can still behave differently depending on their specific holdings.",
    },
  ],
  "5-things-to-check-before-investing-in-any-sif-1783401772932": [
    {
      q: "Under the 'track-record route,' what is the minimum average AUM required over the preceding 3 years?",
      options: ["₹1,000 crore", "₹5,000 crore", "₹10,000 crore", "₹50,000 crore"],
      answer: 2,
      explain: "The track-record route requires an AMC in operation ≥3 years with average AUM ≥ ₹10,000 crore.",
    },
    {
      q: "Under the alternate (experience-based) route, what is required of the CIO?",
      options: ["5 years managing ₹1,000 crore", "10 years managing ₹5,000 crore", "3 years managing ₹500 crore", "15 years managing ₹10,000 crore"],
      answer: 1,
      explain: "The alternate route requires a CIO with 10 years' experience managing ₹5,000 crore AUM.",
    },
    {
      q: "Which of the '5 things to check' relates to redemption frequency and notice periods?",
      options: ["Risk band", "Minimum investment commitment", "Liquidity, redemption frequency, and notice periods", "Fund manager's track record"],
      answer: 2,
      explain: "Checking liquidity, redemption frequency and notice periods is one of the five key due-diligence items.",
    },
    {
      q: "What is the maximum unhedged short exposure a strategy can carry?",
      options: ["10%", "15%", "20%", "25%"],
      answer: 3,
      explain: "SEBI caps unhedged short exposure at 25% of a strategy's net assets.",
    },
  ],
  "reading-a-sifs-investment-strategy-information-document-isid-1783401807545": [
    {
      q: "What does ISID stand for?",
      options: ["Investment Scheme Information Disclosure", "Investment Strategy Information Document", "Indexed Strategy Investment Data", "Investor Suitability and Identification Document"],
      answer: 1,
      explain: "ISID = Investment Strategy Information Document, the SIF equivalent of a mutual fund's SID.",
    },
    {
      q: "Can the standard risk-warning disclaimer in an ISID be modified by the AMC?",
      options: ["Yes, freely", "Yes, but only with SEBI's written approval", "No — it's mandatory, non-negotiable language", "No, but it can be reworded"],
      answer: 2,
      explain: "SEBI mandates standard, non-negotiable disclaimer language — no words can be added or removed.",
    },
    {
      q: "What should investors cross-check the ISID's stated risk band and strategy against?",
      options: ["Competitor AMC filings", "The AMC's annual report", "Monthly portfolio disclosures published by the AMC", "Stock exchange circulars"],
      answer: 2,
      explain: "Cross-check the ISID against the AMC's monthly portfolio disclosures to verify the mandate is being followed.",
    },
    {
      q: "Which of the following is NOT a core ISID section?",
      options: ["Asset allocation pattern", "Benchmark", "Fee and expense structure", "Fund manager's personal investment portfolio"],
      answer: 3,
      explain: "Core ISID sections cover objective, asset allocation, risk band, benchmark and fees — not personal manager holdings.",
    },
  ],
  "liquidity-redemption-and-exit-terms-in-sifs-what-to-expect": [
    {
      q: "Which structures can SIF strategies use?",
      options: ["Only open-ended", "Only close-ended", "Open-ended, interval, or close-ended", "Only interval"],
      answer: 2,
      explain: "SIF strategies can be structured as open-ended, interval, or close-ended, depending on liquidity needs.",
    },
    {
      q: "Which SIF structures does SEBI require to be listed on a stock exchange?",
      options: ["Open-ended only", "Close-ended and interval strategies", "All SIF strategies regardless of structure", "None — listing is optional for all"],
      answer: 1,
      explain: "SEBI requires close-ended and interval SIF strategies to be listed on a stock exchange as an exit route.",
    },
    {
      q: "Will a listed close-ended strategy's traded price always equal its NAV?",
      options: ["Yes, always", "No — exchange liquidity can be thin and traded price may differ from NAV", "Yes, SEBI guarantees price parity", "No, traded price is always higher than NAV"],
      answer: 1,
      explain: "Exchange liquidity for listed SIF strategies can be thin, so traded price may diverge from NAV.",
    },
    {
      q: "What should you do before committing to a SIF strategy?",
      options: ["Assume it behaves like a standard open-ended mutual fund", "Ignore redemption frequency since it rarely matters", "Map your liquidity needs against the strategy's redemption terms and listing status", "Only check liquidity after investing"],
      answer: 2,
      explain: "Always map your liquidity needs against a strategy's redemption frequency, notice period, and listing status.",
    },
  ],
  "taxation-of-sif-investments-what-investors-should-know": [
    {
      q: "How is a SIF strategy's taxation generally determined?",
      options: ["All SIFs are taxed at a single uniform 'SIF rate'", "Based on the nature of its underlying portfolio (equity vs debt)", "Based solely on the investor's income tax slab", "SIFs are entirely tax-exempt"],
      answer: 1,
      explain: "SIF taxation generally follows the underlying portfolio's classification — equity or debt mutual fund rules.",
    },
    {
      q: "An equity long-short strategy and a debt strategy under the same SIF brand:",
      options: ["Are always taxed identically because they share a brand", "Can be taxed quite differently based on actual asset allocation", "Are both tax-exempt", "Are taxed based on the AMC's headquarters"],
      answer: 1,
      explain: "Two strategies under the same SIF brand can be taxed quite differently based on actual asset allocation.",
    },
    {
      q: "What determines the tax treatment of a hybrid SIF strategy?",
      options: ["The strategy's name", "Its actual equity/debt split — check the ISID and consult an advisor", "The investor's age", "A fixed 50/50 rule set by SEBI"],
      answer: 1,
      explain: "Hybrid strategy taxation depends on the actual equity/debt split — check the ISID and consult a tax advisor.",
    },
    {
      q: "Do derivatives/short positions inside the fund directly change how gains on your units are taxed?",
      options: ["Yes, always", "No — but they make careful record-keeping more important", "Yes, they double the tax rate", "No, taxation is irrelevant for SIFs"],
      answer: 1,
      explain: "Instrument-level activity doesn't itself change unit-level taxation, but makes record-keeping essential.",
    },
  ],
  "risks-of-long-short-and-leveraged-strategies-in-sifs": [
    {
      q: "Why can losses on unhedged short positions be more severe than on a simple long position?",
      options: ["Short losses are capped at the amount invested, same as long positions", "Losses on short positions aren't naturally capped the way long-position losses are", "Short positions are risk-free due to hedging", "Short positions cannot lose money by regulation"],
      answer: 1,
      explain: "Short-position losses aren't capped the way a long position's losses are limited to the amount invested.",
    },
    {
      q: "Which risk factor relates to active asset allocation depending on the manager's macro calls?",
      options: ["Liquidity mismatch", "Model / manager judgment risk", "Tax classification uncertainty", "Sector/thematic concentration"],
      answer: 1,
      explain: "Model/manager judgment risk reflects how much active asset allocation depends on correct macro calls.",
    },
    {
      q: "What is the maximum permitted unhedged short exposure for a long-short SIF strategy?",
      options: ["15%", "20%", "25%", "30%"],
      answer: 2,
      explain: "SEBI permits up to 25% unhedged short exposure of net assets in long-short SIF strategies.",
    },
    {
      q: "What is this course's final lesson on SIFs?",
      options: ["SIFs are risk-free once SEBI-registered", "The flexibility that makes SIFs attractive is the same feature that introduces their added risk", "Only accredited investors should ever consider SIFs", "Liquidity concerns don't matter if returns are high"],
      answer: 1,
      explain: "The added flexibility that makes SIFs attractive is the same feature that introduces their added risk.",
    },
  ],
};
