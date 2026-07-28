"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  /**
   * Link mode (server-paginated lists). A URL containing the literal token
   * `{page}`, e.g. `/news?brand=X&page={page}#general-news`. A function can't be
   * used here — Server Components can't pass functions to Client Components.
   * Takes precedence over onChange.
   */
  hrefPattern?: string;
  /** Button mode (client-paginated lists). */
  onChange?: (page: number) => void;
  className?: string;
};

/** Page numbers with ellipsis: 1 … 4 5 6 … 12 */
function pageItems(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const items: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("…");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("…");
  items.push(totalPages);

  return items;
}

const base =
  "inline-flex items-center justify-center min-w-[34px] h-[34px] px-2.5 rounded-[9px] text-[13px] font-medium transition-colors";
const idle = "bg-white border border-rule text-body hover:border-rule-strong hover:text-heading";
const active = "bg-primary border border-primary text-white";
const disabled = "bg-white border border-rule text-faint pointer-events-none opacity-50";

export function Pagination({ page, totalPages, hrefPattern, onChange, className = "" }: Props) {
  if (totalPages <= 1) return null;

  const cell = (p: number, label: React.ReactNode, isActive: boolean, isDisabled = false) => {
    const cls = `${base} ${isDisabled ? disabled : isActive ? active : idle}`;
    if (isDisabled) return <span className={cls}>{label}</span>;
    if (hrefPattern) {
      return (
        <Link
          href={hrefPattern.replace("{page}", String(p))}
          scroll
          className={cls}
          aria-current={isActive ? "page" : undefined}
        >
          {label}
        </Link>
      );
    }
    return (
      <button type="button" onClick={() => onChange?.(p)} className={cls} aria-current={isActive ? "page" : undefined}>
        {label}
      </button>
    );
  };

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1.5 mt-8 ${className}`}>
      {cell(page - 1, <ChevronLeft className="w-4 h-4" />, false, page <= 1)}
      {pageItems(page, totalPages).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-[13px] text-faint">
            …
          </span>
        ) : (
          <span key={item}>{cell(item, item, item === page)}</span>
        ),
      )}
      {cell(page + 1, <ChevronRight className="w-4 h-4" />, false, page >= totalPages)}
    </nav>
  );
}
