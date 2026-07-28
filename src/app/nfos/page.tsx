import type { Metadata } from "next";
import { resolvePageMetadata } from "@/lib/pageSeo";
export const revalidate = 60;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import { getOpenNfos } from "@/lib/nfoQueries";
import { NFOListClient } from "./NFOListClient";

// Title/description/canonical come from the Page SEO admin screen when an
// override exists, otherwise from the defaults in src/lib/seoRegistry.ts.
export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata({ path: "/nfos" });
}

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
