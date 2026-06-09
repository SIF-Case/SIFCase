import { ArrowUpRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import NewsItem from "@/models/NewsItem";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export async function SIFNewsSection() {
  await connectDB();
  const items = await NewsItem.find({ isVisible: true })
    .sort({ publishedAt: -1 })
    .limit(8)
    .lean();

  if (items.length === 0) return null;

  return (
    <section className="bg-white py-section">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Latest Updates</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">SIF News</h2>
            <p className="text-[15px] text-muted">Curated news from across the SIF ecosystem</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <a
              key={String(item._id)}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium hover:border-rule-strong transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-primary-tint text-primary truncate max-w-[160px]">
                  {item.source}
                </span>
                <span className="text-[11px] text-faint shrink-0">{timeAgo(new Date(item.publishedAt))}</span>
              </div>

              <h3 className="text-[14.5px] font-bold text-heading leading-snug mb-3 group-hover:text-primary line-clamp-2">
                {item.title}
              </h3>

              {item.aiSummary && (
                <p className="text-[13px] text-body leading-relaxed flex-1 mb-3 line-clamp-3">{item.aiSummary}</p>
              )}

              <div className="mt-auto pt-2 flex items-center justify-between">
                <span className="text-[11px] text-faint">
                  {new Date(item.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary group-hover:gap-2 transition-all">
                  Read article <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
