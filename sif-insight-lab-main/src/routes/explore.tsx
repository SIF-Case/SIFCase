import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Rows3,
  ArrowUpDown,
  Download,
  ChevronDown,
  ArrowUp,
  X,
  RotateCcw,
} from "lucide-react";
import { FUNDS } from "@/lib/data";
import { CompareTrayProvider } from "@/components/home/CompareTray";
import { FundCard } from "@/components/funds/FundCard";
import { FundListRow, FundListHeader } from "@/components/explore/FundListRow";
import { UpcomingSchemes } from "@/components/explore/UpcomingSchemes";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { exportCSV, exportJSON, exportXLSX, printPDF, copyShareLink } from "@/lib/export";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore SIFs — Screener · SIFHub" },
      {
        name: "description",
        content:
          "Screen India's Specialized Investment Funds by AMC, strategy, AUM, risk, returns, expense and more. Switch between card and list views and export anytime.",
      },
    ],
  }),
  component: () => (
    <CompareTrayProvider>
      <Explore />
    </CompareTrayProvider>
  ),
});

type SortKey = "aum" | "y1" | "sharpe" | "vol" | "expense" | "name" | "launch";
type View = "grid" | "list";

const SORT_LABEL: Record<SortKey, string> = {
  aum: "AUM",
  y1: "1Y Return",
  sharpe: "Sharpe",
  vol: "Volatility",
  expense: "Expense",
  name: "Name",
  launch: "Launch date",
};

const PAGE = 24;

