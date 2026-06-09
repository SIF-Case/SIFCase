"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, RefreshCw, Save, X, Pencil, ChevronLeft, ChevronRight, Loader2, Check, SlidersHorizontal } from "lucide-react";
import { deriveCompanyNameShort } from "@/lib/schemeHelpers";

type SchemeRow = {
  _id: string;
  schemeCode: string;
  schemeName: string;
  amc: string;
  fundType: string;
  isinGrowth: string;
  isinReinvestment: string | null;
  plan: string;
  option: string;
  strategy: string;
  companyName: string;
  companyName_short: string;
  brandName: string;
  fundName: string;
  isActive: boolean;
};

const PLAN_OPTIONS = ["Regular", "Direct"];
const OPTION_OPTIONS = ["Growth", "IDCW", "Monthly IDCW", "Quarterly IDCW", "IDCW Payout", "IDCW Reinvestment"];
const STRATEGY_OPTIONS = [
  "Equity Long-Short",
  "Hybrid Long-Short",
  "Equity Ex-Top 100 Long-Short",
  "Active Asset Allocator Long-Short",
  "Sector Rotation Long-Short",
];

const COLUMNS: {
  key: keyof SchemeRow;
  label: string;
  width: string;
  type?: "select" | "bool";
  options?: string[];
  readonly?: boolean;
}[] = [
    { key: "schemeCode", label: "Code", width: "80px", readonly: true },
    { key: "schemeName", label: "Scheme Name", width: "minmax(200px,2fr)" },
    { key: "fundName", label: "Fund Name", width: "minmax(160px,1.5fr)" },
    { key: "brandName", label: "Brand", width: "100px" },
    { key: "amc", label: "AMC", width: "120px" },
    { key: "companyName", label: "Company", width: "minmax(140px,1fr)" },
    { key: "companyName_short", label: "Co Short", width: "100px" },
    { key: "isinGrowth", label: "ISIN Growth", width: "130px" },
    { key: "isinReinvestment", label: "ISIN Reinvest", width: "130px" },
    { key: "plan", label: "Plan", width: "90px", type: "select", options: PLAN_OPTIONS },
    { key: "option", label: "Option", width: "120px", type: "select", options: OPTION_OPTIONS },
    { key: "strategy", label: "Strategy", width: "minmax(140px,1fr)", type: "select", options: STRATEGY_OPTIONS },
    { key: "isActive", label: "Active", width: "64px", type: "bool" },
  ];

const GRID = COLUMNS.map((c) => c.width).join(" ");

export default function AdminSchemesPage() {
  return <Suspense><AdminSchemes /></Suspense>;
}

