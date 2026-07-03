"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { ArrowRight, Download, ArrowUpRight } from "lucide-react";
import type { LatestReportSummary } from "@/lib/sifData";
import { AuthModal } from "@/components/auth/AuthModal";

const PENDING_KEY = "sif:pendingReportDownload";

// Wavy SIF performance path from Figma — realistic oscillating market movement
const WAVY_PATH =
  "M0 89.6C26.1 89.6 37 36.5 61.7 68.8C86.5 101.1 111.3 20 125 40.6C138.6 61.2 138.6 5.1 148 48.7C152.5 69.8 161 106.9 177 77.9C190.4 53.5 199.1 106.9 216.1 69.5C233.1 32.1 230.3 91.7 241.1 74.5C245.9 66.9 257.7 93 277.6 55.9C286 40.2 305.7 94.6 321.8 71.7C329.7 60.3 337.1 27.1 344.4 39.9C351.7 52.6 358.3 24.8 364.3 24.8C375.5 24.8 370.8 51.7 393 33.9C415.2 16 435.8 89.6 474 89.6";

// Blob background fill shape — creates organic shaded area under the line
const BLOB_PATH =
  "M0 94.7C28.7 94.7 33.4 25.8 50.5 25.8C67.7 25.8 57 38.2 79.2 38.2C101.3 38.2 92.9 61.5 109.5 61.5C126.1 61.5 116.7 0 141.9 0C167.1 0 153.3 34 189.7 34C226.2 34 217.4 94.1 241.1 94.1C264.8 94.1 265.5 41.5 282.4 41.5C299.4 41.5 296.3 82.1 318.9 82.1C341.5 82.1 345.1 55.2 364.3 55.2C383.6 55.2 383.6 62.4 397.8 62.4C412 62.4 405.5 30.2 427.9 29.7C450.3 29.3 440.2 102 474.3 102";

function startDownload(slug: string) {
  window.location.href = `/api/reports/${slug}/download`;
}

function ReportChart() {
  return (
    <div className="sif-chart-wrap">
      {/*
        viewBox top is -50 to give the tooltip room above the wavy path.
        Path y-range is ~5–107. Tooltip sits 44px above dot origin = y≈-39 at worst.
      */}
      <svg viewBox="0 -50 474 160" fill="none" className="sif-chart-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="sifBlobGrad" x1="237" y1="102" x2="237" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopOpacity="0.01" />
            <stop offset="1" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Organic background blob fill */}
        <path fillRule="evenodd" clipRule="evenodd" d={BLOB_PATH} fill="url(#sifBlobGrad)" className="sif-blob" />

        {/* Main wavy performance line */}
        <path
          id="sif-wave"
          d={WAVY_PATH}
          stroke="#0F2918"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="sif-line"
        />

        {/*
          Moving group: tooltip bubble + caret + dot share one animateMotion.
          Group origin (0,0) = dot center on the path.
          Tooltip bubble is 44px above; caret points down to the dot.
        */}
        <g className="sif-indicator">
          {/* Tooltip bubble */}
          <rect x="-25" y="-44" width="50" height="21" rx="8" fill="#0F2918" />
          {/* Down-pointing caret */}
          <polygon points="-4,-23 4,-23 0,-18" fill="#0F2918" />
          {/* Short connector line from caret tip to dot */}
          <line x1="0" y1="-18" x2="0" y2="-6" stroke="#D8D8D8" strokeWidth="0.56" />
          {/* Dot */}
          <ellipse rx="4.8" ry="5.1" fill="#000" />
          <animateMotion
            dur="5s"
            repeatCount="indefinite"
            calcMode="spline"
            keyPoints="0;0;1;1;0"
            keyTimes="0;0.04;0.86;0.93;1"
            keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0 0 1 1;0 0 1 1"
          >
            <mpath href="#sif-wave" />
          </animateMotion>
        </g>
      </svg>
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

        {/* Right: chart */}
        <div className="report-banner-right">
          <ReportChart />
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
