"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroHeatmap } from "@/components/sections/HeroHeatmap";
import type { FundRow, SnapshotStats } from "@/lib/sifData";

export function Hero({ stats, topFund, allFunds }: { stats?: SnapshotStats; topFund?: FundRow; allFunds?: FundRow[] }) {
  return (
    <section
      className="overflow-hidden px-5 py-12 sm:px-10 sm:py-16 lg:px-[113px] lg:py-[84px]"
      style={{ background: "linear-gradient(0deg, #004c61 0%, #004c61 100%)" }}
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_378px]">
          {/* Left content */}
          <div className="flex flex-col items-start gap-8 sm:gap-10">
            {/* Platform badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
              style={{ borderColor: "#14b7a3", background: "rgba(20,183,163,0.1)" }}
            >
              <span
                className="text-[12px] font-semibold leading-[20px] uppercase tracking-wider sm:text-[13px] sm:leading-[26px] lg:text-[14px] lg:leading-[30px]"
                style={{ color: "#14b7a3" }}
              >
                India&apos;s SIF Research Platform
              </span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-4">
              <h1
                className="text-white max-w-[620px] text-[34px] leading-[42px] sm:text-[40px] sm:leading-[50px] lg:text-[44px] lg:leading-[56px]"
                style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                Research, Compare &amp;
                <br />
                Invest in{" "}
                <span style={{ color: "#14b7a3" }}>Specialised</span> Investment Funds
              </h1>
              <p
                className="max-w-[580px] text-[15px] leading-[24px] sm:text-[16px] sm:leading-[26px] lg:text-[18px] lg:leading-[28px]"
                style={{ color: "rgba(255,255,255,0.72)", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400 }}
              >
                Every SEBI-registered SIF — tracked, rated and explained. From first read to final
                investment, SIFcase is your complete guide to India&apos;s newest investment
                category.
              </p>
            </div>

            {/* CTA button */}
            <Link
              href="/sifs"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: "#14b7a3", textDecoration: "none", boxShadow: "0 0 24px rgba(20,183,163,0.35)" }}
            >
              Explore Funds
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right: heatmap panel */}
          <div className="mx-auto w-full max-w-[378px] lg:mx-0">
            <HeroHeatmap stats={stats} topFund={topFund} allFunds={allFunds} />
          </div>
        </div>
      </div>
    </section>
  );
}