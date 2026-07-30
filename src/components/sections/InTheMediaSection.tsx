import { connectDB } from "@/lib/mongodb";
import MediaMention from "@/models/MediaMention";
import { MediaMentionCard } from "./MediaMentionCard";

export async function InTheMediaSection() {
  await connectDB();
  const mentions = await MediaMention.find({ published: true }).sort({ order: 1, createdAt: 1 }).lean();

  if (mentions.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-white to-surface border-t border-rule pt-16 pb-section">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8 text-center">
        <p className="text-[12px] font-mono uppercase tracking-widest text-primary mb-2">In the Media</p>
        <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-3">As Featured In</h2>
        <p className="text-[14.5px] text-muted max-w-[480px] mx-auto mb-8">
          Our research and perspective on India&apos;s Specialised Investment Funds, recognized by leading financial media.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 max-w-[900px] mx-auto text-left">
          {mentions.map((m) => (
            <MediaMentionCard
              key={String(m._id)}
              mention={{
                id: String(m._id),
                outlet: m.outlet,
                url: m.url,
                title: m.title,
                tag: m.tag,
                imageUrl: m.imageUrl,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
