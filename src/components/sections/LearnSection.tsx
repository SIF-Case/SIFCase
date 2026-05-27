import { ArrowRight, Clock } from "lucide-react";
import { KNOWLEDGE_ARTICLES } from "@/lib/staticData";

const CATEGORY_COLORS: Record<string, string> = {
  Basics: "bg-primary-tint text-primary",
  Comparison: "bg-[#EEF3F8] text-brand-navy",
  Documents: "bg-verified-tint text-[#063B28]",
  Strategy: "bg-[#FFF7E6] text-[#92400E]",
};

export function LearnSection() {
  return (
    <section className="bg-white py-section">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">
              Understand SIFs before you compare
            </h2>
            <p className="text-[15px] text-muted">
              Research notes and plain-English explanations
            </p>
          </div>
          <a
            href="/learn"
            className="text-[13.5px] font-semibold text-primary hover:text-primary-hover"
          >
            View Knowledge Hub →
          </a>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {KNOWLEDGE_ARTICLES.map((article, i) => (
            <a
              key={i}
              href={`/learn/${article.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
              className="group flex flex-col bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium hover:border-rule-strong"
            >
              {/* Category + read time */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-[10.5px] font-semibold ${
                    CATEGORY_COLORS[article.category] ??
                    "bg-surface text-muted"
                  }`}
                >
                  {article.category}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-faint">
                  <Clock className="w-3 h-3" strokeWidth={2} />
                  {article.readTime}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[14.5px] font-bold text-heading leading-snug mb-3 group-hover:text-primary">
                {article.title}
              </h3>

              {/* Summary */}
              <p className="text-[13px] text-body leading-relaxed flex-1 mb-4">
                {article.summary}
              </p>

              {/* Read link */}
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary group-hover:gap-2">
                Read article
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
