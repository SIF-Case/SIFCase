import { createFileRoute } from "@tanstack/react-router";
import { UniverseHeader } from "@/components/market/UniverseHeader";
import { SmartMetrics } from "@/components/market/SmartMetrics";
import { CapitalFlowsMap } from "@/components/market/CapitalFlowsMap";
import { SifHeatmap } from "@/components/market/SifHeatmap";
import { UniverseHighlights } from "@/components/market/UniverseHighlights";
import { ExploreCta } from "@/components/market/ExploreCta";
import { useTimeframe } from "@/hooks/use-timeframe";

export const Route = createFileRoute("/market")({
  validateSearch: (s: Record<string, unknown>) => {
    const tf = s.tf;
    const valid = ["1M", "3M", "6M", "1Y", "YTD", "ALL"];
    return { tf: (valid.includes(tf as string) ? tf : "1Y") as "1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL" };
  },
  head: () => ({
    meta: [
      { title: "SIFs Universe — Live Ecosystem Terminal | SIFHub" },
      { name: "description", content: "Live SIF ecosystem terminal: smart metrics, capital flows by strategy & AMC, heatmap and AI-driven universe highlights." },
      { property: "og:title", content: "SIFs Universe — Live Ecosystem Terminal" },
      { property: "og:description", content: "What's happening in the SIF ecosystem, right now." },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const [tf, setTf] = useTimeframe();
  return (
    <div>
      <UniverseHeader tf={tf} onTf={setTf} />
      <SmartMetrics tf={tf} />
      <CapitalFlowsMap tf={tf} />
      <SifHeatmap tf={tf} />
      <UniverseHighlights tf={tf} />
      <ExploreCta />
    </div>
  );
}
