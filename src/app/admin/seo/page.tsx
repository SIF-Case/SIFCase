"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, RotateCcw, ChevronDown, ChevronRight, Search as SearchIcon } from "lucide-react";

type SeoRow = {
  path: string;
  label: string;
  group: string;
  tokens: string[];
  defaults: { title: string; description: string };
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage: string;
  imageAlt: string;
  robotsIndex: boolean;
  overridden: boolean;
};

const GROUP_ORDER = ["Core", "Listing", "Content", "Legal", "Templates"];

const TITLE_MAX = 60;
const DESC_MAX = 160;

function CharCount({ value, max }: { value: string; max: number }) {
  const n = value.length;
  const cls = n === 0 ? "text-[#94A3B8]" : n > max ? "text-[#EF4444]" : n > max * 0.9 ? "text-[#D97706]" : "text-[#0E9F8E]";
  return <span className={`text-[10px] font-mono ${cls}`}>{n}/{max}</span>;
}

export default function SeoAdminPage() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPath, setSavingPath] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/seo");
        const data = await res.json();
        setRows(data.pages || []);
      } catch {
        setMessage({ type: "error", text: "Failed to load pages" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (path: string, field: keyof SeoRow, value: string | boolean) => {
    setRows((prev) => prev.map((r) => (r.path === path ? { ...r, [field]: value } : r)));
  };

  const save = async (row: SeoRow) => {
    setSavingPath(row.path);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) throw new Error();
      setRows((prev) => prev.map((r) => (r.path === row.path ? { ...r, overridden: true } : r)));
      setMessage({ type: "success", text: `Saved ${row.label}` });
    } catch {
      setMessage({ type: "error", text: `Failed to save ${row.label}` });
    } finally {
      setSavingPath(null);
    }
  };

  const reset = async (row: SeoRow) => {
    if (!confirm(`Reset ${row.label} to the built-in defaults?`)) return;
    setSavingPath(row.path);
    try {
      const res = await fetch(`/api/admin/seo?path=${encodeURIComponent(row.path)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRows((prev) =>
        prev.map((r) =>
          r.path === row.path
            ? { ...r, title: "", description: "", canonicalUrl: "", ogImage: "", imageAlt: "", robotsIndex: true, overridden: false }
            : r,
        ),
      );
      setMessage({ type: "success", text: `${row.label} reset to defaults` });
    } catch {
      setMessage({ type: "error", text: "Reset failed" });
    } finally {
      setSavingPath(null);
    }
  };

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const visible = q
      ? rows.filter((r) => r.label.toLowerCase().includes(q) || r.path.toLowerCase().includes(q))
      : rows;
    return GROUP_ORDER.map((g) => ({ group: g, items: visible.filter((r) => r.group === g) })).filter(
      (g) => g.items.length > 0,
    );
  }, [rows, filter]);

  if (loading) {
    return <div className="p-8 text-[13px] text-[#64748B]">Loading pages…</div>;
  }

  return (
    <div className="p-8 max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#0B1F3A]">Page SEO</h1>
        <p className="text-[13px] text-[#64748B] mt-1">
          Title tag, meta description, canonical URL and image alt text for every page. Leave a field
          empty to keep the built-in default shown beneath it. Article and news pages are edited on the
          article itself.
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-[10px] text-[13px] ${
            message.type === "success"
              ? "bg-emerald-50 text-[#0E7C5A] border border-emerald-200"
              : "bg-red-50 text-[#B91C1C] border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="relative mb-5 max-w-xs">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter pages…"
          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8EE] rounded-[10px] text-[13px] focus:outline-none focus:border-[#0E9F8E]"
        />
      </div>

      <div className="space-y-6">
        {grouped.map(({ group, items }) => (
          <section key={group}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-2">{group}</h2>
            <div className="bg-white border border-[#E2E8EE] rounded-[14px] overflow-hidden divide-y divide-[#E2E8EE]">
              {items.map((row) => {
                const isOpen = open === row.path;
                const effectiveTitle = row.title || row.defaults.title;
                const effectiveDesc = row.description || row.defaults.description;
                return (
                  <div key={row.path}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : row.path)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F8FAFC] transition-colors"
                    >
                      {isOpen ? (
                        <ChevronDown className="size-4 text-[#94A3B8] shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-[#94A3B8] shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#0B1F3A]">{row.label}</span>
                          <code className="text-[11px] text-[#64748B] font-mono">{row.path}</code>
                          {row.overridden && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0E9F8E]/10 text-[#0E7C5A]">
                              custom
                            </span>
                          )}
                          {!row.robotsIndex && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-[#B91C1C]">
                              noindex
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#64748B] truncate mt-0.5">{effectiveTitle}</p>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-5 pt-1 bg-[#F8FAFC] space-y-4">
                        {/* SERP preview */}
                        <div className="rounded-[10px] border border-[#E2E8EE] bg-white p-4">
                          <div className="text-[11px] text-[#64748B] font-mono mb-1">
                            www.sifcase.com{row.path === "/" ? "" : row.path}
                          </div>
                          <div className="text-[16px] text-[#1A0DAB] leading-snug">{effectiveTitle}</div>
                          <p className="text-[12.5px] text-[#4D5156] leading-relaxed mt-1">{effectiveDesc}</p>
                        </div>

                        {row.tokens.length > 0 && (
                          <p className="text-[11px] text-[#64748B]">
                            Placeholders for this template:{" "}
                            {row.tokens.map((t) => (
                              <code key={t} className="font-mono text-[#0E7C5A] mr-1.5">{`{${t}}`}</code>
                            ))}
                          </p>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[12px] font-semibold text-[#0B1F3A]">Title tag</label>
                            <CharCount value={effectiveTitle} max={TITLE_MAX} />
                          </div>
                          <input
                            value={row.title}
                            onChange={(e) => update(row.path, "title", e.target.value)}
                            placeholder={row.defaults.title}
                            className="w-full px-3 py-2 bg-white border border-[#E2E8EE] rounded-[8px] text-[13px] focus:outline-none focus:border-[#0E9F8E]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[12px] font-semibold text-[#0B1F3A]">Meta description</label>
                            <CharCount value={effectiveDesc} max={DESC_MAX} />
                          </div>
                          <textarea
                            value={row.description}
                            onChange={(e) => update(row.path, "description", e.target.value)}
                            placeholder={row.defaults.description}
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-[#E2E8EE] rounded-[8px] text-[13px] leading-relaxed focus:outline-none focus:border-[#0E9F8E] resize-y"
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[12px] font-semibold text-[#0B1F3A] mb-1">
                              Canonical URL
                            </label>
                            <input
                              value={row.canonicalUrl}
                              onChange={(e) => update(row.path, "canonicalUrl", e.target.value)}
                              placeholder={row.path.includes("[") ? "Leave empty — page sets its own" : `https://www.sifcase.com${row.path}`}
                              className="w-full px-3 py-2 bg-white border border-[#E2E8EE] rounded-[8px] text-[13px] font-mono focus:outline-none focus:border-[#0E9F8E]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-[#0B1F3A] mb-1">
                              Social image URL
                            </label>
                            <input
                              value={row.ogImage}
                              onChange={(e) => update(row.path, "ogImage", e.target.value)}
                              placeholder="https://…/og.png"
                              className="w-full px-3 py-2 bg-white border border-[#E2E8EE] rounded-[8px] text-[13px] font-mono focus:outline-none focus:border-[#0E9F8E]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[12px] font-semibold text-[#0B1F3A] mb-1">
                            Image alt text
                          </label>
                          <input
                            value={row.imageAlt}
                            onChange={(e) => update(row.path, "imageAlt", e.target.value)}
                            placeholder="Describes the page's main image for screen readers and image search"
                            className="w-full px-3 py-2 bg-white border border-[#E2E8EE] rounded-[8px] text-[13px] focus:outline-none focus:border-[#0E9F8E]"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-[13px] text-[#334155]">
                          <input
                            type="checkbox"
                            checked={row.robotsIndex}
                            onChange={(e) => update(row.path, "robotsIndex", e.target.checked)}
                            className="size-4 accent-[#0E9F8E]"
                          />
                          Allow search engines to index this page
                        </label>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => save(row)}
                            disabled={savingPath === row.path}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#0E9F8E] text-white text-[13px] font-semibold hover:bg-[#0C8B7C] disabled:opacity-50 transition-colors"
                          >
                            <Save className="size-3.5" />
                            {savingPath === row.path ? "Saving…" : "Save"}
                          </button>
                          {row.overridden && (
                            <button
                              type="button"
                              onClick={() => reset(row)}
                              disabled={savingPath === row.path}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[#E2E8EE] bg-white text-[13px] text-[#64748B] hover:text-[#0B1F3A] disabled:opacity-50 transition-colors"
                            >
                              <RotateCcw className="size-3.5" />
                              Reset to default
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
