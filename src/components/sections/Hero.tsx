"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroHeatmap } from "@/components/sections/HeroHeatmap";
import type { FundRow, SnapshotStats } from "@/lib/sifData";

export function Hero({ stats, topFund }: { stats?: SnapshotStats; topFund?: FundRow }) {
  return (
    <section
      className="overflow-hidden"
      style={{
        background: "linear-gradient(0deg, #004c61 0%, #004c61 100%)",
        padding: "84px 53px 84px 113px",
        minHeight: 569,
      }}
    >
      <div className="max-w-[1280px] mx-auto" style={{ padding: "0" }}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_378px]">
          {/* Left content */}
          <div className="flex flex-col items-start gap-8">
            {/* SEBI badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
              style={{ borderColor: "#14b7a3", background: "rgba(255,255,255,0.1)" }}
            >
              <span
                className="text-[16px] font-medium leading-[30px] uppercase sm:text-[16px]"
                style={{ color: "#14b7a3" }}
              >
                SEBI-Regulated · India&apos;s SIF Research Platform
              </span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-4">
              <h1
                className="text-white max-w-[515px]"
                style={{
                  fontFamily: "Nohemi, 'Satoshi Variable', sans-serif",
                  fontSize: 40,
                  fontWeight: 400,
                  lineHeight: "58px",
                }}
              >
                Research, Compare &amp; Invest in{" "}
                <span style={{ color: "#14b7a3" }}>Specialised</span> Investment Funds
              </h1>
              <p
                className="max-w-[522px]"
                style={{
                  color: "#FFF",
                  fontFamily: "'Satoshi Variable', sans-serif",
                  fontSize: 20,
                  fontStyle: "normal",
                  fontWeight: 400,
                  lineHeight: "30px",
                }}
              >
                Every SEBI-registered SIF — tracked, rated and explained. From first read to final
                investment, SIFcase is your complete guide to India&apos;s newest investment
                category.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/sifs"
                className="inline-flex items-center justify-center gap-2 text-white text-[15px] font-medium transition-opacity hover:opacity-90"
                style={{
                  height: 48,
                  width: 170,
                  borderRadius: 100,
                  background: "#14b7a3",
                  padding: "10px 16px",
                  textDecoration: "none",
                }}
              >
                Explore Funds
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/suitability"
                className="inline-flex items-center justify-center gap-2 text-white text-[15px] font-medium transition-opacity hover:opacity-90"
                style={{
                  height: 48,
                  width: 208,
                  borderRadius: 100,
                  background: "#3b8bb1",
                  padding: "10px 16px",
                  textDecoration: "none",
                }}
              >
                <Sparkles className="w-5 h-5" />
                Find my Ideal SIF
              </Link>
            </div>
          </div>

          {/* Right: heatmap panel */}
          <div className="mx-auto lg:mx-0">
            <HeroHeatmap stats={stats} topFund={topFund} />
          </div>
        </div>
      </div>
    </section>
  );
}
