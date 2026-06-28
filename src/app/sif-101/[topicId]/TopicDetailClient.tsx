"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TOPICS, STORAGE_KEY } from "../topicsData";

// ─── Shared icons ────────────────────────────────────────────────────────────

function CheckIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path d="M1.5 5L4 7.5L8.5 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2.167 7.583c-.103.001-.203-.029-.287-.083-.087-.055-.156-.133-.201-.225-.044-.092-.061-.196-.049-.297.012-.102.053-.198.117-.278L7.107 1.175a.213.213 0 01.155-.087.213.213 0 01.166.077c.054.029.097.075.121.131a.213.213 0 01.014.31L6.532 4.685a.548.548 0 00.049.842.548.548 0 00.51.07l3.792-.001c.103 0 .203.029.287.083.087.055.156.133.201.225.044.092.061.196.049.297-.012.102-.053.198-.117.278L5.893 11.825a.213.213 0 01-.155.087.213.213 0 01-.166-.077.213.213 0 01-.057-.155.213.213 0 01.042-.145l1.04-3.261a.548.548 0 00-.049-.842.548.548 0 00-.51-.07H2.167z" stroke="#0A6060" strokeWidth="1.083" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 14.667A6.667 6.667 0 108 1.333a6.667 6.667 0 000 13.334z" stroke="#B87F00" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10.667V8M8 5.333h.007" stroke="#B87F00" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.917 7h8.166M7 2.917L11.083 7 7 11.083" stroke="white" strokeWidth="1.167" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M11.083 7H2.917M7 11.083L2.917 7 7 2.917" stroke="#6B7685" strokeWidth="1.167" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Topic content definitions ─────────────────────────────────────────────

interface TocSection {
  id: string;
  label: string;
}

interface TopicContent {
  sections: TocSection[];
  relatedArticles: { title: string; href: string }[];
}

