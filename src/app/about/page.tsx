import { resolvePageMetadata } from "@/lib/pageSeo";
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import {
  BarChart3,
  BookOpen,
  Bell,
  FileText,
  Building2,
  Mail,
  ArrowRight,
} from "lucide-react";

// Title/description/canonical come from the Page SEO admin screen when an
// override exists, otherwise from the defaults in src/lib/seoRegistry.ts.
export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata({ path: "/about" });
}

const TOOLS = [
  {
    icon: BarChart3,
    name: "Compare",
    desc: "Put up to four SIFs side by side across returns, risk, and strategy.",
    href: "/compare",
  },
  {
    icon: BookOpen,
    name: "SIF 101",
    desc: 'A structured learning path for investors new to the category — from "what is a SIF" through taxation and exit terms.',
    href: "/sif-101",
  },
  {
    icon: Bell,
    name: "NFO Tracker",
    desc: "Every open subscription window, with plain-English explanations of terms like allotment, lock-in, and exit load.",
    href: "/nfos",
  },
  {
    icon: FileText,
    name: "Monthly Performance Reports",
    desc: "Fund-by-fund return data across the full SIF universe, benchmarked against the Nifty 50.",
    href: "/performance",
  },
  {
    icon: Building2,
    name: "Fund House Profiles",
    desc: "Every AMC running a SIF platform, what they\u2019ve launched, and how their funds have performed.",
    href: "/fund-houses",
  },
];

export default async function AboutPage() {
  const tickerNavs = await getTickerNavs();

  return (
    <main className="flex flex-col min-h-screen bg-surface">
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />

      {/* Hero */}
      <section className="pt-14 pb-8">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8">
          <h1 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.8px] text-heading mb-4 text-balance leading-tight">
            About SIFcase
          </h1>
          <p className="text-[17px] text-body leading-relaxed max-w-[760px] text-pretty">
            India&apos;s dedicated research and comparison platform for
            Specialised Investment Funds
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16 pt-2">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8">
          <div className="space-y-8">
            {/* Why SIFcase exists */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  01
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Why SIFcase exists
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8 space-y-3">
                <p>
                  SIFcase exists because SIFs are new, complex, and scattered.
                  SEBI created the Specialised Investment Fund category in
                  February 2025 to bridge the gap between traditional mutual
                  funds and higher-ticket products like PMS and AIFs — but the
                  information about these funds still lives in a dozen different
                  places: AMC websites, scattered PDFs, and one-off news
                  mentions.
                </p>
                <p>
                  SIFcase brings it into one place, tracked daily, sourced from
                  AMFI, and explained in plain language.
                </p>
              </div>
            </div>

            {/* What we do */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  02
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  What we do
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8 space-y-4">
                <p>
                  We track every SEBI-registered SIF from every AMC that has
                  launched one — NAV history, returns, risk metrics like Sharpe
                  ratio and drawdown, expense ratios, and strategy documents —
                  and update it daily from AMFI&apos;s official data feed.
                  Alongside that, we built the tools an investor actually needs
                  to make sense of it:
                </p>

                {/* Tool cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {TOOLS.map((t) => (
                    <Link
                      key={t.name}
                      href={t.href}
                      className="group flex flex-col gap-2 rounded-xl border border-rule bg-surface/60 p-4 hover:border-[#098B91]/40 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <t.icon
                          className="w-4 h-4 text-[#098B91]"
                          strokeWidth={2}
                        />
                        <span className="text-[13px] font-semibold text-heading group-hover:text-[#098B91] transition-colors">
                          {t.name}
                        </span>
                        <ArrowRight className="w-3 h-3 text-faint ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[12px] text-muted leading-relaxed">
                        {t.desc}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Our approach */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  03
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Our approach
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8 space-y-3">
                <p>
                  Every figure on SIFcase is either sourced directly from AMFI,
                  AMCs etc. or calculated from AMFI&apos;s official NAV history.
                  Where data is unverified or a fund doesn&apos;t yet have
                  enough history for a metric, we say so.
                </p>
                <p>
                  We&apos;re not paid by any AMC to rank their funds more
                  favorably, and we don&apos;t publish &ldquo;best&rdquo; or
                  &ldquo;worst&rdquo; labels as investment advice — decisions
                  like that belong to you and your own risk profile, not a
                  headline.
                </p>
              </div>
            </div>

            {/* Who's behind SIFcase */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  04
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Who&apos;s behind SIFcase
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8">
                <p>
                  SIFcase is built and operated by{" "}
                  <strong className="text-heading">
                    Aureva Capital Private Limited
                  </strong>
                  , an AMFI-registered Mutual Fund Distributor (
                  <span className="font-mono text-[13px]">ARN-346247</span>,{" "}
                  <span className="font-mono text-[13px]">APRN0797924</span>),
                  based in Mumbai.
                </p>
              </div>
            </div>

            {/* What we're not */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  05
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  What we&apos;re not
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8 space-y-3">
                <p>
                  SIFcase is a research, comparison, and distribution platform —
                  it is not a SEBI-registered Investment Adviser, and nothing on
                  this site should be read as personalised investment advice.
                </p>
                <p>
                  As a distributor, we can help you access and transact in SIF
                  schemes; recommendations on what&apos;s right for your
                  specific portfolio should come from a qualified, regulated
                  adviser. Full detail is in our{" "}
                  <Link
                    href="/disclaimer"
                    className="text-[#098B91] font-medium hover:underline"
                  >
                    Disclaimer
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Get in touch */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[12px] font-mono text-[#098B91] mt-1 w-5 flex-shrink-0">
                  06
                </span>
                <h2 className="text-[16px] font-semibold text-[#098B91] text-balance">
                  Get in touch
                </h2>
              </div>
              <div className="text-[14px] text-body leading-[1.7] text-pretty pl-8">
                <p>
                  Have a question, a correction to flag, or want to talk to a
                  Relationship Manager? Reach us at{" "}
                  <a
                    href="mailto:support@sifcase.com"
                    className="text-[#098B91] font-medium hover:underline"
                  >
                    support@sifcase.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* CTA card */}
          <div className="mt-10 rounded-[16px] border border-rule bg-white p-6 flex items-start gap-4">
            <Mail
              className="w-5 h-5 text-[#098B91] flex-shrink-0 mt-0.5"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <div>
              <p className="text-[14px] font-semibold text-heading mb-1">
                Questions about SIFcase?
              </p>
              <p className="text-[13px] text-body leading-relaxed">
                Reach us at{" "}
                <a
                  href="mailto:support@sifcase.com"
                  className="text-[#098B91] hover:underline"
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
