"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface QuestionOption {
  text: string;
  value: number;
}

interface SuitabilityQuestion {
  _id: string;
  question: string;
  options: QuestionOption[];
  dimension: string;
  dimensionOrder: number;
  context: string;
  order: number;
}

interface SelectedAnswer {
  text: string;
  value: number;
}

function getSessionId(): string {
  const key = "sif_suitability_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function SuitabilityClient() {
  const router = useRouter();
  const [questions, setQuestions] = useState<SuitabilityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SelectedAnswer>>({});
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    sessionIdRef.current = getSessionId();
    fetch("/api/suitability/questions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setQuestions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveProgress(updatedAnswers: Record<string, SelectedAnswer>, completed = false) {
    const answersPayload = Object.entries(updatedAnswers).map(([questionId, selected]) => {
      const q = questions.find((q) => q._id === questionId);
      return {
        questionId,
        question: q?.question ?? "",
        selectedOption: selected.text,
        selectedValue: selected.value,
        dimension: q?.dimension ?? "",
      };
    });

    await fetch("/api/suitability/response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        answers: answersPayload,
        completed,
      }),
    }).catch(() => {});
  }

  const current = questions[currentIndex];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const progressPercent = total > 0 ? Math.round((answered / total) * 100) : 0;

  const dimensions = Array.from(
    new Map(questions.map((q) => [q.dimension, q.dimensionOrder])).entries(),
  ).sort((a, b) => a[1] - b[1]);

  const currentDimension = current?.dimension ?? "";
  const currentDimensionIndex = dimensions.findIndex(([d]) => d === currentDimension);
  const dimensionQuestions = questions.filter((q) => q.dimension === currentDimension);
  const positionInDimension = dimensionQuestions.findIndex((q) => q._id === current?._id);

  function handleSelect(option: QuestionOption) {
    if (!current) return;
    const updated: Record<string, SelectedAnswer> = {
      ...answers,
      [current._id]: { text: option.text, value: option.value },
    };
    setAnswers(updated);
    saveProgress(updated);
  }

  function handleContinue() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      saveProgress(answers, true);
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      router.back();
    }
  }

  const currentAnswer = current ? answers[current._id] : undefined;

  return (
    <div className="suitability-wrapper">
      {/* Left: Quiz panel */}
      <div className="quiz-panel">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p className="loading-text">Loading questions…</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No questions available yet. Please check back soon.</p>
          </div>
        ) : (
          <>
            <div className="quiz-header-row">
              <span className="quiz-label">Suitability Profiler</span>
              <span className="quiz-progress-text">{progressPercent}% complete</span>
            </div>

            <div className="quiz-progress-bar-track">
              <div className="quiz-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="quiz-question-wrap">
              <h2 className="quiz-question">{current.question}</h2>
            </div>

            <div className="quiz-options">
              {current.options.map((option, i) => {
                const selected = currentAnswer?.text === option.text;
                return (
                  <button
                    key={i}
                    className={`quiz-option${selected ? " quiz-option--selected" : ""}`}
                    onClick={() => handleSelect(option)}
                  >
                    <span className={`radio-circle${selected ? " radio-circle--selected" : ""}`}>
                      <span className="radio-dot" />
                    </span>
                    <span className="option-text">{option.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="pagination-dots">
              {dimensionQuestions.map((_, i) => (
                <span key={i} className={`dot${i === positionInDimension ? " dot--active" : ""}`} />
              ))}
            </div>

            <div className="quiz-nav">
              <button className="btn-back" onClick={handleBack}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1.75 7C1.75 8.038 2.058 9.053 2.635 9.917C3.212 10.78 4.032 11.453 4.991 11.85C5.95 12.248 7.006 12.352 8.024 12.149C9.043 11.947 9.978 11.447 10.712 10.712C11.447 9.978 11.947 9.043 12.149 8.024C12.352 7.006 12.248 5.95 11.85 4.991C11.453 4.032 10.78 3.212 9.917 2.635C9.053 2.058 8.038 1.75 7 1.75C5.532 1.756 4.124 2.328 3.068 3.348L1.75 4.667" stroke="#4A5568" strokeWidth="1.167" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1.75 1.75V4.667H4.667" stroke="#4A5568" strokeWidth="1.167" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Go Back
              </button>
              <button
                className={`btn-continue${!currentAnswer ? " btn-continue--disabled" : ""}`}
                onClick={handleContinue}
                disabled={!currentAnswer}
              >
                {currentIndex === total - 1 ? "Finish" : "Continue"}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="white" strokeWidth="1.167" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right: Context panel */}
      <div className="context-panel">
        {!loading && questions.length > 0 && (
          <div className="context-inner">
            <div className="dimension-strip">
              <div className="dimension-strip-header">
                <span className="assessing-label">Assessing</span>
                <div className="dimension-info">
                  <span className="dimension-name">{currentDimension || "Quiz"}</span>
                  <span className="dimension-count">· {answered} of {total} done</span>
                </div>
              </div>
              <div className="dimension-segments">
                {dimensions.map(([dim], i) => (
                  <div
                    key={dim}
                    className={`segment${i < currentDimensionIndex ? " segment--done" : i === currentDimensionIndex ? " segment--active" : ""}`}
                  />
                ))}
              </div>
            </div>

            {current?.context && (
              <div className="why-card">
                <div className="why-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 16.5C13.142 16.5 16.5 13.142 16.5 9C16.5 4.858 13.142 1.5 9 1.5C4.858 1.5 1.5 4.858 1.5 9C1.5 13.142 4.858 16.5 9 16.5Z" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 12V9" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 6H9.0075" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="why-content">
                  <span className="why-label">Why we ask this?</span>
                  <p className="why-text">{current.context}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
