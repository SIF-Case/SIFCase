// Re-fetch from MongoDB every hour; cron updates NAV nightly
export const revalidate = 3600;

import type { Metadata } from "next";
import { resolvePageMetadata } from "@/lib/pageSeo";

// Overrides the root layout's title/description when the Page SEO admin screen
// has an entry for "/"; falls back to the same defaults otherwise.
export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata({ path: "/" });
}

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Hero } from "@/components/sections/Hero";
import { PerformanceReportBanner } from "@/components/sections/PerformanceReportBanner";
import { TopFunds } from "@/components/sections/TopFunds";

import { WhySIFcase } from "@/components/sections/WhySIFcase";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTABand } from "@/components/sections/CTABand";
import { NotReadyToInvest } from "@/components/sections/NotReadyToInvest";
import { Providers } from "@/app/providers";
import {
  getSnapshotStats,
  getTopFunds,
  getTickerNavs,
  getLatestPublishedReport,
  getPublishedFaqs,
} from "@/lib/sifData";
import { getOpenNfos } from "@/lib/nfoQueries";

// recharts is heavy — the lazy wrapper keeps it out of the homepage's initial
// JS entirely (client-only, no SSR).
import { BuildYourCompareLazy } from "@/components/sections/BuildYourCompareLazy";

// Admin sign-in redirect now happens in middleware.ts (matcher: "/") — keeping
// auth()/cookies() out of this component lets it stay statically cached (ISR).
export default async function HomePage() {
  const [stats, topFunds, tickerNavs, latestReport, faqGroups, openNfos] = await Promise.all([
    getSnapshotStats(),
    getTopFunds(),
    getTickerNavs(),
    getLatestPublishedReport(),
    getPublishedFaqs(),
    getOpenNfos(),
  ]);

  const compareFunds = topFunds.map(({ schemeCode, name }) => ({ schemeCode, name }));

  return (
    <Providers funds={compareFunds}>
      <main className="flex flex-col min-h-screen">
        <TickerRibbon navItems={tickerNavs} />
        <Navbar />
        <Hero stats={stats} topFund={topFunds[0]} allFunds={topFunds} nextNfo={openNfos[0]} />
        <WhySIFcase />

        <PerformanceReportBanner report={latestReport} />
        <TopFunds funds={topFunds} />
        <NotReadyToInvest />
        <BuildYourCompareLazy funds={topFunds} />
        <FAQSection groups={faqGroups} />
        <CTABand />
        <Footer />
      </main>
    </Providers>
  );
}