function Explore() {
  const allStrategies = useMemo(() => Array.from(new Set(FUNDS.map((f) => f.strategy))).sort(), []);
  const allAmcs = useMemo(() => Array.from(new Set(FUNDS.map((f) => f.amc))).sort(), []);
  const allBenchmarks = useMemo(() => Array.from(new Set(FUNDS.map((f) => f.benchmark))).sort(), []);

  const aumMax = useMemo(() => Math.ceil(Math.max(...FUNDS.map((f) => f.aum)) / 50) * 50, []);
  const expMax = useMemo(() => Math.ceil(Math.max(...FUNDS.map((f) => f.expense)) * 10) / 10, []);

  const [q, setQ] = useState("");
  const [strategies, setStrategies] = useState<string[]>([]);
  const [amcs, setAmcs] = useState<string[]>([]);
  const [risks, setRisks] = useState<number[]>([]);
  const [benchmarks, setBenchmarks] = useState<string[]>([]);
  const [aumRange, setAumRange] = useState<[number, number]>([0, aumMax]);
  const [expRange, setExpRange] = useState<[number, number]>([0, expMax]);
  const [minY1, setMinY1] = useState<number>(-20);
  const [minSharpe, setMinSharpe] = useState<number>(-2);

  const [sortKey, setSortKey] = useState<SortKey>("aum");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [view, setView] = useLocalStorage<View>("sifhub:explore:view", "grid");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  // back-to-top
  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const filtered = useMemo(() => {
    let list = FUNDS.filter((f) => {
      if (q && !`${f.name} ${f.amc} ${f.strategy} ${f.category}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (strategies.length && !strategies.includes(f.strategy)) return false;
      if (amcs.length && !amcs.includes(f.amc)) return false;
      if (risks.length && !risks.includes(f.risk)) return false;
      if (benchmarks.length && !benchmarks.includes(f.benchmark)) return false;
      if (f.aum < aumRange[0] || f.aum > aumRange[1]) return false;
      if (f.expense < expRange[0] || f.expense > expRange[1]) return false;
      if (f.returns.y1 < minY1) return false;
      if (f.metrics.sharpe < minSharpe) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const get = (f: (typeof FUNDS)[number]) =>
        sortKey === "aum"
          ? f.aum
          : sortKey === "y1"
          ? f.returns.y1
          : sortKey === "sharpe"
          ? f.metrics.sharpe
          : sortKey === "vol"
          ? f.metrics.vol
          : sortKey === "expense"
          ? f.expense
          : sortKey === "launch"
          ? +new Date(f.launch)
          : f.name;
      const av = get(a), bv = get(b);
      const cmp = typeof av === "string" ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [q, strategies, amcs, risks, benchmarks, aumRange, expRange, minY1, minSharpe, sortKey, sortDir]);

  // reset paging when filters change
  useEffect(() => setPage(1), [q, strategies, amcs, risks, benchmarks, aumRange, expRange, minY1, minSharpe, sortKey, sortDir]);

  const visible = filtered.slice(0, page * PAGE);
  const hasMore = visible.length < filtered.length;

  // infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setPage((p) => p + 1)),
      { rootMargin: "400px" },
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, visible.length]);

  const activeCount =
    (strategies.length ? 1 : 0) +
    (amcs.length ? 1 : 0) +
    (risks.length ? 1 : 0) +
    (benchmarks.length ? 1 : 0) +
    (aumRange[0] > 0 || aumRange[1] < aumMax ? 1 : 0) +
    (expRange[0] > 0 || expRange[1] < expMax ? 1 : 0) +
    (minY1 > -20 ? 1 : 0) +
    (minSharpe > -2 ? 1 : 0);

  const resetAll = () => {
    setQ("");
    setStrategies([]);
    setAmcs([]);
    setRisks([]);
    setBenchmarks([]);
    setAumRange([0, aumMax]);
    setExpRange([0, expMax]);
    setMinY1(-20);
    setMinSharpe(-2);
  };

  return (
    <div>
      {/* Page header */}
      <div className="max-w-[1440px] mx-auto px-6 pt-10 pb-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Screener</div>
        <h1 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight">Explore Specialized Investment Funds</h1>
        <p className="mt-2 text-[14px] text-muted-foreground max-w-2xl">
          Screen {FUNDS.length} actively tracked SIFs across {allAmcs.length} AMCs — filter, sort, compare and export.
        </p>
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 border-y border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search fund, AMC, strategy…"
              className="w-full bg-surface border border-border rounded-md pl-9 pr-3 h-9 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <button className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface text-[12px] font-medium hover:bg-surface-2">
                <SlidersHorizontal className="size-3.5" /> Filters
                {activeCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                    {activeCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FiltersPanel
                allStrategies={allStrategies}
                allAmcs={allAmcs}
                allBenchmarks={allBenchmarks}
                strategies={strategies} setStrategies={setStrategies}
                amcs={amcs} setAmcs={setAmcs}
                risks={risks} setRisks={setRisks}
                benchmarks={benchmarks} setBenchmarks={setBenchmarks}
                aumRange={aumRange} setAumRange={setAumRange} aumMax={aumMax}
                expRange={expRange} setExpRange={setExpRange} expMax={expMax}
                minY1={minY1} setMinY1={setMinY1}
                minSharpe={minSharpe} setMinSharpe={setMinSharpe}
                onReset={resetAll}
              />
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex items-center gap-1.5 text-[12px]">
            <span className="text-muted-foreground font-mono uppercase tracking-widest text-[10px]">Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 bg-surface border border-border rounded-md px-2 text-[12px]"
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORT_LABEL[k]}</option>
              ))}
            </select>
            <button
              onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
              className="h-9 w-9 inline-flex items-center justify-center border border-border rounded-md bg-surface hover:bg-surface-2"
              title={sortDir === "asc" ? "Ascending" : "Descending"}
            >
              <ArrowUpDown className="size-3.5" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="text-[12px] text-muted-foreground tabular hidden sm:block">
              <span className="text-foreground font-medium">{filtered.length}</span> of {FUNDS.length}
            </div>

            <div className="inline-flex p-0.5 rounded-md border border-border-strong bg-surface">
              <button
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                title="Card view"
                className={`h-8 w-8 inline-flex items-center justify-center rounded ${
                  view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                title="List view"
                className={`h-8 w-8 inline-flex items-center justify-center rounded ${
                  view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Rows3 className="size-3.5" />
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface text-[12px] font-medium hover:bg-surface-2">
                  <Download className="size-3.5" /> Export <ChevronDown className="size-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => exportCSV(filtered)}>Download CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportXLSX(filtered)}>Download Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportJSON(filtered)}>Download JSON</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={printPDF}>Print / Save as PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={copyShareLink}>Copy share link</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <div className="max-w-[1440px] mx-auto px-6 pb-3 flex flex-wrap items-center gap-1.5">
            {strategies.map((s) => (
              <Chip key={"s" + s} onRemove={() => setStrategies(strategies.filter((x) => x !== s))}>{s}</Chip>
            ))}
            {amcs.map((s) => (
              <Chip key={"a" + s} onRemove={() => setAmcs(amcs.filter((x) => x !== s))}>{s}</Chip>
            ))}
            {risks.map((r) => (
              <Chip key={"r" + r} onRemove={() => setRisks(risks.filter((x) => x !== r))}>Risk L{r}</Chip>
            ))}
            {benchmarks.map((b) => (
              <Chip key={"b" + b} onRemove={() => setBenchmarks(benchmarks.filter((x) => x !== b))}>{b}</Chip>
            ))}
            {(aumRange[0] > 0 || aumRange[1] < aumMax) && (
              <Chip onRemove={() => setAumRange([0, aumMax])}>AUM ₹{aumRange[0]}–{aumRange[1]} Cr</Chip>
            )}
            {(expRange[0] > 0 || expRange[1] < expMax) && (
              <Chip onRemove={() => setExpRange([0, expMax])}>Exp {expRange[0]}–{expRange[1]}%</Chip>
            )}
            {minY1 > -20 && <Chip onRemove={() => setMinY1(-20)}>1Y ≥ {minY1}%</Chip>}
            {minSharpe > -2 && <Chip onRemove={() => setMinSharpe(-2)}>Sharpe ≥ {minSharpe}</Chip>}
            <button onClick={resetAll} className="ml-1 text-[11px] text-primary inline-flex items-center gap-1 hover:underline">
              <RotateCcw className="size-3" /> Reset all
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-16 text-center">
            <div className="text-[14px] font-medium">No funds match your filters</div>
            <p className="text-[12px] text-muted-foreground mt-1">Try widening a range or clearing a chip.</p>
            <button onClick={resetAll} className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold">
              <RotateCcw className="size-3.5" /> Reset filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((f) => (
              <FundCard key={f.id} f={f} />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <FundListHeader />
            {visible.map((f) => (
              <FundListRow key={f.id} f={f} />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center text-[12px] text-muted-foreground tabular">
          Showing <span className="text-foreground font-medium mx-1">{visible.length}</span> of {filtered.length}
        </div>
        {hasMore && <div ref={sentinelRef} className="h-12" />}
      </div>

      <UpcomingSchemes />

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-6 z-40 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-xl shadow-black/30 inline-flex items-center justify-center hover:opacity-90"
          title="Back to top"
        >
          <ArrowUp className="size-4" />
        </button>
      )}
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 border border-primary/30 text-[11px] text-primary">
      {children}
      <button onClick={onRemove} className="p-0.5 rounded hover:bg-primary/20">
        <X className="size-3" />
      </button>
    </span>
  );
}

function FiltersPanel(props: {
  allStrategies: string[];
  allAmcs: string[];
  allBenchmarks: string[];
  strategies: string[]; setStrategies: (v: string[]) => void;
  amcs: string[]; setAmcs: (v: string[]) => void;
  risks: number[]; setRisks: (v: number[]) => void;
  benchmarks: string[]; setBenchmarks: (v: string[]) => void;
  aumRange: [number, number]; setAumRange: (v: [number, number]) => void; aumMax: number;
  expRange: [number, number]; setExpRange: (v: [number, number]) => void; expMax: number;
  minY1: number; setMinY1: (v: number) => void;
  minSharpe: number; setMinSharpe: (v: number) => void;
  onReset: () => void;
}) {
  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="mt-4">
      <Accordion type="multiple" defaultValue={["basics", "size", "perf"]} className="w-full">
        <AccordionItem value="basics">
          <AccordionTrigger className="text-[12px] font-mono uppercase tracking-widest">Basics</AccordionTrigger>
          <AccordionContent className="space-y-5 pt-2">
            <Group label="Strategy">
              <div className="flex flex-wrap gap-1.5">
                {props.allStrategies.map((s) => (
                  <Pill key={s} active={props.strategies.includes(s)} onClick={() => toggle(props.strategies, s, props.setStrategies)}>{s}</Pill>
                ))}
              </div>
            </Group>
            <Group label="AMC">
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-auto">
                {props.allAmcs.map((s) => (
                  <Pill key={s} active={props.amcs.includes(s)} onClick={() => toggle(props.amcs, s, props.setAmcs)}>{s.split(" ")[0]}</Pill>
                ))}
              </div>
            </Group>
            <Group label="Risk band">
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5].map((r) => (
                  <Pill key={r} active={props.risks.includes(r)} onClick={() => toggle(props.risks, r, props.setRisks)}>L{r}</Pill>
                ))}
              </div>
            </Group>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="size">
          <AccordionTrigger className="text-[12px] font-mono uppercase tracking-widest">Size &amp; cost</AccordionTrigger>
          <AccordionContent className="space-y-5 pt-3">
            <RangeBlock
              label="AUM (₹ Cr)"
              value={props.aumRange}
              min={0}
              max={props.aumMax}
              step={10}
              onChange={(v) => props.setAumRange(v)}
              format={(v) => `${v}`}
            />
            <RangeBlock
              label="Expense ratio (%)"
              value={props.expRange}
              min={0}
              max={props.expMax}
              step={0.05}
              onChange={(v) => props.setExpRange(v)}
              format={(v) => v.toFixed(2)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="perf">
          <AccordionTrigger className="text-[12px] font-mono uppercase tracking-widest">Performance</AccordionTrigger>
          <AccordionContent className="space-y-5 pt-3">
            <SingleSlider label="Min 1Y return (%)" value={props.minY1} min={-20} max={40} step={1} onChange={props.setMinY1} />
            <SingleSlider label="Min Sharpe" value={props.minSharpe} min={-2} max={3} step={0.1} onChange={props.setMinSharpe} format={(v) => v.toFixed(1)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="structure">
          <AccordionTrigger className="text-[12px] font-mono uppercase tracking-widest">Structure</AccordionTrigger>
          <AccordionContent className="space-y-5 pt-2">
            <Group label="Benchmark">
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-auto">
                {props.allBenchmarks.map((s) => (
                  <Pill key={s} active={props.benchmarks.includes(s)} onClick={() => toggle(props.benchmarks, s, props.setBenchmarks)}>{s}</Pill>
                ))}
              </div>
            </Group>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="sticky bottom-0 -mx-6 px-6 py-3 mt-4 bg-background border-t border-border flex items-center justify-between">
        <button onClick={props.onReset} className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <RotateCcw className="size-3" /> Reset all
        </button>
        <span className="text-[11px] text-muted-foreground">Filters apply live</span>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 h-7 rounded-md text-[11px] border transition-colors ${
        active ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
      }`}
    >
      {children}
    </button>
  );
}

function RangeBlock({
  label, value, min, max, step, onChange, format,
}: {
  label: string;
  value: [number, number];
  min: number; max: number; step: number;
  onChange: (v: [number, number]) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular text-foreground">{format(value[0])} – {format(value[1])}</span>
      </div>
      <Slider
        className="mt-3"
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange([v[0], v[1]] as [number, number])}
      />
    </div>
  );
}

function SingleSlider({
  label, value, min, max, step, onChange, format,
}: {
  label: string;
  value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular text-foreground">{format ? format(value) : value}</span>
      </div>
      <Slider
        className="mt-3"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}
