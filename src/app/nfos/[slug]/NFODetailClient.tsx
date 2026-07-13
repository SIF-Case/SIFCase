"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Clock,
  Shield,
  BarChart3,
  Lock,
  Check,
  X,
  AlertTriangle,
  Info,
  Users,
  FileText,
  Link2
} from "lucide-react";
import { NFOData } from "@/lib/nfoData";

export function NFODetailClient({ nfo }: { nfo: NFOData }) {
  const [compared, setCompared] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    setApplied(true);
    setTimeout(() => setApplied(false), 5000);
  };

  return (
    <div className="nfo-detail-container">
      {/* Scoped CSS from sifcase-nfo-detail-page.html */}
      <style dangerouslySetInnerHTML={{ __html: `
        .nfo-detail-container {
          --navy:       #1B2A3B;
          --navy-deep:  #111C28;
          --primary:    #004C61;
          --primary-h:  #005f78;
          --accent:     #2E9E94;
          --accent-l:   #3DBDB2;
          --accent-bg:  rgba(46,158,148,0.08);
          --success:    #1a9e60;
          --success-bg: rgba(26,158,96,0.09);
          --danger:     #d94040;
          --danger-bg:  rgba(217,64,64,0.09);
          --warn:       #c07b1a;
          --warn-bg:    rgba(192,123,26,0.1);

          --bg:         #f4f6f8;
          --surface:    #ffffff;
          --surface-2:  #f8fafb;
          --border:     #e2e8ed;
          --border-s:   #ccd5dd;

          --text-1:     #0f1c28;
          --text-2:     #3d5166;
          --text-3:     #6b8299;

          --radius-s:   6px;
          --radius:     10px;
          --radius-l:   14px;
          --shadow:     0 2px 8px rgba(15,28,40,0.08), 0 1px 3px rgba(15,28,40,0.05);
          --font:       'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

          font-family: var(--font);
          background: var(--bg);
          color: var(--text-1);
          line-height: 1.6;
          padding-bottom: 4rem;
        }

        /* ── Breadcrumb ─────────────────────────────────────────────────── */
        .nfo-breadcrumb-wrap { background: var(--surface); border-bottom: 1px solid var(--border); }
        .nfo-breadcrumb { max-width: 1180px; margin: 0 auto; padding: 10px 1.5rem; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-3); }
        .nfo-breadcrumb a { color: var(--text-3); transition: color 0.15s; }
        .nfo-breadcrumb a:hover { color: var(--accent); }
        .nfo-breadcrumb-sep { color: var(--border-s); font-size: 14px; }
        .nfo-breadcrumb-cur { color: var(--text-2); font-weight: 500; }

        /* ── Layout ─────────────────────────────────────────────────────── */
        .nfo-detail-main { max-width: 1180px; margin: 0 auto; padding: 2rem 1.5rem 0; }
        .nfo-page-grid { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: start; }
        .nfo-main-col { display: flex; flex-direction: column; gap: 1.5rem; min-width: 0; }
        .nfo-side-col { display: flex; flex-direction: column; gap: 1.25rem; }

        /* ── Cards ──────────────────────────────────────────────────────── */
        .nfo-card-el { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-l); overflow: hidden; }
        .nfo-card-el-head { padding: 1.25rem 1.5rem 1rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; text-align: left; }
        .nfo-card-el-title { font-size: 14px; font-weight: 600; color: var(--text-1); display: flex; align-items: center; gap: 8px; }
        .nfo-card-el-title svg { color: var(--accent); }
        .nfo-card-el-body { padding: 1.25rem 1.5rem; text-align: left; }
        .nfo-card-el-body-flush { padding: 0; }

        /* ── NFO Hero ───────────────────────────────────────────────────── */
        .nfo-hero-sec { background: var(--navy); border-radius: var(--radius-l); overflow: hidden; border: 1px solid rgba(255,255,255,0.06); text-align: left; }
        .nfo-hero-sec-top { padding: 1.75rem 1.75rem 1.25rem; }
        .nfo-fund-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; flex-wrap: wrap; }
        .nfo-fund-amc-badge { display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 4px 12px 4px 8px; font-size: 12px; color: rgba(255,255,255,0.8); font-weight: 500; }
        .nfo-amc-avatar { width: 20px; height: 20px; background: var(--accent); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; }
        .nfo-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; letter-spacing: 0.01em; }
        .nfo-badge-closing { background: rgba(192,123,26,0.2); color: #facc15; border: 1px solid rgba(250,204,21,0.3); }
        .nfo-badge-open { background: var(--success-bg); color: var(--success); border: 1px solid rgba(26,158,96,0.2); }
        .nfo-badge-hybrid { background: rgba(46,158,148,0.16); color: var(--accent-l); border: 1px solid rgba(46,158,148,0.3); }
        .nfo-badge-equity { background: rgba(0,76,97,0.08); color: var(--accent-l); border: 1px solid rgba(0,76,97,0.18); }
        .nfo-badge-pill-dark { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.12); font-size: 10px; }
        .nfo-fund-name { font-size: 22px; font-weight: 600; color: #fff; line-height: 1.3; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
        .nfo-fund-sub { font-size: 13px; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .nfo-fund-sub-sep { color: rgba(255,255,255,0.2); }

        /* ── Countdown Strip ──────────────────────────────────────────────── */
        .nfo-countdown-strip { border-top: 1px solid rgba(255,255,255,0.08); padding: 1.25rem 1.75rem; background: rgba(192,123,26,0.08); }
        .nfo-countdown-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .nfo-countdown-left { display: flex; align-items: center; gap: 10px; }
        .nfo-countdown-icon-box { width: 36px; height: 36px; border-radius: 50%; background: rgba(250,204,21,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nfo-countdown-icon-box svg { color: #facc15; }
        .nfo-countdown-days { font-size: 18px; font-weight: 700; color: #fff; }
        .nfo-countdown-label { font-size: 12px; color: rgba(255,255,255,0.5); }
        .nfo-countdown-dates { display: flex; gap: 1.5rem; }
        .nfo-cd-date-item { text-align: right; }
        .nfo-cd-date-label { font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
        .nfo-cd-date-val { font-size: 13px; color: #fff; font-weight: 500; }

        /* ── Key Terms Grid ─────────────────────────────────────────────── */
        .nfo-terms-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; overflow: hidden; }
        .nfo-terms-cell { padding: 1rem 1.25rem; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); text-align: left; }
        .nfo-terms-cell:nth-child(4n) { border-right: none; }
        .nfo-terms-cell-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); margin-bottom: 5px; }
        .nfo-terms-cell-val { font-size: 16px; font-weight: 600; color: var(--text-1); letter-spacing: -0.01em; }
        .nfo-terms-cell-sub { font-size: 11px; color: var(--text-3); margin-top: 3px; }

        /* ── SIF-Specific Callout ─────────────────────────────────────────── */
        .nfo-sif-callout { display: flex; gap: 12px; padding: 1rem 1.25rem; background: var(--accent-bg); border: 1px solid rgba(46,158,148,0.2); border-radius: var(--radius); align-items: flex-start; text-align: left; }
        .nfo-sif-callout-icon { width: 32px; height: 32px; border-radius: var(--radius-s); background: rgba(46,158,148,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nfo-sif-callout-icon svg { color: var(--accent); }
        .nfo-sif-callout-title { font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 3px; }
        .nfo-sif-callout-body { font-size: 12.5px; color: var(--text-2); line-height: 1.55; }

        /* ── Asset Allocation Bands ─────────────────────────────────────── */
        .nfo-alloc-row { margin-bottom: 1rem; }
        .nfo-alloc-row:last-child { margin-bottom: 0; }
        .nfo-alloc-row-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
        .nfo-alloc-name { font-size: 13px; font-weight: 500; color: var(--text-1); }
        .nfo-alloc-range { font-size: 12.5px; color: var(--text-3); font-weight: 500; }
        .nfo-alloc-bar-track { height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; position: relative; }
        .nfo-alloc-bar-fill { height: 100%; border-radius: 5px; }
        .nfo-alloc-legend { display: flex; gap: 1.25rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border); flex-wrap: wrap; }
        .nfo-alloc-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-2); }
        .nfo-alloc-legend-dot { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }

        /* ── Restriction List ───────────────────────────────────────────── */
        .nfo-restriction-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .nfo-restriction-item { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: var(--text-2); line-height: 1.5; text-align: left; }
        .nfo-restriction-item svg { flex-shrink: 0; margin-top: 2px; }
        .nfo-restriction-item.allow svg { color: var(--success); }
        .nfo-restriction-item.deny svg { color: var(--danger); }

        /* ── Strategy ────────────────────────────────────────────────────── */
        .nfo-strategy-point { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); align-items: flex-start; text-align: left; }
        .nfo-strategy-point:last-child { border-bottom: none; }
        .nfo-strategy-icon { width: 32px; height: 32px; border-radius: var(--radius-s); background: var(--accent-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nfo-strategy-icon svg { color: var(--accent); }
        .nfo-strategy-title { font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 3px; }
        .nfo-strategy-desc { font-size: 12.5px; color: var(--text-2); line-height: 1.55; }
        .nfo-objective-text { font-size: 13.5px; color: var(--text-2); line-height: 1.65; padding-bottom: 12px; margin-bottom: 4px; border-bottom: 1px solid var(--border); }

        /* ── Fund Managers ──────────────────────────────────────────────── */
        .nfo-managers-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .nfo-manager-card { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.875rem; text-align: left; }
        .nfo-manager-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .nfo-manager-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #fff; flex-shrink: 0; }
        .nfo-manager-name { font-size: 13px; font-weight: 500; color: var(--text-1); }
        .nfo-manager-role { font-size: 11px; color: var(--text-3); }
        .nfo-manager-cred { font-size: 11.5px; color: var(--text-2); line-height: 1.5; }

        /* ── Process Steps ──────────────────────────────────────────────── */
        .nfo-process-steps-detail { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; position: relative; }
        .nfo-process-step-detail { padding: 0 1rem; position: relative; text-align: left; }
        .nfo-process-step-detail:first-child { padding-left: 0; }
        .nfo-process-step-detail:last-child { padding-right: 0; }
        .nfo-process-step-num-detail { width: 30px; height: 30px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 700; margin-bottom: 0.75rem; position: relative; z-index: 2; }
        .nfo-process-step-detail::after { content: ''; position: absolute; top: 15px; left: calc(50% + 15px); width: calc(100% - 15px); height: 1.5px; background: var(--border); z-index: 1; }
        .nfo-process-step-detail:last-child::after { display: none; }
        .nfo-process-step-title-detail { font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 4px; }
        .nfo-process-step-desc-detail { font-size: 12px; color: var(--text-3); line-height: 1.5; }

        /* ── Sidebar ────────────────────────────────────────────────────── */
        .nfo-side-apply-card { background: var(--navy); border-radius: var(--radius-l); padding: 1.5rem; border: 1px solid rgba(255,255,255,0.06); text-align: left; }
        .nfo-apply-price { font-size: 28px; font-weight: 600; color: #fff; letter-spacing: -0.03em; line-height: 1; margin-bottom: 4px; }
        .nfo-apply-price-label { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; margin-bottom: 1.25rem; }
        .nfo-apply-detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 13px; }
        .nfo-apply-detail-row:last-child { border-bottom: none; }
        .nfo-apply-detail-label { color: rgba(255,255,255,0.45); }
        .nfo-apply-detail-val { color: #fff; font-weight: 500; text-align: right; }
        .nfo-btn-p { width: 100%; padding: 13px; background: var(--accent); color: #fff; font-size: 14px; font-weight: 600; border-radius: var(--radius); border: none; cursor: pointer; margin-top: 1.25rem; transition: background 0.15s; letter-spacing: 0.01em; text-align: center; }
        .nfo-btn-p:hover { background: var(--accent-l); }
        .nfo-btn-s { width: 100%; padding: 10px; background: transparent; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius); cursor: pointer; margin-top: 8px; transition: all 0.15s; text-align: center; }
        .nfo-btn-s:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .nfo-btn-s.active { background: rgba(255,255,255,0.15); color: #fff; border-color: #fff; }
        .nfo-apply-note { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 1rem; line-height: 1.5; text-align: center; }

        .nfo-sidebar-info-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-l); text-align: left; }
        .nfo-sidebar-info-card-head { padding: 1rem 1.25rem 0.75rem; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 600; color: var(--text-1); display: flex; align-items: center; gap: 7px; }
        .nfo-sidebar-info-row { display: flex; justify-content: space-between; gap: 8px; padding: 9px 1.25rem; border-bottom: 1px solid var(--border); font-size: 12.5px; }
        .nfo-sidebar-info-row:last-child { border-bottom: none; }
        .nfo-sidebar-info-label { color: var(--text-3); }
        .nfo-sidebar-info-val { color: var(--text-1); font-weight: 500; text-align: right; }

        .nfo-eligibility-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-l); padding: 1.125rem 1.25rem; text-align: left; }
        .nfo-eligibility-title { font-size: 13px; font-weight: 600; color: var(--text-1); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 7px; }
        .nfo-eligibility-title svg { color: var(--accent); }
        .nfo-eligibility-item { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--text-2); line-height: 1.5; margin-bottom: 8px; }
        .nfo-eligibility-item:last-child { margin-bottom: 0; }
        .nfo-eligibility-item svg { flex-shrink: 0; margin-top: 1px; color: var(--accent); }

        /* ── Section Titles ─────────────────────────────────────────────── */
        .nfo-section-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .nfo-section-eyebrow::before { content: ''; display: block; width: 16px; height: 2px; background: var(--accent); border-radius: 1px; }
        .nfo-section-title-d { font-size: 17px; font-weight: 600; color: var(--text-1); letter-spacing: -0.01em; text-align: left; }

        /* ── Disclaimer ─────────────────────────────────────────────────── */
        .nfo-disclaimer-detail { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.25rem; font-size: 11.5px; color: var(--text-3); line-height: 1.6; display: flex; gap: 10px; align-items: flex-start; text-align: left; }
        .nfo-disclaimer-detail svg { flex-shrink: 0; color: var(--warn); margin-top: 1px; }
        .nfo-toast { padding: 10px 16px; background: #fff; border-left: 4px solid var(--accent); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: fixed; bottom: 24px; right: 24px; z-index: 1000; font-size: 13px; color: var(--text-1); font-weight: 500; }

        /* ── Responsive ──────────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .nfo-page-grid { grid-template-columns: 1fr; }
          .nfo-side-col { order: -1; }
          .nfo-terms-grid { grid-template-columns: 1fr 1fr; }
          .nfo-terms-cell:nth-child(2n) { border-right: none; }
          .nfo-managers-grid { grid-template-columns: 1fr; }
          .nfo-process-steps-detail { grid-template-columns: 1fr 1fr; gap: 1.5rem 0; }
          .nfo-process-step-detail::after { display: none; }
          .nfo-countdown-row { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 600px) {
          .nfo-fund-name { font-size: 18px; }
          .nfo-terms-grid { grid-template-columns: 1fr; }
          .nfo-terms-cell { border-right: none; }
          .nfo-process-steps-detail { grid-template-columns: 1fr; }
          .nfo-countdown-dates { flex-direction: column; gap: 0.5rem; text-align: left; }
          .nfo-cd-date-item { text-align: left; }
        }
      ` }} />

      {/* Breadcrumb */}
      <div className="nfo-breadcrumb-wrap">
        <nav className="nfo-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="nfo-breadcrumb-sep" aria-hidden="true">›</span>
          <Link href="/nfos">NFO</Link>
          <span className="nfo-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="nfo-breadcrumb-cur">{nfo.name.replace(" Fund", "")}</span>
        </nav>
      </div>

      <main className="nfo-detail-main" id="main-content">
        <div className="nfo-page-grid">
          
          {/* ════════════════════════ MAIN COLUMN ════════════════════════ */}
          <div className="nfo-main-col">
            
            {/* NFO Hero */}
            <section className="nfo-hero-sec" aria-labelledby="fund-name">
              <div className="nfo-hero-sec-top">
                <div className="nfo-fund-meta">
                  <div className="nfo-fund-amc-badge">
                    <div className="nfo-amc-avatar" aria-hidden="true">
                      {nfo.avatar}
                    </div>
                    {nfo.amc}
                  </div>
                  {nfo.isClosingSoon && (
                    <span className="nfo-badge nfo-badge-closing" role="status">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      NFO closing soon
                    </span>
                  )}
                  {!nfo.isClosingSoon && (
                    <span className="nfo-badge nfo-badge-open" role="status">
                      <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
                        <circle cx="3" cy="3" r="3" fill="currentColor" />
                      </svg>
                      NFO open
                    </span>
                  )}
                  <span className="nfo-badge nfo-badge-hybrid">
                    {nfo.category} {nfo.slug.includes("long-short") || nfo.name.includes("Long-Short") ? "Long-Short" : ""}
                  </span>
                  <span className="nfo-badge nfo-badge-pill-dark">{nfo.structure}</span>
                </div>
                <h1 className="nfo-fund-name" id="fund-name">
                  {nfo.name}
                </h1>
                <div className="nfo-fund-sub" aria-label="Fund details">
                  <span>SIF strategy under {nfo.amc}</span>
                  <span className="nfo-fund-sub-sep" aria-hidden="true">·</span>
                  <span>Category: {nfo.category}</span>
                  <span className="nfo-fund-sub-sep" aria-hidden="true">·</span>
                  <span>Face value {nfo.subscriptionPrice}/unit</span>
                </div>
              </div>

              {/* Countdown Strip */}
              <div className="nfo-countdown-strip">
                <div className="nfo-countdown-row">
                  <div className="nfo-countdown-left">
                    <div className="nfo-countdown-icon-box" aria-hidden="true">
                      <Clock size={18} />
                    </div>
                    <div>
                      <div className="nfo-countdown-days">{nfo.daysLeft} days left to subscribe</div>
                      <div className="nfo-countdown-label">NFO closes {nfo.closeDate}, 3:00 PM</div>
                    </div>
                  </div>
                  <div className="nfo-countdown-dates" role="list" aria-label="NFO key dates">
                    <div className="nfo-cd-date-item" role="listitem">
                      <div className="nfo-cd-date-label">Opened</div>
                      <div className="nfo-cd-date-val">{nfo.openDate}</div>
                    </div>
                    <div className="nfo-cd-date-item" role="listitem">
                      <div className="nfo-cd-date-label">Closes</div>
                      <div className="nfo-cd-date-val">{nfo.closeDate}</div>
                    </div>
                    <div className="nfo-cd-date-item" role="listitem">
                      <div className="nfo-cd-date-label">Allotment</div>
                      <div className="nfo-cd-date-val">{nfo.allotmentDate}</div>
                    </div>
                    <div className="nfo-cd-date-item" role="listitem">
                      <div className="nfo-cd-date-label">Reopens</div>
                      <div className="nfo-cd-date-val">{nfo.reopenDate}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Key Terms Grid */}
            <section aria-labelledby="terms-title">
              <div style={{ marginBottom: "1.25rem" }}>
                <div className="nfo-section-eyebrow" aria-hidden="true">At a glance</div>
                <h2 className="nfo-section-title-d" id="terms-title">Key scheme terms</h2>
              </div>
              <div className="nfo-card-el nfo-card-el-body-flush">
                <div className="nfo-terms-grid" role="list" aria-label="Key NFO terms">
                  <div className="nfo-terms-cell" role="listitem">
                    <div className="nfo-terms-cell-label">Min. investment</div>
                    <div className="nfo-terms-cell-val">{nfo.minInvestment}</div>
                    <div className="nfo-terms-cell-sub">Per PAN, across all {nfo.amcShort.toUpperCase()} SIF strategies</div>
                  </div>
                  <div className="nfo-terms-cell" role="listitem">
                    <div className="nfo-terms-cell-label">Additional investment</div>
                    <div className="nfo-terms-cell-val">₹1 multiples</div>
                    <div className="nfo-terms-cell-sub">After minimum is met</div>
                  </div>
                  <div className="nfo-terms-cell" role="listitem">
                    <div className="nfo-terms-cell-label">Subscription price</div>
                    <div className="nfo-terms-cell-val">{nfo.subscriptionPrice}</div>
                    <div className="nfo-terms-cell-sub">Per unit, face value</div>
                  </div>
                  <div className="nfo-terms-cell" role="listitem">
                    <div className="nfo-terms-cell-label">Exit load</div>
                    <div className="nfo-terms-cell-val">{nfo.exitLoad.split(" ")[0]}</div>
                    <div className="nfo-terms-cell-sub">If redeemed {nfo.exitLoad.split(" ").slice(1).join(" ")}</div>
                  </div>
                  <div className="nfo-terms-cell" role="listitem">
                    <div className="nfo-terms-cell-label">Lock-in period</div>
                    <div className="nfo-terms-cell-val">None</div>
                    <div className="nfo-terms-cell-sub">Open-ended structure</div>
                  </div>
                  <div className="nfo-terms-cell" role="listitem">
                    <div className="nfo-terms-cell-label">Benchmark</div>
                    <div className="nfo-terms-cell-val">{nfo.benchmark}</div>
                    <div className="nfo-terms-cell-sub">Single-tier, SEBI mandated</div>
                  </div>
                  <div className="nfo-terms-cell" role="listitem">
                    <div className="nfo-terms-cell-label">NFO expenses</div>
                    <div className="nfo-terms-cell-val">₹0</div>
                    <div className="nfo-terms-cell-sub">SEBI prohibits NFO charges</div>
                  </div>
                  <div className="nfo-terms-cell" role="listitem">
                    <div className="nfo-terms-cell-label">Risk band</div>
                    <div className="nfo-terms-cell-val" style={{ color: nfo.riskColor }}>
                      {nfo.riskLevel}
                    </div>
                    <div className="nfo-terms-cell-sub">SEBI riskometer</div>
                  </div>
                </div>
              </div>
            </section>

            {/* SIF Regulatory Callouts */}
            <section aria-labelledby="sif-rules-title">
              <div style={{ marginBottom: "1.25rem" }}>
                <div className="nfo-section-eyebrow" aria-hidden="true">SIF-specific rules</div>
                <h2 className="nfo-section-title-d" id="sif-rules-title">What makes this different from a standard MF NFO</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="nfo-sif-callout">
                  <div className="nfo-sif-callout-icon" aria-hidden="true">
                    <Info size={16} />
                  </div>
                  <div>
                    <div className="nfo-sif-callout-title">₹10L minimum is aggregated at PAN level, not per scheme</div>
                    <div className="nfo-sif-callout-body">
                      If you already hold ₹10L in another {nfo.amcShort.toUpperCase()} SIF strategy, you don&apos;t need a fresh ₹10L for this fund — the threshold applies across all SIF strategies from the same AMC under your PAN.
                    </div>
                  </div>
                </div>
                <div className="nfo-sif-callout">
                  <div className="nfo-sif-callout-icon" aria-hidden="true">
                    <Check size={16} />
                  </div>
                  <div>
                    <div className="nfo-sif-callout-title">Accredited investors are exempt from the ₹10L threshold</div>
                    <div className="nfo-sif-callout-body">
                      Individuals with ₹2Cr+ annual income, or ₹7.5Cr+ net worth (with ₹3.75Cr+ in financial assets), qualify as accredited investors under SEBI norms and can invest below the standard minimum.
                    </div>
                  </div>
                </div>
                <div className="nfo-sif-callout">
                  <div className="nfo-sif-callout-icon" aria-hidden="true">
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="nfo-sif-callout-title">Unhedged short exposure capped at 25% of net assets</div>
                    <div className="nfo-sif-callout-body">
                      This is a SEBI-wide cap on all SIF long-short strategies. Hedging and rebalancing positions don&apos;t count toward this limit — only the directional short book does.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Asset Allocation */}
            <section className="nfo-card-el" aria-labelledby="alloc-title">
              <div className="nfo-card-el-head">
                <h2 className="nfo-card-el-title" id="alloc-title">
                  <BarChart3 size={16} aria-hidden="true" />
                  Asset allocation mandate
                </h2>
              </div>
              <div className="nfo-card-el-body">
                {nfo.allocationBands.map((band, idx) => (
                  <div key={idx} className="nfo-alloc-row">
                    <div className="nfo-alloc-row-head">
                      <span className="nfo-alloc-name">{band.name}</span>
                      <span className="nfo-alloc-range">{band.range}</span>
                    </div>
                    <div className="nfo-alloc-bar-track">
                      <div
                        className="nfo-alloc-bar-fill"
                        style={{ width: `${band.percent}%`, background: band.color }}
                      ></div>
                    </div>
                  </div>
                ))}
                <div className="nfo-alloc-legend">
                  {nfo.allocationBands.map((band, idx) => (
                    <div key={idx} className="nfo-alloc-legend-item">
                      <span
                        className="nfo-alloc-legend-dot"
                        style={{ background: band.color }}
                        aria-hidden="true"
                      ></span>
                      {band.name.split(" (")[0].split(" &")[0]}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Strategy */}
            <section className="nfo-card-el" aria-labelledby="strategy-title">
              <div className="nfo-card-el-head">
                <h2 className="nfo-card-el-title" id="strategy-title">
                  <Activity size={16} aria-hidden="true" />
                  Investment strategy &amp; objective
                </h2>
              </div>
              <div className="nfo-card-el-body">
                {nfo.objective && (
                  <p className="nfo-objective-text">{nfo.objective}</p>
                )}
                {nfo.strategyPoints.map((point, idx) => {
                  const IconComponent =
                    point.icon === "pulse"
                      ? Activity
                      : point.icon === "clock"
                      ? Clock
                      : point.icon === "shield"
                      ? Shield
                      : point.icon === "chart"
                      ? BarChart3
                      : Lock;

                  return (
                    <div key={idx} className="nfo-strategy-point">
                      <div className="nfo-strategy-icon" aria-hidden="true">
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <div className="nfo-strategy-title">{point.title}</div>
                        <div className="nfo-strategy-desc">{point.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Liquidity & Restrictions */}
            <section className="nfo-card-el" aria-labelledby="liquidity-title">
              <div className="nfo-card-el-head">
                <h2 className="nfo-card-el-title" id="liquidity-title">
                  <Lock size={16} aria-hidden="true" />
                  Liquidity &amp; investment restrictions
                </h2>
              </div>
              <div className="nfo-card-el-body">
                <div className="nfo-restriction-list">
                  <div className="nfo-restriction-item allow">
                    <Check size={15} className="mt-0.5" />
                    <span>SIP, STP, and SWP permitted, provided your aggregate SIF balance stays at or above {nfo.minInvestment}</span>
                  </div>
                  <div className="nfo-restriction-item allow">
                    <Check size={15} className="mt-0.5" />
                    <span>Open-ended structure — invest or redeem any business day after allotment</span>
                  </div>
                  <div className="nfo-restriction-item deny">
                    <X size={15} className="mt-0.5" />
                    <span>Partial redemptions not allowed if remaining investment would fall below {nfo.minInvestment} — only full redemption permitted in that case</span>
                  </div>
                  <div className="nfo-restriction-item deny">
                    <X size={15} className="mt-0.5" />
                    <span>Applications cannot be cancelled once submitted and funds are blocked for allotment</span>
                  </div>
                  <div className="nfo-restriction-item allow">
                    <Check size={15} className="mt-0.5" />
                    <span>NAV disclosed daily by 11:00 PM; portfolio disclosed every alternate month</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Fund Managers */}
            <section className="nfo-card-el" aria-labelledby="managers-title">
              <div className="nfo-card-el-head">
                <h2 className="nfo-card-el-title" id="managers-title">
                  <Users size={16} aria-hidden="true" />
                  Fund management team
                </h2>
              </div>
              <div className="nfo-card-el-body">
                <div className="nfo-managers-grid">
                  {nfo.managers.map((m, idx) => (
                    <div key={idx} className="nfo-manager-card">
                      <div className="nfo-manager-top">
                        <div className="nfo-manager-avatar" aria-hidden="true">
                          {m.avatar}
                        </div>
                        <div>
                          <div className="nfo-manager-name">{m.name}</div>
                          <div className="nfo-manager-role">{m.role}</div>
                        </div>
                      </div>
                      <div className="nfo-manager-cred">{m.cred}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* How to apply */}
            <section className="nfo-card-el" aria-labelledby="apply-process-title">
              <div className="nfo-card-el-head">
                <h2 className="nfo-card-el-title" id="apply-process-title">
                  <Check size={16} aria-hidden="true" />
                  How to apply for this NFO
                </h2>
              </div>
              <div className="nfo-card-el-body" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
                <div className="nfo-process-steps-detail" role="list" aria-label="Application steps">
                  <div className="nfo-process-step-detail" role="listitem">
                    <div className="nfo-process-step-num-detail" aria-hidden="true">1</div>
                    <div className="nfo-process-step-title-detail">Confirm eligibility</div>
                    <div className="nfo-process-step-desc-detail">Check your existing SIF holdings with {nfo.amcShort.toUpperCase()} AMC and confirm {nfo.minInvestment} PAN-level threshold.</div>
                  </div>
                  <div className="nfo-process-step-detail" role="listitem">
                    <div className="nfo-process-step-num-detail" aria-hidden="true">2</div>
                    <div className="nfo-process-step-title-detail">Submit application</div>
                    <div className="nfo-process-step-desc-detail">Apply via {nfo.amcShort.toUpperCase()} AMC&apos;s SIF platform or your distributor with completed KYC.</div>
                  </div>
                  <div className="nfo-process-step-detail" role="listitem">
                    <div className="nfo-process-step-num-detail" aria-hidden="true">3</div>
                    <div className="nfo-process-step-title-detail">Funds blocked</div>
                    <div className="nfo-process-step-desc-detail">Your {nfo.minInvestment} is held until allotment — not deducted upfront from your account.</div>
                  </div>
                  <div className="nfo-process-step-detail" role="listitem">
                    <div className="nfo-process-step-num-detail" aria-hidden="true">4</div>
                    <div className="nfo-process-step-title-detail">Units allotted</div>
                    <div className="nfo-process-step-desc-detail">By {nfo.allotmentDate}, units credited at {nfo.subscriptionPrice}/unit. Fund reopens for transactions {nfo.reopenDate}.</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Documents */}
            <section className="nfo-card-el" aria-labelledby="docs-title">
              <div className="nfo-card-el-head">
                <h2 className="nfo-card-el-title" id="docs-title">
                  <FileText size={16} aria-hidden="true" />
                  NFO documents
                </h2>
              </div>
              <div className="nfo-card-el-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {nfo.docs.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-s)"
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-1)" }}>
                        {doc.title}
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--accent)", fontWeight: 500 }}>
                        Download →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* Disclaimer */}
            <div className="nfo-disclaimer-detail" role="note" aria-label="Investment disclaimer">
              <AlertTriangle size={16} />
              SIFcase is a research and comparison platform. NFO information shown is for educational purposes only and should not be considered investment advice. Investments in SIFs involve relatively higher risk, including potential loss of capital, liquidity risk, and market volatility. Please read the Investment Strategy Information Document and all scheme-related documents carefully before investing. This Investment Strategy Information Document reference is current as of the date shown on official AMC documentation — confirm directly with {nfo.amc} before applying.
            </div>

          </div>{/* /main-col */}

          {/* ════════════════════════ SIDEBAR ════════════════════════ */}
          <aside className="nfo-side-col" aria-label="Apply and fund details">
            
            {/* Apply Card */}
            <div className="nfo-side-apply-card">
              <div className="nfo-apply-price">{nfo.subscriptionPrice}</div>
              <div className="nfo-apply-price-label">SUBSCRIPTION PRICE PER UNIT</div>

              <div className="nfo-apply-detail-row">
                <span className="nfo-apply-detail-label">Minimum investment</span>
                <span className="nfo-apply-detail-val">{nfo.minInvestment}</span>
              </div>
              <div className="nfo-apply-detail-row">
                <span className="nfo-apply-detail-label">NFO closes</span>
                <span className="nfo-apply-detail-val" style={{ color: "#facc15" }}>
                  {nfo.closeDate}
                </span>
              </div>
              <div className="nfo-apply-detail-row">
                <span className="nfo-apply-detail-label">Allotment date</span>
                <span className="nfo-apply-detail-val">{nfo.allotmentDate}</span>
              </div>
              <div className="nfo-apply-detail-row">
                <span className="nfo-apply-detail-label">Exit load</span>
                <span className="nfo-apply-detail-val">{nfo.exitLoad}</span>
              </div>
              <div className="nfo-apply-detail-row">
                <span className="nfo-apply-detail-label">Structure</span>
                <span className="nfo-apply-detail-val">{nfo.structure}</span>
              </div>

              <button
                className="nfo-btn-p"
                aria-label={`Apply for ${nfo.name} NFO`}
                onClick={handleApply}
              >
                Apply for this NFO
              </button>
              
              <button
                className={`nfo-btn-s ${compared ? "active" : ""}`}
                aria-label="Add to compare"
                onClick={() => setCompared((prev) => !prev)}
              >
                {compared ? "✓ Added to compare" : "+ Add to compare"}
              </button>

              <div className="nfo-apply-note">
                No NFO charges — SEBI prohibits AMCs from levying NFO expenses on investors.
              </div>
            </div>

            {/* Eligibility */}
            <div className="nfo-eligibility-card">
              <div className="nfo-eligibility-title">
                <Shield size={15} aria-hidden="true" />
                Who can invest
              </div>
              <div className="nfo-eligibility-item">
                <Check size={13} />
                <span>Resident individuals, HUFs, and entities meeting the {nfo.minInvestment} minimum</span>
              </div>
              <div className="nfo-eligibility-item">
                <Check size={13} />
                <span>Accredited investors, exempt from the {nfo.minInvestment} threshold</span>
              </div>
              <div className="nfo-eligibility-item">
                <Check size={13} />
                <span>Investors with completed KYC at the AMC or via KRA</span>
              </div>
            </div>

            {/* Scheme info */}
            <div className="nfo-sidebar-info-card">
              <div className="nfo-sidebar-info-card-head">
                <Info size={14} aria-hidden="true" />
                Scheme information
              </div>
              <div className="nfo-sidebar-info-row">
                <span className="nfo-sidebar-info-label">Category</span>
                <span className="nfo-sidebar-info-val">{nfo.category}</span>
              </div>
              <div className="nfo-sidebar-info-row">
                <span className="nfo-sidebar-info-label">Sub-category</span>
                <span className="nfo-sidebar-info-val">
                  {nfo.slug.includes("long-short") || nfo.name.includes("Long-Short") ? "Long-Short" : "Long-Only"}
                </span>
              </div>
              <div className="nfo-sidebar-info-row">
                <span className="nfo-sidebar-info-label">Plan</span>
                <span className="nfo-sidebar-info-val">Regular &amp; Direct</span>
              </div>
              <div className="nfo-sidebar-info-row">
                <span className="nfo-sidebar-info-label">Option</span>
                <span className="nfo-sidebar-info-val">Growth, IDCW</span>
              </div>
              <div className="nfo-sidebar-info-row">
                <span className="nfo-sidebar-info-label">Benchmark</span>
                <span className="nfo-sidebar-info-val">{nfo.benchmark}</span>
              </div>
              <div className="nfo-sidebar-info-row">
                <span className="nfo-sidebar-info-label">Duration</span>
                <span className="nfo-sidebar-info-val">Perpetual</span>
              </div>
              <div className="nfo-sidebar-info-row">
                <span className="nfo-sidebar-info-label">Listing</span>
                <span className="nfo-sidebar-info-val">Not required ({nfo.structure.toLowerCase()})</span>
              </div>
            </div>

            {/* Quick links */}
            <div className="nfo-sidebar-info-card">
              <div className="nfo-sidebar-info-card-head">
                <Link2 size={14} aria-hidden="true" />
                Quick links
              </div>
              <div className="nfo-sidebar-info-row">
                <Link href="/nfos" style={{ color: "var(--accent)", fontSize: "13px", fontWeight: 500 }}>
                  View all open NFOs →
                </Link>
              </div>
              <div className="nfo-sidebar-info-row">
                <Link
                  href={`/fund-house/${nfo.amcShort}`}
                  style={{ color: "var(--accent)", fontSize: "13px", fontWeight: 500 }}
                >
                  {nfo.amcShort.toUpperCase()} Mutual Fund SIFs →
                </Link>
              </div>
              <div className="nfo-sidebar-info-row">
                <Link href="/sif-101" style={{ color: "var(--accent)", fontSize: "13px", fontWeight: 500 }}>
                  Learn how SIFs work →
                </Link>
              </div>
            </div>

          </aside>{/* /side-col */}
        </div>{/* /page-grid */}
      </main>

      {applied && (
        <div className="nfo-toast" style={{ borderLeftColor: "#1a9e60" }}>
          ✓ Application request sent! A link has been sent to your registered email to transfer funds.
        </div>
      )}
    </div>
  );
}
