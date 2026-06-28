"use client";

import { useState } from "react";
import type { FaqGroup } from "@/lib/sifData";

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3.333 8H12.667" stroke="#666" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 3.333V12.667" stroke="#666" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3.333 8H12.667" stroke="#666" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-black">
      <path d="M14.133 5.6C14.467 5.854 14.667 6.247 14.667 6.667V13.333C14.667 13.687 14.526 14.026 14.276 14.276C14.026 14.526 13.687 14.667 13.333 14.667H2.667C2.313 14.667 1.974 14.526 1.724 14.276C1.474 14.026 1.333 13.687 1.333 13.333V6.667C1.333 6.46 1.382 6.256 1.474 6.071C1.567 5.885 1.701 5.724 1.867 5.6L7.2 1.6C7.431 1.427 7.712 1.333 8 1.333C8.289 1.333 8.569 1.427 8.8 1.6L14.133 5.6Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.667 6.667L8.687 10.467C8.481 10.595 8.243 10.664 8 10.664C7.757 10.664 7.519 10.595 7.313 10.467L1.333 6.667" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#CAE973]">
      <path d="M10.456 11.699C10.326 10.877 9.906 10.128 9.272 9.587C8.638 9.046 7.833 8.749 7 8.75C6.167 8.75 5.361 9.047 4.728 9.588C4.094 10.128 3.674 10.877 3.543 11.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8.75C8.289 8.75 9.333 7.705 9.333 6.417C9.333 5.128 8.289 4.083 7 4.083C5.711 4.083 4.667 5.128 4.667 6.417C4.667 7.705 5.711 8.75 7 8.75Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12.833C10.222 12.833 12.833 10.222 12.833 7C12.833 3.778 10.222 1.167 7 1.167C3.778 1.167 1.167 3.778 1.167 7C1.167 10.222 3.778 12.833 7 12.833Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FAQSection({ groups }: { groups: FaqGroup[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(groups[0]?.category ?? "");

  if (!groups.length) return null;

  const active = groups.find((g) => g.category === activeCategory) ?? groups[0];

  return (
    <section className="bg-white py-[56px] px-6 lg:px-[212px]">
      <div className="flex flex-col align-stretch gap-2 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-1 text-center">
          <p className="text-[15px] font-medium tracking-[0.2px] uppercase mb-0">
            <span className="text-[#555] font-normal">Everything you need </span>
            <span className="text-[#14b7a3]">to know</span>
          </p>
          <h2 className="text-[#111] text-[24px] font-bold tracking-[-0.67px] leading-[25px]">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Tab bar */}
        {groups.length > 1 && (
          <div className="flex justify-center items-center gap-1 py-6 flex-wrap">
            {groups.map((g) => (
              <button
                key={g.category}
                onClick={() => { setActiveCategory(g.category); setOpenKey(null); }}
                className={`py-1.5 px-4 rounded-full text-[14px] font-medium leading-5 border transition-all duration-150 ${
                  g.category === active.category
                    ? "bg-[#3b8bb1] border-[#3b8bb1] text-white"
                    : "bg-transparent border-[#d8d8db] text-[#555] hover:border-[#3b8bb1] hover:text-[#3b8bb1]"
                }`}
              >
                {g.category}
              </button>
            ))}
          </div>
        )}

        {/* Accordion */}
        <div className="flex flex-col gap-2 w-full mt-2">
          {active.items.map((item, i) => {
            const key = `${active.category}-${i}`;
            const isOpen = openKey === key;
            return (
              <div key={key} className="rounded-[14px] border border-[#d8d8db] bg-white overflow-hidden">
                <button
                  onClick={() => setOpenKey(isOpen ? null : key)}
                  className="w-full flex justify-between items-center py-4 px-5 bg-transparent border-0 cursor-pointer text-left gap-4 hover:bg-[#f8f9fb]/50 transition-colors"
                >
                  <span className="text-[#111] text-[15px] font-medium leading-[20.625px] tracking-[-0.234px] flex-1">
                    {item.question}
                  </span>
                  <span className="flex items-center justify-center w-6 h-6 shrink-0">
                    {isOpen ? <MinusIcon /> : <PlusIcon />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-[14px] leading-5 text-[#555]">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions */}
        <div className="flex flex-col items-center gap-3 p-6 mt-4 rounded-[14px] border border-[#c8cace] bg-[#ecf4f1] text-center w-full">
          <div className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[rgba(217,217,217,0.6)]">
            <MailIcon />
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-[#111] text-[20px] font-medium leading-[25px] tracking-[-0.67px] m-0">Still have questions?</p>
            <p className="w-auto max-w-[282px] text-[#555] text-[14px] font-normal leading-[15px] tracking-[0.2px] m-0">We're here to help you get the answers you need</p>
          </div>
          <a
            href="mailto:support@sifcase.com"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#2d3c47] hover:opacity-90 transition-opacity text-[#cae973] text-[14px] font-medium leading-5 w-[170px] decoration-none"
          >
            Contact Support
            <UserIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