const TOPIC_META: { [key: string]: TopicContent | undefined } = {
  "what-is-a-sif": {
    sections: [
      { id: "what-is-a-sif-intro", label: "What is a SIF?" },
      { id: "how-it-differs", label: "How it differs" },
      { id: "whos-for", label: "Who it's for" },
      { id: "investment-strategies", label: "Investment strategies" },
      { id: "amc-eligibility", label: "AMC eligibility" },
      { id: "key-takeaways", label: "Key takeaways" },
    ],
    relatedArticles: [
      { title: "Understanding the Risk Band 1–5", href: "#" },
      { title: "SIF vs PMS vs Mutual Funds", href: "#" },
      { title: "Who qualifies as an accredited investor?", href: "#" },
      { title: "How NAV is calculated in a SIF", href: "#" },
    ],
  },
  "products-strategies": {
    sections: [
      { id: "overview", label: "Overview" },
      { id: "equity-strategies", label: "Equity strategies" },
      { id: "debt-strategies", label: "Debt strategies" },
      { id: "hybrid-strategies", label: "Hybrid strategies" },
      { id: "key-takeaways", label: "Key takeaways" },
    ],
    relatedArticles: [
      { title: "What is a SIF?", href: "/sif-101/what-is-a-sif" },
      { title: "How SIFs work", href: "/sif-101/how-sifs-work" },
      { title: "SIF vs MF vs PMS", href: "/sif-101/sif-vs-mf-vs-pms" },
    ],
  },
  "how-sifs-work": {
    sections: [
      { id: "overview", label: "Overview" },
      { id: "nav-mechanics", label: "NAV mechanics" },
      { id: "portfolio-disclosure", label: "Portfolio disclosure" },
      { id: "redemption", label: "Redemption process" },
      { id: "key-takeaways", label: "Key takeaways" },
    ],
    relatedArticles: [
      { title: "What is a SIF?", href: "/sif-101/what-is-a-sif" },
      { title: "Regulatory framework", href: "/sif-101/regulatory-framework" },
    ],
  },
  "categorisation": {
    sections: [
      { id: "overview", label: "Overview" },
      { id: "equity-sifs", label: "Equity SIFs" },
      { id: "debt-sifs", label: "Debt SIFs" },
      { id: "hybrid-sifs", label: "Hybrid SIFs" },
      { id: "key-takeaways", label: "Key takeaways" },
    ],
    relatedArticles: [
      { title: "Products & strategies", href: "/sif-101/products-strategies" },
      { title: "Risk & Risk Band", href: "/sif-101/risk-risk-band" },
    ],
  },
  "risk-risk-band": {
    sections: [
      { id: "overview", label: "Overview" },
      { id: "risk-band-levels", label: "Risk Band levels" },
      { id: "how-computed", label: "How it's computed" },
      { id: "using-risk-band", label: "Using the Risk Band" },
      { id: "key-takeaways", label: "Key takeaways" },
    ],
    relatedArticles: [
      { title: "Categorisation", href: "/sif-101/categorisation" },
      { title: "SIF vs MF vs PMS", href: "/sif-101/sif-vs-mf-vs-pms" },
    ],
  },
  "regulatory-framework": {
    sections: [
      { id: "overview", label: "Overview" },
      { id: "sebi-circular", label: "SEBI circular" },
      { id: "amc-eligibility", label: "AMC eligibility" },
      { id: "compliance", label: "Ongoing compliance" },
      { id: "key-takeaways", label: "Key takeaways" },
    ],
    relatedArticles: [
      { title: "What is a SIF?", href: "/sif-101/what-is-a-sif" },
      { title: "Taxation of SIFs", href: "/sif-101/taxation-of-sifs" },
    ],
  },
  "taxation-of-sifs": {
    sections: [
      { id: "overview", label: "Overview" },
      { id: "stcg-ltcg", label: "STCG vs LTCG" },
      { id: "pass-through", label: "Pass-through taxation" },
      { id: "distributions", label: "Distributions" },
      { id: "key-takeaways", label: "Key takeaways" },
    ],
    relatedArticles: [
      { title: "Regulatory framework", href: "/sif-101/regulatory-framework" },
      { title: "The ₹10 lakh minimum", href: "/sif-101/ten-lakh-minimum" },
    ],
  },
  "sif-vs-mf-vs-pms": {
    sections: [
      { id: "overview", label: "Overview" },
      { id: "fees", label: "Fees & costs" },
      { id: "liquidity", label: "Liquidity" },
      { id: "disclosure", label: "Disclosures" },
      { id: "key-takeaways", label: "Key takeaways" },
    ],
    relatedArticles: [
      { title: "What is a SIF?", href: "/sif-101/what-is-a-sif" },
      { title: "The ₹10 lakh minimum", href: "/sif-101/ten-lakh-minimum" },
    ],
  },
  "ten-lakh-minimum": {
    sections: [
      { id: "overview", label: "Overview" },
      { id: "why-10-lakh", label: "Why ₹10 lakh?" },
      { id: "eligible-investor", label: "Eligible investors" },
      { id: "nri-rules", label: "NRI considerations" },
      { id: "key-takeaways", label: "Key takeaways" },
    ],
    relatedArticles: [
      { title: "What is a SIF?", href: "/sif-101/what-is-a-sif" },
      { title: "Regulatory framework", href: "/sif-101/regulatory-framework" },
    ],
  },
};

// ─── Article content renderers ────────────────────────────────────────────

