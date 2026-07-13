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
    <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden select-none mx-auto w-full max-w-[540px] h-[340px] flex flex-col font-sans">
      {/* Blurred background document */}
      <div className="absolute inset-0 pt-8 px-10 pb-4 scale-[1.02] pointer-events-none origin-top" style={{ userSelect: "none" }}>
        {/* Header row */}
        <div className="flex justify-between items-end mb-4">
          <img src="/logo.svg" alt="SIFcase" className="h-6 w-auto" />
          <div className="text-[11px] text-gray-500 font-medium">
            SIF Monthly Performance Report | {report.label} | Page 1
          </div>
        </div>
        
        {/* Green line separator */}
        <div className="w-full h-[2px] bg-[#0E9F8E] mb-8"></div>
        
        {/* Titles */}
        <h1 className="text-[#0a233f] text-[32px] leading-[1.1] font-extrabold tracking-tight mb-2">
          SIF MONTHLY PERFORMANCE REPORT
        </h1>
        <h2 className="text-[#0E9F8E] text-[32px] leading-[1.1] font-extrabold tracking-tight mb-8">
          {report.label.toUpperCase()}
        </h2>
        
        {/* Fake content paragraphs */}
        <div className="blur-[3.5px] opacity-75">
          <div className="flex justify-between gap-12">
             <div className="flex-1 space-y-3">
               <div className="h-3.5 bg-gray-200 rounded w-full"></div>
               <div className="h-3.5 bg-gray-200 rounded w-[90%]"></div>
               <div className="h-3.5 bg-gray-200 rounded w-[80%]"></div>
             </div>
             <div className="flex-1 space-y-3">
               <div className="h-3.5 bg-gray-200 rounded w-full"></div>
               <div className="h-3.5 bg-gray-200 rounded w-[85%]"></div>
             </div>
          </div>
          
          {/* Fake table */}
          <div className="mt-8 border-t border-gray-300">
             <div className="flex border-b border-gray-300 bg-gray-50">
               <div className="w-24 h-8 border-r border-gray-300"></div>
               <div className="flex-1 h-8"></div>
             </div>
             <div className="flex border-b border-gray-300">
               <div className="w-24 h-10 border-r border-gray-300"></div>
               <div className="flex-1 h-10"></div>
             </div>
             <div className="flex border-b border-gray-300">
               <div className="w-24 h-10 border-r border-gray-300"></div>
               <div className="flex-1 h-10"></div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Overlay box */}
      <div className="absolute inset-0 z-10 flex items-center justify-center p-6" style={{ background: "rgba(255,255,255,0.25)" }}>
        <div className="bg-white rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-6 text-center w-full max-w-[420px] border border-gray-100 flex flex-col items-center">
          <Lock className="size-6 text-[#334155] mb-4" strokeWidth={1.5} />
          <h3 className="text-[19px] font-semibold text-[#0f172a] mb-1.5 tracking-tight">Unlock the full report</h3>
          <p className="text-[14px] text-[#475569] mb-6">
            Get scheme-by-scheme returns for all {report.data?.funds.length ?? 21} SIFs, free.
          </p>
          
          <div className="flex items-center justify-center gap-3 w-full">
            <div className="flex-1 h-11 border border-gray-200 rounded-[10px] bg-white shadow-sm flex items-center px-4 cursor-text overflow-hidden" onClick={onUnlock}>
              <span className="text-[15px] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">name@company.com</span>
            </div>
            <button 
              onClick={onUnlock}
              className="h-11 px-5 bg-white border border-gray-200 rounded-[10px] text-[15px] font-medium text-[#0f172a] hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
            >
              Unlock report
            </button>
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
