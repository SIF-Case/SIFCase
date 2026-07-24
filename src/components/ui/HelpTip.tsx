"use client";

import type { ReactNode } from "react";

// Hover/focus explainer for a control — spine question Q7 ("how do I judge one?").
//
// Sibling of Term.tsx: Term explains jargon inside prose and opens on click,
// this explains what a *control* does and opens on hover. Deliberately adds no
// affordance of its own — no "?" badge, no underline, no layout shift — so a
// fluent reader sees an unchanged toolbar. Same compression rule as Term
// (PRODUCT.md §4): same surface, two depths.
//
// Keyboard users get it via :focus-visible rather than :focus-within — a mouse
// click also sets :focus-within, which would pin that control's tooltip open for
// as long as the button held focus and let a second one appear on the next hover.

export type HelpCopy = { title?: string; body: string };

export function HelpTip({
  title,
  body,
  align = "center",
  side = "top",
  className,
  children,
}: HelpCopy & {
  align?: "left" | "center" | "right";
  side?: "top" | "bottom";
  className?: string;
  children: ReactNode;
}) {
  if (!body) return <>{children}</>;

  const horiz =
    align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  const vert = side === "bottom" ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <span className={`group relative inline-flex ${className ?? ""}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${vert} ${horiz} z-[200] hidden w-[230px] max-w-[calc(100vw-2rem)] rounded-[10px] bg-[#0B1F3A] px-3 py-2.5 text-left text-[12px] font-normal normal-case leading-[1.5] tracking-normal text-white/75 shadow-[0_8px_24px_rgba(0,0,0,0.18)] group-hover:block group-has-[:focus-visible]:block`}
      >
        {title && <b className="font-semibold text-white">{title}</b>}
        {title ? " " : ""}
        {body}
      </span>
    </span>
  );
}
