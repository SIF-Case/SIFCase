"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, BookOpen } from "lucide-react";

type Question = {
  _id: string;
  question: string;
  options: { text: string; _id?: string }[];
  points: number;
};

type Result = {
  questionId: string;
  question: string;
  userAnswerId: string;
  userAnswerText: string;
  isCorrect: boolean;
  correctAnswerId: string;
  correctAnswerText: string;
  context: string;
  pointsEarned: number;
  pointsPossible: number;
};

export function QuizClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{
    totalScore: number;
    maxScore: number;
    percentage: number;
    results: Result[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/knowledge-quiz")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentQuestion = questions[currentIndex];
  const hasAnsweredCurrent = currentQuestion && answers[currentQuestion._id];
  const allAnswered = questions.every((q) => answers[q._id]);

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/knowledge-quiz/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      
      if (res.status === 401) {
        const data = await res.json();
        if (data.requiresAuth) {
          alert("Please log in to take the quiz and save your progress.");
          window.location.href = "/?login=true";
          return;
        }
      }
      
      if (!res.ok) {
        throw new Error("Failed to submit");
      }
      
      const data = await res.json();
      setResults(data);
      setSubmitted(true);
      setCurrentIndex(0);
    } catch (error) {
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setCurrentIndex(0);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-muted text-[14px]">Loading quiz…</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <BookOpen className="size-12 text-muted mb-4" />
        <p className="text-heading text-[16px] font-semibold mb-2">No quiz available</p>
        <p className="text-muted text-[14px] mb-6 text-center max-w-md">
          The knowledge quiz hasn't been set up yet. Check back soon!
        </p>
        <Link
          href="/sif-101"
          className="px-5 py-2.5 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90"
        >
          Back to Learning Hub
        </Link>
      </div>
    );
  }

  // Results view
  if (submitted && results) {
    const passed = results.percentage >= 70;
    return (
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12">
        {/* Results header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center size-20 rounded-full mb-4 ${passed ? "bg-green-100" : "bg-orange-100"}`}>
            {passed ? (
              <CheckCircle2 className="size-10 text-green-600" />
            ) : (
              <XCircle className="size-10 text-orange-600" />
            )}
          </div>
          <h1 className="text-[28px] font-bold text-heading mb-2">
            {passed ? "Great job!" : "Keep learning"}
          </h1>
          <p className="text-[16px] text-muted mb-4">
            You scored <strong className={passed ? "text-green-600" : "text-orange-600"}>{results.totalScore}</strong> out of {results.maxScore} points ({results.percentage}%)
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={restart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-rule text-[13px] font-semibold hover:bg-surface"
            >
              <RotateCcw className="size-4" /> Retake Quiz
            </button>
            <Link
              href="/sif-101"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90"
            >
              Back to Learning Hub
            </Link>
          </div>
        </div>

        {/* Question-by-question results */}
        <div className="space-y-4">
          {results.results.map((result, idx) => (
            <div
              key={result.questionId}
              className={`p-5 rounded-[12px] border ${result.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
            >
              <div className="flex items-start gap-3 mb-3">
                {result.isCorrect ? (
                  <CheckCircle2 className="size-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="size-5 text-red-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-heading mb-2">
                    Q{idx + 1}. {result.question}
                  </p>
                  <div className="space-y-2">
                    <p className="text-[13px]">
                      <span className="text-muted">Your answer:</span>{" "}
                      <span className={result.isCorrect ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                        {result.userAnswerText}
                      </span>
                    </p>
                    {!result.isCorrect && (
                      <p className="text-[13px]">
                        <span className="text-muted">Correct answer:</span>{" "}
                        <span className="text-green-700 font-medium">{result.correctAnswerText}</span>
                      </p>
                    )}
                  </div>
                  {result.context && (
                    <div className="mt-3 p-3 bg-white rounded-[8px] border border-gray-200">
                      <p className="text-[12px] text-body leading-relaxed">
                        <strong className="text-heading">💡 Explanation:</strong> {result.context}
                      </p>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-mono font-semibold text-muted bg-white border border-rule px-2 py-1 rounded">
                  {result.pointsEarned}/{result.pointsPossible}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quiz taking view
  return (
    <div className="flex-1 max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/sif-101" className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline mb-4">
          ← Back to Learning Hub
        </Link>
        <h1 className="text-[24px] font-bold text-heading mb-2">Test Your Readiness</h1>
        <p className="text-[14px] text-muted">
          Answer all {questions.length} questions to see how much you've learned
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-[12px] text-muted mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Object.keys(answers).length} answered</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      {currentQuestion && (
        <div className="bg-white rounded-[14px] border border-rule shadow-card p-6 mb-6">
          <p className="text-[16px] font-semibold text-heading mb-5">
            {currentQuestion.question}
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion._id] === option._id;
              return (
                <button
                  key={option._id || idx}
                  onClick={() => selectAnswer(currentQuestion._id, option._id || String(idx))}
                  className={`w-full text-left p-4 rounded-[10px] border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-teal-50"
                      : "border-rule bg-white hover:border-primary/30 hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center justify-center size-6 rounded-full border-2 text-[12px] font-semibold shrink-0 ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 text-muted"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={`text-[14px] ${isSelected ? "text-heading font-medium" : "text-body"}`}>
                      {option.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-[8px] border border-rule text-[13px] font-semibold disabled:opacity-30"
        >
          ← Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={!hasAnsweredCurrent}
            className="flex items-center gap-2 px-5 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Next <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="flex items-center gap-2 px-6 py-2 rounded-[8px] bg-green-600 text-white text-[13px] font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Quiz"} <CheckCircle2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
