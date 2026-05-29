'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import Link from "next/link";
import { X, GitCompare } from "lucide-react";
import type { FundRow } from "@/lib/sifData";

type Ctx = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
};

const CompareCtx = createContext<Ctx | null>(null);

export function CompareTrayProvider({ children, funds }: { children: ReactNode; funds: FundRow[] }) {
  const [ids, setIds] = useState<string[]>([]);
  const toggle = useCallback((id: string) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id],
    );
  }, []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const clear = useCallback(() => setIds([]), []);

  return (
    <CompareCtx.Provider value={{ ids, toggle, has, clear }}>
      {children}
      <Tray ids={ids} funds={funds} toggle={toggle} clear={clear} />
    </CompareCtx.Provider>
  );
}

export function useCompareTray() {
  const ctx = useContext(CompareCtx);
  if (!ctx) throw new Error("useCompareTray needs CompareTrayProvider");
  return ctx;
}

function Tray({
  ids, funds, toggle, clear,
}: {
  ids: string[];
  funds: FundRow[];
  toggle: (id: string) => void;
  clear: () => void;
}) {
  if (ids.length === 0) return null;
  const items = ids.map((id) => funds.find((f) => f.schemeCode === id)).filter(Boolean) as FundRow[];
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[min(96vw,820px)] w-fit">
      <div className="bg-white/95 backdrop-blur border border-rule-strong rounded-2xl shadow-premium px-3 py-2 flex items-center gap-2">
        <div className="px-2.5 py-1 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-primary">
          <GitCompare className="size-3.5" /> Compare tray · {ids.length}/4
        </div>
        <div className="flex items-center gap-1.5 flex-wrap max-w-[460px]">
          {items.map((f) => (
            <span key={f.schemeCode} className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 text-[11px] rounded-full bg-surface border border-rule">
              <span className="max-w-[140px] truncate">{f.name.replace(/\s*-\s*(Regular|Direct|Growth|IDCW).*$/i, "")}</span>
              <button onClick={() => toggle(f.schemeCode)} className="p-0.5 rounded hover:bg-rule-strong">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <button onClick={clear} className="text-[10px] font-mono uppercase tracking-widest text-muted hover:text-body px-2">
          Clear
        </button>
        <Link
          href={`/compare?funds=${ids.join(",")}`}
          className="h-8 px-4 inline-flex items-center rounded-full bg-primary text-white text-[12px] font-semibold hover:opacity-90"
        >
          Compare →
        </Link>
      </div>
    </div>
  );
}
