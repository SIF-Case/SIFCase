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
import { MarketSnapshot } from "@/components/sections/MarketSnapshot";
import { WhySIFcase } from "@/components/sections/WhySIFcase";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTABand } from "@/components/sections/CTABand";
import { BuildYourCompare } from "@/components/sections/BuildYourCompare";
import { NotReadyToInvest } from "@/components/sections/NotReadyToInvest";
import { Providers } from "@/app/providers";
import {
  getSnapshotStats,
  getTopFunds,
  getTickerNavs,
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

  const [stats, topFunds, tickerNavs, latestReport, faqGroups] = await Promise.all([
    getSnapshotStats(),
    getTopFunds(),
    getTickerNavs(),
    getLatestPublishedReport(),
    getPublishedFaqs(),
  ]);

  return (
    <Providers funds={topFunds}>
      <main className="flex flex-col min-h-screen">
        <TickerRibbon navItems={tickerNavs} />
        <Navbar />
        <Hero stats={stats} topFund={topFunds[0]} />
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
