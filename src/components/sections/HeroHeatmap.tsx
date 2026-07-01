import Image from "next/image";
import type { FundRow, SnapshotStats } from "@/lib/sifData";

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
}: FloatingStatCardProps) {
  return (
    <article
      className={`absolute overflow-hidden rounded-[12px] border border-white/50 px-[20px] py-[14px] text-white ${className}`}
    >
      <p className="text-[12px] font-semibold leading-[14px] tracking-wider text-white/70 uppercase">{eyebrow}</p>
      <p className="mt-[6px] whitespace-nowrap text-[14px] font-bold leading-[18px] text-white" title={title}>{title}</p>

      <div className="mt-[12px] flex items-start justify-between gap-4">
        <div>
          {metric && <p className="nums whitespace-nowrap text-[16px] font-bold leading-[18px]">{metric}</p>}
          {detail && (
            <p className="mt-[2px] whitespace-pre-line text-[13px] font-medium leading-[16px] text-white/80">
              {detail}
            </p>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-[2px] pt-[2px]">
            <span className="nums whitespace-nowrap text-[12px] font-bold leading-[14px] text-[#00e275]">
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
    </article>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "₹18.92";
  return `₹${value.toFixed(2)}`;
}

export function HeroHeatmap({ stats, topFund }: { stats?: SnapshotStats; topFund?: FundRow }) {
  const oneMonthReturn = topFund?.returns?.["1M"];
  const marketTitle =
    stats ? `${stats.totalSchemes} SIFs - ${stats.totalNavRecords.toLocaleString("en-IN")} NAV records` : "94 SIFs - ₹ 1,950 Cr AUM";

  return (
    <div
      className="relative h-[315px] w-[378px] max-w-full"
      aria-label="SIF market performance snapshot"
    >
      <FloatingStatCard
        className="left-[60px] top-[0px] h-[125px] w-[235px] hero-card hero-card-1 z-[1]"
        eyebrow="TOP PERFORMER - 1M"
        title={topFund?.fundName || topFund?.name || "WM Equity Long-Short"}
        metric={formatCurrency(topFund?.nav)}
        trend={oneMonthReturn != null ? `${oneMonthReturn >= 0 ? "+" : ""}${oneMonthReturn.toFixed(2)}%` : "+6.64%"}
        showArrow
        bars={["orange", "orange", "orange", "orange", "white"]}
      />

      <FloatingStatCard
        className="left-[-60px] top-[110px] h-[125px] w-[235px] hero-card hero-card-2 z-[2]"
        eyebrow="MARKET SNAPSHOT"
        title={marketTitle}
        detail={`${stats?.uniqueAMCs ?? 13} AMCs\nRegistered`}
        trend="+4.2 % avg"
      />

      <FloatingStatCard
        className="left-[30px] top-[220px] h-[125px] w-[235px] hero-card hero-card-3 z-[3]"
        eyebrow="NFO OPEN"
        title="Kotak Infinity Hybrid L’S"
        detail="Closes 29 jun"
        trend="NFO OPEN"
      />
    </div>
  );
}
