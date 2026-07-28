import type { Metadata } from "next";
import { resolvePageMetadata } from "@/lib/pageSeo";
import { Navbar } from "@/components/layout/Navbar";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Providers } from "@/app/providers";
import { getTickerNavs } from "@/lib/sifData";
import SuitabilityClient from "./SuitabilityClient";

// Title/description/canonical come from the Page SEO admin screen when an
// override exists, otherwise from the defaults in src/lib/seoRegistry.ts.
export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata({ path: "/suitability" });
}

export default async function SuitabilityPage() {
  const [tickerNavs] = await Promise.all([getTickerNavs()]);

  return (
    <Providers funds={[]}>
      <div className="flex flex-col min-h-screen">
        <TickerRibbon navItems={tickerNavs} />
        <Navbar />
        <SuitabilityClient />
      </div>
    </Providers>
  );
}
