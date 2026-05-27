import { Calendar, Clock, ArrowRight } from "lucide-react";
import { SAMPLE_NFOS } from "@/lib/staticData";
import { cn } from "@/lib/utils";

export function NFOPreview() {
  return (
    <section className="bg-surface py-section">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">
              Live NFOs
            </h2>
            <p className="text-[15px] text-muted">
              SIF New Fund Offers currently open for subscription
            </p>
          </div>
          <a
            href="/nfos"
            className="text-[13.5px] font-semibold text-primary hover:text-primary-hover"
          >
            View all NFOs →
          </a>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SAMPLE_NFOS.map((nfo, i) => {
            const isLive = nfo.status === "live";
            const isUpcoming = nfo.status === "upcoming";

            return (
              <div
                key={i}
                className="bg-white rounded-[18px] border border-rule p-6 shadow-card hover:shadow-premium flex flex-col gap-4"
              >
                {/* Status + AMC row */}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-muted">
                    {nfo.amc}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                      isLive &&
                        "bg-primary-tint text-primary",
                      isUpcoming &&
                        "bg-[#EEF3F8] text-brand-navy"
                    )}
                  >
                    {isLive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    {isLive ? "Live" : "Upcoming"}
                  </span>
                </div>

                {/* Name + strategy */}
                <div>
                  <h3 className="text-[15px] font-bold text-heading leading-snug mb-1">
                    {nfo.name}
                  </h3>
                  <p className="text-[13px] text-muted">{nfo.strategy}</p>
                </div>

                {/* Date info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[12.5px] text-body">
                    <Calendar className="w-3.5 h-3.5 text-muted flex-shrink-0" strokeWidth={2} />
                    <span>
                      {nfo.opens} — {nfo.closes}
                    </span>
                  </div>
                  {nfo.daysLeft !== null ? (
                    <div className="flex items-center gap-2 text-[12.5px] font-semibold text-primary">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                      <span>Closes in {nfo.daysLeft} days</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[12.5px] text-muted">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                      <span>Opens {nfo.opens}</span>
                    </div>
                  )}
                </div>

                {/* Min investment */}
                <div className="flex items-center justify-between pt-3 border-t border-rule-soft">
                  <div>
                    <p className="text-[10.5px] text-faint uppercase tracking-wide mb-0.5">
                      Minimum Investment
                    </p>
                    <p className="text-[13.5px] font-bold text-heading nums">
                      {nfo.minInvestment}
                    </p>
                  </div>
                  <a
                    href={`/nfos/${nfo.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary-hover"
                  >
                    Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="mt-5 text-[12px] text-faint">
          NFO dates and details are sample data for demonstration. Verify dates
          from official AMC sources before investing.
        </p>
      </div>
    </section>
  );
}
