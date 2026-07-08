"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Loader2, Eye, EyeOff } from "lucide-react";

type Option = { text: string; value: number };

type Question = {
  _id: string;
  question: string;
  options: Option[];
  context: string;
  order: number;
  published: boolean;
};

const EMPTY_OPTION: Option = { text: "", value: 0 };

function QuestionModal({
  q,
  onClose,
  onSaved,
}: {
  q: Question | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [question, setQuestion] = useState(q?.question ?? "");
  const [options, setOptions] = useState<Option[]>(
    q?.options?.length
      ? q.options
      : [EMPTY_OPTION, EMPTY_OPTION, EMPTY_OPTION, EMPTY_OPTION].map((o) => ({ ...o })),
  );
  const [context, setContext] = useState(q?.context ?? "");
  const [order, setOrder] = useState(q?.order ?? 0);
  const [published, setPublished] = useState(q?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setOption(i: number, field: keyof Option, val: string | number) {
    setOptions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
  }

  function addOption() {
    setOptions((prev) => [...prev, { ...EMPTY_OPTION }]);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setError("");
    const validOpts = options.filter((o) => o.text.trim());
    if (!question.trim()) { setError("Question is required"); return; }
    if (validOpts.length < 2) { setError("At least 2 options required"); return; }

    setSaving(true);
    try {
      const payload = { question: question.trim(), options: validOpts, context: context.trim(), order, published };
      const res = q
        ? await fetch(`/api/admin/suitability/${q._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/suitability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) { setError((await res.json()).error ?? "Failed to save"); return; }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[14px] border border-rule shadow-card w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-white z-10">
          <h2 className="text-[16px] font-bold text-heading">{q ? "Edit Question" : "New Question"}</h2>
          <button onClick={onClose} className="size-7 inline-flex items-center justify-center rounded-[6px] text-muted hover:text-body">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Question text */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Question *</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary resize-none"
              placeholder="e.g. What is your primary investment goal?"
            />
          </div>

          {/* Options with values */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted">
                Options * <span className="normal-case font-normal">(min 2)</span>
              </label>
              <span className="text-[11px] text-muted">Value is used to score the quiz</span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[24px_1fr_80px_28px] gap-2 mb-1.5 px-1">
              <span />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Option text</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted text-center">Value</span>
              <span />
            </div>

            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="grid grid-cols-[24px_1fr_80px_28px] gap-2 items-center">
                  <span className="text-[11px] font-mono text-muted text-center">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <input
                    value={opt.text}
                    onChange={(e) => setOption(i, "text", e.target.value)}
                    className="px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary"
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  />
                  <input
                    type="number"
                    value={opt.value}
                    onChange={(e) => setOption(i, "value", Number(e.target.value))}
                    className="px-2 py-2 rounded-[8px] border border-rule text-[13px] text-center focus:outline-none focus:border-primary"
                    placeholder="0"
                  />
                  <button
                    onClick={() => removeOption(i)}
                    disabled={options.length <= 2}
                    className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss disabled:opacity-30"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addOption} className="mt-2.5 flex items-center gap-1.5 text-[12px] text-primary hover:underline">
              <Plus className="size-3.5" /> Add option
            </button>
          </div>

          {/* Order + Published */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Display Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-[13px] text-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="size-4 accent-teal-600"
                />
                Published (visible on quiz)
              </label>
            </div>
          </div>

          {/* Context hint */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">
              Why we ask this <span className="normal-case font-normal">(shown as hint to user)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary resize-none"
              placeholder="Brief explanation of why this question matters…"
            />
          </div>

          {error && <p className="text-[12px] text-red-500">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {saving ? "Saving…" : "Save question"}
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-[8px] border border-rule text-[13px] text-muted hover:text-body">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSuitability() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Question | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/suitability");
    const data = await res.json();
    setQuestions(Array.isArray(data) ? data.sort((a: Question, b: Question) => a.order - b.order) : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function del(q: Question) {
    if (!confirm(`Delete "${q.question}"?`)) return;
    await fetch(`/api/admin/suitability/${q._id}`, { method: "DELETE" });
    load();
  }

  async function togglePublished(q: Question) {
    await fetch(`/api/admin/suitability/${q._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !q.published }),
    });
    load();
  }

  async function move(q: Question, dir: -1 | 1) {
    const sorted = [...questions].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((x) => x._id === q._id);
    const j = idx + dir;
    if (j < 0 || j >= sorted.length) return;
    const other = sorted[j];
    await Promise.all([
      fetch(`/api/admin/suitability/${q._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: other.order }),
      }),
      fetch(`/api/admin/suitability/${other._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: q.order }),
      }),
    ]);
    load();
  }

  const sorted = [...questions].sort((a, b) => a.order - b.order);

  return (
    <div className="p-8">
      {/* Navigation tabs */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-rule">
        <Link
          href="/admin/suitability"
          className="px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold"
        >
          Suitability Quiz
        </Link>
        <Link
          href="/admin/knowledge-quiz"
          className="px-4 py-2 rounded-[8px] border border-rule text-[13px] font-semibold text-muted hover:bg-surface"
        >
          Knowledge Quiz (SIF-101)
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">Suitability Quiz</h1>
          <p className="text-[14px] text-muted mt-1">
            {questions.length} question{questions.length !== 1 ? "s" : ""} · shown on the "Find my Ideal SIF" quiz
          </p>
        </div>
        <button
          onClick={() => setModal(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover shadow-btn"
        >
          <Plus className="size-4" /> New Question
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted text-[13px]">Loading…</div>
      ) : questions.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted text-[14px] mb-3">No questions yet.</p>
          <button onClick={() => setModal(null)} className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold mx-auto">
            <Plus className="size-4" /> Add your first question
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
          {sorted.map((q, idx) => (
            <div key={q._id} className="flex items-start gap-3 px-5 py-4 border-b border-rule last:border-0 hover:bg-surface">
              {/* Order arrows */}
              <div className="flex flex-col gap-0.5 mt-0.5 shrink-0">
                <button onClick={() => move(q, -1)} disabled={idx === 0}
                  className="size-5 inline-flex items-center justify-center rounded-[4px] border border-rule text-muted hover:text-primary disabled:opacity-30">
                  <ChevronUp className="size-3" />
                </button>
                <button onClick={() => move(q, 1)} disabled={idx === sorted.length - 1}
                  className="size-5 inline-flex items-center justify-center rounded-[4px] border border-rule text-muted hover:text-primary disabled:opacity-30">
                  <ChevronDown className="size-3" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-muted bg-surface border border-rule px-1.5 py-0.5 rounded">Q{idx + 1}</span>
                  <p className="text-[13.5px] font-semibold text-heading">{q.question}</p>
                </div>
                {/* Options with values */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {q.options.map((opt, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface border border-rule text-[11px] text-body">
                      <span className="font-mono text-muted">{String.fromCharCode(65 + i)}.</span>
                      {opt.text}
                      <span className="ml-1 px-1 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-[10px] font-semibold">
                        {opt.value}
                      </span>
                    </span>
                  ))}
                </div>
                {q.context && (
                  <p className="text-[11.5px] text-muted mt-1.5 italic line-clamp-1">💡 {q.context}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!q.published && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rule bg-surface text-muted">Hidden</span>
                )}
                <button onClick={() => togglePublished(q)}
                  className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-body transition"
                  title={q.published ? "Hide" : "Publish"}>
                  {q.published ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <button onClick={() => setModal(q)}
                  className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-primary hover:border-primary transition"
                  title="Edit">
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => del(q)}
                  className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 transition"
                  title="Delete">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== undefined && (
        <QuestionModal q={modal} onClose={() => setModal(undefined)} onSaved={load} />
      )}
    </div>
  );
}
