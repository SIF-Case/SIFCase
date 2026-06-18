"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { FaqGroup } from "@/lib/sifData";

export function FAQSection({ groups }: { groups: FaqGroup[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(groups[0]?.category ?? "");

  if (!groups.length) return null;

  const active = groups.find((g) => g.category === activeCategory) ?? groups[0];

  return (
    <section className="bg-surface py-section border-y border-rule-soft">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        <div className="max-w-xl mx-auto mb-12 text-center">
          <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">FAQs</p>
          <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-3">
            Frequently asked questions
          </h2>
          <p className="text-[16px] text-muted leading-relaxed">
            Answers to common questions about SIFs and how SIFcase works.
          </p>
        </div>

        {groups.length > 1 && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {groups.map((g) => (
              <button
                key={g.category}
                onClick={() => { setActiveCategory(g.category); setOpenKey(null); }}
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold border transition ${
                  g.category === active.category
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-body border-rule hover:border-primary hover:text-primary"
                }`}
              >
                {g.category}
              </button>
            ))}
          </div>
        )}

        <div className="max-w-3xl mx-auto bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
          {active.items.map((item, i) => {
            const key = `${active.category}-${i}`;
            const isOpen = openKey === key;
            return (
              <div key={key} className="border-b border-rule last:border-0">
                <button
                  onClick={() => setOpenKey(isOpen ? null : key)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface transition"
                >
                  <span className="flex items-center gap-3 text-[14.5px] font-semibold text-heading">
                    <HelpCircle className="size-4 text-primary shrink-0" />
                    {item.question}
                  </span>
                  <ChevronDown className={`size-4 text-muted shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pl-12 text-[14px] text-body leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
