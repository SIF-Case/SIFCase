import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Hero } from "@/components/sections/Hero";
import { TopFunds } from "@/components/sections/TopFunds";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { MarketSnapshot } from "@/components/sections/MarketSnapshot";
import { SIFComparisonTable } from "@/components/sections/SIFComparisonTable";
import { NFOPreview } from "@/components/sections/NFOPreview";
import { WhySIFcase } from "@/components/sections/WhySIFcase";
import { LearnSection } from "@/components/sections/LearnSection";
import { CTABand } from "@/components/sections/CTABand";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <TickerRibbon />
      <Navbar variant="light" />
      <Hero />
      <TopFunds />
      <TrustStrip />
      <MarketSnapshot />
      <SIFComparisonTable />
      <NFOPreview />
      <WhySIFcase />
      <LearnSection />
      <CTABand />
      <Footer />
    </main>
  );
}
