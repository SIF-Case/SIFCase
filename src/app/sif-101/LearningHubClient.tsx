"use client";

import { useState, useEffect } from "react";

const TOPICS = [
  {
    id: "what-is-a-sif",
    title: "What is a SIF?",
    description:
      "Understand the structure, mandate, and SEBI framework behind Specialised Investment Funds.",
    duration: 4,
    level: "Beginner" as const,
    iconBg: "#E8F5F0",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M10 5.83334V17.5" stroke="black" strokeWidth="0.887" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.5 15C2.279 15 2.067 14.912 1.911 14.756C1.755 14.6 1.667 14.388 1.667 14.167V3.333C1.667 3.112 1.755 2.9 1.911 2.744C2.067 2.588 2.279 2.5 2.5 2.5H6.667C7.551 2.5 8.399 2.851 9.024 3.476C9.649 4.101 10 4.949 10 5.833C10 4.949 10.352 4.101 10.977 3.476C11.602 2.851 12.45 2.5 13.334 2.5H17.5C17.721 2.5 17.933 2.588 18.09 2.744C18.246 2.9 18.334 3.112 18.334 3.333V14.167C18.334 14.388 18.246 14.6 18.09 14.756C17.933 14.912 17.721 15 17.5 15H12.5C11.837 15 11.201 15.263 10.733 15.732C10.264 16.201 10 16.837 10 17.5C10 16.837 9.737 16.201 9.268 15.732C8.799 15.263 8.163 15 7.5 15H2.5Z" stroke="black" strokeWidth="0.887" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "products-strategies",
    title: "Products & strategies",
    description:
      "Long-short equity, multi-asset, arbitrage — what each SIF strategy type actually does.",
    duration: 6,
    level: "Beginner" as const,
    iconBg: "#E8F5F0",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 18C15.314 18 18 15.314 18 12C18 8.686 15.314 6 12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 14C13.105 14 14 13.105 14 12C14 10.895 13.105 10 12 10C10.895 10 10 10.895 10 12C10 13.105 10.895 14 12 14Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "how-sifs-work",
    title: "How SIFs work",
    description:
      "Mechanics of daily NAV, portfolio disclosure, and what makes SIFs operationally distinct from MFs.",
    duration: 5,
    level: "Beginner" as const,
    iconBg: "#E8F5F0",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M10 5.833V17.5" stroke="black" strokeWidth="0.887" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.5 15C2.279 15 2.067 14.912 1.911 14.756C1.755 14.6 1.667 14.388 1.667 14.167V3.333C1.667 3.112 1.755 2.9 1.911 2.744C2.067 2.588 2.279 2.5 2.5 2.5H6.667C7.551 2.5 8.399 2.851 9.024 3.476C9.649 4.101 10 4.949 10 5.833C10 4.949 10.352 4.101 10.977 3.476C11.602 2.851 12.45 2.5 13.334 2.5H17.5C17.721 2.5 17.933 2.588 18.09 2.744C18.246 2.9 18.334 3.112 18.334 3.333V14.167C18.334 14.388 18.246 14.6 18.09 14.756C17.933 14.912 17.721 15 17.5 15H12.5C11.837 15 11.201 15.263 10.733 15.732C10.264 16.201 10 16.837 10 17.5C10 16.837 9.737 16.201 9.268 15.732C8.799 15.263 8.163 15 7.5 15H2.5Z" stroke="black" strokeWidth="0.887" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "categorisation",
    title: "Categorisation",
    description:
      "The 5 SEBI categories of SIFs — equity, debt, hybrid, real estate, and commodity strategies.",
    duration: 5,
    level: "Intermediate" as const,
    iconBg: "#FFF3E0",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M15 3.75C15.398 3.75 15.779 3.908 16.061 4.189C16.342 4.471 16.5 4.852 16.5 5.25V10.5C16.5 10.898 16.342 11.279 16.061 11.561C15.779 11.842 15.398 12 15 12H6.75C6.352 12 5.971 11.842 5.689 11.561C5.408 11.279 5.25 10.898 5.25 10.5V3.75C5.25 3.352 5.408 2.971 5.689 2.689C5.971 2.408 6.352 2.25 6.75 2.25H8.625C8.8 2.25 8.972 2.291 9.128 2.369C9.284 2.447 9.42 2.56 9.525 2.7L9.975 3.3C10.08 3.44 10.216 3.553 10.372 3.631C10.528 3.709 10.7 3.75 10.875 3.75H15Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.25 6.201C2.021 6.333 1.832 6.523 1.7 6.752C1.568 6.981 1.499 7.24 1.5 7.504V14.25C1.5 14.648 1.658 15.029 1.939 15.311C2.221 15.592 2.602 15.75 3 15.75H11.25C11.513 15.75 11.772 15.681 12 15.549C12.228 15.417 12.417 15.228 12.549 15" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "risk-risk-band",
    title: "Risk & Risk Band",
    description:
      "How the SEBI 1–6 Risk Band is computed, what each level means, and how to use it when comparing funds.",
    duration: 4,
    level: "Core" as const,
    iconBg: "#EEF2FF",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M15 9.75C15 13.5 12.375 15.375 9.255 16.463C9.092 16.518 8.914 16.515 8.753 16.455C5.625 15.375 3 13.5 3 9.75V4.5C3 4.301 3.079 4.11 3.22 3.97C3.36 3.829 3.551 3.75 3.75 3.75C5.25 3.75 7.125 2.85 8.43 1.71C8.589 1.574 8.791 1.5 9 1.5C9.209 1.5 9.411 1.574 9.57 1.71C10.883 2.857 12.75 3.75 14.25 3.75C14.449 3.75 14.64 3.829 14.78 3.97C14.921 4.11 15 4.301 15 4.5V9.75Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.75 9H11.25" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 6.75V11.25" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "regulatory-framework",
    title: "Regulatory framework",
    description:
      "SEBI circular, AMC eligibility, investment manager norms, and ongoing compliance obligations.",
    duration: 7,
    level: "Intermediate" as const,
    iconBg: "#FFF3E0",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M8.25 12.75L9.75 14.25C10.073 14.573 10.474 14.716 10.875 14.716C11.276 14.716 11.677 14.573 12 14.25C12.323 13.927 12.466 13.526 12.466 13.125C12.466 12.724 12.323 12.323 12 12" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 10.5L12.375 12.375C12.674 12.673 13.078 12.841 13.5 12.841C13.922 12.841 14.327 12.673 14.625 12.375C14.924 12.076 15.091 11.672 15.091 11.25C15.091 10.828 14.924 10.423 14.625 10.125L11.715 7.215C11.293 6.793 10.721 6.557 10.125 6.557C9.529 6.557 8.957 6.793 8.535 7.215L7.875 7.875C7.577 8.173 7.172 8.341 6.75 8.341C6.328 8.341 5.924 8.173 5.625 7.875C5.327 7.576 5.159 7.172 5.159 6.75C5.159 6.328 5.327 5.923 5.625 5.625L7.733 3.517C8.417 2.835 9.309 2.4 10.268 2.282C11.227 2.164 12.198 2.369 13.028 2.865L13.38 3.075C13.7 3.267 14.079 3.334 14.445 3.262L15.75 3" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.75 2.25L16.5 10.5H15" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.25 2.25L1.5 10.5L6.375 15.375C6.673 15.673 7.078 15.841 7.5 15.841C7.922 15.841 8.327 15.673 8.625 15.375C8.923 15.077 9.091 14.672 9.091 14.25C9.091 13.828 8.923 13.423 8.625 13.125" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.25 3H8.25" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "taxation-of-sifs",
    title: "Taxation of SIFs",
    description:
      "Short-term vs long-term gains, pass-through taxation, and how SIF distributions are treated under Indian tax law.",
    duration: 6,
    level: "Intermediate" as const,
    iconBg: "#FFF3E0",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M8.25 11.25H9.75C10.148 11.25 10.529 11.092 10.811 10.811C11.092 10.529 11.25 10.148 11.25 9.75C11.25 9.352 11.092 8.971 10.811 8.689C10.529 8.408 10.148 8.25 9.75 8.25H7.5C7.05 8.25 6.675 8.4 6.45 8.7L2.25 12.75" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.25 15.75L6.45 14.7C6.675 14.4 7.05 14.25 7.5 14.25H10.5C11.325 14.25 12.075 13.95 12.6 13.35L16.05 10.05C16.339 9.777 16.508 9.399 16.52 9.001C16.531 8.603 16.384 8.217 16.11 7.928C15.837 7.638 15.459 7.469 15.061 7.458C14.663 7.447 14.277 7.594 13.988 7.868L10.838 10.793" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1.5 12L6 16.5" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 8.925C13.201 8.925 14.175 7.951 14.175 6.75C14.175 5.549 13.201 4.575 12 4.575C10.799 4.575 9.825 5.549 9.825 6.75C9.825 7.951 10.799 8.925 12 8.925Z" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 6C5.743 6 6.75 4.993 6.75 3.75C6.75 2.507 5.743 1.5 4.5 1.5C3.257 1.5 2.25 2.507 2.25 3.75C2.25 4.993 3.257 6 4.5 6Z" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "sif-vs-mf-vs-pms",
    title: "SIF vs MF vs PMS",
    description:
      "A direct comparison of fees, liquidity, disclosures, and strategy flexibility across the three structures.",
    duration: 5,
    level: "Core" as const,
    iconBg: "#EEF2FF",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M9 2.25V15.75" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.25 6L16.5 12C15.851 12.487 15.061 12.75 14.25 12.75C13.439 12.75 12.649 12.487 12 12L14.25 6ZM14.25 6V5.25" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.25 5.25H3C5.093 5.25 7.153 4.735 9 3.75C10.847 4.735 12.907 5.25 15 5.25H15.75" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.75 6L6 12C5.351 12.487 4.561 12.75 3.75 12.75C2.939 12.75 2.149 12.487 1.5 12L3.75 6ZM3.75 6V5.25" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.25 15.75H12.75" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "ten-lakh-minimum",
    title: "The ₹10 lakh minimum",
    description:
      "Why SEBI set a ₹10 lakh entry ticket, who qualifies as an eligible investor, and what changes for NRIs.",
    duration: 4,
    level: "Core" as const,
    iconBg: "#EEF2FF",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
        <path d="M4.5 2.25H13.5" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 6H13.5" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 9.75L10.875 15.75" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 9.75H6.75" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.75 9.75C11.75 9.75 11.75 2.25 6.75 2.25" stroke="black" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const LEVEL_STYLES: Record<string, { bg: string; color: string }> = {
  Beginner:     { bg: "#E8F5F0", color: "#1A7A4A" },
  Intermediate: { bg: "#FFF3E0", color: "#B8600B" },
  Core:         { bg: "#EEF2FF", color: "#3730A3" },
};

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

export function LearningHubClient() {
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
  const totalCount = TOPICS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const nextTopic = TOPICS.find((t) => !completed.has(t.id));

  let progressTitle = "Get started";
  let progressMsg = "Start your learning journey — click any topic card below.";
  if (completedCount > 0 && completedCount < totalCount) {
    progressTitle = "Good progress — keep going";
    progressMsg = `You've completed ${completedCount} of ${totalCount} topics. Next up: ${nextTopic?.title}.`;
  } else if (completedCount === totalCount) {
    progressTitle = "Learning path complete!";
    progressMsg = "You've completed all 9 topics. Great work!";
  }

  if (!hydrated) {
    return (
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
              Build confidence before you invest. Bite-sized articles across products, mechanics, risk, regulation and tax.
            </p>
          </div>
        </div>
      </div>
    );
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
              {TOPICS.map((topic) => {
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
                    <a
                      href={`/sif-101/${topic.id}`}
                      className={`hub-sidebar-label${isDone ? " label-done" : isCurrent ? " label-current" : ""}`}
                      style={{ textDecoration: "none" }}
                    >
                      {topic.title}
                    </a>
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

          {/* Topics grid */}
          <div className="hub-topics-section">
            <p className="hub-topics-label">All topics</p>
            <div className="hub-topics-grid">
              {TOPICS.map((topic) => {
                const isDone = completed.has(topic.id);
                const lvl = LEVEL_STYLES[topic.level];
                return (
                  <a
                    key={topic.id}
                    href={`/sif-101/${topic.id}`}
                    className={`hub-topic-card${isDone ? " topic-card-done" : ""}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div className="hub-topic-icon" style={{ background: topic.iconBg }}>
                      {topic.icon}
                    </div>
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
                  </a>
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
              <a href="/sifs" className="hub-cta-primary">Explore Funds →</a>
              <a href="/sifs" className="hub-cta-secondary">Find my Ideal SIF</a>
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
