import { ExternalLink, Newspaper } from "lucide-react";
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
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function SIFNewsSection() {
  await connectDB();
  const items = await NewsItem.find({ isVisible: true })
    .sort({ publishedAt: -1 })
    .limit(8)
    .lean();

  if (items.length === 0) return null;

  return (
    <section className="bg-surface py-section">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Latest Updates</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">SIF News</h2>
            <p className="text-[15px] text-muted">Curated news from across the SIF ecosystem</p>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            <Newspaper className="size-3.5" />
            <span>{items.length} articles</span>
          </div>
        </div>

        {/* Mobile: vertical stack, Desktop: 4-col grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <a
              key={String(item._id)}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-[14px] border border-rule shadow-card p-5 flex flex-col gap-3 hover:shadow-card-hover hover:border-primary/20 transition-all"
            >
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-full h-36 object-cover rounded-[8px] bg-mist"
                  loading="lazy"
                />
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary bg-primary/5 border border-primary/15 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                  {item.source}
                </span>
                <span className="text-[11px] text-faint shrink-0">{timeAgo(new Date(item.publishedAt))}</span>
              </div>
              <h3 className="text-[13.5px] font-semibold text-heading leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              {item.aiSummary && (
                <p className="text-[12.5px] text-muted leading-relaxed line-clamp-3 flex-1">
                  {item.aiSummary}
                </p>
              )}
              <div className="flex items-center gap-1 text-[12px] text-primary mt-auto pt-1">
                <span>Read article</span>
                <ExternalLink className="size-3" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
