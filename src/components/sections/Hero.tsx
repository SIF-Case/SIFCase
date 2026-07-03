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
          <div className="flex flex-col items-start gap-6 sm:gap-8">
            {/* SEBI badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
              style={{ borderColor: "#14b7a3", background: "rgba(255,255,255,0.1)" }}
            >
              <span
                className="text-[12px] font-medium leading-[20px] uppercase sm:text-[14px] sm:leading-[26px] lg:text-[16px] lg:leading-[30px]"
                style={{ color: "#14b7a3" }}
              >
                SEBI-Regulated · India&apos;s SIF Research Platform
              </span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-4">
              <h1
                className="text-white max-w-[515px] text-[28px] leading-[36px] sm:text-[34px] sm:leading-[44px] lg:text-[40px] lg:leading-[58px]"
                style={{ fontFamily: "Nohemi, 'Satoshi Variable', sans-serif", fontWeight: 400 }}
              >
                Research, Compare &amp; Invest in{" "}
                <span style={{ color: "#14b7a3" }}>Specialised</span> Investment Funds
              </h1>
              <p
                className="max-w-[522px] text-[15px] leading-[24px] sm:text-[17px] sm:leading-[27px] lg:text-[20px] lg:leading-[30px]"
                style={{ color: "#FFF", fontFamily: "'Satoshi Variable', sans-serif", fontWeight: 400 }}
              >
                Every SEBI-registered SIF — tracked, rated and explained. From first read to final
                investment, SIFcase is your complete guide to India&apos;s newest investment
                category.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <Link
                href="/sifs"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-[15px] font-medium text-white transition-opacity hover:opacity-90 sm:w-[170px]"
                style={{ background: "#14b7a3", textDecoration: "none" }}
              >
                Explore Funds
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/suitability"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-[15px] font-medium text-white transition-opacity hover:opacity-90 sm:w-[208px]"
                style={{ background: "#3b8bb1", textDecoration: "none" }}
              >
                <Sparkles className="w-5 h-5" />
                Find my Ideal SIF
              </Link>
            </div>
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