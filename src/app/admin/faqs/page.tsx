"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Loader2, Tag, Eye, EyeOff } from "lucide-react";

type Faq = {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
};

function FaqModal({ faq, categories, onClose, onSaved }: {
  faq: Faq | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [category, setCategory] = useState(faq?.category ?? categories[0] ?? "General");
  const [published, setPublished] = useState(faq?.published ?? true);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      if (faq) {
        await fetch(`/api/admin/faqs/${faq._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, answer, category, published }),
        });
      } else {
        await fetch("/api/admin/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, answer, category, published }),
        });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={onClose}>
      <div className="bg-white rounded-[14px] border border-rule shadow-card w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-white">
          <h2 className="text-[16px] font-bold text-heading">{faq ? "Edit FAQ" : "New FAQ"}</h2>
          <button onClick={onClose} className="size-7 inline-flex items-center justify-center rounded-[6px] text-muted hover:text-body">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary"
              placeholder="e.g. What is the minimum investment for a SIF?"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary resize-y"
              placeholder="Write the answer…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-[13px] text-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="size-4"
                />
                Published (visible on site)
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={save} disabled={saving || !question.trim() || !answer.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null} {saving ? "Saving…" : "Save"}
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

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<string[]>(["General"]);
  const [loading, setLoading] = useState(true);
  const [modalFaq, setModalFaq] = useState<Faq | null | undefined>(undefined); // undefined = closed

  const load = useCallback(async () => {
    setLoading(true);
    const [faqsRes, catsRes] = await Promise.all([
      fetch("/api/admin/faqs"),
      fetch("/api/admin/faq-categories"),
    ]);
    const faqsData = await faqsRes.json();
    const catsData = await catsRes.json();
    setFaqs(faqsData.faqs ?? []);
    setCategories(catsData.categories ?? ["General"]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const g: Record<string, Faq[]> = {};
    for (const cat of categories) g[cat] = [];
    for (const f of faqs) {
      if (!g[f.category]) g[f.category] = [];
      g[f.category].push(f);
    }
    for (const cat of Object.keys(g)) g[cat].sort((a, b) => a.order - b.order);
    return g;
  }, [faqs, categories]);

  async function addCategory() {
    const name = prompt("New category name:");
    if (!name?.trim()) return;
    const res = await fetch("/api/admin/faq-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", value: name.trim() }),
    });
    if (res.ok) load();
    else alert((await res.json()).error ?? "Failed");
  }

  async function renameCategory(oldValue: string) {
    const name = prompt("Rename category:", oldValue);
    if (!name?.trim() || name.trim() === oldValue) return;
    const res = await fetch("/api/admin/faq-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", oldValue, value: name.trim() }),
    });
    if (res.ok) load();
    else alert((await res.json()).error ?? "Failed");
  }

  async function deleteCategory(name: string) {
    if (!confirm(`Delete category "${name}"? FAQs in it will move to "General".`)) return;
    await fetch("/api/admin/faq-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", value: name }),
    });
    load();
  }

  async function del(id: string, question: string) {
    if (!confirm(`Delete "${question}"?`)) return;
    await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublished(faq: Faq) {
    await fetch(`/api/admin/faqs/${faq._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !faq.published }),
    });
    load();
  }

  async function move(faq: Faq, dir: -1 | 1) {
    const list = grouped[faq.category];
    const idx = list.findIndex((f) => f._id === faq._id);
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const other = list[j];
    await Promise.all([
      fetch(`/api/admin/faqs/${faq._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: other.order }),
      }),
      fetch(`/api/admin/faqs/${other._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: faq.order }),
      }),
    ]);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">FAQs</h1>
          <p className="text-[14px] text-muted mt-1">{faqs.length} total questions · shown on the homepage</p>
        </div>
        <button onClick={() => setModalFaq(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover shadow-btn">
          <Plus className="size-4" /> New FAQ
        </button>
      </div>

      {/* Category bar */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-rule bg-white text-[12px] font-semibold text-body">
            <Tag className="size-3 text-muted" />
            {cat}
            <span className="text-faint font-normal">({grouped[cat]?.length ?? 0})</span>
            <button onClick={() => renameCategory(cat)} className="ml-1 text-muted hover:text-primary" title="Rename">
              <Pencil className="size-3" />
            </button>
            {cat !== "General" && (
              <button onClick={() => deleteCategory(cat)} className="text-muted hover:text-loss" title="Delete">
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
        ))}
        <button onClick={addCategory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-rule-strong text-[12px] font-semibold text-muted hover:text-primary hover:border-primary transition">
          <Plus className="size-3" /> Add category
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
      ) : faqs.length === 0 ? (
        <div className="py-16 text-center text-muted text-[13px]">No FAQs yet.</div>
      ) : (
        <div className="space-y-6">
          {categories.filter((cat) => grouped[cat]?.length).map((cat) => (
            <div key={cat}>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-primary mb-2">{cat}</p>
              <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
                {grouped[cat].map((f, idx) => (
                  <div key={f._id} className="flex items-start gap-3 px-5 py-3.5 border-b border-rule last:border-0 hover:bg-surface">
                    <div className="flex flex-col gap-0.5 mt-0.5 shrink-0">
                      <button onClick={() => move(f, -1)} disabled={idx === 0}
                        className="size-5 inline-flex items-center justify-center rounded-[4px] border border-rule text-muted hover:text-primary disabled:opacity-30">
                        <ChevronUp className="size-3" />
                      </button>
                      <button onClick={() => move(f, 1)} disabled={idx === grouped[cat].length - 1}
                        className="size-5 inline-flex items-center justify-center rounded-[4px] border border-rule text-muted hover:text-primary disabled:opacity-30">
                        <ChevronDown className="size-3" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-heading">{f.question}</p>
                      <p className="text-[12.5px] text-muted mt-1 line-clamp-2">{f.answer}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!f.published && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rule bg-surface text-muted">Hidden</span>
                      )}
                      <button onClick={() => togglePublished(f)}
                        className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-body transition"
                        title={f.published ? "Hide from site" : "Publish to site"}>
                        {f.published ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      </button>
                      <button onClick={() => setModalFaq(f)}
                        className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-primary hover:border-primary transition" title="Edit">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => del(f._id, f.question)}
                        className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 transition" title="Delete">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalFaq !== undefined && (
        <FaqModal faq={modalFaq} categories={categories} onClose={() => setModalFaq(undefined)} onSaved={load} />
      )}
    </div>
  );
}
