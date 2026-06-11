export const revalidate = 3600;

import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { ArticleCard, type ArticleDoc } from "@/app/read/page";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import { getFundHouseBySlug, getSIFsWithReturns } from "@/lib/sifData";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fundHouse = await getFundHouseBySlug(slug);
  if (!fundHouse) return { title: "Fund House not found — SIFcase" };
  return {
    title: `${fundHouse.brandName} — SIFcase`,
    description: `${fundHouse.brandName} Specialised Investment Funds — schemes, NAV performance, and news.`,
  };
}

const TABS = [
  { key: "funds", label: "Funds" },
  { key: "news", label: "News" },
  { key: "performance", label: "Performance" },
] as const;

function ReturnCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-[12px] text-faint italic">—</span>;
  const isPositive = value.startsWith("+");
  const isNegative = value.startsWith("-");
  return (
    <span className={cn("text-[13px] font-semibold nums", isPositive && "text-gain", isNegative && "text-loss", !isPositive && !isNegative && "text-muted")}>
      {value}%
    </span>
  );
}

export default async function FundHousePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const activeTab = TABS.some((t) => t.key === tab) ? tab! : "funds";

  const fundHouse = await getFundHouseBySlug(slug);
  if (!fundHouse) notFound();

  const sifs = await getSIFsWithReturns("Regular", "Growth", fundHouse.brandName);

  let articles: ArticleDoc[] = [];
  if (activeTab === "news") {
    await connectDB();
    const pattern = fundHouse.brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(pattern, "i");
    articles = (await Article.find({
      status: "published",
      $or: [{ title: regex }, { excerpt: regex }, { content: regex }, { tags: regex }],
    })
      .sort({ publishedAt: -1 })
      .limit(12)
      .lean()) as unknown as ArticleDoc[];
  }

  return (
    <>
      <Navbar />
      <main>
        {/* HERO */}
        <div className="bg-brand-navy text-white">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-widest text-white/50 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/fund-houses" className="hover:text-white transition-colors">Fund Houses</Link>
              <span>/</span>
              <span className="text-white/80">{fundHouse.brandName}</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight mb-3">
              {fundHouse.brandName}
            </h1>
            <p className="text-[13px] text-white/60">
              {fundHouse.companyName} · {fundHouse.schemeCount} scheme{fundHouse.schemeCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white border-b border-rule sticky top-0 z-10">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
            <nav className="flex gap-6">
              {TABS.map((t) => (
                <Link
                  key={t.key}
                  href={`/fund-house/${slug}?tab=${t.key}`}
                  className={cn(
                    "py-4 text-[13.5px] font-semibold border-b-2 transition-colors",
                    activeTab === t.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-heading"
                  )}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-10">
          {activeTab === "funds" && (
            <>
              {sifs.length === 0 ? (
                <div className="py-24 text-center text-muted text-[15px]">No schemes found for this fund house.</div>
              ) : (
                <div className="table-scroll rounded-[18px] border border-rule">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="bg-surface border-b border-rule">
                        {["SIF Name", "Strategy", "Option", "NAV", "NAV Date", "Since Inception", "Source", ""].map((col) => (
                          <th key={col} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap first:pl-5 last:pr-5">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sifs.map((sif) => (
                        <tr key={sif.schemeCode} className="border-b border-rule-soft last:border-0 hover:bg-[#FBFDFF]">
                          <td className="px-4 py-4 pl-5 max-w-[260px]">
                            <span className="text-[13.5px] font-semibold text-heading leading-snug line-clamp-2">{sif.name}</span>
                            <span className="block text-[11px] text-faint mt-0.5">{sif.schemeCode}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-[12.5px] text-body">{sif.strategy}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-muted border border-rule">{sif.option}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <span className="text-[14px] font-bold text-heading nums">₹{sif.nav}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-[12px] text-muted">{sif.navDate}</span>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <ReturnCell value={sif.returnSI} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <SourceBadge variant="amfi" className="text-[10px]" />
                          </td>
                          <td className="px-4 py-4 pr-5 whitespace-nowrap">
                            <Link href={`/sifs/${sif.schemeCode.toLowerCase()}`} className="text-[13px] font-semibold text-primary hover:text-primary-hover">
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === "news" && (
            <>
              {articles.length === 0 ? (
                <div className="py-24 text-center text-muted text-[15px]">No news articles found for {fundHouse.brandName}.</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {articles.map((a) => (
                    <ArticleCard key={String(a._id)} a={a} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "performance" && (
            <>
              {sifs.length === 0 ? (
                <div className="py-24 text-center text-muted text-[15px]">No performance data available.</div>
              ) : (
                <div className="table-scroll rounded-[18px] border border-rule">
                  <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr className="bg-surface border-b border-rule">
                        {["SIF Name", "1M", "3M", "6M", "1Y", "Since Inception", "NAV Date"].map((col) => (
                          <th key={col} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap first:pl-5 last:pr-5">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sifs.map((sif) => (
                        <tr key={sif.schemeCode} className="border-b border-rule-soft last:border-0 hover:bg-[#FBFDFF]">
                          <td className="px-4 py-4 pl-5 max-w-[260px]">
                            <span className="text-[13.5px] font-semibold text-heading leading-snug line-clamp-2">{sif.name}</span>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap"><ReturnCell value={sif.return1m} /></td>
                          <td className="px-4 py-4 text-right whitespace-nowrap"><ReturnCell value={sif.return3m} /></td>
                          <td className="px-4 py-4 text-right whitespace-nowrap"><ReturnCell value={sif.return6m} /></td>
                          <td className="px-4 py-4 text-right whitespace-nowrap"><ReturnCell value={sif.return1y} /></td>
                          <td className="px-4 py-4 text-right whitespace-nowrap"><ReturnCell value={sif.returnSI} /></td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-[12px] text-muted">{sif.navDate}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-4 text-[12px] text-faint">All data sourced from AMFI NAV history.</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
