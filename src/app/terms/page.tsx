import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Shield } from "lucide-react";
import { getTickerNavs } from "@/lib/sifData";

export const metadata: Metadata = {
  title: "Terms of Use — SIFcase",
  description:
    "Terms of Use for SIFcase by Aureva Capital Private Limited. Governs your access to and use of sifcase.com.",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Acceptance of Terms",
    body: (
      <>
        These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use
        of sifcase.com and any related services (together, the
        &ldquo;Platform&rdquo;), operated by Aureva Capital Private Limited
        (&ldquo;Aureva,&rdquo; &ldquo;SIFcase,&rdquo; &ldquo;we,&rdquo;
        &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using the
        Platform, you agree to be bound by these Terms, our{" "}
        <Link
          href="/privacy"
          className="text-[#098B91] font-medium hover:underline"
        >
          Privacy Policy
        </Link>
        , and our{" "}
        <Link
          href="/disclaimer"
          className="text-[#098B91] font-medium hover:underline"
        >
          Disclaimer
        </Link>
        . If you do not agree, do not use the Platform.
      </>
    ),
  },
  {
    title: "Description of Service",
    body: (
      <>
        <p>
          SIFcase is a research, comparison, and distribution platform for
          Specialised Investment Funds (SIFs) regulated by SEBI. We provide fund
          data sourced from AMFI, educational content, comparison tools, NFO
          tracking, and — where you choose to transact through us — access to
          SIF schemes in our capacity as an AMFI-registered Mutual Fund
          Distributor (ARN-346247).
        </p>
        <p className="mt-3">
          SIFcase is not a SEBI-registered Investment Adviser. Nothing on the
          Platform constitutes personalised investment advice, and no content
          should be relied upon as the sole basis for an investment decision. See
          our{" "}
          <Link
            href="/disclaimer"
            className="text-[#098B91] font-medium hover:underline"
          >
            Disclaimer
          </Link>{" "}
          for full detail.
        </p>
      </>
    ),
  },
  {
    title: "Eligibility",
    body: (
      <>
        To use the Platform, you must be capable of entering into a legally
        binding contract under the Indian Contract Act, 1872. SIF schemes
        themselves carry a SEBI-mandated minimum investment threshold (₹10 lakh
        per investor at the PAN level, with an exemption for accredited
        investors) — browsing and research on SIFcase does not require meeting
        this threshold, but investing in a scheme does.
      </>
    ),
  },
  {
    title: "Account Registration",
    body: (
      <>
        Certain features (such as saving fund comparisons, receiving NAV/NFO
        alerts, or unlocking reports etc.) require you to register using your
        phone number via OTP verification, or your email address. You are
        responsible for maintaining the confidentiality of your account access
        and for all activity that occurs under it. Notify us immediately at{" "}
        <a
          href="mailto:support@sifcase.com"
          className="text-[#098B91] font-medium hover:underline"
        >
          support@sifcase.com
        </a>{" "}
        if you suspect unauthorized use of your account.
      </>
    ),
  },
  {
    title: "Acceptable Use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            Use the Platform for any unlawful purpose or in violation of these
            Terms;
          </li>
          <li>
            Scrape, copy, republish, or redistribute data or content from the
            Platform in bulk or through automated means without our prior
            written consent;
          </li>
          <li>
            Attempt to gain unauthorized access to the Platform, its systems, or
            other users&apos; accounts;
          </li>
          <li>
            Misrepresent your identity or impersonate any person or entity;
          </li>
          <li>
            Use the Platform to transmit any virus, malware, or harmful code.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Intellectual Property",
    body: (
      <>
        <p>
          All content on the Platform — including text, design, graphics, logos,
          the SIFcase name and mark, and our proprietary risk metrics and
          calculations — is owned by or licensed to Aureva Capital Private
          Limited and is protected by applicable intellectual property laws.
          Fund-level data sourced from AMFI or AMC scheme documents remains
          subject to the rights of those respective sources; we do not claim
          ownership over third-party source data itself, only over our
          presentation, calculations, and original commentary.
        </p>
        <p className="mt-3">
          You may view and use the Platform for personal, non-commercial
          research purposes. Any other use requires our prior written
          permission.
        </p>
      </>
    ),
  },
  {
    title: "Third-Party Data and Links",
    body: (
      <>
        <p>
          NAV, returns, and scheme information displayed on the Platform are
          sourced from AMFI and AMC-published documents (ISID/SID/KIM); risk
          metrics such as Sharpe ratio, volatility, and drawdown are calculated
          by SIFcase from that NAV history. While we take reasonable care in
          presenting this data accurately and promptly, we do not guarantee its
          completeness, accuracy, or timeliness, and we are not responsible for
          errors or delays originating from AMFI or AMC sources.
        </p>
        <p className="mt-3">
          The Platform may link to third-party websites (including AMC sites,
          SEBI&apos;s SCORES portal, and social media) for your convenience. We
          do not control and are not responsible for the content or practices of
          any linked third-party site.
        </p>
      </>
    ),
  },
  {
    title: "No Investment Advice; No Guarantee of Returns",
    body: (
      <>
        Investments in Specialized Investment Funds involve relatively higher
        risk, including potential loss of capital, liquidity risk, and market
        volatility. Past performance shown on the Platform is not indicative of
        future results. Nothing on the Platform should be construed as a
        recommendation, offer, or solicitation to buy or sell any financial
        product. You are solely responsible for your investment decisions and are
        encouraged to read all scheme-related documents and, where appropriate,
        consult a SEBI-registered Investment Adviser before investing.
      </>
    ),
  },
  {
    title: "Fees",
    body: (
      <>
        Access to SIFcase&apos;s research, comparison, and educational content
        is free of charge to you. Where you choose to invest in a SIF scheme
        through Aureva as your distributor, we may earn distribution commission
        from the relevant AMC in connection with that transaction, as disclosed
        in our{" "}
        <Link
          href="/sebi"
          className="text-[#098B91] font-medium hover:underline"
        >
          SEBI Disclosure
        </Link>{" "}
        page. You are not charged a separate platform fee for using SIFcase
        unless explicitly stated at the time of a specific paid service, if any.
      </>
    ),
  },
  {
    title: "Disclaimers",
    body: (
      <>
        THE PLATFORM AND ALL CONTENT ARE PROVIDED &ldquo;AS IS&rdquo; AND
        &ldquo;AS AVAILABLE,&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER
        EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF ACCURACY, MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT
        WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
      </>
    ),
  },
  {
    title: "Limitation of Liability",
    body: (
      <>
        To the maximum extent permitted by applicable law, Aureva Capital
        Private Limited and its officers, employees, and affiliates shall not be
        liable for any indirect, incidental, special, consequential, or punitive
        damages, or any loss of profits or investment value, arising out of or
        related to your use of the Platform or any investment decision made in
        connection with information obtained from it.
      </>
    ),
  },
  {
    title: "Indemnification",
    body: (
      <>
        You agree to indemnify and hold harmless Aureva Capital Private Limited
        from any claims, losses, or damages, including reasonable legal fees,
        arising from your violation of these Terms or misuse of the Platform.
      </>
    ),
  },
  {
    title: "Termination",
    body: (
      <>
        We may suspend or terminate your access to the Platform, with or
        without notice, if we reasonably believe you have violated these Terms
        or applicable law. You may stop using the Platform and request account
        deletion at any time by contacting{" "}
        <a
          href="mailto:support@sifcase.com"
          className="text-[#098B91] font-medium hover:underline"
        >
          support@sifcase.com
        </a>
        .
      </>
    ),
  },
  {
    title: "Governing Law and Dispute Resolution",
    body: (
      <>
        These Terms are governed by the laws of India. Any disputes arising out
        of or relating to these Terms or the Platform shall be subject to the
        exclusive jurisdiction of the courts at Mumbai. SEBI-related grievances
        may separately be escalated through the{" "}
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
          SMART ODR Portal
        </a>
        .
      </>
    ),
  },
  {
    title: "Changes to These Terms",
    body: (
      <>
        We may update these Terms from time to time. We will post the revised
        Terms on this page with an updated &ldquo;Last updated&rdquo; date.
        Continued use of the Platform after changes are posted constitutes
        acceptance of the revised Terms.
      </>
    ),
  },
];

