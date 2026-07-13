"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { ArrowRight, Download, ArrowUpRight } from "lucide-react";
import type { LatestReportSummary } from "@/lib/sifData";
import { AuthModal } from "@/components/auth/AuthModal";

const PENDING_KEY = "sif:pendingReportDownload";

function startDownload(slug: string) {
  window.location.href = `/api/reports/${slug}/download`;
}

function HiddenDocumentPreview() {
  return (
    <div className="sif-chart-wrap flex items-center justify-center pointer-events-none overflow-hidden">
      <div 
        className="relative bg-white rounded-md shadow-2xl border border-white/20 flex flex-col p-4 overflow-hidden transform rotate-2 select-none mx-auto mt-4"
        style={{ width: "160px", height: "180px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      >
        {/* Faded gradient overlay at the bottom to blend it out */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent z-10" />

        {/* Document Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="size-6 bg-[#0E9F8E]/10 rounded flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 bg-[#0E9F8E] rounded-[2px]" />
          </div>
          <div className="h-2.5 w-16 bg-[#0F2918]/20 rounded" />
        </div>
        
        {/* Blurred Content Lines */}
        <div className="flex-1 space-y-2 opacity-60 blur-[2px]">
          <div className="h-1.5 w-3/4 bg-[#0F2918] rounded" />
          <div className="h-1.5 w-full bg-[#0F2918] rounded" />
          <div className="h-1.5 w-5/6 bg-[#0F2918] rounded" />
          <div className="h-1.5 w-full bg-[#0F2918] rounded" />
          <div className="h-1.5 w-4/5 bg-[#0F2918] rounded" />
          <div className="h-1.5 w-1/2 bg-[#0F2918] rounded" />
          <div className="mt-4 h-12 w-full bg-[#0F2918]/20 rounded" />
        </div>
        
        {/* "MAY REPORT" watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="transform -rotate-12 bg-white/40 backdrop-blur-sm border-2 border-[#0F2918]/20 px-2 py-0.5 rounded shadow-sm">
            <span className="text-[12px] font-bold tracking-widest text-[#0F2918]/40">
              MAY REPORT
            </span>
          </div>
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

        {/* Right: hidden document preview */}
        <div className="report-banner-right">
          <HiddenDocumentPreview />
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
