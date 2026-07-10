"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Building2, BookOpen, Database, CornerDownLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fundHref } from "@/lib/slugify";

interface SearchResultScheme {
  schemeCode: string;
  schemeName: string;
  fundName: string;
  amc: string;
  brandName: string;
  plan: string;
  option: string;
}

interface SearchResultArticle {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  subcategory: string;
  readTime: number;
}

interface SearchResultFundHouse {
  brandName: string;
  companyName_short: string;
  slug: string;
}

interface SearchResults {
  schemes: SearchResultScheme[];
  articles: SearchResultArticle[];
  fundHouses: SearchResultFundHouse[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ schemes: [], articles: [], fundHouses: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults({ schemes: [], articles: [], fundHouses: [] });
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Debounced/Effect search query fetching
  useEffect(() => {
    if (!query.trim()) {
      setResults({ schemes: [], articles: [], fundHouses: [] });
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Failed to fetch search results", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Flattened items list for keyboard navigation
  const flatItems = React.useMemo(() => {
    const list: Array<
      | { type: "scheme"; data: SearchResultScheme; url: string }
      | { type: "fundHouse"; data: SearchResultFundHouse; url: string }
      | { type: "article"; data: SearchResultArticle; url: string }
    > = [];

    results.schemes.forEach((item) => {
      list.push({
        type: "scheme",
        data: item,
        url: fundHref(item.fundName, item.schemeCode),
      });
    });

    results.fundHouses.forEach((item) => {
      list.push({
        type: "fundHouse",
        data: item,
        url: `/fund-house/${item.slug}`,
      });
    });

    results.articles.forEach((item) => {
      list.push({
        type: "article",
        data: item,
        url: `/read/${item.slug}`,
      });
    });

    return list;
  }, [results]);

  // Keyboard navigation handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length ? (prev + 1) % flatItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length ? (prev - 1 + flatItems.length) % flatItems.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = flatItems[selectedIndex];
        if (selected) {
          router.push(selected.url);
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, router, onClose]);

  // Scroll selected item into view if necessary
  useEffect(() => {
    const activeEl = scrollContainerRef.current?.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0B1F3A]/45 backdrop-blur-[6px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[640px] bg-white border border-[#e5e7eb] rounded-[20px] shadow-[0_32px_80px_rgba(11,31,58,0.18)] overflow-hidden flex flex-col max-h-[75vh] animate-[fadeIn_0.15s_ease-out]">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-4 border-b border-[#e5e7eb] gap-3">
          <Search className="w-5 h-5 text-[#64748B] shrink-0" strokeWidth={2.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search funds, strategies, topics..."
            className="flex-1 text-[16px] text-[#0B1F3A] placeholder-[#94A3B8] bg-transparent border-0 outline-none focus:ring-0 w-full"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-[#94A3B8] hover:text-[#334155] hover:bg-[#F1F5F9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-semibold text-[#64748B] tracking-wide select-none">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[50vh] scrollbar-thin scrollbar-thumb-[#CBD5E1] scrollbar-track-transparent"
        >
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] text-[#64748B]">Searching SIFcase...</p>
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="py-10 text-center">
              <p className="text-[14px] text-[#334155] font-semibold">Search anything on SIFcase</p>
              <p className="text-[12px] text-[#64748B] mt-1 max-w-[280px] mx-auto">
                Type AMC brand, fund name, strategy, isin, or educational topics.
              </p>
            </div>
          )}

          {!loading && query.trim() && flatItems.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[14px] text-[#334155] font-semibold">No results found</p>
              <p className="text-[12px] text-[#64748B] mt-1">
                We couldn&apos;t find anything matching &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {!loading && flatItems.length > 0 && (
            <div className="space-y-4">
              {/* Fund Houses Section */}
              {results.fundHouses.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-[10.5px] font-bold text-primary uppercase tracking-widest">
                    Fund Houses
                  </h3>
                  <div className="space-y-0.5 mt-1">
                    {results.fundHouses.map((item) => {
                      const itemIdx = flatItems.findIndex((x) => x.type === "fundHouse" && x.data.brandName === item.brandName);
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <Link
                          key={item.brandName}
                          href={`/fund-house/${item.slug}`}
                          onClick={onClose}
                          data-active={isSelected}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-150 ${
                            isSelected 
                              ? "bg-primary-tint text-primary shadow-[inset_3px_0_0_0_#14b7a3]" 
                              : "hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <Building2 className={`w-4.5 h-4.5 shrink-0 ${isSelected ? "text-primary" : "text-[#64748B]"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13.5px] font-bold leading-tight ${isSelected ? "text-primary" : "text-[#0B1F3A]"}`}>
                              {item.brandName}
                            </p>
                            {item.companyName_short && (
                              <p className="text-[11.5px] text-[#64748B] truncate mt-0.5">
                                {item.companyName_short}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-primary opacity-60" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SIF Schemes Section */}
              {results.schemes.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-[10.5px] font-bold text-primary uppercase tracking-widest">
                    Specialised Investment Funds
                  </h3>
                  <div className="space-y-0.5 mt-1">
                    {results.schemes.map((item) => {
                      const itemIdx = flatItems.findIndex((x) => x.type === "scheme" && x.data.schemeCode === item.schemeCode);
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <Link
                          key={item.schemeCode}
                          href={fundHref(item.fundName, item.schemeCode)}
                          onClick={onClose}
                          data-active={isSelected}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-150 ${
                            isSelected 
                              ? "bg-primary-tint text-primary shadow-[inset_3px_0_0_0_#14b7a3]" 
                              : "hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <Database className={`w-4.5 h-4.5 shrink-0 ${isSelected ? "text-primary" : "text-[#64748B]"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-[13.5px] font-bold leading-tight truncate ${isSelected ? "text-primary" : "text-[#0B1F3A]"}`}>
                                {item.fundName || item.schemeName}
                              </p>
                              <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold font-mono">
                                {item.plan}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-[#64748B] truncate mt-0.5">
                              {item.brandName} &middot; {item.option}
                            </p>
                          </div>
                          {isSelected && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-primary opacity-60" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Articles / Insights Section */}
              {results.articles.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-[10.5px] font-bold text-primary uppercase tracking-widest">
                    Insights & SIF 101
                  </h3>
                  <div className="space-y-0.5 mt-1">
                    {results.articles.map((item) => {
                      const itemIdx = flatItems.findIndex((x) => x.type === "article" && x.data.slug === item.slug);
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <Link
                          key={item.slug}
                          href={`/read/${item.slug}`}
                          onClick={onClose}
                          data-active={isSelected}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-150 ${
                            isSelected 
                              ? "bg-primary-tint text-primary shadow-[inset_3px_0_0_0_#14b7a3]" 
                              : "hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <BookOpen className={`w-4.5 h-4.5 shrink-0 ${isSelected ? "text-primary" : "text-[#64748B]"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13.5px] font-bold leading-tight truncate ${isSelected ? "text-primary" : "text-[#0B1F3A]"}`}>
                              {item.title}
                            </p>
                            <p className="text-[11.5px] text-[#64748B] truncate mt-0.5">
                              {item.subcategory || item.category} &middot; {item.readTime} min read
                            </p>
                          </div>
                          {isSelected && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-primary opacity-60" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#e5e7eb] flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-white text-[9px] font-mono shadow-sm font-semibold">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-white text-[9px] font-mono shadow-sm font-semibold">Enter</kbd> to select
            </span>
          </div>
          <span className="hidden sm:inline">
            SIFcase Global Search
          </span>
        </div>
      </div>
    </div>
  );
}
