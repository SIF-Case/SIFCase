'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import Link from "next/link";
import { X, GitCompare } from "lucide-react";
import type { FundRow } from "@/lib/sifData";

// Tray only ever displays schemeCode + name — avoid shipping full FundRow
// (sparklines/returns/etc.) into this client boundary twice.
export type CompareFund = Pick<FundRow, "schemeCode" | "name">;

type Ctx = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
};

const CompareCtx = createContext<Ctx | null>(null);

// Providers is remounted per-page (each page server-fetches its own funds
// subset), so ids must round-trip through sessionStorage or the tray empties
// on every navigation.
const STORAGE_KEY = "sifcase:compareIds";

export function CompareTrayProvider({ children, funds }: { children: ReactNode; funds: CompareFund[] }) {
  // Start empty so SSR markup (tray hidden when ids.length === 0) matches the
  // client's first render — hydrate from storage in an effect, not lazy-init.
  const [ids, setIds] = useState<string[]>([]);

  // Guards the write-effect below: without it, the write-effect fires on
  // mount with the stale pre-hydration `[]` in the SAME effects pass as the
  // hydrate read (state updates from an effect don't apply until the pass
  // finishes), clobbering sessionStorage before the restored value ever
  // reaches it — capping the tray at whatever was added since the last nav.
  const skipNextWrite = useRef(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setIds(JSON.parse(stored));
      } else {
        skipNextWrite.current = false;
      }
    } catch {
      skipNextWrite.current = false;
    }
  }, []);

  useEffect(() => {
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore write failures (private mode, quota, etc.)
    }
  }, [ids]);

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
  funds: CompareFund[];
  toggle: (id: string) => void;
  clear: () => void;
}) {
  if (ids.length === 0) return null;
  const items = ids.map((id) => funds.find((f) => f.schemeCode === id)).filter(Boolean) as CompareFund[];
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-32px)] max-w-6xl">
      <div className="bg-[#ECF4F1]/95 backdrop-blur-md border-2 border-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-5 py-3 flex items-center justify-between gap-4">

        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Label — always visible */}
          <div className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-widest text-primary font-semibold whitespace-nowrap shrink-0">
            <GitCompare className="size-4" />
            <span className="hidden sm:inline">Compare tray ·</span>
            <span>{ids.length}/4</span>
          </div>

          {/* Chips — desktop only */}
          <div className="hidden sm:flex items-center justify-end gap-2 flex-1 min-w-0">
            {items.map((f) => (
              <span key={f.schemeCode} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-[13px] font-medium rounded-lg bg-white border border-gray-800 hover:bg-white/80 transition-colors max-w-[220px] shrink min-w-0">
                <span className="truncate text-primary">{f.name.replace(/\s*-\s*(Regular|Direct|Growth|IDCW).*$/i, "")}</span>
                <button onClick={() => toggle(f.schemeCode)} className="p-1 shrink-0 rounded-md hover:bg-gray-100 text-primary/60 hover:text-primary transition-colors">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Mobile: fund name list compact */}
          <div className="flex sm:hidden flex-1 min-w-0 flex-col gap-1">
            {items.map((f) => (
              <div key={f.schemeCode} className="flex items-center justify-between gap-2 text-[13px] text-body font-medium">
                <span className="truncate">{f.name.replace(/\s*-\s*(Regular|Direct|Growth|IDCW).*$/i, "")}</span>
                <button onClick={() => toggle(f.schemeCode)} className="shrink-0 p-1 rounded-full hover:bg-[#d0e3db]">
                  <X className="size-4 text-muted" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={clear} className="text-[12px] font-mono uppercase tracking-widest font-semibold text-muted hover:text-body px-2 whitespace-nowrap shrink-0 transition-colors">
            Clear
          </button>
          <Link
            href={`/compare?funds=${ids.join(",")}`}
            className="h-10 px-6 inline-flex items-center justify-center rounded-full bg-primary text-white text-[14px] font-semibold hover:bg-primary/90 whitespace-nowrap shrink-0 transition-colors shadow-sm"
          >
            Compare →
          </Link>
        </div>
      </div>
    </div>
  );
}
