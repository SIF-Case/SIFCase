"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export type SifEducationArticle = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  readTime: number;
  coverDesktop: string;
  coverMobile: string;
  publishedAt: string | null;
};

/* ── Icon used for every article card ───────────────────────────────────── */
function ArticleIcon({ bg }: { bg: string }) {
  return (
    <div className="hub-topic-icon" style={{ background: bg }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M10 5.83334V17.5" stroke="black" strokeWidth="0.887" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.5 15C2.279 15 2.067 14.912 1.911 14.756C1.755 14.6 1.667 14.388 1.667 14.167V3.333C1.667 3.112 1.755 2.9 1.911 2.744C2.067 2.588 2.279 2.5 2.5 2.5H6.667C7.551 2.5 8.399 2.851 9.024 3.476C9.649 4.101 10 4.949 10 5.833C10 4.949 10.352 4.101 10.977 3.476C11.602 2.851 12.45 2.5 13.334 2.5H17.5C17.721 2.5 17.933 2.588 18.09 2.744C18.246 2.9 18.334 3.112 18.334 3.333V14.167C18.334 14.388 18.246 14.6 18.09 14.756C17.933 14.912 17.721 15 17.5 15H12.5C11.837 15 11.201 15.263 10.733 15.732C10.264 16.201 10 16.837 10 17.5C10 16.837 9.737 16.201 9.268 15.732C8.799 15.263 8.163 15 7.5 15H2.5Z" stroke="black" strokeWidth="0.887" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ── Level styling ───────────────────────────────────────────────────────── */
const LEVEL_STYLES: Record<string, { bg: string; color: string }> = {
  Beginner:     { bg: "#E8F5F0", color: "#1A7A4A" },
  Intermediate: { bg: "#FFF3E0", color: "#B8600B" },
  Core:         { bg: "#EEF2FF", color: "#3730A3" },
};

const LEVEL_CYCLE: Array<"Beginner" | "Intermediate" | "Core"> = [
  "Beginner", "Intermediate", "Core", "Beginner",
];
const ICON_BG_CYCLE = ["#E8F5F0", "#FFF3E0", "#EEF2FF", "#E8F5F0"];

const STORAGE_KEY = "sif101_completed";

function CheckIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 5L4 7.5L8.5 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
      <path d="M7.5 1.5H10.5" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10.5L11.25 8.25" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 16.5C12.314 16.5 15 13.814 15 10.5C15 7.186 12.314 4.5 9 4.5C5.686 4.5 3 7.186 3 10.5C3 13.814 5.686 16.5 9 16.5Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LearningHubClient({ sifEducationArticles = [] }: { sifEducationArticles?: SifEducationArticle[] }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompleted(new Set(JSON.parse(saved)));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  /* Derive topics from DB articles — same shape the UI expects */
  const topics = sifEducationArticles.map((article, i) => ({
    id: article.slug,           // used as the localStorage key
    slug: article.slug,
    title: article.title,
    description: article.excerpt,
    duration: article.readTime,
    level: LEVEL_CYCLE[i % LEVEL_CYCLE.length],
    iconBg: ICON_BG_CYCLE[i % ICON_BG_CYCLE.length],
    href: `/sif-101/${article.slug}`,
  }));

  function toggleTopic(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const completedCount = completed.size;
  const totalCount = topics.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextTopic = topics.find((t) => !completed.has(t.id));

  let progressTitle = "Get started";
  let progressMsg = "Start your learning journey — click any topic card below.";
  if (completedCount > 0 && completedCount < totalCount) {
    progressTitle = "Good progress — keep going";
    progressMsg = `You've completed ${completedCount} of ${totalCount} topics. Next up: ${nextTopic?.title}.`;
  } else if (totalCount > 0 && completedCount === totalCount) {
    progressTitle = "Learning path complete!";
    progressMsg = `You've completed all ${totalCount} topics. Great work!`;
  }

  return (
    <>
      {/* Page header */}
      <div className="hub-page-header">
        <div className="hub-header-inner">
          <div className="hub-header-content">
            <div className="hub-breadcrumb">
              <span className="hub-breadcrumb-link">SIF 101</span>
              <span className="hub-breadcrumb-sep">›</span>
              <span className="hub-breadcrumb-link">Learning Hub</span>
            </div>
            <h1 className="hub-heading">Your Learning Hub</h1>
            <p className="hub-subheading">
              Build confidence before you invest. Bite-sized articles across products,
              mechanics, risk, regulation and tax.
            </p>
          </div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="hub-main">
        {/* Sticky sidebar */}
        <aside className="hub-sidebar">
          <div className="hub-sidebar-card">
            <div className="hub-sidebar-header">
              <span className="hub-sidebar-title">Learning path</span>
              <span className="hub-sidebar-count">{completedCount} / {totalCount}</span>
            </div>
            <div className="hub-sidebar-list">
              {topics.map((topic) => {
                const isDone = completed.has(topic.id);
                const isCurrent = !isDone && topic.id === nextTopic?.id;
                return (
                  <div
                    key={topic.id}
                    className={`hub-sidebar-item${isDone ? " is-done" : isCurrent ? " is-current" : ""}`}
                  >
                    <button
                      className={`hub-bullet${isDone ? " bullet-done" : isCurrent ? " bullet-current" : " bullet-pending"}`}
                      onClick={() => toggleTopic(topic.id)}
                      title={isDone ? "Click to undo" : "Mark as complete"}
                      style={{ border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {isDone && <CheckIcon />}
                    </button>
                    <Link
                      href={topic.href}
                      className={`hub-sidebar-label${isDone ? " label-done" : isCurrent ? " label-current" : ""}`}
                      style={{ textDecoration: "none" }}
                    >
                      {topic.title}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Scrollable right content */}
        <div className="hub-content">
          {/* Progress banner */}
          <div className="hub-progress-banner">
            <div className="hub-progress-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18.333C14.602 18.333 18.333 14.602 18.333 10C18.333 5.398 14.602 1.667 10 1.667C5.398 1.667 1.667 5.398 1.667 10C1.667 14.602 5.398 18.333 10 18.333Z" stroke="#333" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 15C12.761 15 15 12.761 15 10C15 7.239 12.761 5 10 5C7.239 5 5 7.239 5 10C5 12.761 7.239 15 10 15Z" stroke="#333" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 11.667C10.92 11.667 11.667 10.92 11.667 10C11.667 9.08 10.92 8.333 10 8.333C9.08 8.333 8.333 9.08 8.333 10C8.333 10.92 9.08 11.667 10 11.667Z" stroke="#333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="hub-progress-text">
              <strong className="hub-progress-title">{progressTitle}</strong>
              <p className="hub-progress-sub">{progressMsg}</p>
            </div>
            <div className="hub-progress-right">
              <div className="hub-progress-stat">
                <span className="hub-progress-stat-label">Your path</span>
                <span className="hub-progress-stat-value">{completedCount} of {totalCount} complete</span>
              </div>
              <div className="hub-progress-bar-track">
                <div className="hub-progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="hub-progress-pct">{progressPct}% complete</span>
            </div>
          </div>

          {/* Topics grid — now driven by DB articles */}
          <div className="hub-topics-section">
            <p className="hub-topics-label">All topics</p>
            <div className="hub-topics-grid">
              {topics.length === 0 ? (
                <p style={{ color: "#6B7685", fontSize: 14, gridColumn: "1 / -1" }}>No articles published yet.</p>
              ) : topics.map((topic) => {
                const isDone = completed.has(topic.id);
                const lvl = LEVEL_STYLES[topic.level];
                return (
                  <Link
                    key={topic.id}
                    href={topic.href}
                    className={`hub-topic-card${isDone ? " topic-card-done" : ""}`}
                    style={{ textDecoration: "none" }}
                  >
                    <ArticleIcon bg={topic.iconBg} />
                    <div className="hub-topic-title-row">
                      <h3 className="hub-topic-title">{topic.title}</h3>
                      {isDone && (
                        <div className="hub-done-badge">
                          <CheckIcon size={9} />
                        </div>
                      )}
                    </div>
                    <p className="hub-topic-desc">{topic.description}</p>
                    <div className="hub-topic-footer">
                      <div className="hub-topic-duration">
                        <ClockIcon />
                        <span>{topic.duration} min</span>
                      </div>
                      <span className="hub-topic-level" style={{ background: lvl.bg, color: lvl.color }}>
                        {topic.level}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* CTA banner */}
          <div className="hub-cta-banner">
            <div className="hub-cta-text">
              <span className="hub-cta-eyebrow">Ready to invest?</span>
              <h2 className="hub-cta-heading">Feeling ready? Dive into the funds.</h2>
              <p className="hub-cta-sub">You&apos;ve covered the basics — explore strategies that fit your goals.</p>
            </div>
            <div className="hub-cta-actions">
              <Link href="/sifs" className="hub-cta-primary">Explore Funds →</Link>
              <Link href="/sifs" className="hub-cta-secondary">Find my Ideal SIF</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Page header ─────────────────────────────── */
        .hub-page-header {
          background: #004C61;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .hub-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 36px 40px 32px;
        }
        .hub-header-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 560px;
        }
        .hub-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hub-breadcrumb-link {
          color: #2E9E94;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .hub-breadcrumb-sep {
          color: rgba(255,255,255,0.30);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .hub-heading {
          color: #fff;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 28px;
          font-weight: 500;
          line-height: 32.2px;
          letter-spacing: -0.5px;
          margin: 4px 0 0;
        }
        .hub-subheading {
          color: rgba(255,255,255,0.55);
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 14px;
          font-weight: 500;
          line-height: 22.4px;
          margin: 0;
        }

        /* ── Main two-column layout ──────────────────── */
        .hub-main {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 40px 64px;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── Sidebar ─────────────────────────────────── */
        .hub-sidebar {
          width: 252px;
          flex-shrink: 0;
          position: sticky;
          top: 72px;
          align-self: flex-start;
        }
        .hub-sidebar-card {
          border-radius: 12px;
          border: 1px solid #DDE3EA;
          background: #fff;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .hub-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px 14px;
          border-bottom: 1px solid #EEF1F5;
        }
        .hub-sidebar-title {
          color: #6B7685;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .hub-sidebar-count {
          color: #004C61;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 11px;
          font-weight: 600;
        }
        .hub-sidebar-list {
          display: flex;
          flex-direction: column;
          padding: 8px 0;
        }
        .hub-sidebar-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 18px;
          border: none;
          border-left: 2px solid transparent;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
          width: 100%;
        }
        .hub-sidebar-item:hover { background: rgba(46,158,148,0.06); }
        .hub-sidebar-item.is-current {
          border-left-color: #004C61;
          background: rgba(46,158,148,0.12);
        }

        .hub-bullet {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bullet-done    { background: #004C61; }
        .bullet-current { border: 1px solid #004C61; background: rgba(46,158,148,0.12); }
        .bullet-pending { border: 1px solid #DDE3EA; }

        .hub-sidebar-label {
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 13px;
          font-weight: 500;
          line-height: 20.8px;
          color: #3D4B5C;
        }
        .hub-sidebar-label.label-done {
          color: #6B7685;
        }
        .hub-sidebar-label.label-current { color: #004C61; }

        /* ── Right content ───────────────────────────── */
        .hub-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Progress banner */
        .hub-progress-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #DDE3EA;
          background: #fff;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.06);
          flex-wrap: wrap;
        }
        .hub-progress-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hub-progress-text { flex: 1; min-width: 180px; }
        .hub-progress-title {
          display: block;
          color: #1B2A3B;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 13px;
          font-weight: 700;
          line-height: 20.8px;
        }
        .hub-progress-sub {
          color: #6B7685;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 12px;
          font-weight: 500;
          line-height: 19.2px;
          margin: 0;
        }
        .hub-progress-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          min-width: 200px;
        }
        .hub-progress-stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hub-progress-stat-label,
        .hub-progress-stat-value {
          color: #2E9E94;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 11px;
          font-weight: 700;
        }
        .hub-progress-bar-track {
          width: 100%;
          height: 6px;
          border-radius: 4px;
          background: #C8E6C9;
          overflow: hidden;
        }
        .hub-progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          background: #14B7A3;
          transition: width 0.4s ease;
        }
        .hub-progress-pct {
          color: #2E9E94;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 11px;
          font-weight: 500;
          align-self: flex-end;
        }

        /* Topics */
        .hub-topics-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .hub-topics-label {
          color: #6B7685;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin: 0;
        }
        .hub-topics-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .hub-topic-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 18px;
          border-radius: 12px;
          border: 1px solid #DDE3EA;
          background: #fff;
          cursor: pointer;
          text-align: left;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .hub-topic-card:hover {
          box-shadow: 0 4px 16px rgba(0,76,97,0.10);
          border-color: #b8c7d6;
        }
        .hub-topic-card.topic-card-done {
          background: #f6fffe;
          border-color: #a8d8d4;
        }
        .hub-topic-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-bottom: 14px;
        }
        .hub-topic-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          margin-bottom: 6px;
        }
        .hub-topic-title {
          color: #1B2A3B;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 14px;
          font-weight: 700;
          line-height: 18.9px;
          margin: 0;
          flex: 1;
          text-align: left;
        }
        .hub-done-badge {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #004C61;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hub-topic-desc {
          color: #6B7685;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 12px;
          font-weight: 500;
          line-height: 18.6px;
          margin: 0 0 14px;
          flex: 1;
          text-align: left;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hub-topic-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 8px;
        }
        .hub-topic-duration {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #6B7A8D;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 400;
        }
        .hub-topic-level {
          padding: 3px 9px;
          border-radius: 4px;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        /* CTA banner */
        .hub-cta-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 26px 30px;
          border-radius: 12px;
          background: #004C61;
          flex-wrap: wrap;
        }
        .hub-cta-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hub-cta-eyebrow {
          color: rgba(255,255,255,0.50);
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }
        .hub-cta-heading {
          color: #fff;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 18px;
          font-weight: 700;
          line-height: 23.4px;
          margin: 2px 0 0;
        }
        .hub-cta-sub {
          color: rgba(255,255,255,0.80);
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 13px;
          font-weight: 500;
          line-height: 19.5px;
          margin: 0;
        }
        .hub-cta-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .hub-cta-primary {
          display: inline-flex;
          padding: 10px 22px;
          border-radius: 12px;
          background: #fff;
          color: #004C61;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: opacity 0.15s;
        }
        .hub-cta-primary:hover { opacity: 0.9; }
        .hub-cta-secondary {
          display: inline-flex;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.20);
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.85);
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .hub-cta-secondary:hover { background: rgba(255,255,255,0.18); }

        /* ── Responsive ──────────────────────────────── */
        @media (max-width: 1024px) {
          .hub-topics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 860px) {
          .hub-main { flex-direction: column; padding: 24px 16px 48px; }
          .hub-sidebar { width: 100%; position: static; }
          .hub-header-inner { padding: 28px 16px 24px; }
          .hub-progress-right { min-width: 100%; align-items: flex-start; }
          .hub-progress-bar-track { width: 160px; }
        }
        @media (max-width: 540px) {
          .hub-topics-grid { grid-template-columns: 1fr; }
          .hub-cta-banner { flex-direction: column; align-items: flex-start; }
          .hub-cta-actions { width: 100%; }
        }
      `}</style>
    </>
  );
}
