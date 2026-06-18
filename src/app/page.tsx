// Re-fetch from MongoDB every hour; cron updates NAV nightly
export const revalidate = 3600;

import { auth } from "@/auth";
import { getEffectiveAccess } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Hero } from "@/components/sections/Hero";
import { PerformanceReportBanner } from "@/components/sections/PerformanceReportBanner";
import { TopFunds } from "@/components/sections/TopFunds";
import { CompareFunds } from "@/components/sections/CompareFunds";
import { MarketSnapshot } from "@/components/sections/MarketSnapshot";
import { SIFComparisonTable } from "@/components/sections/SIFComparisonTable";
import { PulseStrip } from "@/components/sections/PulseStrip";
import { UniverseMap } from "@/components/sections/UniverseMap";
import { BuildYourCompare } from "@/components/sections/BuildYourCompare";
import { WhySIFcase } from "@/components/sections/WhySIFcase";
import { LearnSection } from "@/components/sections/LearnSection";
import { SIFNewsSection } from "@/components/sections/SIFNewsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTABand } from "@/components/sections/CTABand";
import { Providers } from "@/app/providers";
import {
  getSnapshotStats,
  getSIFsWithReturns,
  getTopFunds,
  getTickerNavs,
  getMonthlyHeatmapData,
  getLatestPublishedReport,
  getPublishedFaqs,
} from "@/lib/sifData";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    const access = await getEffectiveAccess(session.user.id);
    if (access && (access.isSuperAdmin || access.permissions.size > 0)) {
      redirect("/admin");
    }
  }

  const [stats, sifs, topFunds, tickerNavs, heatmap, latestReport, faqGroups] = await Promise.all([
    getSnapshotStats(),
    getSIFsWithReturns("Regular", "Growth"),
    getTopFunds(),
    getTickerNavs(),
    getMonthlyHeatmapData(),
    getLatestPublishedReport(),
    getPublishedFaqs(),
  ]);

  return (
    <Providers funds={topFunds}>
      <main className="flex flex-col min-h-screen">
        <TickerRibbon navItems={tickerNavs} />
        <Navbar />
        <Hero />
        <PerformanceReportBanner report={latestReport} />
        <MarketSnapshot stats={stats} />
        <TopFunds funds={topFunds} />
        <PulseStrip funds={heatmap.funds} monthLabels={heatmap.monthLabels} topFunds={topFunds} />
        <UniverseMap funds={topFunds} />
        <BuildYourCompare funds={topFunds} />
        <CompareFunds funds={topFunds} />
        <SIFComparisonTable sifs={sifs} />
        <WhySIFcase />
        <LearnSection />
        <SIFNewsSection />
        <FAQSection groups={faqGroups} />
        <CTABand />
        <Footer />
      </main>
    </Providers>
  );
}
