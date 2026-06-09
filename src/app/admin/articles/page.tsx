"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, RefreshCw, ArrowUpDown, X, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

type Article = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  category: string;
  subcategory: string;
  order: number;
  readTime: number;
  publishedAt: string | null;
  createdAt: string;
};

function ReorderModal({ articles, onClose, onSaved }: {
  articles: Article[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = useMemo(() => {
    const order: string[] = [];
    const grouped: Record<string, Article[]> = {};
    for (const a of articles.filter((x) => x.category === "General")) {
      const sub = a.subcategory?.trim() || "General";
      if (!grouped[sub]) { grouped[sub] = []; order.push(sub); }
      grouped[sub].push(a);
    }
    for (const sub of order) {
      grouped[sub].sort((x, y) => (x.order ?? 0) - (y.order ?? 0)
        || (new Date(y.publishedAt ?? 0).getTime() - new Date(x.publishedAt ?? 0).getTime()));
    }
    return { order, grouped };
  }, [articles]);

  const [groups, setGroups] = useState(initial.grouped);
  const [sectionOrder, setSectionOrder] = useState(initial.order);
  const [saving, setSaving] = useState(false);

  function move(sub: string, idx: number, dir: -1 | 1) {
    setGroups((g) => {
      const list = [...g[sub]];
      const j = idx + dir;
      if (j < 0 || j >= list.length) return g;
      [list[idx], list[j]] = [list[j], list[idx]];
      return { ...g, [sub]: list };
    });
  }

  function moveSection(idx: number, dir: -1 | 1) {
    setSectionOrder((order) => {
      const next = [...order];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return order;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const items = sectionOrder.flatMap((sub) => groups[sub].map((a, i) => ({ id: a._id, order: i })));
      await Promise.all([
        fetch("/api/admin/articles/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        }),
        fetch("/api/admin/article-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reorder_subcategories", value: "", category: "General", order: sectionOrder }),
        }),
      ]);
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
          <div>
            <h2 className="text-[16px] font-bold text-heading">Reorder articles</h2>
            <p className="text-[11.5px] text-muted mt-0.5">Sets the display order within each sub-category on /read.</p>
          </div>
          <button onClick={onClose} className="size-7 inline-flex items-center justify-center rounded-[6px] text-muted hover:text-body">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {sectionOrder.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-8">No General-category articles to reorder yet.</p>
          ) : sectionOrder.map((sub, sIdx) => (
            <div key={sub}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-primary">{sub}</p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0}
                    className="size-5 inline-flex items-center justify-center rounded-[4px] border border-rule text-muted hover:text-primary hover:border-primary/30 disabled:opacity-30">
                    <ChevronUp className="size-3" />
                  </button>
                  <button type="button" onClick={() => moveSection(sIdx, 1)} disabled={sIdx === sectionOrder.length - 1}
                    className="size-5 inline-flex items-center justify-center rounded-[4px] border border-rule text-muted hover:text-primary hover:border-primary/30 disabled:opacity-30">
                    <ChevronDown className="size-3" />
                  </button>
                </div>
              </div>
              <div className="border border-rule rounded-[10px] overflow-hidden">
                {groups[sub].map((a, idx) => (
                  <div key={a._id} className="flex items-center gap-3 px-4 py-2.5 border-b border-rule last:border-0">
                    <span className="text-[11px] font-mono text-faint w-5 shrink-0">{idx + 1}</span>
                    <p className="flex-1 min-w-0 text-[13px] font-medium text-body truncate">{a.title}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => move(sub, idx, -1)} disabled={idx === 0}
                        className="size-6 inline-flex items-center justify-center rounded-[5px] border border-rule text-muted hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => move(sub, idx, 1)} disabled={idx === groups[sub].length - 1}
                        className="size-6 inline-flex items-center justify-center rounded-[5px] border border-rule text-muted hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <button onClick={save} disabled={saving || initial.order.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null} {saving ? "Saving…" : "Save order"}
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

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reorderOpen, setReorderOpen] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/articles?all=1");
    const data = await res.json();
    setArticles(data.articles ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function del(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    fetch_();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">Articles</h1>
          <p className="text-[14px] text-muted mt-1">{total} total articles</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetch_} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
            <RefreshCw className="size-3.5" />
          </button>
          <button onClick={() => setReorderOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] font-semibold text-muted hover:text-body"
            title="Set the display order of articles within each sub-category on /read">
            <ArrowUpDown className="size-3.5" /> Reorder
          </button>
          <Link href="/admin/articles/new"
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover shadow-btn">
            <Plus className="size-4" /> New Article
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_100px_80px_80px_120px_100px] gap-4 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
          <div>Title</div><div>Category</div><div>Read Time</div><div>Status</div><div>Published</div><div>Actions</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
        ) : articles.length === 0 ? (
          <div className="py-16 text-center text-muted text-[13px]">No articles yet. <Link href="/admin/articles/new" className="text-primary">Create one →</Link></div>
        ) : articles.map((a) => (
          <div key={a._id} className="grid grid-cols-[minmax(0,2fr)_100px_80px_80px_120px_100px] gap-4 px-5 py-3.5 border-b border-rule last:border-0 items-center hover:bg-surface">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-heading truncate">{a.title}</p>
              <p className="text-[11px] font-mono text-faint">/read/{a.slug}</p>
            </div>
            <div className="text-[11px] text-muted">{a.category}</div>
            <div className="text-[11px] text-muted">{a.readTime} min</div>
            <div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${a.status === "published" ? "text-gain bg-green-50 border-green-200" : "text-muted bg-surface border-rule"}`}>
                {a.status}
              </span>
            </div>
            <div className="text-[11px] text-muted">{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-IN") : "—"}</div>
            <div className="flex items-center gap-1.5">
              <Link href={`/read/${a.slug}`} target="_blank"
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-body transition" title="Preview">
                <Eye className="size-3.5" />
              </Link>
              <Link href={`/admin/articles/${a._id}/edit`}
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-primary hover:border-primary transition" title="Edit">
                <Pencil className="size-3.5" />
              </Link>
              <button onClick={() => del(a._id, a.title)}
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 transition" title="Delete">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {reorderOpen && (
        <ReorderModal articles={articles} onClose={() => setReorderOpen(false)} onSaved={fetch_} />
      )}
    </div>
  );
}