export default async function TermsPage() {
  const tickerNavs = await getTickerNavs();

  return (
    <main className="flex flex-col min-h-screen bg-surface">
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />

      {/* Hero */}
      <section className="pt-12 pb-6">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8">
          <h1 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.8px] text-heading mb-3 text-balance leading-tight">
            Terms of Use
          </h1>
          <p className="text-[16px] text-body leading-relaxed max-w-[700px] text-pretty">
            These Terms govern your access to and use of sifcase.com, operated
            by Aureva Capital Private Limited.
          </p>
          <p className="text-[12px] text-muted mt-4">
            Last updated: 15th July 2026 &nbsp;·&nbsp; Issued by{" "}
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
            {SECTIONS.map(({ title, body }, i) => (
              <div
                key={title}
                className="bg-white rounded-[16px] border border-rule shadow-card p-6"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                    {title}
                  </h2>
                </div>
                <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8">
                  {body}
                </div>
              </div>
            ))}
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
                Questions about these terms?
              </p>
              <p className="text-[13px] text-body leading-relaxed">
                Reach us at{" "}
                <a
                  href="mailto:support@sifcase.com"
                  className="text-primary hover:underline"
                >
                  support@sifcase.com
                </a>{" "}
                or write to us at Awfis, B Wing 6F, Supreme Business Park,
                Hiranandani Gardens, Powai, Mumbai 400076.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
