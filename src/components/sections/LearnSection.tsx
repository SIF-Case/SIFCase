import { ArrowRight, Clock } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";

export async function LearnSection() {
  await connectDB();
  const articles = await Article.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(4)
    .lean();

  if (articles.length === 0) return null;

  return (
    <section className="bg-white py-section">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Knowledge Hub</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">
              Understand SIFs before you compare
            </h2>
            <p className="text-[15px] text-muted">Research notes and plain-English explanations</p>
          </div>
          <a href="/read" className="text-[13.5px] font-semibold text-primary hover:text-primary-hover">
            View all articles →
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {articles.map((a) => (
            <a key={String(a._id)} href={`/read/${a.slug}`}
              className="group flex flex-col bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium hover:border-rule-strong transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-primary-tint text-primary">
                  {a.category}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-faint">
                  <Clock className="w-3 h-3" strokeWidth={2} />
                  {a.readTime} min
                </span>
              </div>

              <h3 className="text-[14.5px] font-bold text-heading leading-snug mb-3 group-hover:text-primary line-clamp-2">
                {a.title}
              </h3>

              {a.excerpt && (
                <p className="text-[13px] text-body leading-relaxed flex-1 mb-3 line-clamp-3">{a.excerpt}</p>
              )}

              <div className="mt-auto pt-2 flex items-center justify-between">
                <span className="text-[11px] text-faint">
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary group-hover:gap-2 transition-all">
                  Read <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
