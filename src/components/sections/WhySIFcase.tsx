import { ShieldCheck, BarChart3, FileText, Scale } from "lucide-react";

const DIFFERENTIATORS = [
  {
    Icon: ShieldCheck,
    title: "Source-verified data",
    body: "Every NAV comes from AMFI. Every benchmark is sourced from the official ISID document. Nothing is inferred or assumed.",
  },
  {
    Icon: BarChart3,
    title: "Calculated, not guessed",
    body: "Returns are computed from stored NAV history, not copied from marketing factsheets that may lag or round figures.",
  },
  {
    Icon: FileText,
    title: "Document-backed explanations",
    body: "Strategy summaries link to the official Investment Strategy Information Document. Read what the fund actually commits to.",
  },
  {
    Icon: Scale,
    title: "No recommendation language",
    body: "We show you data. We don't tell you what's best, safe, or recommended. You research, you decide.",
  },
];

export function WhySIFcase() {
  return (
    <section className="bg-white py-section border-y border-rule-soft">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-xl mb-12">
          <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Our Approach</p>
          <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-3">
            Why SIFcase is different
          </h2>
          <p className="text-[16px] text-muted leading-relaxed">
            Most SIF data sites surface numbers without context. SIFcase shows
            you where every number came from and what it means.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DIFFERENTIATORS.map(({ Icon, title, body }, i) => (
            <div key={i} className="flex flex-col gap-4">
              {/* Icon container */}
              <div className="w-11 h-11 rounded-[12px] bg-primary-tint flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>

              <div>
                <h3 className="text-[15.5px] font-bold text-heading mb-2">
                  {title}
                </h3>
                <p className="text-[14px] text-body leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
