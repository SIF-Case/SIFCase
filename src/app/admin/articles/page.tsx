"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, RefreshCw } from "lucide-react";

type Article = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  category: string;
  readTime: number;
  publishedAt: string | null;
  createdAt: string;
};

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/articles");
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
    </div>
  );
}
