import { cn } from "@/lib/utils";
import type { SIFRow } from "@/lib/sifData";
import { fundHref } from "@/lib/slugify";

function ReturnCell({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-[12px] text-faint italic">Insufficient history</span>;
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

export function SIFComparisonTable({ sifs }: { sifs: SIFRow[] }) {
  return (
    <section className="bg-white py-section">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Performance</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">
              SIF Performance
            </h2>
            <p className="text-[15px] text-muted">
              Regular plan returns calculated from AMFI NAV history — {sifs.length} funds
            </p>
          </div>
          <a href="/performance" className="text-[13.5px] font-semibold text-primary hover:text-primary-hover">
            View all SIFs →
          </a>
        </div>

        <div className="table-scroll rounded-[18px] border border-rule">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-surface border-b border-rule">
                {["SIF Name", "AMC", "Strategy", "Option", "NAV", "NAV Date", "1M", "3M", "Since Inception", ""].map((col) => (
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
              {sifs.map((sif) => (
                <tr key={sif.schemeCode} className="border-b border-rule-soft last:border-0 hover:bg-[#FBFDFF]">
                  <td className="px-4 py-4 pl-5 max-w-[220px]">
                    <span className="text-[13.5px] font-semibold text-heading leading-snug line-clamp-2">
                      {sif.name}
                    </span>
                    <span className="block text-[11px] text-faint mt-0.5">{sif.schemeCode}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="block text-[12.5px] font-medium text-body">{sif.companyName}</span>
                    <span className="block text-[11px] text-faint">{sif.amc}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[12.5px] text-body">{sif.strategy}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-muted border border-rule">
                      {sif.option}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span className="text-[14px] font-bold text-heading nums">₹{sif.nav}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[12px] text-muted">{sif.navDate}</span>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <ReturnCell value={sif.return1m} />
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <ReturnCell value={sif.return3m} />
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <ReturnCell value={sif.returnSI} />
                  </td>
                  <td className="px-4 py-4 pr-5 whitespace-nowrap">
                    <a
                      href={fundHref(sif.fundName, sif.schemeCode)}
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

        <p className="mt-4 text-[12px] text-faint">
          Returns marked &ldquo;Insufficient history&rdquo; indicate fewer than 20 days of NAV data.
          All data sourced from AMFI.
        </p>
      </div>
    </section>
  );
}
