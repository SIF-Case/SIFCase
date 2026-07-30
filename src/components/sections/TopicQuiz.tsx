"use client";

import { useState } from "react";
import type { Sif101QuizQuestion } from "@/lib/sif101Quizzes";

function tierMessage(pct: number): string {
  if (pct === 100) return "Excellent — perfect score. You've fully grasped this topic.";
  if (pct >= 75) return "Well done — a strong grasp of this topic.";
  if (pct >= 50) return "Decent effort. A quick re-read of the article will sharpen this up.";
  return "Worth revisiting — re-read the article above before moving on.";
}

const LETTERS = ["A", "B", "C", "D"];

export function TopicQuiz({ questions }: { questions: Sif101QuizQuestion[] }) {
  const [selected, setSelected] = useState<(number | undefined)[]>(() => new Array(questions.length).fill(undefined));
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const answered = selected.filter((s) => s !== undefined).length;
  const correct = selected.filter((s, i) => s === questions[i].answer).length;
  const pct = Math.round((correct / questions.length) * 100);
  const current = questions[index];
  const sel = selected[index];
  const locked = sel !== undefined;
  const isLast = index === questions.length - 1;

  function selectAnswer(oi: number) {
    if (locked) return;
    setSelected((prev) => prev.map((s, i) => (i === index ? oi : s)));
  }

  function next() {
    if (isLast) setFinished(true);
    else setIndex((i) => i + 1);
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function retake() {
    setSelected(new Array(questions.length).fill(undefined));
    setIndex(0);
    setFinished(false);
  }

  return (
    <section id="topic-quiz" className="topic-quiz-section">
      <div className="topic-quiz-header">
        <h3 className="topic-quiz-title">Test your knowledge</h3>
        {!finished && <span className="topic-quiz-progress">Question {index + 1} of {questions.length}</span>}
      </div>

      {!finished && (
        <div className="topic-quiz-track">
          <div className="topic-quiz-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
      )}

      {!finished ? (
        <>
          <div className="topic-quiz-card">
            <p className="topic-quiz-qtext">{index + 1}. {current.q}</p>
            <div className="topic-quiz-options">
              {current.options.map((opt, oi) => {
                let cls = "topic-quiz-option";
                if (locked) {
                  if (oi === current.answer) cls += " correct";
                  else if (oi === sel) cls += " incorrect";
                  else cls += " dim";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    className={cls}
                    onClick={() => selectAnswer(oi)}
                    disabled={locked}
                  >
                    <span className="topic-quiz-letter">{LETTERS[oi]}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {locked && (
              <div className={`topic-quiz-feedback ${sel === current.answer ? "correct" : "incorrect"}`}>
                <strong>{sel === current.answer ? "Correct — nicely done." : `Not quite. The correct answer is ${LETTERS[current.answer]}.`}</strong>
                <p>{current.explain}</p>
              </div>
            )}
          </div>

          <div className="topic-quiz-nav">
            <button type="button" className="topic-quiz-navbtn secondary" onClick={prev} disabled={index === 0}>
              ← Previous
            </button>
            <button type="button" className="topic-quiz-navbtn" onClick={next} disabled={!locked}>
              {isLast ? "Finish" : "Next →"}
            </button>
          </div>
        </>
      ) : (
        <div className="topic-quiz-summary">
          <div className="topic-quiz-summary-score">{correct} / {questions.length} ({pct}%)</div>
          <p>{tierMessage(pct)}</p>
          <button type="button" className="topic-quiz-retake" onClick={retake}>Retake</button>
        </div>
      )}

      <style jsx>{`
        .topic-quiz-section {
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px solid #E2E8EE;
        }
        .topic-quiz-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .topic-quiz-title {
          font-size: 18px;
          font-weight: 700;
          color: #0E2A47;
          margin: 0;
        }
        .topic-quiz-progress {
          font-size: 12px;
          color: #6B8299;
          white-space: nowrap;
        }
        .topic-quiz-track {
          height: 6px;
          background: #E2E8EE;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .topic-quiz-fill {
          height: 100%;
          background: linear-gradient(90deg, #0E9F8E, #1d4e89);
          transition: width .3s ease;
        }
        .topic-quiz-card {
          background: #fff;
          border: 1px solid #E2E8EE;
          border-radius: 14px;
          padding: 18px 20px;
        }
        .topic-quiz-qtext {
          font-weight: 600;
          font-size: 14.5px;
          margin: 0 0 12px;
          color: #0F1C28;
        }
        .topic-quiz-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .topic-quiz-option {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #E2E8EE;
          border-radius: 9px;
          padding: 10px 12px;
          cursor: pointer;
          font-size: 13.5px;
          background: #fff;
          text-align: left;
          color: #0F1C28;
          transition: border-color .12s ease, background .12s ease;
        }
        .topic-quiz-option:not(:disabled):hover {
          border-color: #0E9F8E;
        }
        .topic-quiz-option:disabled {
          cursor: default;
        }
        .topic-quiz-letter {
          flex: 0 0 22px;
          height: 22px;
          border-radius: 6px;
          background: #F4F6F8;
          border: 1px solid #E2E8EE;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #6B8299;
        }
        .topic-quiz-option.correct {
          border-color: #1A8F5A;
          background: #EAF7F0;
        }
        .topic-quiz-option.correct .topic-quiz-letter {
          background: #1A8F5A;
          color: #fff;
          border-color: #1A8F5A;
        }
        .topic-quiz-option.incorrect {
          border-color: #C23B3B;
          background: #FDECEC;
        }
        .topic-quiz-option.incorrect .topic-quiz-letter {
          background: #C23B3B;
          color: #fff;
          border-color: #C23B3B;
        }
        .topic-quiz-option.dim {
          opacity: .55;
        }
        .topic-quiz-feedback {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
        }
        .topic-quiz-feedback strong {
          display: block;
          margin-bottom: 2px;
        }
        .topic-quiz-feedback p {
          margin: 0;
        }
        .topic-quiz-feedback.correct {
          background: #EAF7F0;
          color: #146b45;
          border: 1px solid #cdeedd;
        }
        .topic-quiz-feedback.incorrect {
          background: #FDECEC;
          color: #8f2b2b;
          border: 1px solid #f6d3d3;
        }
        .topic-quiz-nav {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
        }
        .topic-quiz-navbtn {
          background: #0E9F8E;
          color: #fff;
          border: none;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .topic-quiz-navbtn:disabled {
          opacity: .4;
          cursor: not-allowed;
        }
        .topic-quiz-navbtn.secondary {
          background: none;
          color: #1d4e89;
          border: 1px solid #E2E8EE;
        }
        .topic-quiz-navbtn.secondary:disabled {
          color: #9CA3AF;
        }
        .topic-quiz-summary {
          border-radius: 14px;
          padding: 20px;
          margin-top: 4px;
          color: #fff;
          background: linear-gradient(135deg, #0E2A47, #1d4e89);
        }
        .topic-quiz-summary-score {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .topic-quiz-summary p {
          margin: 0 0 12px;
          font-size: 13.5px;
          opacity: .92;
        }
        .topic-quiz-retake {
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .topic-quiz-retake:hover {
          background: rgba(255,255,255,0.22);
        }
      `}</style>
    </section>
  );
}