function AdminSchemes() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<SchemeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const initialQ = searchParams.get("q") ?? "";
  const [inputSearch, setInputSearch] = useState(initialQ);
  const [search, setSearch] = useState(initialQ);
  const [filterPlan, setFilterPlan] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [filterStrategy, setFilterStrategy] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Partial<SchemeRow>>>({});
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const activeFilterCount = [filterPlan, filterOption, filterStrategy, filterActive].filter(Boolean).length;

  const fetchSchemes = useCallback(async () => {
    setFetching(true);
    const params = new URLSearchParams({
      page: String(page), limit: "30", q: search,
      ...(filterPlan && { plan: filterPlan }),
      ...(filterOption && { option: filterOption }),
      ...(filterStrategy && { strategy: filterStrategy }),
      ...(filterActive && { active: filterActive }),
    });
    const res = await fetch(`/api/admin/funds?${params}`);
    const data = await res.json();
    setRows(data.schemes ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
    setFetching(false);
  }, [page, search, filterPlan, filterOption, filterStrategy, filterActive]);

  useEffect(() => { fetchSchemes(); }, [fetchSchemes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search input → committed search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(inputSearch);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputSearch]);

  function startEditing() {
    const initial: Record<string, Partial<SchemeRow>> = {};
    rows.forEach((r) => { initial[r.schemeCode] = { ...r }; });
    setDrafts(initial);
    setEditing(true);
    setSavedCount(null);
  }

  function cancelEditing() {
    setDrafts({});
    setEditing(false);
  }

  function change(code: string, key: keyof SchemeRow, value: unknown) {
    setDrafts((d) => {
      const updated: Partial<SchemeRow> = { ...(d[code] ?? {}), [key]: value };
      if (key === "companyName") {
        updated.companyName_short = deriveCompanyNameShort(String(value));
      }
      return { ...d, [code]: updated };
    });
  }

  function isDirty(code: string) {
    const draft = drafts[code];
    const row = rows.find((r) => r.schemeCode === code);
    if (!draft || !row) return false;
    return COLUMNS.some(
      (c) => !c.readonly && draft[c.key] !== undefined && String(draft[c.key]) !== String((row as Record<string, unknown>)[c.key])
    );
  }

  async function saveAll() {
    const dirty = rows.filter((r) => isDirty(r.schemeCode));
    if (dirty.length === 0) { setEditing(false); return; }
    setSaving(true);
    await Promise.all(
      dirty.map((r) =>
        fetch(`/api/admin/funds/${r.schemeCode}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(drafts[r.schemeCode]),
        })
      )
    );
    setRows((prev) =>
      prev.map((r) => isDirty(r.schemeCode) ? { ...r, ...drafts[r.schemeCode] } as SchemeRow : r)
    );
    setSavedCount(dirty.length);
    setSaving(false);
    setDrafts({});
    setEditing(false);
  }

  function resetFilters() {
    setFilterPlan(""); setFilterOption(""); setFilterStrategy(""); setFilterActive("");
    setInputSearch(""); setSearch(""); setPage(1);
  }

  const dirtyCount = rows.filter((r) => isDirty(r.schemeCode)).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">Scheme Table</h1>
          <p className="text-[14px] text-muted mt-1">{total} schemes</p>
        </div>
        <div className="flex items-center gap-3">
          {savedCount !== null && !editing && (
            <span className="flex items-center gap-1.5 text-[12px] text-gain font-medium">
              <Check className="size-3.5" /> {savedCount} row{savedCount !== 1 ? "s" : ""} saved
            </span>
          )}
          <button onClick={() => fetchSchemes()} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
            <RefreshCw className={`size-3.5 ${fetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          {editing ? (
            <>
              <button onClick={cancelEditing} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
                <X className="size-3.5" /> Cancel
              </button>
              <button
                onClick={saveAll}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover disabled:opacity-60 shadow-btn"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {saving ? "Saving…" : `Save Changes${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover shadow-btn"
            >
              <Pencil className="size-3.5" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search box */}
        <div className="flex items-center gap-2 bg-white border border-rule rounded-[10px] px-3 h-10 shadow-card flex-1 min-w-[320px] max-w-[520px]">
          <Search className="size-3.5 text-muted shrink-0" />
          <input
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
            placeholder="Search scheme name, code, AMC, ISIN…"
            className="flex-1 text-[13px] bg-transparent outline-none"
          />
          {fetching && <Loader2 className="size-3.5 text-muted animate-spin shrink-0" />}
          {inputSearch && !fetching && (
            <button onClick={() => { setInputSearch(""); setSearch(""); setPage(1); }}>
              <X className="size-3.5 text-muted" />
            </button>
          )}
        </div>

        {/* Filter selects */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="size-3.5 text-muted shrink-0" />
        </div>

        <select
          value={filterPlan}
          onChange={(e) => { setFilterPlan(e.target.value); setPage(1); }}
          className={`h-10 px-3 pr-7 rounded-[10px] border text-[13px] bg-white outline-none shadow-card appearance-none cursor-pointer transition-colors ${filterPlan ? "border-primary text-primary font-medium" : "border-rule text-muted"}`}
        >
          <option value="">All Plans</option>
          {PLAN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          value={filterOption}
          onChange={(e) => { setFilterOption(e.target.value); setPage(1); }}
          className={`h-10 px-3 pr-7 rounded-[10px] border text-[13px] bg-white outline-none shadow-card appearance-none cursor-pointer transition-colors ${filterOption ? "border-primary text-primary font-medium" : "border-rule text-muted"}`}
        >
          <option value="">All Options</option>
          {OPTION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          value={filterStrategy}
          onChange={(e) => { setFilterStrategy(e.target.value); setPage(1); }}
          className={`h-10 px-3 pr-7 rounded-[10px] border text-[13px] bg-white outline-none shadow-card appearance-none cursor-pointer transition-colors ${filterStrategy ? "border-primary text-primary font-medium" : "border-rule text-muted"}`}
        >
          <option value="">All Strategies</option>
          {STRATEGY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
          className={`h-10 px-3 pr-7 rounded-[10px] border text-[13px] bg-white outline-none shadow-card appearance-none cursor-pointer transition-colors ${filterActive ? "border-primary text-primary font-medium" : "border-rule text-muted"}`}
        >
          <option value="">Active: All</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 h-10 px-3 rounded-[10px] border border-rule text-[12px] text-muted hover:text-loss hover:border-loss transition-colors bg-white shadow-card"
          >
            <X className="size-3" /> Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {editing && (
        <div className="mb-3 px-4 py-2.5 rounded-[10px] bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
          Editing mode — make changes then click <strong>Save Changes</strong>. Unsaved rows are highlighted.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        <div className="relative overflow-x-auto">
          {/* Overlay spinner — keeps table visible while refetching */}
          {fetching && !loading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center pointer-events-none">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
          <div style={{ minWidth: "1600px" }}>
            {/* Header */}
            <div className="grid items-center border-b border-rule bg-mist" style={{ gridTemplateColumns: GRID }}>
              {COLUMNS.map((c) => (
                <div key={c.key} className="px-3 py-2.5 text-[9.5px] font-mono uppercase tracking-widest text-muted">
                  {c.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              <div className="py-16 text-center text-muted text-[13px] flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> 
              </div>
            ) : rows.length === 0 ? (
              <div className="py-16 text-center text-muted text-[13px]">No schemes match your search or filters.</div>
            ) : rows.map((row) => {
              const draft = drafts[row.schemeCode] ?? row;
              const dirty = isDirty(row.schemeCode);
              return (
                <div
                  key={row.schemeCode}
                  className={`grid items-stretch border-b border-rule last:border-0 ${dirty ? "bg-amber-50/70" : ""}`}
                  style={{ gridTemplateColumns: GRID }}
                >
                  {COLUMNS.map((col) => {
                    const val = (draft as Record<string, unknown>)[col.key];

                    if (col.readonly) {
                      return (
                        <div key={col.key} className="px-3 py-2.5 text-[11px] font-mono text-primary font-semibold truncate self-center">
                          {String(val)}
                        </div>
                      );
                    }

                    if (col.type === "bool") {
                      return (
                        <div key={col.key} className="px-3 py-2.5 flex items-center justify-center self-center">
                          <button
                            onClick={() => editing && change(row.schemeCode, col.key, !val)}
                            disabled={!editing}
                            className={`size-5 rounded flex items-center justify-center border transition-colors ${val ? "bg-primary border-primary text-white" : "border-rule text-transparent"} ${editing ? "hover:border-primary cursor-pointer" : "cursor-default"}`}
                          >
                            <Check className="size-3" />
                          </button>
                        </div>
                      );
                    }

                    if (editing && col.type === "select") {
                      return (
                        <div key={col.key} className="px-1.5 py-1.5 self-center">
                          <select
                            value={String(val ?? "")}
                            onChange={(e) => change(row.schemeCode, col.key, e.target.value)}
                            className="w-full h-7 px-2 text-[11px] border border-rule rounded-[6px] bg-white outline-none focus:border-primary"
                          >
                            {col.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      );
                    }

                    if (editing) {
                      return (
                        <div key={col.key} className="px-1.5 py-1.5 self-center">
                          <input
                            value={String(val ?? "")}
                            onChange={(e) => change(row.schemeCode, col.key, e.target.value)}
                            className="w-full h-7 px-2 text-[11px] border border-rule rounded-[6px] bg-white outline-none focus:border-primary"
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={col.key} className="px-3 py-2.5 text-[12px] text-body truncate self-center">
                        {val === null || val === undefined || val === ""
                          ? <span className="text-faint">—</span>
                          : String(val)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-rule flex items-center justify-between">
            <span className="text-[12px] text-muted">{total} total · page {page} of {pages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="size-7 inline-flex items-center justify-center rounded-[8px] border border-rule text-muted hover:text-body disabled:opacity-30">
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="text-[12px] font-mono text-muted px-2">{page} / {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="size-7 inline-flex items-center justify-center rounded-[8px] border border-rule text-muted hover:text-body disabled:opacity-30">
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
