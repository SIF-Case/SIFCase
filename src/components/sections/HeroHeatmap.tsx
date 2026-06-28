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
      className={`absolute overflow-hidden rounded-[12px] border border-white/50 px-[22px] text-white ${className}`}
    >
      <p className="text-[10px] font-medium leading-3 text-white/70">{eyebrow}</p>
      <p className="mt-[6px] whitespace-nowrap text-[11px] font-bold leading-3">{title}</p>

      <div className="mt-[17px] flex items-start justify-between gap-4">
        <div>
          {metric && <p className="nums whitespace-nowrap text-[12px] font-bold leading-[12px]">{metric}</p>}
          {detail && (
            <p className="mt-[2px] whitespace-pre-line text-[12px] font-medium leading-3 text-white/70">
              {detail}
            </p>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-[2px] pt-[1px]">
            <span className="nums whitespace-nowrap text-[10px] font-bold leading-3 text-[#00e275]">
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
        <div className="mt-[9px] flex gap-[2px]">
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
      className="relative h-[281px] w-[378px] max-w-full"
      aria-label="SIF market performance snapshot"
    >
      <FloatingStatCard
        className="left-[186px] top-[1px] h-[109px] w-[192px] py-[6px] hero-card hero-card-1 z-[1]"
        eyebrow="TOP PERFORMER - 1M"
        title={topFund?.fundName || topFund?.name || "WM Equity Long-Short"}
        metric={formatCurrency(topFund?.nav)}
        trend={oneMonthReturn != null ? `${oneMonthReturn >= 0 ? "+" : ""}${oneMonthReturn.toFixed(2)}%` : "+6.64%"}
        showArrow
        bars={["orange", "orange", "orange", "orange", "white"]}
      />

      <FloatingStatCard
        className="left-0 top-[102px] h-[95px] w-[192px] py-[10px] hero-card hero-card-2 z-[2]"
        eyebrow="MARKET SNAPSHOT"
        title={marketTitle}
        detail={`${stats?.uniqueAMCs ?? 13} AMCs\nRegistered`}
        trend="+4.2 % avg"
      />

      <FloatingStatCard
        className="left-[166px] top-[191px] h-[90px] w-[192px] py-[12px] hero-card hero-card-3 z-[3]"
        eyebrow="NFO OPEN"
        title="Kotak Infinity Hybrid L’S"
        detail="Closes 29 jun"
        trend="NFO OPEN"
      />
    </div>
  );
}
