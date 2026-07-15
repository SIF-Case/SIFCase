import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { ComparePageClient } from "./ComparePageClient";
import { Providers } from "@/app/providers";
import { getTopFunds, getTickerNavs } from "@/lib/sifData";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compare SIFs — SIFcase",
  description: "Compare up to 4 Specialized Investment Funds side by side. Source-verified NAV, returns, risk metrics, and strategy",
};

type Props = { searchParams: Promise<{ funds?: string }> };

export default async function ComparePage({ searchParams }: Props) {
  const { funds: fundsParam } = await searchParams;
  const initialCodes = fundsParam ? fundsParam.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean) : [];

  const [allFunds, tickerNavs] = await Promise.all([
    getTopFunds(),
    getTickerNavs(),
  ]);

  return (
    <Providers funds={allFunds}>
      <div className="min-h-screen flex flex-col">
        <TickerRibbon navItems={tickerNavs} />
        <Navbar />
        <main className="flex-1 bg-white">
          <ComparePageClient funds={allFunds} initialCodes={initialCodes} />
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
