import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { X, GitCompare } from "lucide-react";
import { FUNDS } from "@/lib/data";

type Ctx = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
};
const CompareCtx = createContext<Ctx | null>(null);

export function CompareTrayProvider({ children }: { children: ReactNode }) {
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
      <Tray />
    </CompareCtx.Provider>
  );
}

export function useCompareTray() {
  const ctx = useContext(CompareCtx);
  if (!ctx) throw new Error("useCompareTray needs CompareTrayProvider");
  return ctx;
}

function Tray() {
  const { ids, toggle, clear } = useCompareTray();
  if (ids.length === 0) return null;
  const items = ids.map((id) => FUNDS.find((f) => f.id === id)!).filter(Boolean);
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[min(96vw,820px)] w-fit">
      <div className="bg-surface/95 backdrop-blur border border-border-strong rounded-2xl shadow-2xl shadow-black/50 px-3 py-2 flex items-center gap-2">
        <div className="px-2.5 py-1 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-primary">
          <GitCompare className="size-3.5" /> Compare tray · {ids.length}/4
        </div>
        <div className="flex items-center gap-1.5 flex-wrap max-w-[460px]">
          {items.map((f) => (
            <span key={f.id} className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 text-[11px] rounded-full bg-surface-2 border border-border">
              <span className="max-w-[140px] truncate">{f.name.replace(/\s*Fund\s*$/, "")}</span>
              <button onClick={() => toggle(f.id)} className="p-0.5 rounded hover:bg-border-strong">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <button onClick={clear} className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground px-2">
          Clear
        </button>
        <Link
          to="/compare"
          className="h-8 px-4 inline-flex items-center rounded-full bg-primary text-primary-foreground text-[12px] font-semibold hover:opacity-90"
        >
          Compare →
        </Link>
      </div>
    </div>
  );
}
