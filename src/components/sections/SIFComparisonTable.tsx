import { SourceBadge } from "@/components/ui/SourceBadge";
import { SAMPLE_SIFS } from "@/lib/staticData";
import { cn } from "@/lib/utils";

function ReturnCell({ value }: { value: string | null }) {
  if (!value) {
    return (
      <span className="text-[12px] text-faint italic">
        Insufficient history
      </span>
    );
  }
  const isPositive = value.startsWith("+");
  const isNegative = value.startsWith("-");
  return (
    <span
      className={cn(
        "text-[13px] font-semibold nums",
        isPositive && "text-gain",
        isNegative && "text-loss",
        !isPositive && !isNegative && "text-muted"
      )}
    >
      {value}%
    </span>
  );
}

export function SIFComparisonTable() {
  return (
    <section className="bg-white py-section">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">
              SIF Performance Preview
            </h2>
            <p className="text-[15px] text-muted">
              Sample returns calculated from stored AMFI NAV history
            </p>
          </div>
          <a
            href="/performance"
            className="text-[13.5px] font-semibold text-primary hover:text-primary-hover"
          >
            View all SIFs →
          </a>
        </div>

        {/* Scrollable table */}
        <div className="table-scroll rounded-[18px] border border-rule">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-surface border-b border-rule">
                {[
                  "SIF Name",
                  "AMC",
                  "Strategy",
                  "Plan",
                  "NAV",
                  "NAV Date",
                  "1M",
                  "3M",
                  "Since Inception",
                  "TER",
                  "Source",
                  "",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted whitespace-nowrap first:pl-5 last:pr-5"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_SIFS.map((sif, i) => (
                <tr
                  key={i}
                  className="border-b border-rule-soft last:border-0 hover:bg-[#FBFDFF]"
                >
                  {/* SIF Name */}
                  <td className="px-4 py-4 pl-5 max-w-[220px]">
                    <span className="text-[13.5px] font-semibold text-heading leading-snug line-clamp-2">
                      {sif.name}
                    </span>
                  </td>

                  {/* AMC */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[12.5px] text-muted">{sif.amc}</span>
                  </td>

                  {/* Strategy */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[12.5px] text-body">{sif.strategy}</span>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-muted border border-rule">
                      {sif.plan}
                    </span>
                  </td>

                  {/* NAV */}
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span className="text-[14px] font-bold text-heading nums">
                      ₹{sif.nav}
                    </span>
                  </td>

                  {/* NAV Date */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[12px] text-muted">{sif.navDate}</span>
                  </td>

                  {/* 1M */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <ReturnCell value={sif.return1m} />
                  </td>

                  {/* 3M */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <ReturnCell value={sif.return3m} />
                  </td>

                  {/* Since Inception */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <ReturnCell value={sif.returnSI} />
                  </td>

                  {/* TER */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {sif.ter ? (
                      <span className="text-[13px] font-semibold text-body nums">
                        {sif.ter}%
                      </span>
                    ) : (
                      <span className="text-[12px] text-faint italic">
                        Unavailable
                      </span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <SourceBadge variant="amfi" className="text-[10px]" />
                  </td>

                  {/* Action */}
                  <td className="px-4 py-4 pr-5 whitespace-nowrap">
                    <a
                      href={`/sifs/${sif.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-[13px] font-semibold text-primary hover:text-primary-hover"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-[12px] text-faint">
          Returns marked as &ldquo;Insufficient history&rdquo; indicate fewer
          than 30 days of NAV data. NAV and returns are sample values for
          demonstration.
        </p>
      </div>
    </section>
  );
}
