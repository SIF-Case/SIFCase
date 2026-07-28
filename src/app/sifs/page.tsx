import type { Metadata } from "next";
import { resolvePageMetadata } from "@/lib/pageSeo";
export const revalidate = 3600;

import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { SIFsClient } from "./SIFsClient";
import { getTopFunds, getTickerNavs } from "@/lib/sifData";
import { Providers } from "@/app/providers";

// Title/description/canonical come from the Page SEO admin screen when an
// override exists, otherwise from the defaults in src/lib/seoRegistry.ts.
export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata({ path: "/sifs" });
}

export default async function SIFsPage() {
  const [funds, tickerNavs] = await Promise.all([getTopFunds(), getTickerNavs()]);

  return (
    <Providers funds={funds}>
      <main className="flex flex-col min-h-screen bg-surface">
        <TickerRibbon navItems={tickerNavs} />
        <Navbar />
        <Suspense>
          <SIFsClient funds={funds} />
        </Suspense>
        <Footer />
      </main>
    </Providers>
  );
}
