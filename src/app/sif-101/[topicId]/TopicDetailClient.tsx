"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STORAGE_KEY } from "../topicsData";
import type { Sif101QuizQuestion } from "@/lib/sif101Quizzes";
import { TopicQuiz } from "@/components/sections/TopicQuiz";

export type ArticleMeta = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  readTime: number;
};

export type Article = ArticleMeta & {
  content: string;
  publishedAt: string | null;
};

export type RelatedArticle = {
  slug: string;
  title: string;
};

// ─── Icons ────────────────────────────────────────────────────────

function CheckIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path d="M1.5 5L4 7.5L8.5 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── Main Component ─────────────────────────────────────────────────

export function TopicDetailClient({
  topicId,
  article,
  allArticles,
  relatedArticles,
  quizQuestions,
}: {
  topicId: string;
  article: Article;
  allArticles: ArticleMeta[];
  relatedArticles: RelatedArticle[];
  quizQuestions: Sif101QuizQuestion[] | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");
  const articleContentRef = useRef<HTMLDivElement>(null);

  const topicIndex = allArticles.findIndex((a) => a.slug === topicId);
  const prevTopic = topicIndex > 0 ? allArticles[topicIndex - 1] : null;
  const nextTopic = topicIndex < allArticles.length - 1 ? allArticles[topicIndex + 1] : null;

  // Process content to add IDs to headings
  const [processedContent, setProcessedContent] = useState(article.content);

  useEffect(() => {
    // Create a temporary DOM element to parse and modify the HTML
    const temp = document.createElement('div');
    temp.innerHTML = article.content;
    
    const headings = temp.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const usedIds = new Set<string>();
    
    headings.forEach((heading, index) => {
      const text = heading.textContent || "";
      let baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `section-${index}`;
      
      // Ensure unique IDs
      let id = baseId;
      let counter = 1;
      while (usedIds.has(id)) {
        id = `${baseId}-${counter}`;
        counter++;
      }
      usedIds.add(id);
      
      heading.id = id;
    });
    
    setProcessedContent(temp.innerHTML);
  }, [article.content]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompleted(new Set(JSON.parse(saved)));
    } catch {}
    setHydrated(true);
  }, []);

  // Extract headings from content for table of contents
  useEffect(() => {
    if (!articleContentRef.current) return;
    
    // Wait a bit for content to be fully rendered
    const timer = setTimeout(() => {
      if (!articleContentRef.current) return;
      
      const headings = articleContentRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const toc: { id: string; label: string }[] = [];
      
      headings.forEach((heading) => {
        const id = heading.id;
        const text = heading.textContent || "";
        
        if (id && text) {
          toc.push({ id, label: text });
        }
      });
      
      setSections(toc);
      
      // Set first section as active initially if we have sections
      if (toc.length > 0 && !activeSection) {
        setActiveSection(toc[0].id);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [processedContent, activeSection]);

  // Scroll spy for active section
  useEffect(() => {
    if (!sections.length) return;
    
    const observers: IntersectionObserver[] = [];
    
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      
      obs.observe(el);
      observers.push(obs);
    });
    
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const saveCompleted = useCallback((next: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {}
  }, []);

  function toggleTopic(slug: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
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
    router.push(`/sif-101/${nextTopic.slug}`);
  }

  function handlePrev() {
    if (!prevTopic) return;
    router.push(`/sif-101/${prevTopic.slug}`);
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`Element with id "${id}" not found`);
      return;
    }
    
    try {
      const navbarHeight = 72; // Height of sticky navbar
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - 20; // 20px extra padding
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    } catch (error) {
      // Fallback for browsers that don't support smooth scrolling
      el.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }

  const completedCount = completed.size;
  const totalCount = allArticles.length;

  return (
    <>
      <div className="topic-page-wrap">
        {/* ── Left sidebar ── */}
        <aside className="topic-left-sidebar">
          <div className="topic-sidebar-card">
            <div className="topic-sidebar-header">
              <span className="topic-sidebar-heading">Learning path</span>
              <span className="topic-sidebar-progress">
                {completedCount} / {totalCount}
              </span>
            </div>
            <div className="topic-sidebar-list">
              {allArticles.map((a) => {
                const done = hydrated && completed.has(a.slug);
                const current = a.slug === topicId;
                return (
                  <div
                    key={a.slug}
                    className={`topic-sidebar-item${
                      done
                        ? " sidebar-item-done"
                        : current
                        ? " sidebar-item-current"
                        : " sidebar-item-pending"
                    }`}
                  >
                    <button
                      className={`topic-sidebar-bullet${
                        done
                          ? " bullet-done"
                          : current
                          ? " bullet-current"
                          : " bullet-pending"
                      }`}
                      onClick={() => toggleTopic(a.slug)}
                      title={done ? "Click to undo" : "Mark as complete"}
                      aria-label={done ? `Unmark ${a.title}` : `Mark ${a.title} as complete`}
                    >
                      {done && <CheckIcon />}
                    </button>
                    <Link
                      href={`/sif-101/${a.slug}`}
                      className={`topic-sidebar-label${
                        done
                          ? " label-done"
                          : current
                          ? " label-current"
                          : " label-pending"
                      }`}
                    >
                      {a.title}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Main article ── */}
        <article className="topic-article">
          {/* Article header */}
          <div className="article-header">
            <div className="article-breadcrumb">
              <Link href="/sif-101" className="breadcrumb-link">
                SIF 101
              </Link>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{article.title}</span>
            </div>
            <h1 className="article-title">{article.title}</h1>
            <div className="article-meta">
              <div className="article-read-time">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle
                    cx="7"
                    cy="7"
                    r="5.833"
                    stroke="#9CA3AF"
                    strokeWidth="1.167"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 3.5V7l2.333 1.167"
                    stroke="#9CA3AF"
                    strokeWidth="1.167"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{article.readTime} min read</span>
              </div>
              {article.publishedAt && (
                <>
                  <span className="article-meta-separator">·</span>
                  <span className="article-published-date">
                    {new Date(article.publishedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Article body - render the HTML content */}
          <div
            ref={articleContentRef}
            className="article-body-wrap prose"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* Test your knowledge */}
          {quizQuestions && <TopicQuiz questions={quizQuestions} />}

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
              {nextTopic ? (
                <button className="bottom-nav-next" onClick={handleNext}>
                  <span>Next: {nextTopic.title}</span>
                  <ArrowRightIcon />
                </button>
              ) : (
                <button 
                  className="bottom-nav-finish" 
                  onClick={() => {
                    const next = new Set(completed);
                    next.add(topicId);
                    saveCompleted(next);
                    setCompleted(next);
                    router.push('/sif-101');
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13.333 4L6 11.333 2.667 8"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Finish Course</span>
                </button>
              )}
            </div>
          </div>
        </article>

        {/* ── Right sidebar ── */}
        <aside className="topic-right-sidebar">
          {/* On this page */}
          {sections.length > 0 && (
            <div className="right-sidebar-card">
              <h4 className="right-sidebar-card-title">On this page</h4>
              <nav className="toc-list">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      className={`toc-item${isActive ? " toc-item-active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(section.id);
                      }}
                    >
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Test your readiness */}
          <div className="right-sidebar-quiz-card">
            <div className="quiz-card-header">
              <div className="quiz-card-icon">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12.5 3.75L5.625 10.625L2.5 7.5"
                    stroke="white"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h4 className="quiz-card-title">Test your readiness</h4>
            </div>
            {quizQuestions ? (
              <>
                <p className="quiz-card-desc">
                  A quick {quizQuestions.length}-question check on this topic — instant feedback,
                  no login needed.
                </p>
                <button type="button" className="quiz-card-btn" onClick={() => scrollToSection("topic-quiz")}>
                  Take the quiz
                </button>
              </>
            ) : (
              <>
                <p className="quiz-card-desc">
                  A quick 5-question check tells you whether you&apos;re ready to start exploring
                  funds — or which topics to revisit.
                </p>
                <Link href="/sif-101/quiz" className="quiz-card-btn">Take the quiz</Link>
              </>
            )}
          </div>

          {/* Browse insights by category */}
          <div className="right-sidebar-card">
            <h4 className="right-sidebar-card-title">Browse insights</h4>
            <ul className="related-articles-list">
              {[
                { href: "/read/subcategory/sif-categories", label: "SIF Categories" },
                { href: "/read/subcategory/strategy", label: "Strategy" },
                { href: "/read/subcategory/derivative-strategies", label: "Derivative Strategies" },
                { href: "/read/subcategory/sif-education", label: "SIF Education" },
              ].map((cat) => (
                <li key={cat.href} className="related-article-item">
                  <Link href={cat.href} className="related-article-link">
                    <span className="related-article-arrow">›</span>
                    <span>{cat.label}</span>
                  </Link>
                </li>
              ))}
              <li className="related-article-item">
                <Link href="/read" className="related-article-link">
                  <span className="related-article-arrow">›</span>
                  <span>Read all insights</span>
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <style>{`
        /* ── Page layout ──────────────────────────────── */
        .topic-page-wrap {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── Left sidebar ──────────────────────────────── */
        .topic-left-sidebar {
          width: 240px;
          flex-shrink: 0;
          position: sticky;
          top: 72px;
          align-self: flex-start;
          max-height: calc(100vh - 80px);
          overflow-y: auto;
          padding: 24px 0;
        }
        .topic-sidebar-card {
          border-radius: 12px;
          border: 1px solid #DDE3EA;
          background: #fff;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.06);
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
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .topic-sidebar-progress {
          color: #004C61;
          font-family: var(--font-dm-sans), sans-serif;
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
          background: transparent;
          transition: background 0.15s;
        }
        .topic-sidebar-item:hover {
          background: rgba(46, 158, 148, 0.06);
        }
        .topic-sidebar-item.sidebar-item-current {
          border-left-color: #004C61;
          background: rgba(46, 158, 148, 0.12);
        }
        .topic-sidebar-bullet {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .bullet-done {
          background: #004C61;
        }
        .bullet-current {
          border: 1px solid #004C61;
          background: rgba(46, 158, 148, 0.12);
        }
        .bullet-pending {
          border: 1px solid #DDE3EA;
          background: transparent;
        }
        .topic-sidebar-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          font-weight: 500;
          line-height: 20.8px;
          color: #3D4B5C;
          text-decoration: none;
          flex: 1;
        }
        .topic-sidebar-label.label-done {
          color: #6B7685;
        }
        .topic-sidebar-label.label-current {
          color: #004C61;
        }

        /* ── Main article ──────────────────────────────── */
        .topic-article {
          flex: 1;
          min-width: 0;
          max-width: 720px;
          padding: 28px 0 64px 0;
        }

        /* Article header */
        .article-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 32px;
        }
        .article-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .breadcrumb-link {
          color: #2E9E94;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-decoration: none;
        }
        .breadcrumb-link:hover {
          color: #14B7A3;
        }
        .breadcrumb-sep {
          color: #9CA3AF;
          font-size: 12px;
        }
        .breadcrumb-current {
          color: #6B7685;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        .article-title {
          color: #0F2D3D;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 32px;
          font-weight: 700;
          line-height: 40px;
          letter-spacing: -0.5px;
          margin: 0;
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
          font-size: 12px;
          font-weight: 400;
        }
        .article-meta-separator {
          color: #D1D5DB;
          font-size: 14px;
          font-weight: 300;
        }
        .article-published-date {
          color: #6B7685;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 400;
        }

        /* Article body with prose styles */
        .article-body-wrap {
          width: 100%;
          max-width: 100%;
        }
        .article-body-wrap.prose {
          color: #3D4B5C;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 15px;
          line-height: 1.7;
        }
        .article-body-wrap.prose h1,
        .article-body-wrap.prose h2 {
          color: #0F2D3D;
          font-weight: 700;
          margin: 32px 0 16px;
        }
        .article-body-wrap.prose h1 {
          font-size: 28px;
          line-height: 1.3;
        }
        .article-body-wrap.prose h2 {
          font-size: 22px;
          line-height: 1.4;
        }
        .article-body-wrap.prose h3 {
          color: #0F2D3D;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.4;
          margin: 24px 0 12px;
        }
        .article-body-wrap.prose p {
          margin: 0 0 18px;
        }
        .article-body-wrap.prose ul,
        .article-body-wrap.prose ol {
          margin: 0 0 18px;
          padding-left: 24px;
        }
        .article-body-wrap.prose li {
          margin-bottom: 8px;
        }
        .article-body-wrap.prose strong {
          font-weight: 600;
          color: #1B2A3B;
        }
        .article-body-wrap.prose em {
          font-style: italic;
        }
        .article-body-wrap.prose a {
          color: #0A6060;
          text-decoration: underline;
        }
        .article-body-wrap.prose a:hover {
          color: #0E8080;
        }
        .article-body-wrap.prose code {
          background: #F3F4F6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }
        .article-body-wrap.prose table,
        .article-body-wrap.prose .tiptap-table {
          width: 100%;
          max-width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          border: 1px solid #E5E7EB;
          overflow-x: auto;
          display: block;
        }
        .article-body-wrap.prose th,
        .article-body-wrap.prose td {
          border: 1px solid #E5E7EB;
          padding: 12px;
          text-align: left;
          word-wrap: break-word;
        }
        .article-body-wrap.prose th {
          background: #F9FAFB;
          font-weight: 600;
          color: #0F2D3D;
        }
        .article-body-wrap.prose td p {
          margin: 0 0 8px;
        }
        .article-body-wrap.prose td p:last-child {
          margin: 0;
        }
        .article-body-wrap.prose blockquote {
          border-left: 4px solid #0A6060;
          padding-left: 16px;
          margin: 24px 0;
          color: #4B5563;
          font-style: italic;
        }

        /* ── Bottom navigation ─────────────────────────── */
        .article-bottom-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #E5E7EB;
          width: 100%;
          max-width: 100%;
        }
        .bottom-nav-left,
        .bottom-nav-right {
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
        .bottom-nav-prev:hover {
          color: #0F2D3D;
        }
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
        .bottom-nav-next:hover {
          background: #0E8080;
        }
        .bottom-nav-finish {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1A9E5F;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: #fff;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          padding: 9px 20px;
          transition: background 0.15s;
        }
        .bottom-nav-finish:hover {
          background: #168F53;
        }

        /* ── Right sidebar ─────────────────────────────── */
        .topic-right-sidebar {
          width: 280px;
          flex-shrink: 0;
          position: sticky;
          top: 72px;
          align-self: flex-start;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 28px 0 28px 0;
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
        .toc-item:hover {
          background: #EAFAFA;
          border-left-color: rgba(14, 128, 128, 0.4);
        }
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
          display: block;
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
          text-decoration: none;
          transition: background 0.15s;
        }
        .quiz-card-btn:hover {
          background: #A87608;
        }

        /* Related articles */
        .related-articles-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .related-article-item {
          display: flex;
        }
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
        .related-article-link:hover {
          color: #0E8080;
        }
        .related-article-arrow {
          font-size: 15px;
          line-height: 21px;
          flex-shrink: 0;
        }

        /* ── Responsive ──────────────────────────────────── */
        @media (max-width: 1200px) {
          .topic-right-sidebar {
            display: none;
          }
          .topic-article {
            max-width: 100%;
          }
        }
        @media (max-width: 860px) {
          .topic-page-wrap {
            flex-direction: column;
            padding: 0 16px;
            gap: 0;
          }
          .topic-left-sidebar {
            width: 100%;
            position: static;
            padding: 16px 0 0;
            max-height: none;
          }
          .topic-article {
            padding: 24px 0 40px 0;
          }
        }
        @media (max-width: 540px) {
          .article-title {
            font-size: 24px;
            line-height: 32px;
          }
          .topic-page-wrap {
            padding: 0 12px;
          }
        }
      `}</style>
    </>
  );
}
