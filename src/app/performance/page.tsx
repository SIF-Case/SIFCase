import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FileText } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import PerformanceReport from "@/models/PerformanceReport";

// The footer links here twice ("Performance analytics" and "Monthly reports")
// but only /performance/[slug] existed, so both 404'd. This is the index.
//
// Reads PerformanceReport directly rather than going through
// getLatestPublishedReport(), which is hardcoded to a single month.

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "SIF Performance Reports — SIFcase",
  description:
    "Monthly performance analysis across every Specialised Investment Fund in India — category leaders, fund-by-fund returns, and downloadable reports.",
};

type ReportRow = {
  monthKey: string;
  slug: string;
  label: string;
  summary: string;
  niftyReturn: number | null;
  pdfUrl?: string;
};

async function loadReports(): Promise<ReportRow[]> {
  await connectDB();
  return PerformanceReport.find(
    { published: true },
    { monthKey: 1, slug: 1, label: 1, summary: 1, niftyReturn: 1, pdfUrl: 1, _id: 0 },
  )
    .sort({ monthKey: -1 })
    .lean<ReportRow[]>();
}

export default async function PerformanceIndexPage() {
  const reports = await loadReports();
  const [latest, ...older] = reports;

  return (
    <main className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <section className="flex-1 px-5 py-12 sm:px-10 lg:px-[113px] lg:py-16">
        <div className="mx-auto max-w-[900px]">
          <h1 className="font-sans text-[28px] font-extrabold leading-tight tracking-tight text-heading sm:text-[34px]">
            SIF Performance Reports
          </h1>
          <p className="mt-3 max-w-[640px] text-[15px] leading-[24px] text-body">
            Monthly analysis across every Specialised Investment Fund in India — category
            leaders, fund-by-fund returns, and the numbers behind them.
          </p>

          {reports.length === 0 ? (
            <div className="mt-10 rounded-xl border border-rule bg-surface p-8 text-center">
              <FileText className="mx-auto mb-3 size-10 text-muted" />
              <p className="text-[16px] font-semibold text-heading">No reports published yet</p>
              <p className="mt-1 text-[14px] text-muted">
                Monthly reports appear here once published.
              </p>
            </div>
          ) : (
            <>
              <Link
                href={`/performance/${latest.slug}`}
                className="mt-10 block rounded-xl border border-rule bg-canvas p-6 shadow-card transition-colors hover:border-rule-strong"
              >
                <span className="text-[12px] font-semibold uppercase tracking-wider text-primary">
                  Latest report
                </span>
                <h2 className="mt-2 font-sans text-[22px] font-bold text-heading">
                  {latest.label}
                </h2>
                {latest.summary && (
                  <p className="mt-2 text-[15px] leading-[24px] text-body">{latest.summary}</p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary">
                  Read the report
                  <ArrowRight size={16} />
                </span>
              </Link>

              {older.length > 0 && (
                <>
                  <h2 className="mt-12 text-[13px] font-semibold uppercase tracking-wider text-muted">
                    Earlier reports
                  </h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {older.map((r) => (
                      <li key={r.slug}>
                        <Link
                          href={`/performance/${r.slug}`}
                          className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-canvas px-5 py-4 transition-colors hover:border-rule-strong"
                        >
                          <span>
                            <span className="block text-[16px] font-semibold text-heading">
                              {r.label}
                            </span>
                            {r.summary && (
                              <span className="mt-0.5 block text-[14px] leading-[20px] text-muted">
                                {r.summary}
                              </span>
                            )}
                          </span>
                          <ArrowRight size={18} className="shrink-0 text-muted" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
