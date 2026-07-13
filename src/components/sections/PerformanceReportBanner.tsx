"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { ArrowRight, Download, ArrowUpRight, Lock } from "lucide-react";
import type { LatestReportSummary } from "@/lib/sifData";
import { AuthModal } from "@/components/auth/AuthModal";

const PENDING_KEY = "sif:pendingReportDownload";

function startDownload(slug: string) {
  window.location.href = `/api/reports/${slug}/download`;
}

function ReportPreviewCard({
  report,
  onUnlock,
}: {
  report: LatestReportSummary;
  onUnlock: () => void;
}) {
  return (
    <div className="relative bg-white rounded-[18px] shadow-2xl border border-rule overflow-hidden select-none mx-auto w-full max-w-[420px]">
      {/* Dark header */}
      <div className="px-6 py-5" style={{ background: "#0C3B54" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#14b7a3] mb-1">
          Monthly Report · {report.label}
        </p>
        <h3 className="text-[19px] font-extrabold text-white leading-tight">SIF Performance, Fund By Fund</h3>
      </div>

      {/* Body */}
      <div className="px-6 pt-5 pb-6">
        <p className="text-[15px] font-semibold text-heading leading-relaxed">
          Unlock the full report to access detailed fund performance, rankings, and key insights.
        </p>

        <div className="mt-4 w-full rounded-[14px] bg-mist p-6 flex flex-col items-center text-center gap-2">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <Lock className="size-5 text-primary" />
          </div>
          <p className="text-[16px] font-bold text-heading">Unlock the full report</p>
          <p className="text-[13px] text-muted leading-snug">
            Sign in to read the complete fund-by-fund breakdown.
          </p>
          <button
            type="button"
            onClick={onUnlock}
            className="mt-3 w-full h-10 rounded-[8px] bg-primary text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
          >
            Unlock report
          </button>
        </div>
      </div>
    </div>
  );
}

export function PerformanceReportBanner({
  report,
}: {
  report: LatestReportSummary | null;
}) {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!session?.user || !report) return;
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(PENDING_KEY);
    } catch {}
    if (pending && pending === report.slug) {
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch {}
      startDownload(report.slug);
    }
  }, [session, report]);

  // Clear pending download when modal is closed without login
  useEffect(() => {
    if (!authOpen && !session?.user) {
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch {}
    }
  }, [authOpen, session]);

  // Fade-in on scroll into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("report-banner-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!report || !report.data) return null;
  const { data } = report;

  function handleGetReport() {
    if (!session?.user) {
      try {
        sessionStorage.setItem(PENDING_KEY, report!.slug);
      } catch {}
      setAuthOpen(true);
      return;
    }
    startDownload(report!.slug);
  }

  return (
    <section ref={sectionRef} className="report-banner-section">
      <div className="report-banner-inner">
        {/* Left: text content */}
        <div className="report-banner-left">
          <div className="report-banner-header">
            <p className="report-banner-label">MONTHLY REPORT · {data.label}</p>
            <h2 className="report-banner-title">SIF Performance, Fund By Fund</h2>
          </div>

          <div className="report-banner-actions">
            <div className="report-banner-buttons">
              <a
                href={`/performance/${report.slug}`}
                className="report-btn-outline"
              >
                Read Analysis
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleGetReport}
                className="report-btn-solid"
              >
                Download PDF
                <Download className="w-3.5 h-3.5 report-download-icon" />
              </button>
            </div>
            <p className="report-banner-unlock">
              <span className="report-banner-signin">Signing in</span>{" "}
              unlocks the complete PDF.
            </p>
          </div>
        </div>

        {/* Right: real report preview with unlock overlay */}
        <div className="report-banner-right">
          <ReportPreviewCard report={report} onUnlock={handleGetReport} />
          {/* Nav arrow */}
          <a
            href={`/performance/${report.slug}`}
            className="report-banner-nav-btn"
            aria-label="View performance report"
          >
            <ArrowUpRight className="w-4 h-4" style={{ color: "#000" }} />
          </a>
        </div>
      </div>

      {mounted && createPortal(
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          reason="download the performance report"
        />,
        document.body
      )}
    </section>
  );
}
