import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import { getNfoBySlug, getOpenNfoSlugs } from "@/lib/nfoQueries";
import { NFODetailClient } from "./NFODetailClient";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getOpenNfoSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: { params: Params }) {
  const { slug } = await props.params;
  const nfo = await getNfoBySlug(slug);
  if (!nfo) {
    return {
      title: "NFO Not Found — SIFcase",
    };
  }
  return {
    title: `${nfo.name} NFO — SIFcase`,
    description: `${nfo.name} NFO. Open ${nfo.openDate} – ${nfo.closeDate}. Minimum ${nfo.minInvestment}. ${nfo.category} long-short strategy under SEBI's SIF framework.`,
  };
}

export default async function NFODetailsPage(props: { params: Params }) {
  const { slug } = await props.params;
  const nfo = await getNfoBySlug(slug);

  if (!nfo) {
    notFound();
  }

  const tickerNavs = await getTickerNavs();

  return (
    <main className="flex flex-col min-h-screen" style={{ background: "#FDFEFE" }}>
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />
      <NFODetailClient nfo={nfo} />
      <Footer />
    </main>
  );
}
