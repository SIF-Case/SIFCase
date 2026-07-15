import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Shield } from "lucide-react";
import { getTickerNavs } from "@/lib/sifData";

export const metadata: Metadata = {
  title: "SEBI Disclosure — SIFcase",
  description:
    "SEBI regulatory disclosure for SIFcase by Aureva Capital Private Limited. Registration details, commission disclosure, and mandated risk disclaimers.",
};

export default async function SebiPage() {
  const tickerNavs = await getTickerNavs();

  return (
    <main className="flex flex-col min-h-screen bg-surface">
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />

      {/* Hero */}
      <section className="pt-12 pb-6">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8">
          <h1 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.8px] text-heading mb-3 text-balance leading-tight">
            SEBI Disclosure
          </h1>
          <p className="text-[16px] text-body leading-relaxed max-w-[700px] text-pretty">
            Regulatory registration details, commission disclosures, and
            mandated risk disclaimers for Aureva Capital Private Limited.
          </p>
          <p className="text-[12px] text-muted mt-4">
            Issued by{" "}
            <span className="font-medium text-body">
              Aureva Capital Private Limited
            </span>{" "}
            &nbsp;·&nbsp; CIN: U66190MH2025PTC460862
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16 pt-6">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8">
          <div className="space-y-8">
            {/* 1. Registration & Regulatory Status */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  01
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Registration &amp; Regulatory Status
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8 space-y-4">
                {/* Registration details table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {[
                    ["Entity", "Aureva Capital Private Limited"],
                    ["CIN", "U66190MH2025PTC460862"],
                    ["AMFI Registration Number (ARN)", "ARN-346247"],
                    [
                      "AMFI Registered Persons Number (APRN)",
                      "APRN0797924",
                    ],
                    ["Startup India Recognition", "DIPP232750"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-col py-1.5 border-b border-rule/50 last:border-0"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {label}
                      </span>
                      <span className="text-[13px] font-medium text-heading font-mono">
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex flex-col py-1.5 border-b border-rule/50 last:border-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Principal Officer
                    </span>
                    <span className="text-[13px] font-medium text-heading">
                      Smita Sahai (
                      <a
                        href="mailto:smita.sahai@aurevawealth.com"
                        className="text-[#098B91] hover:underline font-normal"
                      >
                        smita.sahai@aurevawealth.com
                      </a>
                      )
                    </span>
                  </div>
                </div>

                <p>
                  Aureva Capital Private Limited is registered with the
                  Association of Mutual Funds in India (AMFI) as a Mutual Fund
                  Distributor. This registration permits us to distribute mutual
                  fund and SIF schemes and to earn distribution commission from
                  Asset Management Companies (AMCs) in connection with that
                  activity.
                </p>
              </div>
            </div>

            {/* 2. What We Are, and What We Are Not */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  02
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  What We Are, and What We Are Not
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8 space-y-3">
                <p>
                  We are a Mutual Fund and SIF Distributor. We are not registered
                  with SEBI as an Investment Adviser (IA) under the SEBI
                  (Investment Advisers) Regulations, 2013, and we do not provide
                  investment advice for a fee.
                </p>
                <p>
                  This distinction matters because it defines the nature of our
                  relationship with you:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    As a distributor, we can help you compare, select, and
                    transact in SIF schemes, and we may recommend schemes based
                    on general suitability factors you share with us.
                  </li>
                  <li>
                    We do not conduct the formal risk-profiling and fiduciary
                    duty obligations that apply to a SEBI Registered Investment
                    Adviser, and any guidance we provide should not be construed
                    as personalised investment advice under SEBI&apos;s IA
                    framework.
                  </li>
                  <li>
                    If you require formal, fee-based investment advisory services
                    with fiduciary obligations, you should engage a
                    SEBI-registered Investment Adviser separately.
                  </li>
                </ul>
              </div>
            </div>

            {/* 3. Commission & Conflict-of-Interest Disclosure */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  03
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Commission &amp; Conflict-of-Interest Disclosure
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8 space-y-3">
                <p>
                  As an AMFI-registered distributor, Aureva Capital Private
                  Limited earns distribution commission (as applicable and as
                  permitted under SEBI/AMFI norms) from the AMCs whose schemes
                  are transacted through us. This is a standard and disclosed
                  part of the mutual fund distribution model in India, but it is
                  a conflict of interest you should be aware of:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    Commission rates may vary by AMC and by scheme.
                  </li>
                  <li>
                    SIFcase&apos;s data, rankings, comparisons, and performance
                    labels — including &ldquo;Best Performer&rdquo; and
                    &ldquo;Worst Performer&rdquo; designations — are{" "}
                    <strong className="text-heading">commission blind</strong>:
                    they are generated solely from AMFI NAV data using a
                    standard, disclosed calculation methodology. Commission
                    differences across AMCs have no influence on how funds are
                    displayed, sorted, or ranked on this platform.
                  </li>
                  <li>
                    We do not receive any additional payment from AMCs for
                    placement, prominence, or favourable coverage on
                    SIFcase&apos;s editorial content (News, Insights, SIF 101).
                  </li>
                  <li>
                    You are not charged any additional fee by us for using
                    SIFcase&apos;s research and comparison tools; our
                    compensation comes from the AMC side of a transaction, not
                    from you directly, unless separately disclosed at the time of
                    a specific engagement.
                  </li>
                </ul>
              </div>
            </div>

            {/* 4. Mandated Risk Disclaimer */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  04
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Mandated Risk Disclaimer
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8 space-y-4">
                <p>
                  SEBI requires the following disclaimer to accompany
                  SIF-related communications, reproduced here without
                  modification:
                </p>
                <blockquote className="border-l-3 border-[#098B91] pl-4 py-2 bg-surface/60 rounded-r-lg text-[13px] italic text-heading leading-relaxed">
                  &ldquo;Investments in Specialized Investment Fund involves
                  relatively higher risk including potential loss of capital,
                  liquidity risk and market volatility. Please read all
                  investment strategy related documents carefully before making
                  the investment decision.&rdquo;
                </blockquote>
                <p>
                  Additionally: mutual fund and SIF investments are subject to
                  market risk. Please read all scheme-related documents,
                  including the Investment Strategy Information Document (ISID),
                  Scheme Information Document (SID), and Key Information
                  Memorandum (KIM), carefully before investing. Past performance
                  is not indicative of future results.
                </p>
              </div>
            </div>

            {/* 5. Data Source Disclosure */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  05
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Data Source Disclosure
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8">
                <p>
                  NAV, returns, and performance related data are sourced from
                  AMFI&apos;s official data feeds. Scheme level details are
                  sourced from AMC-published scheme documents (ISID/SID/KIM) and
                  APIs. Risk metrics such as Sharpe ratio, volatility, and
                  drawdown are calculated by SIFcase from this NAV history. Where
                  data is unavailable or a scheme has insufficient history for a
                  given metric, this is indicated on the relevant page rather
                  than estimated.
                </p>
              </div>
            </div>

            {/* 6. Code of Conduct */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  06
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Code of Conduct
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8">
                <p>
                  As an AMFI-registered distributor, Aureva Capital Private
                  Limited abides by the AMFI Code of Conduct for Intermediaries
                  of Mutual Funds, including obligations around fair and unbiased
                  representation of scheme information, avoidance of misleading
                  claims about returns, and appropriate disclosure of risks.
                </p>
              </div>
            </div>

            {/* 7. Investor Grievances */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  07
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Investor Grievances
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8">
                <p>
                  Investor grievances relating to SIFcase or Aureva Capital
                  Private Limited can be raised with our Principal Officer or at{" "}
                  <a
                    href="mailto:support@sifcase.com"
                    className="text-[#098B91] font-medium hover:underline"
                  >
                    support@sifcase.com
                  </a>
                  . If unresolved to your satisfaction, grievances relating to
                  SEBI-regulated products can be escalated through SEBI&apos;s{" "}
                  <a
                    href="https://scores.sebi.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#098B91] font-medium hover:underline"
                  >
                    SCORES portal
                  </a>{" "}
                  or the{" "}
                  <a
                    href="https://smartodr.in/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#098B91] font-medium hover:underline"
                  >
                    SMART Online Dispute Resolution (ODR) Portal
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Contact note */}
          <div className="mt-10 rounded-[16px] border border-rule bg-white p-6 flex items-start gap-4">
            <Shield
              className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <div>
              <p className="text-[14px] font-semibold text-heading mb-1">
                Questions about our regulatory status?
              </p>
              <p className="text-[13px] text-body leading-relaxed">
                Contact our Principal Officer at{" "}
                <a
                  href="mailto:smita.sahai@aurevawealth.com"
                  className="text-primary hover:underline"
                >
                  smita.sahai@aurevawealth.com
                </a>{" "}
                or reach us at{" "}
                <a
                  href="mailto:support@sifcase.com"
                  className="text-primary hover:underline"
                >
                  support@sifcase.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
