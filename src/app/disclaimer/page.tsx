import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer — SIFCase",
  description: "Legal disclaimer for SIFCase by Aureva Capital Private Limited.",
};

const SECTIONS = [
  {
    title: "General Information",
    body: `Unless otherwise stated, all content on this website is issued by Aureva Capital Private Limited ("Aureva") and is meant for general information and educational purposes only. It may be updated or changed without notice. SIFCase is an intelligence and research platform operated by Aureva for the purpose of disseminating information about Specialized Investment Funds (SIFs) in India.`,
  },
  {
    title: "Not an Offer or Advice",
    body: `Nothing on this website should be considered an offer, solicitation, or recommendation to buy or sell any financial product or service, or to provide investment or portfolio advice. The information published here should not be relied upon for making financial or investment decisions. SIFCase does not act as an investment advisor, broker, or distributor in the context of this platform.`,
  },
  {
    title: "No Financial, Tax, or Legal Advice",
    body: `The content on this platform does not constitute financial, tax, legal, or accounting advice. Visitors are advised to seek independent professional guidance before acting on any information presented here. Past performance of any fund or strategy is not indicative of future results. All returns, NAV data, and risk metrics are for analytical purposes only.`,
  },
  {
    title: "Risk Disclosure",
    body: `Investments in Specialized Investment Funds involve relatively higher risk, including potential loss of capital, liquidity risk, and market volatility. SIFs are higher-ticket investment products with a minimum investment threshold and may not be suitable for every investor. Please read all scheme-related documents, including the Scheme Information Document (SID), Statement of Additional Information (SAI), and Key Information Memorandum (KIM), carefully before making any investment decision.`,
  },
  {
    title: "Data Accuracy",
    body: `While Aureva makes reasonable efforts to ensure the accuracy and completeness of data on this platform, it does not warrant the accuracy, adequacy, correctness, reliability, or completeness of any information. NAV data is sourced from AMFI and risk metrics are calculated from historical NAV history. Data may be subject to delays, errors, or omissions. Aureva shall not be liable for any loss or damage arising from the use of or reliance on such data.`,
  },
  {
    title: "Third-Party Links",
    body: `This website may contain links to third-party websites or resources for convenience. Aureva does not endorse, control, or take responsibility for the content, accuracy, or practices of any linked third-party site. Accessing such links is entirely at your own risk.`,
  },
  {
    title: "Regulatory Status",
    body: `Aureva Capital Private Limited is registered with AMFI as a Mutual Fund Distributor (ARN-346247). SIFCase is operated as a research and analytics platform. The platform does not currently hold a SEBI Investment Advisor (IA) registration. Any information provided herein is purely educational and analytical in nature and should not be construed as regulated financial advice.`,
  },
  {
    title: "Changes to This Disclaimer",
    body: `Aureva reserves the right to update or modify this disclaimer at any time without prior notice. Continued use of this website after any changes constitutes acceptance of the updated disclaimer. We encourage users to review this page periodically.`,
  },
];

export default function DisclaimerPage() {
  return (
    <main className="flex flex-col min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-rule pt-10 pb-10">
        <div className="max-w-[760px] mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4.5 h-4.5 text-primary" strokeWidth={1.75} />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary">Legal</span>
          </div>
          <h1 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.8px] text-heading mb-3 leading-tight">
            Disclaimer
          </h1>
          <p className="text-[15px] text-body leading-relaxed max-w-[600px]">
            Please read this disclaimer carefully before using SIFCase. By accessing this platform,
            you agree to the terms set out below.
          </p>
          <p className="text-[12px] text-muted mt-4">
            Issued by <span className="font-medium text-body">Aureva Capital Private Limited</span> &nbsp;·&nbsp; CIN: U66190MH2025PTC460862
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-[760px] mx-auto px-6 lg:px-8">
          <div className="space-y-8">
            {SECTIONS.map(({ title, body }, i) => (
              <div key={title} className="bg-white rounded-[16px] border border-rule shadow-card p-6">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-[15px] font-semibold text-heading">{title}</h2>
                </div>
                <p className="text-[13.5px] text-body leading-[1.7] pl-8">{body}</p>
              </div>
            ))}
          </div>

          {/* Contact note */}
          <div className="mt-10 rounded-[16px] border border-rule bg-white p-6 flex items-start gap-4">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <p className="text-[13.5px] font-semibold text-heading mb-1">Questions about this disclaimer?</p>
              <p className="text-[13px] text-body leading-relaxed">
                Reach us at{" "}
                <a href="mailto:Smita.sahai@aurevawealth.com" className="text-primary hover:underline">
                  Smita.sahai@aurevawealth.com
                </a>{" "}
                or write to us at Awfis, B Wing 6F, Supreme Business Park, Hiranandani Gardens, Powai, Mumbai 400076.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
