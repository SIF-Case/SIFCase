"use client";

import { useState } from "react";
import Link from "next/link";
import { NFOS_DATA, NFOData } from "@/lib/nfoData";

export function NFOListClient() {
  const [activeFilter, setActiveFilter] = useState<"All" | "Equity" | "Hybrid" | "Closing soon">("All");
  const [comparedSlugs, setComparedSlugs] = useState<string[]>([]);
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  // Filter logic
  const filteredNfos = NFOS_DATA.filter((nfo) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Equity") return nfo.category === "Equity";
    if (activeFilter === "Hybrid") return nfo.category === "Hybrid";
    if (activeFilter === "Closing soon") return nfo.isClosingSoon;
    return true;
  });

  const toggleCompare = (slug: string) => {
    setComparedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribedEmail) {
      setSubscriptionSuccess(true);
      setTimeout(() => setSubscriptionSuccess(false), 5000);
      setSubscribedEmail("");
    }
  };

  return (
    <div className="nfo-page-container">
      {/* Scoped CSS from sifcase-nfo-page (1).html */}
      <style dangerouslySetInnerHTML={{ __html: `
        .nfo-page-container {
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
        .nfo-breadcrumb a:hover { color: var(--primary); }
        .nfo-breadcrumb-sep { color: var(--border-s); font-size: 14px; }
        .nfo-breadcrumb-cur { color: var(--text-2); font-weight: 500; }

        /* ── Page Hero ──────────────────────────────────────────────────── */
        .nfo-page-hero { background: var(--navy); padding: 2.25rem 0 1.75rem; text-align: left; }
        .nfo-page-hero-inner { max-width: 1180px; margin: 0 auto; padding: 0 1.5rem; }
        .nfo-hero-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-l); margin-bottom: 0.625rem; display: flex; align-items: center; gap: 7px; }
        .nfo-hero-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-l); animation: nfo-pulse 2s infinite; }
        @keyframes nfo-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .nfo-hero-title { font-size: 26px; font-weight: 600; color: #fff; letter-spacing: -0.02em; margin-bottom: 0.5rem; line-height: 1.2; }
        .nfo-hero-sub { font-size: 14.5px; color: rgba(255,255,255,0.55); max-width: 600px; line-height: 1.6; }
        .nfo-hero-stats-row { display: flex; gap: 2rem; margin-top: 1.5rem; flex-wrap: wrap; }
        .nfo-hero-stat { display: flex; flex-direction: column; gap: 2px; }
        .nfo-hero-stat-val { font-size: 22px; font-weight: 600; color: #fff; letter-spacing: -0.02em; }
        .nfo-hero-stat-val.accent { color: var(--accent-l); }
        .nfo-hero-stat-label { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; }

        /* ── Layout ─────────────────────────────────────────────────────── */
        .nfo-main-content { max-width: 1180px; margin: 0 auto; padding: 2rem 1.5rem 0; }
        .nfo-section { margin-bottom: 2.5rem; }
        .nfo-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; text-align: left; }
        .nfo-section-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .nfo-section-eyebrow::before { content: ''; display: block; width: 16px; height: 2px; background: var(--accent); border-radius: 1px; }
        .nfo-section-title { font-size: 18px; font-weight: 600; color: var(--text-1); letter-spacing: -0.01em; }
        .nfo-section-sub { font-size: 13px; color: var(--text-3); margin-top: 3px; }

        /* ── Filter Bar ─────────────────────────────────────────────────── */
        .nfo-filter-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .nfo-filter-chip { font-size: 12.5px; font-weight: 500; padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); transition: all 0.15s; cursor: pointer; }
        .nfo-filter-chip:hover { border-color: var(--primary); color: var(--primary); }
        .nfo-filter-chip.active { background: var(--primary); border-color: var(--primary); color: #fff; }

        /* ── Open NFO Cards Grid ──────────────────────────────────────────── */
        .nfo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .nfo-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-l);
          overflow: hidden; transition: box-shadow 0.15s, border-color 0.15s;
          display: flex; flex-direction: column;
          text-align: left;
        }
        .nfo-card:hover { box-shadow: var(--shadow); border-color: var(--border-s); }
        .nfo-card-top { padding: 1.25rem 1.25rem 1rem; flex: 1; }
        .nfo-card-badges { display: flex; align-items: center; gap: 7px; margin-bottom: 0.75rem; flex-wrap: wrap; }
        .nfo-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 600; padding: 3px 9px; border-radius: 20px; letter-spacing: 0.01em; }
        .nfo-badge-open { background: var(--success-bg); color: var(--success); border: 1px solid rgba(26,158,96,0.2); }
        .nfo-badge-closing { background: var(--warn-bg); color: var(--warn); border: 1px solid rgba(192,123,26,0.22); }
        .nfo-badge-equity { background: rgba(46,158,148,0.12); color: var(--accent); border: 1px solid rgba(46,158,148,0.25); }
        .nfo-badge-hybrid { background: rgba(0,76,97,0.08); color: var(--primary); border: 1px solid rgba(0,76,97,0.18); }
        .nfo-badge-closed-end { background: var(--surface-2); color: var(--text-3); border: 1px solid var(--border); }
        .nfo-card-amc { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--text-3); font-weight: 500; margin-bottom: 6px; }
        .nfo-amc-avatar-sm { width: 18px; height: 18px; background: var(--accent); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .nfo-card-name { font-size: 15.5px; font-weight: 600; color: var(--text-1); line-height: 1.35; margin-bottom: 0.875rem; letter-spacing: -0.01em; }

        .nfo-countdown {
          display: flex; align-items: center; gap: 8px; padding: 8px 10px;
          background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-s);
          margin-bottom: 0.875rem; font-size: 12px;
        }
        .nfo-countdown.urgent { background: var(--warn-bg); border-color: rgba(192,123,26,0.25); }
        .nfo-countdown-icon { color: var(--text-3); flex-shrink: 0; }
        .nfo-countdown.urgent .nfo-countdown-icon { color: var(--warn); }
        .nfo-countdown-text { color: var(--text-2); }
        .nfo-countdown.urgent .nfo-countdown-text { color: var(--warn); font-weight: 600; }
        .nfo-countdown-days { font-weight: 700; color: var(--text-1); }
        .nfo-countdown.urgent .nfo-countdown-days { color: var(--warn); }

        .nfo-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; margin-bottom: 0.25rem; }
        .nfo-meta-item { }
        .nfo-meta-label { font-size: 10px; color: var(--text-3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .nfo-meta-val { font-size: 13px; color: var(--text-1); font-weight: 500; }

        .nfo-card-bottom { display: flex; gap: 8px; padding: 0.875rem 1.25rem; border-top: 1px solid var(--border); background: var(--surface-2); }
        .nfo-btn-primary { flex: 1; text-align: center; padding: 9px; background: var(--accent); color: #fff; font-size: 12.5px; font-weight: 600; border-radius: var(--radius-s); transition: background 0.15s; }
        .nfo-btn-primary:hover { background: var(--accent-l); }
        .nfo-btn-secondary { padding: 9px 14px; background: var(--surface); color: var(--text-2); font-size: 12.5px; font-weight: 500; border-radius: var(--radius-s); border: 1px solid var(--border); transition: all 0.15s; cursor: pointer; }
        .nfo-btn-secondary:hover { border-color: var(--primary); color: var(--primary); }
        .nfo-btn-secondary.active { background: var(--primary); color: #fff; border-color: var(--primary); }

        /* ── Closing Soon Strip ──────────────────────────────────────────── */
        .nfo-alert-strip {
          display: flex; align-items: center; gap: 10px; padding: 0.875rem 1.25rem;
          background: var(--warn-bg); border: 1px solid rgba(192,123,26,0.25); border-radius: var(--radius);
          margin-bottom: 1.25rem; font-size: 13px; color: var(--warn); font-weight: 500;
          text-align: left;
        }
        .nfo-alert-strip svg { flex-shrink: 0; }

        /* ── Info Sections (Educational) ──────────────────────────────── */
        .nfo-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .nfo-info-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-l); padding: 1.25rem; text-align: left; }
        .nfo-info-icon { width: 36px; height: 36px; border-radius: var(--radius-s); background: var(--accent-bg); display: flex; align-items: center; justify-content: center; margin-bottom: 0.875rem; }
        .nfo-info-icon svg { color: var(--accent); }
        .nfo-info-card-title { font-size: 14.5px; font-weight: 600; color: var(--text-1); margin-bottom: 6px; }
        .nfo-info-card-body { font-size: 13px; color: var(--text-2); line-height: 1.6; }

        /* ── Process Steps ──────────────────────────────────────────────── */
        .nfo-process-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-l); padding: 2.5rem 2rem; }
        .nfo-process-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; position: relative; }
        .nfo-process-step { padding: 0 1.25rem; position: relative; text-align: left; }
        .nfo-process-step:first-child { padding-left: 0; }
        .nfo-process-step:last-child { padding-right: 0; }
        .nfo-process-step-num {
          width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: #fff;
          display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;
          margin-bottom: 1.125rem; position: relative; z-index: 2;
        }
        .nfo-process-step::after {
          content: ''; position: absolute; top: 18px; left: calc(50% + 18px); width: calc(100% - 18px);
          height: 1.5px; background: var(--border); z-index: 1;
        }
        .nfo-process-step:last-child::after { display: none; }
        .nfo-process-step-title { font-size: 14.5px; font-weight: 600; color: var(--text-1); margin-bottom: 6px; }
        .nfo-process-step-desc { font-size: 13px; color: var(--text-3); line-height: 1.6; }

        /* ── Disclaimer ─────────────────────────────────────────────────── */
        .nfo-disclaimer { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.25rem; font-size: 11.5px; color: var(--text-3); line-height: 1.6; display: flex; gap: 10px; align-items: flex-start; text-align: left; }
        .nfo-disclaimer svg { flex-shrink: 0; color: var(--warn); margin-top: 1px; }

        /* ── Newsletter strip ───────────────────────────────────────────── */
        .nfo-newsletter-strip {
          background: var(--navy); border-radius: var(--radius-l); padding: 1.75rem 2rem;
          display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;
          text-align: left;
        }
        .nfo-newsletter-text h3 { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 4px; }
        .nfo-newsletter-text p { font-size: 12.5px; color: rgba(255,255,255,0.5); }
        .nfo-newsletter-form { display: flex; gap: 8px; flex-shrink: 0; }
        .nfo-newsletter-input { padding: 10px 14px; border-radius: var(--radius-s); border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.07); color: #fff; font-size: 13px; width: 220px; font-family: var(--font); outline: none; }
        .nfo-newsletter-input::placeholder { color: rgba(255,255,255,0.35); }
        .nfo-newsletter-btn { padding: 10px 20px; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; border-radius: var(--radius-s); white-space: nowrap; transition: background 0.15s; cursor: pointer; }
        .nfo-newsletter-btn:hover { background: var(--accent-l); }
        .nfo-toast { padding: 10px 16px; background: #fff; border-left: 4px solid var(--accent); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: fixed; bottom: 24px; right: 24px; z-index: 1000; font-size: 13px; color: var(--text-1); font-weight: 500; }

        /* ── Responsive ──────────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .nfo-grid { grid-template-columns: 1fr; }
          .nfo-info-grid { grid-template-columns: 1fr; }
          .nfo-process-steps { grid-template-columns: 1fr 1fr; gap: 1.5rem 0; }
          .nfo-process-step::after { display: none; }
          .nfo-hero-stats-row { gap: 1.25rem; }
        }
        @media (max-width: 600px) {
          .nfo-hero-title { font-size: 21px; }
          .nfo-meta-grid { grid-template-columns: 1fr 1fr; }
          .nfo-newsletter-strip { flex-direction: column; align-items: flex-start; }
          .nfo-newsletter-form { width: 100%; }
          .nfo-newsletter-input { flex: 1; width: auto; }
          .nfo-process-steps { grid-template-columns: 1fr; }
        }
      ` }} />

      {/* Breadcrumb */}
      <div className="nfo-breadcrumb-wrap">
        <nav className="nfo-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="nfo-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="nfo-breadcrumb-cur">NFO</span>
        </nav>
      </div>

      {/* Page Hero */}
      <div className="nfo-page-hero">
        <div className="nfo-page-hero-inner">
          <div className="nfo-hero-eyebrow">
            <span className="nfo-hero-eyebrow-dot" aria-hidden="true"></span>
            Live subscription window
          </div>
          <h1 className="nfo-hero-title">Open SIF NFOs</h1>
          <p className="nfo-hero-sub">Every active New Fund Offer across SEBI-registered SIFs — subscription windows, allotment dates, and full scheme terms in one place.</p>
          <div className="nfo-hero-stats-row" role="list" aria-label="NFO summary stats">
            <div className="nfo-hero-stat" role="listitem">
              <span className="nfo-hero-stat-val accent">4</span>
              <span className="nfo-hero-stat-label">NFOs open now</span>
            </div>
            <div className="nfo-hero-stat" role="listitem">
              <span className="nfo-hero-stat-val">2</span>
              <span className="nfo-hero-stat-label">Closing this week</span>
            </div>
            <div className="nfo-hero-stat" role="listitem">
              <span className="nfo-hero-stat-val">3</span>
              <span className="nfo-hero-stat-label">AMCs represented</span>
            </div>
            <div className="nfo-hero-stat" role="listitem">
              <span className="nfo-hero-stat-val">₹10L</span>
              <span className="nfo-hero-stat-label">Minimum across all</span>
            </div>
          </div>
        </div>
      </div>

      <main className="nfo-main-content">
        {/* SECTION 1 — OPEN NFOs */}
        <section className="nfo-section" aria-labelledby="open-nfo-title">
          <div className="nfo-section-head">
            <div>
              <div className="nfo-section-eyebrow" aria-hidden="true">Right now</div>
              <h2 className="nfo-section-title" id="open-nfo-title">Open NFOs</h2>
              <p className="nfo-section-sub">Subscription windows currently accepting applications</p>
            </div>
            <div className="nfo-filter-bar" role="group" aria-label="Filter NFOs by category">
              {(["All", "Equity", "Hybrid", "Closing soon"] as const).map((filter) => (
                <button
                  key={filter}
                  className={`nfo-filter-chip ${activeFilter === filter ? "active" : ""}`}
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="nfo-alert-strip" role="status">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            2 NFOs close within 5 days — Kotak Infinity Hybrid L/S (29 Jun) and SBI Magnum Ex-Top 100 L/S (2 Jul)
          </div>

          <div className="nfo-grid" role="list" aria-label="Open NFO listings">
            {filteredNfos.map((nfo) => (
              <article key={nfo.slug} className="nfo-card" role="listitem">
                <div className="nfo-card-top">
                  <div className="nfo-card-badges">
                    {nfo.isClosingSoon && (
                      <span className="nfo-badge nfo-badge-closing">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        Closing soon
                      </span>
                    )}
                    {!nfo.isClosingSoon && (
                      <span className="nfo-badge nfo-badge-open">
                        <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
                          <circle cx="3" cy="3" r="3" fill="currentColor" />
                        </svg>
                        Open
                      </span>
                    )}
                    <span className={`nfo-badge ${nfo.category === "Equity" ? "nfo-badge-equity" : "nfo-badge-hybrid"}`}>
                      {nfo.category}
                    </span>
                    <span className="nfo-badge nfo-badge-closed-end">{nfo.structure}</span>
                  </div>
                  <div className="nfo-card-amc">
                    <div className="nfo-amc-avatar-sm" aria-hidden="true">
                      {nfo.avatar}
                    </div>
                    {nfo.amc}
                  </div>
                  <h3 className="nfo-card-name">{nfo.name}</h3>

                  <div className={`nfo-countdown ${nfo.isClosingSoon ? "urgent" : ""}`}>
                    <svg className="nfo-countdown-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="nfo-countdown-text">
                      <span className="nfo-countdown-days">{nfo.daysLeft} days</span> left to subscribe · Closes {nfo.closeDate}
                    </span>
                  </div>

                  <div className="nfo-meta-grid">
                    <div className="nfo-meta-item">
                      <div className="nfo-meta-label">NFO opened</div>
                      <div className="nfo-meta-val">{nfo.openDate}</div>
                    </div>
                    <div className="nfo-meta-item">
                      <div className="nfo-meta-label">Allotment date</div>
                      <div className="nfo-meta-val">{nfo.allotmentDate}</div>
                    </div>
                    <div className="nfo-meta-item">
                      <div className="nfo-meta-label">Min. investment</div>
                      <div className="nfo-meta-val">{nfo.minInvestment}</div>
                    </div>
                    <div className="nfo-meta-item">
                      <div className="nfo-meta-label">Subscription price</div>
                      <div className="nfo-meta-val">{nfo.subscriptionPrice} / unit</div>
                    </div>
                    <div className="nfo-meta-item">
                      <div className="nfo-meta-label">Exit load</div>
                      <div className="nfo-meta-val">{nfo.exitLoad}</div>
                    </div>
                    <div className="nfo-meta-item">
                      <div className="nfo-meta-label">Benchmark</div>
                      <div className="nfo-meta-val">{nfo.benchmark}</div>
                    </div>
                  </div>
                </div>
                <div className="nfo-card-bottom">
                  <Link href={`/nfos/${nfo.slug}`} className="nfo-btn-primary">
                    View full details
                  </Link>
                  <button
                    className={`nfo-btn-secondary ${comparedSlugs.includes(nfo.slug) ? "active" : ""}`}
                    aria-label={`Add ${nfo.name} to compare`}
                    onClick={() => toggleCompare(nfo.slug)}
                  >
                    {comparedSlugs.includes(nfo.slug) ? "✓ Added" : "+ Compare"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 2 — Educational */}
        <section className="nfo-section" aria-labelledby="terms-title">
          <div className="nfo-section-head">
            <div>
              <div className="nfo-section-eyebrow" aria-hidden="true">Before you subscribe</div>
              <h2 className="nfo-section-title" id="terms-title">What every NFO term actually means</h2>
              <p className="nfo-section-sub">The fields that matter most when evaluating a SIF NFO — explained, not just listed</p>
            </div>
          </div>
          <div className="nfo-info-grid">
            <div className="nfo-info-card">
              <div className="nfo-info-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div className="nfo-info-card-title">Subscription window</div>
              <div className="nfo-info-card-body">
                The period during which you can apply at the fixed offer price — typically ₹10/unit. After close, units are allotted and the fund starts trading at live NAV.
              </div>
            </div>
            <div className="nfo-info-card">
              <div className="nfo-info-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="nfo-info-card-title">Open vs. close-ended</div>
              <div className="nfo-info-card-body">
                Open-ended SIFs accept investment and redemption anytime after allotment. Close-ended structures lock capital for a fixed term — check this before committing ₹10L.
              </div>
            </div>
            <div className="nfo-info-card">
              <div className="nfo-info-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <div className="nfo-info-card-title">Asset allocation bands</div>
              <div className="nfo-info-card-body">
                &quot;Long-short equity&quot; can mean very different gross/net exposure across AMCs. The allocation band tells you the actual risk envelope you&apos;re buying into.
              </div>
            </div>
            <div className="nfo-info-card">
              <div className="nfo-info-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
                </svg>
              </div>
              <div className="nfo-info-card-title">Fund manager track record</div>
              <div className="nfo-info-card-body">
                SIF strategies require higher skill than passive index funds — derivatives, hedging, active rotation. Manager pedigree matters more here than for a vanilla equity fund.
              </div>
            </div>
            <div className="nfo-info-card">
              <div className="nfo-info-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="nfo-info-card-title">Exit load &amp; lock-in</div>
              <div className="nfo-info-card-body">
                Most SIF NFOs charge 1% if redeemed within 15–30 days of allotment. Some carry longer effective lock-ins via close-ended structures — confirm before applying.
              </div>
            </div>
            <div className="nfo-info-card">
              <div className="nfo-info-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V7a3 3 0 0 1 6 0v4M9 11h6" />
                </svg>
              </div>
              <div className="nfo-info-card-title">Application &amp; allotment</div>
              <div className="nfo-info-card-body">
                Funds are blocked at application, debited only on allotment. If you&apos;re not allotted units (rare for SIFs), the full amount is released back automatically.
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — Process */}
        <section className="nfo-section" aria-labelledby="process-title">
          <div className="nfo-section-head">
            <div>
              <div className="nfo-section-eyebrow" aria-hidden="true">Step by step</div>
              <h2 className="nfo-section-title" id="process-title">How NFO subscription works</h2>
            </div>
          </div>
          <div className="nfo-process-card">
            <div className="nfo-process-steps" role="list" aria-label="NFO subscription process steps">
              <div className="nfo-process-step" role="listitem">
                <div className="nfo-process-step-num" aria-hidden="true">1</div>
                <div className="nfo-process-step-title">Review scheme terms</div>
                <div className="nfo-process-step-desc">Check minimum investment, allocation bands, benchmark, and exit load before applying.</div>
              </div>
              <div className="nfo-process-step" role="listitem">
                <div className="nfo-process-step-num" aria-hidden="true">2</div>
                <div className="nfo-process-step-title">Submit application</div>
                <div className="nfo-process-step-desc">Apply through your AMC or distributor with KYC and ₹10L+ funds ready for transfer.</div>
              </div>
              <div className="nfo-process-step" role="listitem">
                <div className="nfo-process-step-num" aria-hidden="true">3</div>
                <div className="nfo-process-step-title">Funds blocked, not debited</div>
                <div className="nfo-process-step-desc">Your amount is held until allotment — not deducted upfront from your account.</div>
              </div>
              <div className="nfo-process-step" role="listitem">
                <div className="nfo-process-step-num" aria-hidden="true">4</div>
                <div className="nfo-process-step-title">Units allotted</div>
                <div className="nfo-process-step-desc">Within 5 business days of NFO close, units are allotted at ₹10/unit and the fund goes live.</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — Newsletter */}
        <section className="nfo-section" aria-labelledby="newsletter-title" style={{ marginBottom: "1.5rem" }}>
          <div className="nfo-newsletter-strip">
            <div className="nfo-newsletter-text">
              <h3 id="newsletter-title">Never miss a new SIF launch</h3>
              <p>Get notified the moment a new NFO opens, with full scheme terms summarized.</p>
            </div>
            <form className="nfo-newsletter-form" aria-label="Subscribe to NFO alerts" onSubmit={handleSubscribe}>
              <input
                type="email"
                className="nfo-newsletter-input"
                placeholder="you@email.com"
                aria-label="Email address"
                required
                value={subscribedEmail}
                onChange={(e) => setSubscribedEmail(e.target.value)}
              />
              <button type="submit" className="nfo-newsletter-btn">Get NFO alerts</button>
            </form>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="nfo-disclaimer" role="note" aria-label="Investment disclaimer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          SIFcase is a research and comparison platform. NFO information shown is for educational purposes only and should not be considered investment advice. Investments in SIFs are subject to market risks and require a minimum investment of ₹10 lakh. Please read all official scheme documents carefully before subscribing. Dates and terms are subject to change by the AMC without prior notice — confirm directly with the fund house before applying.
        </div>
      </main>

      {/* Comparison and Subscription Toast indicators */}
      {comparedSlugs.length > 0 && (
        <div className="nfo-toast">
          {comparedSlugs.length} fund{comparedSlugs.length > 1 ? "s" : ""} selected for comparison.
        </div>
      )}
      {subscriptionSuccess && (
        <div className="nfo-toast" style={{ borderLeftColor: "#1a9e60" }}>
          ✓ Subscribed! You will receive alerts when new SIF NFOs open.
        </div>
      )}
    </div>
  );
}
