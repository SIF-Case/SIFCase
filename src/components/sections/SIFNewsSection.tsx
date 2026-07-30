import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";

export async function SIFNewsSection() {
  await connectDB();
  // Combines General News and Fund Houses articles into one feed, newest
  // first — this is the same pool /news draws its two sections from.
  const items = await Article.find({
    status: "published",
    category: { $in: ["General News", "Fund Houses"] },
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select("title slug excerpt subcategory publishedAt readTime")
    .lean();

  if (items.length === 0) return null;

  return (
    <section className="bg-white pt-section pb-10">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Latest Updates</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">SIF News &amp; Fund Launches</h2>
            <p className="text-[15px] text-muted">NFOs, fund house moves, and industry developments — updated as they happen.</p>
          </div>
          <a href="/news" className="text-[13px] font-semibold text-primary hover:underline">
            View all news →
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <a
              key={String(item._id)}
              href={`/news/${item.slug}`}
              className="group flex flex-col bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium hover:border-rule-strong transition-shadow min-h-[168px]"
            >
              <span className="inline-flex self-start px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-primary-tint text-primary truncate max-w-[160px]">
                {item.subcategory || "News"}
              </span>

              <h3 className="text-[14.5px] font-bold text-heading leading-snug mt-3 flex-1 group-hover:text-primary line-clamp-3">
                {item.title}
              </h3>

              <div className="mt-3 flex items-center gap-2 text-[12px] text-faint">
                <span>
                  {item.publishedAt
                    ? new Date(item.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : ""}
                </span>
                <span>·</span>
                <span>{item.readTime || 3} min read</span>
              </div>
            </a>
          ))}

          <a
            href="/news"
            className="flex flex-col bg-surface rounded-[18px] border border-rule p-5 min-h-[168px] hover:border-rule-strong transition-colors"
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">More stories</span>
            <h3 className="text-[15px] font-bold text-heading leading-snug mt-3 flex-1">
              View all SIF news &amp; fund house updates
            </h3>
            <span className="mt-3 text-[13px] font-semibold text-primary">Browse the full archive →</span>
          </a>
        </div>
      </div>
    </section>
  );
}
