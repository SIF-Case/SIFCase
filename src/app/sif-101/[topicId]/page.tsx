import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import { TopicDetailClient } from "./TopicDetailClient";
import { TOPICS } from "../topicsData";

export const revalidate = 3600;

export async function generateStaticParams() {
  return TOPICS.map((t) => ({ topicId: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return {};
  return {
    title: `${topic.title} — SIF 101 | SIFcase`,
    description: topic.description,
  };
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) notFound();

  const tickerNavs = await getTickerNavs();

  return (
    <main className="flex flex-col min-h-screen" style={{ background: "#FDFEFE" }}>
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />
      <TopicDetailClient topicId={topicId} />
      <Footer />
    </main>
  );
}
