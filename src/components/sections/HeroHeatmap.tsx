import Image from "next/image";
import Link from "next/link";
import type { FundRow, SnapshotStats } from "@/lib/sifData";
import type { NFOData } from "@/lib/nfoData";
import { fundHref } from "@/lib/slugify";

type SignalBar = "orange" | "white";

type FloatingStatCardProps = {
  className: string;
  eyebrow: string;
  title: string;
  metric?: string;
  detail?: string;
  trend?: string;
  showArrow?: boolean;
  bars?: SignalBar[];
  href?: string;
};

const barColor = {
  orange: "bg-[#fb600d]",
  white: "bg-white/80",
};

function FloatingStatCard({
  className,
  eyebrow,
  title,
  metric,
  detail,
  trend,
  showArrow = false,
  bars,
  href,
}: FloatingStatCardProps) {
  const content = (
    <>
      <p className="text-[10px] font-semibold leading-[14px] tracking-wider text-white/70 uppercase sm:text-[12px]">{eyebrow}</p>
      <p className="mt-[6px] truncate text-[12px] font-bold leading-[18px] text-white sm:text-[14px]" title={title}>{title}</p>

      <div className="mt-[10px] flex items-start justify-between gap-2 sm:mt-[12px] sm:gap-4">
        <div className="min-w-0">
          {metric && <p className="nums whitespace-nowrap text-[14px] font-bold leading-[18px] sm:text-[16px]">{metric}</p>}
          {detail && (
            <p className="mt-[2px] whitespace-pre-line text-[11px] font-medium leading-[16px] text-white/80 sm:text-[13px]">
              {detail}
            </p>
          )}
        </div>

        {trend && (
          <div className="flex shrink-0 items-center gap-[2px] pt-[2px]">
            <span className="nums whitespace-nowrap text-[11px] font-bold leading-[14px] text-[#00e275] sm:text-[12px]">
              {trend}
            </span>
            {showArrow && (
              <Image
                src="/arrow-up-green.svg"
                alt=""
                width={16}
                height={16}
                className="size-4"
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </div>

      {bars && (
        <div className="mt-[8px] flex gap-[3px]">
          {bars.map((bar, index) => (
            <span
              key={`${bar}-${index}`}
              className={`size-3 rounded-[2.063px] ${barColor[bar]}`}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`absolute overflow-hidden rounded-[12px] border border-white/50 px-[4%] py-[4%] text-white transition-all hover:border-white hover:shadow-lg hover:scale-[1.02] cursor-pointer ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <article
      className={`absolute overflow-hidden rounded-[12px] border border-white/50 px-[4%] py-[4%] text-white ${className}`}
    >
      {content}
    </article>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "₹18.92";
  return `₹${value.toFixed(2)}`;
}

export function HeroHeatmap({ stats, topFund, allFunds, nextNfo }: { stats?: SnapshotStats; topFund?: FundRow; allFunds?: FundRow[]; nextNfo?: NFOData }) {
  const oneMonthReturn = topFund?.returns?.["1M"];
  const marketTitle =
    stats ? `${stats.totalGrowthRegular} SIFs - ${stats.totalNavRecords.toLocaleString("en-IN")} NAV records` : "94 SIFs - ₹ 1,950 Cr AUM";

  // Generate risk bars based on the fund's risk band (1-5)
  const riskBars: SignalBar[] | undefined = topFund?.riskBand
    ? Array.from({ length: 5 }, (_, i) => (i < topFund.riskBand! ? "orange" : "white"))
    : undefined;

  // Calculate average 1-month return across all funds
  const avgReturn = allFunds && allFunds.length > 0
    ? allFunds
        .map(f => f.returns["1M"])
        .filter((r): r is number => r !== null)
        .reduce((sum, r, _, arr) => sum + r / arr.length, 0)
    : null;

  const amcCount = stats?.uniqueAMCs ?? 13;
  const avgReturnText = avgReturn !== null ? `${avgReturn >= 0 ? "+" : ""}${avgReturn.toFixed(1)}% avg` : "+4.2% avg";

  return (
    <div
      className="relative mx-auto aspect-[378/315] w-full max-w-[378px]"
      aria-label="SIF market performance snapshot"
    >
      <FloatingStatCard
        className="left-[30%] top-[-10%] h-[38%] w-[60%] hero-card hero-card-1 z-[1]"
        eyebrow="TOP PERFORMER - 1M"
        title={topFund?.fundName || topFund?.name || "WM Equity Long-Short"}
        metric={formatCurrency(topFund?.nav)}
        trend={oneMonthReturn != null ? `${oneMonthReturn >= 0 ? "+" : ""}${oneMonthReturn.toFixed(2)}%` : "+6.64%"}
        showArrow
        bars={riskBars}
        href={topFund?.schemeCode ? fundHref(topFund.fundName, topFund.schemeCode) : "/sifs"}
      />

      <FloatingStatCard
        className="left-[0%] top-[30%] h-[38%] w-[60%] hero-card hero-card-2 z-[2]"
        eyebrow="MARKET SNAPSHOT"
        title={marketTitle}
        detail={`${amcCount} AMCs\nRegistered`}
        trend={avgReturnText}
        href="/sifs"
      />

      {nextNfo && (
        <FloatingStatCard
          className="left-[18%] top-[68%] h-[38%] w-[60%] hero-card hero-card-3 z-[3]"
          eyebrow="NFO OPEN"
          title={nextNfo.name}
          detail={`Closes ${nextNfo.closeDate.replace(/(\d+)\s(\w+)\s\d+/, (_, d, m) => `${d} ${m.toLowerCase()}`)}`}
          trend="NFO OPEN"
          href={`/nfos/${nextNfo.slug}`}
        />
      )}
    </div>
  );
}