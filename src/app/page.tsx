// Re-fetch from MongoDB every hour; cron updates NAV nightly
export const revalidate = 3600;

import dynamic from "next/dynamic";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Hero } from "@/components/sections/Hero";
import { PerformanceReportBanner } from "@/components/sections/PerformanceReportBanner";
import { TopFunds } from "@/components/sections/TopFunds";
import { MarketSnapshot } from "@/components/sections/MarketSnapshot";
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

// recharts is heavy — split out of the initial homepage bundle, load on demand.
const BuildYourCompare = dynamic(
  () => import("@/components/sections/BuildYourCompare").then((m) => m.BuildYourCompare),
  { loading: () => <div className="h-[600px]" /> },
);

// Admin sign-in redirect now happens in middleware.ts (matcher: "/") — keeping
// auth()/cookies() out of this component lets it stay statically cached (ISR).
export default async function HomePage() {
  const [stats, topFunds, tickerNavs, latestReport, faqGroups] = await Promise.all([
    getSnapshotStats(),
    getTopFunds(),
    getTickerNavs(),
    getLatestPublishedReport(),
    getPublishedFaqs(),
  ]);

  const compareFunds = topFunds.map(({ schemeCode, name }) => ({ schemeCode, name }));

  return (
    <Providers funds={compareFunds}>
      <main className="flex flex-col min-h-screen">
        <TickerRibbon navItems={tickerNavs} />
        <Navbar />
        <Hero stats={stats} topFund={topFunds[0]} allFunds={topFunds} />
        <WhySIFcase />
        <MarketSnapshot stats={stats} />
        <PerformanceReportBanner report={latestReport} />
        <TopFunds funds={topFunds} />
        <NotReadyToInvest />
        <BuildYourCompare funds={topFunds} />
        <FAQSection groups={faqGroups} />
        <CTABand />
        <Footer />
      </main>
    </Providers>
  );
}
