export const revalidate = 60;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import { getOpenNfos } from "@/lib/nfoQueries";
import { NFOListClient } from "./NFOListClient";

export const metadata = {
  title: "Open SIF NFOs — SIFcase",
  description:
    "Track every open SIF NFO — subscription window, allotment dates, asset allocation, exit load and minimum investment. Verified from official sources.",
};

export default async function NFOListPage() {
  const [tickerNavs, nfos] = await Promise.all([getTickerNavs(), getOpenNfos()]);

  return (
    <main className="flex flex-col min-h-screen" style={{ background: "#FDFEFE" }}>
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />
      <NFOListClient nfos={nfos} />
      <Footer />
    </main>
  );
}
