"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { GLOSSARY } from "@/lib/glossary";

// Inline jargon definitions — spine question Q7 ("how do I judge one?").
// See docs/product/refactor/02-content-consolidation.md.
//
// Why inline rather than a link to /sif-101: metrics literacy currently exists
// only as destination learning, so understanding a term on an evaluation surface
// means leaving that surface — and leaving is where people don't come back. For
// the Qualified Novice, Q7 is the single biggest drop point in the journey.
//
// Collapsed by default and visually quiet, so a fluent reader (Diversifier,
// Analyst, NFO Opportunist) sees effectively no change. This is the compression
// rule from PRODUCT.md §4 expressed as one component: same surface, two depths.

export function Term({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const entry = GLOSSARY[slug];

  // An unknown slug renders as plain text rather than breaking the sentence.
  if (!entry) return <>{children ?? slug}</>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="cursor-help border-b border-dotted border-rule-strong text-left transition-colors hover:border-primary hover:text-primary"
      >
        {children ?? entry.term}
      </button>

      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-2 block w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-rule bg-canvas p-4 text-left shadow-card"
        >
          <span className="block text-[13px] font-semibold text-heading">{entry.term}</span>
          <span className="mt-1 block text-[13px] leading-[20px] text-body">{entry.short}</span>

          {entry.full && (
            <span className="mt-2 block text-[13px] leading-[20px] text-muted">{entry.full}</span>
          )}

          {entry.articleSlug && (
            <Link
              href={`/sif-101/${entry.articleSlug}`}
              className="mt-3 inline-block text-[13px] font-medium text-primary hover:underline"
            >
              Read more
            </Link>
          )}
        </span>
      )}
    </span>
  );
}
