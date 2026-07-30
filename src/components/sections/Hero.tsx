import Link from "next/link";
import { ArrowRight, Compass, Sprout, IndianRupee } from "lucide-react";
import { TalkToAdvisorButton } from "@/components/sections/TalkToAdvisorButton";
import type { FundRow, SnapshotStats } from "@/lib/sifData";
import type { NFOData } from "@/lib/nfoData";

// Existing brand values — the hero teal and its accent are unchanged.
const INK = "#004c61";
const INK_2 = "#03566d";
const ACCENT = "#14b7a3";
const LINE = "rgba(20,183,163,0.28)";
const PALE = "rgba(255,255,255,0.72)";

const INVESTOR_TYPES = [
  {
    Icon: Compass,
    title: "Get started",
    description: "Start your SIF investing journey with confidence",
    href: "/sif-101",
  },
  {
    Icon: Sprout,
    title: "Growth investor",
    description: "Equity-led SIFs built to compound wealth over time",
    href: "/sifs?category=Equity",
  },
  {
    Icon: IndianRupee,
    title: "Income investor",
    description: "Hybrid SIFs designed for steadier, regular returns",
    href: "/sifs?category=Hybrid",
  },
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="shrink-0">
      <div className="text-[22px] font-semibold text-white whitespace-nowrap nums">{value}</div>
      <div className="text-[13px] mt-0.5 whitespace-nowrap" style={{ color: PALE }}>{label}</div>
    </div>
  );
}

export function Hero({ stats }: { stats?: SnapshotStats; topFund?: FundRow; allFunds?: FundRow[]; nextNfo?: NFOData }) {
  const equity = stats?.categoryBreakdown.equity ?? 0;
  const hybrid = stats?.categoryBreakdown.hybrid ?? 0;
  const debt = stats?.categoryBreakdown.debt ?? 0;
  const schemeTotal = equity + hybrid + debt;
  const aumCr = stats?.totalAUM ? Math.round(stats.totalAUM / 1e7) : null;

  // Composition bar widths — guard against a zero total on first load.
  const pctOf = (n: number) => (schemeTotal > 0 ? (n / schemeTotal) * 100 : 0);

  return (
    <section className="overflow-hidden px-5 py-12 sm:px-10 sm:py-14 lg:px-[113px] lg:py-16" style={{ background: INK }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="grid gap-10 lg:grid-cols-[65fr_35fr] lg:gap-11 items-start">
          {/* Left: copy + CTAs */}
          <div className="flex flex-col items-start">
            <span
              className="inline-block rounded-full px-3.5 py-1.5 text-[13px] mb-5"
              style={{ color: "#9fe1d5", border: `1px solid ${LINE}` }}
            >
              SEBI regulated Investment Category
            </span>

            <h1
              className="text-white text-[32px] leading-[1.2] sm:text-[38px] lg:text-[42px] mb-4"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Research, compare and invest in{" "}
              <span style={{ color: ACCENT }}>Specialised Investment Funds</span>
            </h1>

            <p className="text-[17px] leading-[1.5] max-w-[640px] mb-7" style={{ color: PALE }}>
              SIF bridges the gap between mutual funds and alternatives such as PMS & AIFs.
            <br></br>
              SIFcase offers Verified NAV, risk bands and strategy notes for
              every SEBI-registered scheme, from ₹10 lakh.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/sifs"
                className="inline-flex items-center rounded-[10px] px-[22px] py-3 text-[15px] font-medium transition-opacity hover:opacity-90"
                style={{ background: ACCENT, color: INK }}
              >
                Explore All SIFs
              </Link>
              <TalkToAdvisorButton
                className="inline-flex items-center rounded-[10px] px-[22px] py-3 text-[15px] font-medium text-white transition-colors hover:bg-white/5"
                style={{ border: `1px solid ${LINE}`, background: "transparent" }}
              />
            </div>
          </div>

          {/* Right: investor-type entry points */}
          <div className="flex flex-col gap-3 lg:mt-12">
            {INVESTOR_TYPES.map(({ Icon, title, description, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex items-center gap-3.5 rounded-[12px] p-4 transition-colors"
                style={{ background: INK_2, border: `1px solid ${LINE}` }}
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ background: "rgba(20,183,163,0.16)" }}
                >
                  <Icon className="size-5" style={{ color: ACCENT }} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-white mb-0.5">{title}</span>
                  <span className="block text-[13px] leading-[1.5]" style={{ color: PALE }}>{description}</span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: PALE }}
                />
              </Link>
            ))}
          </div>

          {/* Full-width stat strip */}
          <div className="lg:col-span-2">
            <div
              className="flex flex-wrap items-start justify-between gap-6 pt-5 sm:gap-10"
              style={{ borderTop: `1px solid ${LINE}` }}
            >
              <Stat value="₹17,858 Cr" label="AUM tracked" />
              <Stat value={String(stats?.uniqueAMCs ?? "—")} label="AMCs" />
              <Stat value={String(schemeTotal || "—")} label="Schemes" />
              <Stat value="Daily" label="NAV updates" />

              <div className="flex-1 min-w-[220px] max-sm:basis-full">
                <div className="flex items-center gap-4">
                  <span className="text-[22px] font-semibold text-white whitespace-nowrap">Scheme composition</span>
                  <span className="flex h-2 flex-1 gap-[3px] overflow-hidden rounded-full">
                    <span style={{ width: `${pctOf(equity)}%`, background: ACCENT }} />
                    <span style={{ width: `${pctOf(hybrid)}%`, background: "#0d8a7c" }} />
                    {debt > 0 && <span style={{ width: `${pctOf(debt)}%`, background: "#9fe1d5" }} />}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-[18px] gap-y-1 text-[13px] mt-0.5">
                  <span className="text-white">
                    <span className="mr-1.5 inline-block size-[7px] rounded-[2px] align-middle" style={{ background: ACCENT }} />
                    {equity} equity schemes
                  </span>
                  <span className="text-white">
                    <span className="mr-1.5 inline-block size-[7px] rounded-[2px] align-middle" style={{ background: "#0d8a7c" }} />
                    {hybrid} hybrid schemes
                  </span>
                  <span style={{ color: PALE, opacity: 0.7 }}>
                    <span className="mr-1.5 inline-block size-[7px] rounded-[2px] align-middle" style={{ background: "#9fe1d5" }} />
                    {debt > 0 ? `${debt} debt schemes` : "0 debt schemes yet"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
