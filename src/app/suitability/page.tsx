import { Navbar } from "@/components/layout/Navbar";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Providers } from "@/app/providers";
import { getTickerNavs } from "@/lib/sifData";
import SuitabilityClient from "./SuitabilityClient";

export const metadata = {
  title: "Find My Ideal SIF — SIFcase",
  description:
    "Answer a few questions and we'll match you with the Specialised Investment Funds that suit your goals and risk profile.",
};

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
