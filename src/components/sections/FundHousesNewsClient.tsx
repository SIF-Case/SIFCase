"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Clock, ArrowRight, Search, Filter } from "lucide-react";

type Article = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  subcategory?: string;
  publishedAt?: string;
  readTime?: number;
  category: string;
};

export function FundHousesNewsClient({ articles }: { articles: Article[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");

  const fundHouses = useMemo(() => {
    const houses = new Set<string>();
    articles.forEach(a => {
      if (a.subcategory) houses.add(a.subcategory);
    });
    return Array.from(houses).sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchesSearch = (a.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (a.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHouse = selectedHouse ? a.subcategory === selectedHouse : true;
      return matchesSearch && matchesHouse;
    });
  }, [articles, searchQuery, selectedHouse]);

  return (
    <section>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <h2 className="text-[28px] font-bold text-heading tracking-tight whitespace-nowrap">Fund Houses News</h2>
          <div className="hidden sm:block flex-1 h-px bg-rule"></div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8299]" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-rule rounded-lg text-[13px] text-body placeholder:text-faint focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Fund House Dropdown */}
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8299]" />
            <select
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-rule rounded-lg text-[13px] text-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-all cursor-pointer"
            >
              <option value="">All Fund Houses</option>
              {fundHouses.map(house => (
                <option key={house} value={house}>{house}</option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-[#6B8299]">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {filteredArticles.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredArticles.map((article) => (
            <Link
              key={article._id}
              href={`/news/${article.slug}`}
              className="group flex flex-col bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium hover:border-rule-strong transition-shadow"
            >
              <div className="flex flex-col flex-1">
                {/* Category & Read Time */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-primary-tint text-primary truncate max-w-[140px]">
                    {article.subcategory || "Fund Houses"}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-faint">
                    <Clock className="w-3 h-3" strokeWidth={2} />
                    {article.readTime || 3} min
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-[14.5px] font-bold text-heading leading-snug mb-3 group-hover:text-primary line-clamp-2">
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-[13px] text-body leading-relaxed flex-1 mb-3 line-clamp-3">
                  {article.excerpt || "Click to read the full article."}
                </p>

                {/* Footer: Date & Read Arrow */}
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-faint">
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary group-hover:gap-2 transition-all">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 border border-dashed border-rule rounded-[18px] bg-white">
          <p className="text-[14px] text-faint font-medium">No articles match your criteria.</p>
        </div>
      )}
    </section>
  );
}
