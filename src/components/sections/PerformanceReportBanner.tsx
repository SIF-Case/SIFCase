"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, ArrowRight, Download } from "lucide-react";
import type { LatestReportSummary } from "@/lib/sifData";
import { AuthModal } from "@/components/auth/AuthModal";

const PENDING_KEY = "sif:pendingReportDownload";

function startDownload(slug: string) {
  window.location.href = `/api/reports/${slug}/download`;
}

export function PerformanceReportBanner({ report }: { report: LatestReportSummary | null }) {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!session?.user || !report) return;
    let pending: string | null = null;
    try { pending = sessionStorage.getItem(PENDING_KEY); } catch {}
    if (pending && pending === report.slug) {
      try { sessionStorage.removeItem(PENDING_KEY); } catch {}
      startDownload(report.slug);
    }
  }, [session, report]);

  if (!report || !report.data) return null;
  const { data } = report;

  function handleGetReport() {
    if (!session?.user) {
      try { sessionStorage.setItem(PENDING_KEY, report!.slug); } catch {}
      setAuthOpen(true);
      return;
    }
    startDownload(report!.slug);
  }

  return (
    <section className="bg-mist border-b border-rule">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-10 lg:py-12">
        <div className="bg-white rounded-[20px] border border-rule shadow-card p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
                <FileText className="w-4.5 h-4.5" strokeWidth={2} />
              </span>
              <p className="text-[11px] font-mono uppercase tracking-widest text-primary">Monthly Report</p>
            </div>
            <h2 className="text-[24px] lg:text-[28px] font-bold text-heading tracking-[-0.3px] mb-2">
              {data.label} SIF Performance Report
            </h2>
            <p className="text-[14.5px] text-muted leading-relaxed max-w-[640px]">
              {report.summary || `A complete look at how Specialized Investment Fund strategies performed in ${data.label}, covering ${data.funds.length} Direct • Growth schemes from ${data.rangeStart} to ${data.rangeEnd}.`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleGetReport}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover shadow-btn"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
              Get Report (PDF)
            </button>
            <a
              href={`/performance/${report.slug}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-rule text-[13.5px] font-semibold text-heading hover:border-brand-navy hover:bg-surface"
            >
              Read {data.label} Analysis
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} reason="download the performance report" />
    </section>
  );
}