function WhatIsASifContent() {
  return (
    <>
      <section id="what-is-a-sif-intro">
        <p className="article-intro">
          A <strong>Specialised Investment Fund (SIF)</strong> is a new investment category introduced by the Securities and Exchange Board of India (SEBI), effective from <strong>April 1, 2025</strong>. It is designed to bridge the gap between traditional mutual funds and Portfolio Management Services (PMS).
        </p>
        <p className="article-body">
          Before 2025, if you wanted hedge-fund-style strategies — like long-short equity or sector rotation — you needed ₹50 lakh for PMS or ₹1 crore for AIFs. SIFs change this entirely, bringing institutional-grade flexibility to investors with a ₹10 lakh entry point.
        </p>
        <div className="article-key-takeaway">
          <div className="key-takeaway-header">
            <BoltIcon />
            <span className="key-takeaway-label">Key takeaway</span>
          </div>
          <p className="key-takeaway-body">
            A SIF sits between mutual funds and PMS/AIF: it allows more flexible, sophisticated strategies, carries a Risk Band of 1–5, and requires a minimum investment of ₹10 lakh per investor.
          </p>
        </div>
      </section>

      <section id="how-it-differs">
        <h2 className="article-h2">How it differs from a mutual fund</h2>
        <p className="article-body">
          While mutual funds are designed for retail investors with relatively standard investment strategies, SIFs allow AMCs to run more sophisticated, strategy-focused schemes. The key distinctions are:
        </p>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th className="col-feature">Feature</th>
                <th>Mutual Fund</th>
                <th className="col-sif">SIF</th>
                <th>PMS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Min. investment</td>
                <td>₹500</td>
                <td className="cell-sif">₹10 lakh</td>
                <td>₹50 lakh</td>
              </tr>
              <tr>
                <td>Strategy type</td>
                <td>Long-only</td>
                <td className="cell-sif">Long-short, active</td>
                <td>Customised</td>
              </tr>
              <tr>
                <td>Short positions</td>
                <td>Not permitted</td>
                <td className="cell-sif">Up to 25% unhedged</td>
                <td>Permitted</td>
              </tr>
              <tr>
                <td>Single stock limit</td>
                <td>10% of NAV</td>
                <td className="cell-sif">15% of NAV</td>
                <td>Flexible</td>
              </tr>
              <tr>
                <td>Regulatory oversight</td>
                <td>SEBI (MF Regs)</td>
                <td className="cell-sif">SEBI (MF Regs)</td>
                <td>SEBI (PMS Regs)</td>
              </tr>
              <tr>
                <td>Redemption</td>
                <td>T+2 days</td>
                <td className="cell-sif">Up to 15 working days</td>
                <td>Flexible</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="whos-for">
        <h2 className="article-h2">Who it&apos;s for</h2>
        <p className="article-body">
          SIFs are best suited for investors who are comfortable with moderately complex financial products and can meet the minimum investment threshold. They are not designed for first-time or retail investors.
        </p>
        <div className="investor-grid">
          <div className="investor-card">
            <div className="investor-icon" style={{ background: "#EAFAFA" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10.667 4.667H14.667V8.667" stroke="#0A6060" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14.667 4.667L9 10.333 5.667 7 1.333 11.333" stroke="#0A6060" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="investor-card-title">Experienced investors</h3>
            <p className="investor-card-desc">Those familiar with equity markets and comfortable navigating moderate-to-high risk investments.</p>
          </div>
          <div className="investor-card">
            <div className="investor-icon" style={{ background: "#FDF6E3" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6.667 12V7.333M7.413 1.47c.183-.09.384-.136.587-.136.204 0 .405.046.587.136l5.227 2.564a.333.333 0 010 .6H2.333a.333.333 0 010-.6L7.413 1.47zM9.333 12V7.333M12 12V7.333M2 14.667h12M4 12V7.333" stroke="#9A6800" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="investor-card-title">HNIs &amp; mass affluent</h3>
            <p className="investor-card-desc">Individuals with investable surplus of ₹10–30 lakh seeking beyond plain vanilla funds.</p>
          </div>
          <div className="investor-card">
            <div className="investor-icon" style={{ background: "#E8EEF4" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6.667 8H9.333M6.667 5.333H9.333M9.333 14v-2a1.333 1.333 0 00-2.666 0v2M4 6.667H2.667A1.333 1.333 0 001.333 8v4.667A1.333 1.333 0 002.667 14h10.666A1.333 1.333 0 0014.667 12.667V6A1.333 1.333 0 0013.333 4.667H12M4 14V3.333A1.333 1.333 0 015.333 2h5.334A1.333 1.333 0 0112 3.333V14" stroke="#0F2D3D" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="investor-card-title">Institutions</h3>
            <p className="investor-card-desc">Family offices and corporate treasuries seeking regulated, strategy-driven exposure.</p>
          </div>
          <div className="investor-card">
            <div className="investor-icon" style={{ background: "#EAFAFA" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.333 8.667C13.333 12 11 13.667 8.227 14.633a.667.667 0 01-.454-.007C5 13.667 2.667 12 2.667 8.667V4a.667.667 0 01.666-.667c1.334 0 3-.8 4.16-1.813a.667.667 0 01.874 0C9.533 2.54 11.2 3.333 12.533 3.333A.667.667 0 0113.2 4l.133 4.667zM6 8l1.333 1.333L10 6.667" stroke="#0A6060" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="investor-card-title">Accredited investors</h3>
            <p className="investor-card-desc">Qualified under SEBI&apos;s accredited investor framework and exempt from the ₹10L threshold.</p>
          </div>
        </div>
        <div className="article-info-box">
          <InfoIcon />
          <p className="info-box-text">
            <strong>Accredited investor:</strong> Individuals or entities qualifying as accredited investors are exempt from the ₹10 lakh minimum investment requirement in SIFs. Daily monitoring is required to ensure continued compliance.
          </p>
        </div>
      </section>

      <section id="investment-strategies">
        <h2 className="article-h2">Investment strategies permitted</h2>
        <p className="article-body">SEBI has approved a defined set of strategies under three broad categories:</p>

        <h3 className="article-h3">1. Equity-oriented SIFs</h3>
        <ul className="article-list">
          <li>Equity Long-Short Fund — minimum 80% in equities; up to 25% unhedged short positions via derivatives</li>
          <li>Equity Ex-Top 100 Long-Short — focuses on stocks outside the top 100 by market cap</li>
          <li>Sectoral Long-Short — sector-based positioning with at least two sectors, max 75% in one sector</li>
        </ul>

        <h3 className="article-h3">2. Debt-oriented SIFs</h3>
        <ul className="article-list">
          <li>Debt Long-Short Fund — investment across debt instruments of varied durations with short exposure</li>
          <li>Sectoral Debt Long-Short — across at least two sectors; max 75% in single sector; up to 25% short exposure</li>
        </ul>

        <h3 className="article-h3">3. Hybrid SIFs</h3>
        <ul className="article-list">
          <li>Active Asset Allocator Long-Short — dynamic investment across equity, debt, InvITs/REITs, and commodity derivatives; up to 25% short exposure</li>
          <li>Hybrid Long-Short Fund — minimum 25% in equity and 25% in debt; up to 25% short positions</li>
        </ul>
        <div className="article-divider" />
      </section>

      <section id="amc-eligibility">
        <h2 className="article-h2">Who can launch a SIF?</h2>
        <p className="article-body">
          SEBI has laid down strict eligibility criteria for Asset Management Companies to ensure funds are managed by experienced professionals.
        </p>
        <div className="amc-route-list">
          <div className="amc-route-item">
            <div className="amc-route-left">
              <div className="amc-route-badge">1</div>
              <div className="amc-route-line" />
            </div>
            <div className="amc-route-content">
              <strong className="amc-route-title">Route 1 — Sound track record</strong>
              <p className="amc-route-desc">AMC must have been operational for at least 3 years with an average AUM of ₹10,000 crore or more in the preceding three years.</p>
            </div>
          </div>
          <div className="amc-route-item">
            <div className="amc-route-left">
              <div className="amc-route-badge">2</div>
            </div>
            <div className="amc-route-content">
              <strong className="amc-route-title">Route 2 — Alternate route</strong>
              <p className="amc-route-desc">AMC must appoint a CIO with at least 10 years of fund management experience managing ≥₹5,000 crore AUM, plus a Fund Manager with 3+ years and ₹500 crore AUM.</p>
            </div>
          </div>
        </div>
        <div className="article-divider" />
      </section>

      <section id="key-takeaways">
        <h2 className="article-h2">Key takeaways</h2>
        <ul className="article-list">
          <li>SIFs are a new SEBI-regulated category effective April 1, 2025, sitting between mutual funds and PMS</li>
          <li>Minimum investment is ₹10 lakh per investor at PAN level across all SIF strategies within one AMC</li>
          <li>They permit unhedged short positions up to 25% of portfolio value using derivatives</li>
          <li>Higher single-stock allocation limit of 15% vs the 10% cap in traditional mutual funds</li>
          <li>Redemption can take up to 15 working days — less liquid than regular mutual funds</li>
          <li>Risk Band of 1–5 applies; SEBI mandates detailed disclosure and transparent risk labelling</li>
          <li>Accredited investors are exempt from the ₹10 lakh minimum threshold</li>
        </ul>
      </section>
    </>
  );
}

function GenericTopicContent({ topicId }: { topicId: string }) {
  const topic = TOPICS.find((t) => t.id === topicId);
  const meta = TOPIC_META[topicId];
  if (!topic || !meta) return null;

  return (
    <>
      {meta.sections.map((section, idx) => (
        <section key={section.id} id={section.id}>
          {idx === 0 ? (
            <>
              <p className="article-intro">{topic.description}</p>
              <div className="article-key-takeaway">
                <div className="key-takeaway-header">
                  <BoltIcon />
                  <span className="key-takeaway-label">Key takeaway</span>
                </div>
                <p className="key-takeaway-body">
                  This section covers the essential concepts of {topic.title.toLowerCase()} as defined by SEBI&apos;s Specialised Investment Fund framework.
                </p>
              </div>
            </>
          ) : section.id === "key-takeaways" ? (
            <>
              <h2 className="article-h2">Key takeaways</h2>
              <ul className="article-list">
                <li>This topic is an important part of the SIF 101 learning path.</li>
                <li>Review the SEBI circular for detailed regulatory specifics.</li>
                <li>Connect this knowledge with related topics in the learning path.</li>
              </ul>
            </>
          ) : (
            <>
              <h2 className="article-h2">{section.label}</h2>
              <p className="article-body">
                Content for this section is being prepared. Please check back soon or explore the related articles on the right.
              </p>
              <div className="article-divider" />
            </>
          )}
        </section>
      ))}
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function TopicDetailClient({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const articleRef = useRef<HTMLDivElement>(null);

  const topicIndex = TOPICS.findIndex((t) => t.id === topicId);
  const topic = TOPICS[topicIndex];
  const prevTopic = topicIndex > 0 ? TOPICS[topicIndex - 1] : null;
  const nextTopic = topicIndex < TOPICS.length - 1 ? TOPICS[topicIndex + 1] : null;
  const meta = TOPIC_META[topicId] ?? { sections: [], relatedArticles: [] };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompleted(new Set(JSON.parse(saved)));
    } catch {}
    setHydrated(true);
  }, []);

  // Scroll spy via IntersectionObserver
  useEffect(() => {
    if (!meta.sections.length) return;
    const observers: IntersectionObserver[] = [];

    meta.sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  const saveCompleted = useCallback((next: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {}
  }, []);

  function toggleTopic(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCompleted(next);
      return next;
    });
  }

  function handleNext() {
    if (!nextTopic) return;
    const next = new Set(completed);
    next.add(topicId);
    saveCompleted(next);
    setCompleted(next);
    router.push(`/sif-101/${nextTopic.id}`);
  }

  function handlePrev() {
    if (!prevTopic) return;
    router.push(`/sif-101/${prevTopic.id}`);
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const completedCount = completed.size;
  const totalCount = TOPICS.length;

  if (!topic) return null;

  return (
    <>
      <div className="topic-page-wrap">
        {/* ── Left sidebar ── */}
        <aside className="topic-left-sidebar">
          <div className="topic-sidebar-card">
            <div className="topic-sidebar-header">
              <span className="topic-sidebar-heading">Learning path</span>
              <span className="topic-sidebar-progress">{completedCount} / {totalCount}</span>
            </div>
            <div className="topic-sidebar-list">
              {TOPICS.map((t) => {
                const done = hydrated && completed.has(t.id);
                const current = t.id === topicId;
                return (
                  <div
                    key={t.id}
                    className={`topic-sidebar-item${done ? " sidebar-item-done" : current ? " sidebar-item-current" : " sidebar-item-pending"}`}
                  >
                    <button
                      className={`topic-sidebar-bullet${done ? " bullet-done" : current ? " bullet-current" : " bullet-pending"}`}
                      onClick={() => toggleTopic(t.id)}
                      title={done ? "Click to undo" : "Mark as complete"}
                      aria-label={done ? `Unmark ${t.title}` : `Mark ${t.title} as complete`}
                    >
                      {done && <CheckIcon />}
                    </button>
                    <a
                      href={`/sif-101/${t.id}`}
                      className={`topic-sidebar-label${done ? " label-done" : current ? " label-current" : " label-pending"}`}
                    >
                      {t.title}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Main article ── */}
        <article className="topic-article" ref={articleRef}>
          {/* Article header */}
          <div className="article-header">
            <div className="article-breadcrumb">
              <a href="/sif-101" className="breadcrumb-link">SIF 101</a>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{topic.title}</span>
            </div>
            <h1 className="article-title">
              {topicId === "what-is-a-sif"
                ? "What is a Specialized Investment Fund?"
                : topic.title}
            </h1>
            <div className="article-meta">
              <div className="article-read-time">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.833" stroke="#9CA3AF" strokeWidth="1.167" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 3.5V7l2.333 1.167" stroke="#9CA3AF" strokeWidth="1.167" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{topic.duration} min read</span>
              </div>
              <span className="article-level-badge">{topic.level}</span>
            </div>
          </div>

          {/* Article body */}
          <div className="article-body-wrap">
            {topicId === "what-is-a-sif" ? (
              <WhatIsASifContent />
            ) : (
              <GenericTopicContent topicId={topicId} />
            )}
          </div>

          {/* Bottom navigation */}
          <div className="article-bottom-nav">
            <div className="bottom-nav-left">
              {prevTopic ? (
                <button className="bottom-nav-prev" onClick={handlePrev}>
                  <ArrowLeftIcon />
                  <span>Previous</span>
                </button>
              ) : (
                <span className="bottom-nav-disabled">← Previous</span>
              )}
            </div>
            <div className="bottom-nav-right">
              {nextTopic && (
                <button className="bottom-nav-next" onClick={handleNext}>
                  <span>Next: {nextTopic.title}</span>
                  <ArrowRightIcon />
                </button>
              )}
            </div>
          </div>
        </article>

        {/* ── Right sidebar ── */}
        <aside className="topic-right-sidebar">
          {/* On this page */}
          <div className="right-sidebar-card">
            <h4 className="right-sidebar-card-title">On this page</h4>
            <nav className="toc-list">
              {meta.sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    className={`toc-item${isActive ? " toc-item-active" : ""}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Test your readiness */}
          <div className="right-sidebar-quiz-card">
            <div className="quiz-card-header">
              <div className="quiz-card-icon">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M12.5 3.75L5.625 10.625L2.5 7.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="quiz-card-title">Test your readiness</h4>
            </div>
            <p className="quiz-card-desc">
              A quick 5-question check tells you whether you&apos;re ready to start exploring funds — or which topics to revisit.
            </p>
            <button className="quiz-card-btn">Take the quiz</button>
          </div>

          {/* Related articles */}
          <div className="right-sidebar-card">
            <h4 className="right-sidebar-card-title">Related articles</h4>
            <ul className="related-articles-list">
              {meta.relatedArticles.map((article) => (
                <li key={article.title} className="related-article-item">
                  <a href={article.href} className="related-article-link">
                    <span className="related-article-arrow">›</span>
                    <span>{article.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <style>{`
        /* ── Page layout ──────────────────────────────── */
        .topic-page-wrap {
          display: flex;
          align-items: flex-start;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 40px;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── Left sidebar ──────────────────────────────── */
        .topic-left-sidebar {
          width: 252px;
          flex-shrink: 0;
          position: sticky;
          top: 72px;
          align-self: flex-start;
          max-height: calc(100vh - 80px);
          overflow-y: auto;
          padding: 24px 0;
        }
        .topic-left-sidebar::-webkit-scrollbar { width: 3px; }
        .topic-left-sidebar::-webkit-scrollbar-thumb { background: #DDE3EA; border-radius: 2px; }

        .topic-sidebar-card {
          border-radius: 12px;
          border: 1px solid #DDE3EA;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .topic-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px 14px;
          border-bottom: 1px solid #EEF1F5;
        }
        .topic-sidebar-heading {
          color: #6B7685;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .topic-sidebar-progress {
          color: #004C61;
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 11px;
          font-weight: 600;
        }

        .topic-sidebar-list {
          display: flex;
          flex-direction: column;
          padding: 8px 0;
        }

        .topic-sidebar-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 18px;
          border-left: 2px solid transparent;
        }
        .topic-sidebar-item.sidebar-item-done { border-left-color: transparent; }
        .topic-sidebar-item.sidebar-item-current {
          border-left-color: #004C61;
          background: rgba(46,158,148,0.12);
        }

        .topic-sidebar-bullet {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          transition: background 0.15s;
        }
        .topic-sidebar-bullet.bullet-done { background: #004C61; }
        .topic-sidebar-bullet.bullet-current {
          background: rgba(46,158,148,0.12);
          border: 1px solid #004C61;
        }
        .topic-sidebar-bullet.bullet-pending { background: transparent; border: 1px solid #DDE3EA; }
        .topic-sidebar-bullet.bullet-pending:hover { border-color: #004C61; }

        .topic-sidebar-label {
          font-family: 'Satoshi Variable', sans-serif;
          font-size: 13px;
          font-weight: 500;
          line-height: 20.8px;
          text-decoration: none;
          transition: color 0.15s;
        }
        .topic-sidebar-label.label-done {
          color: #6B7685;
        }
        .topic-sidebar-label.label-current { color: #004C61; }
        .topic-sidebar-label.label-pending { color: #3D4B5C; }
        .topic-sidebar-label:hover { color: #004C61; }

        /* ── Article ──────────────────────────────────── */
        .topic-article {
          flex: 1;
          min-width: 0;
          padding: 28px 40px 48px;
          border-left: 1px solid #EEF1F5;
          border-right: 1px solid #EEF1F5;
        }

        .article-header {
          padding-bottom: 20px;
          border-bottom: 1px solid #E5E7EB;
          margin-bottom: 24px;
        }
        .article-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }
        .breadcrumb-link {
          color: #2E9E94;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
        }
        .breadcrumb-link:hover { text-decoration: underline; }
        .breadcrumb-sep {
          color: #9CA3AF;
          font-size: 12px;
        }
        .breadcrumb-current {
          color: #6B7685;
          font-family: Inter, sans-serif;
          font-size: 12px;
        }
        .article-title {
          color: #0F2D3D;
          font-family: Inter, sans-serif;
          font-size: 28px;
          font-weight: 700;
          line-height: 35px;
          letter-spacing: -0.4px;
          margin: 0 0 12px;
        }
        .article-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .article-read-time {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #6B7685;
          font-family: Inter, sans-serif;
          font-size: 13px;
        }
        .article-level-badge {
          padding: 3px 12px;
          border-radius: 20px;
          border: 1px solid #D0F0F0;
          background: #EAFAFA;
          color: #0D5252;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 500;
        }

        .article-body-wrap {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .article-body-wrap section {
          padding-bottom: 8px;
        }

        /* ── Article typography ────────────────────────── */
        .article-intro {
          color: #374151;
          font-family: Inter, sans-serif;
          font-size: 15px;
          font-weight: 400;
          line-height: 26.25px;
          margin: 0 0 16px;
        }
        .article-intro strong { font-weight: 700; }

        .article-body {
          color: #374151;
          font-family: Inter, sans-serif;
          font-size: 15px;
          font-weight: 400;
          line-height: 26.25px;
          margin: 0 0 16px;
        }

        .article-h2 {
          color: #0F2D3D;
          font-family: Inter, sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.2px;
          margin: 26px 0 12px;
        }

        .article-h3 {
          color: #0F2D3D;
          font-family: Inter, sans-serif;
          font-size: 15px;
          font-weight: 600;
          margin: 14px 0 10px;
        }

        .article-list {
          list-style: none;
          padding: 0;
          margin: 0 0 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .article-list li {
          position: relative;
          padding-left: 20px;
          color: #374151;
          font-family: Inter, sans-serif;
          font-size: 15px;
          line-height: 25.5px;
        }
        .article-list li::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 9px;
          width: 6px;
          height: 6px;
          border-radius: 3px;
          background: #1AABAB;
        }

        .article-divider {
          height: 1px;
          background: #E5E7EB;
          margin: 16px 0;
        }

        /* Key takeaway box */
        .article-key-takeaway {
          border-top: 1px solid #0E8080;
          border-right: 1px solid #0E8080;
          border-bottom: 1px solid #0E8080;
          border-left: 3px solid #0E8080;
          border-radius: 8px;
          background: #EAFAFA;
          padding: 18px 22px;
          margin: 0 0 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .key-takeaway-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .key-takeaway-label {
          color: #0A6060;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.72px;
          text-transform: uppercase;
        }
        .key-takeaway-body {
          color: #0F4040;
          font-family: Inter, sans-serif;
          font-size: 14.5px;
          line-height: 24.65px;
          margin: 0;
        }

        /* Comparison table */
        .article-table-wrap {
          overflow-x: auto;
          margin: 12px 0 24px;
          border-radius: 8px;
        }
        .article-table {
          width: 100%;
          border-collapse: collapse;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
        }
        .article-table thead tr th {
          background: #0F2D3D;
          color: #fff;
          padding: 10px 14px;
          font-weight: 500;
          font-size: 13px;
          text-align: left;
        }
        .article-table thead tr th:first-child { border-radius: 8px 0 0 0; }
        .article-table thead tr th:last-child { border-radius: 0 8px 0 0; }
        .article-table thead tr th.col-sif { background: #1A4057; }
        .article-table tbody tr td {
          padding: 10px 14px;
          border-bottom: 1px solid #E5E7EB;
          color: #374151;
          font-size: 13.5px;
        }
        .article-table tbody tr td.cell-sif {
          color: #0E8080;
          font-weight: 500;
        }
        .article-table tbody tr:last-child td { border-bottom: none; }

        /* Investor grid */
        .investor-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin: 16px 0;
        }
        .investor-card {
          padding: 16px;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .investor-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .investor-card-title {
          color: #0F2D3D;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          margin: 0;
        }
        .investor-card-desc {
          color: #4B5563;
          font-family: Inter, sans-serif;
          font-size: 13px;
          line-height: 20.8px;
          margin: 0;
        }

        /* Info box */
        .article-info-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 8px;
          border: 1px solid #F5E4A8;
          background: #FDF6E3;
          margin: 0 0 24px;
        }
        .info-box-text {
          color: #5A3D00;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
          line-height: 22.28px;
          margin: 0;
          flex: 1;
        }
        .info-box-text strong { font-weight: 700; }

        /* AMC routes */
        .amc-route-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin: 12px 0;
        }
        .amc-route-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .amc-route-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 24px;
          flex-shrink: 0;
        }
        .amc-route-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #0E8080;
          color: #fff;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .amc-route-line {
          width: 2px;
          height: 36px;
          background: #E5E7EB;
          margin-top: 4px;
        }
        .amc-route-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 2px 0 24px;
        }
        .amc-route-title {
          color: #0F2D3D;
          font-family: Inter, sans-serif;
          font-size: 14px;
          font-weight: 600;
        }
        .amc-route-desc {
          color: #4B5563;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
          line-height: 21.6px;
          margin: 0;
        }

        /* ── Bottom navigation ─────────────────────────── */
        .article-bottom-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #E5E7EB;
        }
        .bottom-nav-left, .bottom-nav-right {
          display: flex;
          align-items: center;
        }
        .bottom-nav-disabled {
          color: #9CA3AF;
          font-family: Inter, sans-serif;
          font-size: 13px;
        }
        .bottom-nav-prev {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          color: #6B7685;
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 0;
          transition: color 0.15s;
        }
        .bottom-nav-prev:hover { color: #0F2D3D; }
        .bottom-nav-next {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0A6060;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: #fff;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          padding: 9px 18px;
          transition: background 0.15s;
        }
        .bottom-nav-next:hover { background: #0E8080; }

        /* ── Right sidebar ─────────────────────────────── */
        .topic-right-sidebar {
          width: 268px;
          flex-shrink: 0;
          position: sticky;
          top: 72px;
          align-self: flex-start;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 28px 0 28px 24px;
        }

        .right-sidebar-card {
          padding: 18px;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          background: #fff;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .right-sidebar-card-title {
          color: #111827;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          margin: 0;
        }

        /* TOC */
        .toc-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .toc-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 4px 0 4px 10px;
          border-radius: 0 4px 4px 0;
          border-left: 2px solid transparent;
          background: none;
          border-top: none;
          border-right: none;
          border-bottom: none;
          cursor: pointer;
          color: #0A6060;
          font-family: Inter, sans-serif;
          font-size: 13px;
          font-weight: 400;
          line-height: normal;
          transition: background 0.15s, border-color 0.15s, font-weight 0.1s;
        }
        .toc-item:hover { background: #EAFAFA; border-left-color: rgba(14,128,128,0.4); }
        .toc-item.toc-item-active {
          background: #EAFAFA;
          border-left-color: #0E8080;
          color: #0D5252;
          font-weight: 500;
        }

        /* Quiz card */
        .right-sidebar-quiz-card {
          padding: 18px 18px 20px;
          border-radius: 10px;
          border: 1px solid #F5E4A8;
          background: #FDF6E3;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .quiz-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .quiz-card-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #C9900A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .quiz-card-title {
          color: #5A3D00;
          font-family: Inter, sans-serif;
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }
        .quiz-card-desc {
          color: #7A5200;
          font-family: Inter, sans-serif;
          font-size: 12.5px;
          line-height: 20px;
          margin: 0;
        }
        .quiz-card-btn {
          width: 100%;
          padding: 9px;
          border-radius: 7px;
          background: #C9900A;
          border: none;
          cursor: pointer;
          color: #fff;
          font-family: Arial, sans-serif;
          font-size: 13.5px;
          text-align: center;
          transition: background 0.15s;
        }
        .quiz-card-btn:hover { background: #A87608; }

        /* Related articles */
        .related-articles-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .related-article-item { display: flex; }
        .related-article-link {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 4px 0;
          text-decoration: none;
          color: #0A6060;
          font-family: Inter, sans-serif;
          font-size: 13px;
          line-height: 19.5px;
          transition: color 0.15s;
        }
        .related-article-link:hover { color: #0E8080; }
        .related-article-arrow {
          font-size: 15px;
          line-height: 21px;
          flex-shrink: 0;
        }

        /* ── Responsive ──────────────────────────────────── */
        @media (max-width: 1100px) {
          .topic-right-sidebar { display: none; }
          .topic-article { border-right: none; }
        }
        @media (max-width: 860px) {
          .topic-page-wrap { flex-direction: column; padding: 0 16px; }
          .topic-left-sidebar { 
            width: 100%; 
            position: static; 
            padding: 16px 0 0;
            max-height: none;
          }
          .topic-article { border: none; padding: 24px 0 40px; }
          .investor-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 540px) {
          .article-title { font-size: 22px; line-height: 28px; }
          .investor-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
