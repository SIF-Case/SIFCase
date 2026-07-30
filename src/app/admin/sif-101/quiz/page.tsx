"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Loader2, CheckCircle2, RotateCcw } from "lucide-react";

type Question = { q: string; options: string[]; answer: number; explain: string };

type Topic = {
  slug: string;
  title: string;
  order: number;
  questions: Question[];
  isOverridden: boolean;
  hasDefault: boolean;
};

const EMPTY_QUESTION: Question = { q: "", options: ["", "", "", ""], answer: 0, explain: "" };

export default function AdminSif101Quiz() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sif101-quiz");
    const data = await res.json();
    const list: Topic[] = Array.isArray(data.topics) ? data.topics : [];
    setTopics(list);
    setLoading(false);
    return list;
  }, []);

  useEffect(() => {
    load().then((list) => {
      if (list.length) selectTopic(list[0]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  function selectTopic(t: Topic) {
    setSelectedSlug(t.slug);
    setQuestions(t.questions.length ? t.questions.map((q) => ({ ...q, options: [...q.options] })) : [{ ...EMPTY_QUESTION }]);
    setError("");
    setSavedAt(null);
  }

  const selected = topics.find((t) => t.slug === selectedSlug) ?? null;

  function setQuestionField(qi: number, field: "q" | "explain", val: string) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, [field]: val } : q)));
  }

  function setOption(qi: number, oi: number, val: string) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) } : q)));
  }

  function setAnswer(qi: number, oi: number) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, answer: oi } : q)));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { ...EMPTY_QUESTION, options: ["", "", "", ""] }]);
  }

  function removeQuestion(qi: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== qi));
  }

  function addOption(qi: number) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: [...q.options, ""] } : q)));
  }

  function removeOption(qi: number, oi: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oi);
        const answer = q.answer === oi ? 0 : q.answer > oi ? q.answer - 1 : q.answer;
        return { ...q, options, answer };
      }),
    );
  }

  async function save() {
    if (!selectedSlug) return;
    setError("");
    for (const [i, q] of questions.entries()) {
      if (!q.q.trim()) { setError(`Question ${i + 1} needs question text`); return; }
      if (q.options.some((o) => !o.trim())) { setError(`Question ${i + 1} has an empty option`); return; }
      if (!q.explain.trim()) { setError(`Question ${i + 1} needs an explanation`); return; }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sif101-quiz/${selectedSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      if (!res.ok) { setError((await res.json()).error ?? "Failed to save"); return; }
      setSavedAt(Date.now());
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function resetToDefault() {
    if (!selectedSlug || !selected?.isOverridden) return;
    if (!confirm("Revert this topic's quiz to the shipped default? Your saved edits will be lost.")) return;
    setResetting(true);
    try {
      await fetch(`/api/admin/sif101-quiz/${selectedSlug}`, { method: "DELETE" });
      const list = await load();
      const t = list.find((x) => x.slug === selectedSlug);
      if (t) selectTopic(t);
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted text-[13px]">Loading…</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">SIF 101 Quizzes</h1>
        <p className="text-[14px] text-muted mt-1">
          Edit the "Test your knowledge" quiz shown on each SIF 101 topic page. {topics.length} topics.
        </p>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-6 items-start">
        {/* Topic list */}
        <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
          {topics.map((t) => (
            <button
              key={t.slug}
              onClick={() => selectTopic(t)}
              className={`w-full text-left px-4 py-3 border-b border-rule last:border-0 transition-colors ${
                t.slug === selectedSlug ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-surface"
              }`}
            >
              <p className="text-[12.5px] font-semibold text-heading leading-snug">{t.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono text-muted">{t.questions.length} question{t.questions.length !== 1 ? "s" : ""}</span>
                {t.isOverridden && (
                  <span className="text-[9px] font-bold uppercase tracking-wide text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">Edited</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Editor */}
        {selected && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-heading">{selected.title}</h2>
              <div className="flex items-center gap-2">
                {selected.isOverridden && selected.hasDefault && (
                  <button
                    onClick={resetToDefault}
                    disabled={resetting}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-rule text-[12.5px] text-muted hover:text-body disabled:opacity-50"
                  >
                    {resetting ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                    Reset to default
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="size-3.5 animate-spin" />}
                  {saving ? "Saving…" : "Save quiz"}
                </button>
              </div>
            </div>

            {savedAt && <p className="text-[12px] text-green-600 mb-3 flex items-center gap-1.5"><CheckCircle2 className="size-3.5" /> Saved</p>}
            {error && <p className="text-[12px] text-red-500 mb-3">{error}</p>}

            <div className="space-y-4">
              {questions.map((q, qi) => (
                <div key={qi} className="bg-white rounded-[14px] border border-rule shadow-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-muted bg-surface border border-rule px-1.5 py-0.5 rounded">Q{qi + 1}</span>
                    <button
                      onClick={() => removeQuestion(qi)}
                      disabled={questions.length <= 1}
                      className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss disabled:opacity-30"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <textarea
                    value={q.q}
                    onChange={(e) => setQuestionField(qi, "q", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary resize-none mb-3"
                    placeholder="Question text…"
                  />

                  <div className="space-y-2 mb-3">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`answer-${qi}`}
                          checked={q.answer === oi}
                          onChange={() => setAnswer(qi, oi)}
                          className="size-4 accent-teal-600 shrink-0"
                          title="Mark as correct answer"
                        />
                        <span className="text-[11px] font-mono text-muted w-4 shrink-0">{String.fromCharCode(65 + oi)}.</span>
                        <input
                          value={opt}
                          onChange={(e) => setOption(qi, oi, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary"
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        />
                        <button
                          onClick={() => removeOption(qi, oi)}
                          disabled={q.options.length <= 2}
                          className="size-6 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss disabled:opacity-30 shrink-0"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addOption(qi)} className="flex items-center gap-1.5 text-[12px] text-primary hover:underline">
                      <Plus className="size-3.5" /> Add option
                    </button>
                  </div>

                  <textarea
                    value={q.explain}
                    onChange={(e) => setQuestionField(qi, "explain", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary resize-none"
                    placeholder="Explanation shown after answering…"
                  />
                </div>
              ))}
            </div>

            <button onClick={addQuestion} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-[8px] border border-dashed border-rule text-[13px] text-muted hover:text-primary hover:border-primary">
              <Plus className="size-4" /> Add question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
