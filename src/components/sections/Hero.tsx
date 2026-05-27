"use client";

import { useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { HeroHeatmap } from "@/components/sections/HeroHeatmap";

const POPULAR_TAGS = [
  "Long-Short",
  "Market Neutral",
  "Equity Ex-Top 100",
  "Hybrid L/S",
  "Event Driven",
  "New Launches",
  "Top by NAV",
];


export function Hero() {
  const [query, setQuery] = useState("");

  return (
    <section className="bg-white pt-8 pb-12 md:pt-10 md:pb-16 border-b border-rule-soft">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[440px_1fr] xl:grid-cols-[500px_1fr] gap-8 lg:gap-10 items-start">

          {/* ── Left column ─────────────────────────── */}
          <div>

            {/* Headline */}
            <h1 className="text-[38px] sm:text-[44px] lg:text-[48px] font-bold leading-[1.06] tracking-[-1.2px] text-ink mb-4">
              India&apos;s verified{" "}
              <span className="text-primary">Specialized</span>
              <br />
              <span className="text-primary">Investment Fund</span>
              <br />
              research platform.
            </h1>

            {/* Subtext */}
            <p className="text-[15px] text-body leading-[1.65] mb-6 max-w-full">
              Research, compare and understand SIFs before you invest.
              Source-verified NAV, official document and responsible
              comparisons for serious investors.
            </p>

            {/* Search bar */}
            <div className="flex items-center gap-0 rounded-[12px] border border-rule bg-white shadow-card mb-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 overflow-hidden">
              <Search
                className="ml-4 w-4 h-4 text-faint flex-shrink-0"
                strokeWidth={2}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "Long-Short", "Market Neutral", or a strategy...'
                className="flex-1 px-3 py-3.5 text-[14px] text-body placeholder:text-faint bg-transparent outline-none"
              />
              <button className="m-1.5 px-5 py-2.5 rounded-[8px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover flex-shrink-0">
                Search
              </button>
            </div>

            {/* Popular tags */}
            <div className="flex flex-wrap items-center gap-2 mb-10">
              <span className="text-[11.5px] font-semibold text-faint uppercase tracking-wide">
                Popular
              </span>
              {POPULAR_TAGS.map((tag) => (
                <a
                  key={tag}
                  href={`/sifs?strategy=${encodeURIComponent(tag)}`}
                  className="px-3 py-1.5 rounded-full border border-rule text-[12.5px] text-body hover:border-primary hover:text-primary hover:bg-primary-tint"
                >
                  {tag}
                </a>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/sifs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-brand-navy text-white text-[13.5px] font-semibold hover:bg-ink"
              >
                Explore SIFs
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href="/compare"
                className="inline-flex items-center px-5 py-2.5 rounded-[10px] border border-rule text-[13.5px] font-semibold text-heading hover:border-brand-navy hover:bg-surface"
              >
                Compare SIFs
              </a>
              <a
                href="/learn"
                className="inline-flex items-center px-5 py-2.5 rounded-[10px] border border-rule text-[13.5px] font-semibold text-heading hover:border-brand-navy hover:bg-surface"
              >
                Learn SIFs
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-muted hover:text-primary"
              >
                Book Consultation →
              </a>
            </div>
          </div>

          {/* ── Right column — performance heatmap ───── */}
          <div className="hidden lg:block pt-2">
            <HeroHeatmap />
          </div>
        </div>
      </div>
    </section>
  );
}
