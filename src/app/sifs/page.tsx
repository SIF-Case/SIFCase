export const revalidate = 3600;

import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { SIFsClient } from "./SIFsClient";
import { getTopFunds, getTickerNavs } from "@/lib/sifData";
import { Providers } from "@/app/providers";

export const metadata = {
  title: "All SIFs — SIFcase",
  description: "Browse every Specialised Investment Fund with verified NAV, returns, and risk metrics.",
};

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
