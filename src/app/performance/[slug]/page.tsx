import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TrendingUp, TrendingDown, BarChart3, Activity, ArrowRight, Download } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";
import { getMonthlyPerformanceData } from "@/lib/sifData";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

async function loadReport(slug: string) {
  await connectDB();
  const report = await PerformanceReport.findOne({ slug, published: true }).lean();
  if (!report) return null;
  const data = await getMonthlyPerformanceData(report.monthKey);
  if (!data) return null;
  return { report, data };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadReport(slug);
  if (!loaded) return { title: "Report not found — SIFcase" };
  return {
    title: `${loaded.data.label} SIF Performance Report — SIFcase`,
    description: `${loaded.data.label} performance analysis across ${loaded.data.funds.length} Specialized Investment Fund schemes — best/worst performers, returns table and key insights.`,
  };
}

function fmtPct(v: number | null) {
  if (v === null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function pctCls(v: number | null) {
  if (v === null) return "text-muted";
  return v >= 0 ? "text-gain" : "text-loss";
}

export default async function PerformanceReportPage({ params }: Props) {
  const { slug } = await params;
  const loaded = await loadReport(slug);
  if (!loaded) notFound();
  const { report, data } = loaded;

  const otherReports = await PerformanceReport.find({ published: true, slug: { $ne: slug } })
    .sort({ monthKey: -1 })
    .limit(6)
    .lean();

  const topGainers = data.funds.filter((f) => f.monthlyReturn >= 0).length;

  return (
    <main className="flex flex-col min-h-screen bg-surface">
      <Navbar />

      <section className="bg-white border-b border-rule">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-2">Monthly Performance Report</p>
          <h1 className="text-[32px] lg:text-[40px] font-bold text-heading tracking-[-0.5px] mb-3">
            {data.label} SIF Performance Report
          </h1>
          <p className="text-[15px] text-muted max-w-[720px] leading-relaxed">
            {report.summary || `A complete look at how Specialized Investment Fund strategies performed in ${data.label}, covering ${data.funds.length} Direct • Growth schemes from ${data.rangeStart} to ${data.rangeEnd}.`}
          </p>
          <div className="flex items-center gap-6 mt-6 text-[13px] text-body">
            <span><span className="font-semibold text-heading nums">{data.funds.length}</span> funds covered</span>
            <span className="text-faint">•</span>
            <span className="nums">{data.rangeStart} – {data.rangeEnd}</span>
            <span className="text-faint">•</span>
            <span><span className="font-semibold text-gain nums">{topGainers}</span> positive / <span className="font-semibold text-loss nums">{data.funds.length - topGainers}</span> negative</span>
          </div>
          <a
            href={`/api/reports/${report.slug}/download`}
            className="inline-flex items-center gap-2 mt-7 px-6 py-2.5 rounded-full bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover shadow-btn"
          >
            <Download className="w-4 h-4" strokeWidth={2} />
            Download Full Report (PDF)
          </a>
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 lg:px-8 py-10 lg:py-12 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-[16px] border border-rule shadow-card p-5">
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-gain" strokeWidth={2.5} /> Best Performer
            </p>
            {data.bestPerformer ? (
              <>
                <p className="text-[14px] font-bold text-heading leading-tight">{data.bestPerformer.fundName}</p>
                <p className="text-[12px] text-muted mt-0.5">{data.bestPerformer.amc}</p>
                <p className="text-[20px] font-bold text-gain nums mt-2">{fmtPct(data.bestPerformer.monthlyReturn)}</p>
              </>
            ) : <p className="text-muted">—</p>}
          </div>

          <div className="bg-white rounded-[16px] border border-rule shadow-card p-5">
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint mb-2 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-loss" strokeWidth={2.5} /> Worst Performer
            </p>
            {data.worstPerformer ? (
              <>
                <p className="text-[14px] font-bold text-heading leading-tight">{data.worstPerformer.fundName}</p>
                <p className="text-[12px] text-muted mt-0.5">{data.worstPerformer.amc}</p>
                <p className={`text-[20px] font-bold nums mt-2 ${pctCls(data.worstPerformer.monthlyReturn)}`}>{fmtPct(data.worstPerformer.monthlyReturn)}</p>
              </>
            ) : <p className="text-muted">—</p>}
          </div>

          <div className="bg-white rounded-[16px] border border-rule shadow-card p-5">
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} /> Average Return
            </p>
            <p className={`text-[26px] font-bold nums mt-3 ${pctCls(data.avgReturn)}`}>{fmtPct(data.avgReturn)}</p>
            <p className="text-[12px] text-muted mt-1">across {data.funds.length} schemes</p>
          </div>

          <div className="bg-white rounded-[16px] border border-rule shadow-card p-5">
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-brand-navy" strokeWidth={2.5} /> Nifty 50 Benchmark
            </p>
            <p className={`text-[26px] font-bold nums mt-3 ${pctCls(report.niftyReturn)}`}>{fmtPct(report.niftyReturn)}</p>
            <p className="text-[12px] text-muted mt-1">{data.label} return</p>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-rule shadow-card overflow-hidden mb-10">
          <div className="px-6 py-4 border-b border-rule">
            <h2 className="text-[17px] font-bold text-heading">Fund-wise Returns — Direct • Growth</h2>
            <p className="text-[12.5px] text-muted mt-0.5">Sorted by {data.label} monthly return</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-rule text-left">
                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-faint">Fund</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-faint">AMC</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-faint">Inception</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-faint text-right">Monthly</th>
                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-faint text-right">Since Inception</th>
                </tr>
              </thead>
              <tbody>
                {data.funds.map((f) => (
                  <tr key={f.schemeCode} className="border-b border-rule last:border-0 hover:bg-surface">
                    <td className="px-6 py-3 font-semibold text-heading">{f.fundName}</td>
                    <td className="px-4 py-3 text-body">{f.amc}</td>
                    <td className="px-4 py-3 text-muted nums">{f.inceptionDate}</td>
                    <td className={`px-4 py-3 text-right font-semibold nums ${pctCls(f.monthlyReturn)}`}>{fmtPct(f.monthlyReturn)}</td>
                    <td className={`px-6 py-3 text-right font-semibold nums ${pctCls(f.sinceInceptionReturn)}`}>{fmtPct(f.sinceInceptionReturn)}</td>
                  </tr>
                ))}
                {data.funds.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted">No fund data available for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data.excludedCount > 0 && (
            <p className="px-6 py-3 text-[12px] text-faint border-t border-rule">
              {data.excludedCount} scheme{data.excludedCount === 1 ? "" : "s"} excluded — insufficient NAV history for this period.
            </p>
          )}
        </div>

        <div className="bg-white rounded-[16px] border border-rule shadow-card p-6 lg:p-7 mb-10">
          <h2 className="text-[17px] font-bold text-heading mb-4">Key Insights</h2>
          <ul className="space-y-3 text-[14px] text-body leading-relaxed">
            {data.bestPerformer && (
              <li className="flex gap-2.5">
                <span className="text-gain mt-0.5">●</span>
                <span><span className="font-semibold text-heading">{data.bestPerformer.fundName}</span> ({data.bestPerformer.amc}) led the category with a {fmtPct(data.bestPerformer.monthlyReturn)} return in {data.label}.</span>
              </li>
            )}
            {data.worstPerformer && (
              <li className="flex gap-2.5">
                <span className="text-loss mt-0.5">●</span>
                <span><span className="font-semibold text-heading">{data.worstPerformer.fundName}</span> ({data.worstPerformer.amc}) was the weakest performer, posting {fmtPct(data.worstPerformer.monthlyReturn)} for the month.</span>
              </li>
            )}
            <li className="flex gap-2.5">
              <span className="text-primary mt-0.5">●</span>
              <span>{topGainers} of {data.funds.length} tracked schemes ({data.funds.length ? ((topGainers / data.funds.length) * 100).toFixed(0) : 0}%) delivered positive returns over the period, with an average return of {fmtPct(data.avgReturn)}.</span>
            </li>
            {report.niftyReturn !== null && data.avgReturn !== null && (
              <li className="flex gap-2.5">
                <span className="text-brand-navy mt-0.5">●</span>
                <span>SIF schemes {data.avgReturn >= report.niftyReturn ? "outperformed" : "underperformed"} the Nifty 50 ({fmtPct(report.niftyReturn)}) on average by {Math.abs(data.avgReturn - report.niftyReturn).toFixed(2)} percentage points.</span>
              </li>
            )}
          </ul>
        </div>

        {otherReports.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[15px] font-bold text-heading mb-3">Other Monthly Reports</h2>
            <div className="flex flex-wrap gap-2.5">
              {otherReports.map((r) => (
                <Link
                  key={r.slug}
                  href={`/performance/${r.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rule bg-white text-[13px] font-semibold text-heading hover:border-brand-navy hover:bg-surface"
                >
                  {r.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-mist border border-rule rounded-[16px] p-5 text-[12.5px] text-muted leading-relaxed">
          <span className="font-semibold text-body">Disclaimer: </span>
          Returns shown are point-to-point NAV changes for Direct Plan • Growth Option schemes, computed from end-of-day NAV records and not adjusted for loads or taxes. Past performance is not indicative of future results. This report is for informational purposes only and does not constitute investment advice — please consult a registered investment advisor before making investment decisions.
        </div>
      </section>

      <Footer />
    </main>
  );
}
