export const revalidate = 3600;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import { LearningHubClient } from "./LearningHubClient";

export const metadata = {
  title: "SIF 101 — Learning Hub | SIFcase",
  description:
    "Build confidence before you invest. Bite-sized articles on SIF products, mechanics, risk, regulation and tax.",
};

export default async function SIF101Page() {
  const tickerNavs = await getTickerNavs();

  return (
    <main className="flex flex-col min-h-screen" style={{ background: "#FDFEFE" }}>
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />
      <LearningHubClient />
      <Footer />
    </main>
  );
}
