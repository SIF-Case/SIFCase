"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Loader2, Eye, EyeOff, Wand2 } from "lucide-react";

type Mention = {
  _id: string;
  outlet: string;
  url: string;
  title: string;
  tag: string;
  imageUrl: string;
  order: number;
  published: boolean;
};

function MentionModal({
  m,
  onClose,
  onSaved,
}: {
  m: Mention | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [outlet, setOutlet] = useState(m?.outlet ?? "");
  const [url, setUrl] = useState(m?.url ?? "");
  const [title, setTitle] = useState(m?.title ?? "");
  const [tag, setTag] = useState(m?.tag ?? "");
  const [imageUrl, setImageUrl] = useState(m?.imageUrl ?? "");
  const [order, setOrder] = useState(m?.order ?? 0);
  const [published, setPublished] = useState(m?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  async function autoFetch() {
    setError("");
    if (!url.trim()) { setError("Paste the article URL first"); return; }
    try {
      new URL(url.trim());
    } catch {
      setError("URL is not valid — include https://");
      return;
    }

    setFetching(true);
    try {
      const res = await fetch(`/api/admin/media-mentions/fetch-meta?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Auto-fetch failed"); return; }
      if (data.title) setTitle(data.title);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      if (data.tag) setTag(data.tag);
      if (data.outlet && !outlet.trim()) setOutlet(data.outlet);
      if (!data.title && !data.imageUrl) setError("Couldn't find title/image on that page — fill in manually");
    } catch {
      setError("Auto-fetch failed — fill in manually");
    } finally {
      setFetching(false);
    }
  }

  async function save() {
    setError("");
    if (!outlet.trim()) { setError("Outlet name is required"); return; }
    if (!url.trim()) { setError("URL is required"); return; }
    if (!title.trim()) { setError("Title is required"); return; }
    try {
      new URL(url.trim());
    } catch {
      setError("URL is not valid — include https://");
      return;
    }

    setSaving(true);
    try {
      const payload = { outlet: outlet.trim(), url: url.trim(), title: title.trim(), tag: tag.trim(), imageUrl: imageUrl.trim(), order, published };
      const res = m
        ? await fetch(`/api/admin/media-mentions/${m._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/media-mentions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const text = await res.text();
        let message = `Failed to save (${res.status})`;
        try { message = JSON.parse(text).error ?? message; } catch { /* non-JSON error body, e.g. a 500 HTML page */ }
        setError(message);
        return;
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save — network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[14px] border border-rule shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-white z-10">
          <h2 className="text-[16px] font-bold text-heading">{m ? "Edit Mention" : "New Mention"}</h2>
          <button onClick={onClose} className="size-7 inline-flex items-center justify-center rounded-[6px] text-muted hover:text-body">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Outlet name *</label>
            <input
              value={outlet}
              onChange={(e) => setOutlet(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary"
              placeholder="e.g. Moneycontrol"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Article URL *</label>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary"
                placeholder="https://www.moneycontrol.com/news/..."
              />
              <button
                type="button"
                onClick={autoFetch}
                disabled={fetching || saving}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-rule text-[12.5px] font-semibold text-primary hover:bg-primary-tint disabled:opacity-50"
                title="Pull title, cover image and outlet name from this URL's page metadata"
              >
                {fetching ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                {fetching ? "Fetching…" : "Auto-fetch"}
              </button>
            </div>
            <p className="text-[11px] text-muted mt-1">
              Card shows the image/title/tag below by default; clicking "Read Article" expands this URL as an inline iframe. If the outlet blocks framing (X-Frame-Options), the embed renders blank — "View on {"{Outlet}"}" always opens it in a new tab regardless.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Article title *</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary resize-none"
              placeholder="One Category, Three Strategies: How SEBI's New SIFs Are Redefining Equity Long-Short Investing"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Tag / subline (optional)</label>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary"
              placeholder="e.g. Specialised Investment Funds"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1.5">Cover image URL (optional)</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:border-primary"
              placeholder="https://…"
            />
          </div>

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
                Published
              </label>
            </div>
          </div>

          {error && <p className="text-[12px] text-red-500">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving || fetching}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {saving ? "Saving…" : "Save"}
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

export default function AdminMediaMentions() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Mention | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/media-mentions");
    const data = await res.json();
    setMentions(Array.isArray(data) ? data.sort((a: Mention, b: Mention) => a.order - b.order) : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function del(m: Mention) {
    if (!confirm(`Delete "${m.outlet}" mention?`)) return;
    await fetch(`/api/admin/media-mentions/${m._id}`, { method: "DELETE" });
    load();
  }

  async function togglePublished(m: Mention) {
    await fetch(`/api/admin/media-mentions/${m._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !m.published }),
    });
    load();
  }

  async function move(m: Mention, dir: -1 | 1) {
    const sorted = [...mentions].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((x) => x._id === m._id);
    const j = idx + dir;
    if (j < 0 || j >= sorted.length) return;
    const other = sorted[j];
    await Promise.all([
      fetch(`/api/admin/media-mentions/${m._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: other.order }),
      }),
      fetch(`/api/admin/media-mentions/${other._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: m.order }),
      }),
    ]);
    load();
  }

  const sorted = [...mentions].sort((a, b) => a.order - b.order);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">Media Mentions</h1>
          <p className="text-[14px] text-muted mt-1">
            Press coverage shown in the homepage "As Featured In" section — each one embeds the article as an iframe.
          </p>
        </div>
        <button
          onClick={() => setModal(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover shadow-btn"
        >
          <Plus className="size-4" /> New Mention
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted text-[13px]">Loading…</div>
      ) : mentions.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted text-[14px] mb-3">No media mentions yet.</p>
          <button onClick={() => setModal(null)} className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold mx-auto">
            <Plus className="size-4" /> Add your first mention
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
          {sorted.map((m, idx) => (
            <div key={m._id} className="flex items-start gap-3 px-5 py-4 border-b border-rule last:border-0 hover:bg-surface">
              <div className="flex flex-col gap-0.5 mt-0.5 shrink-0">
                <button onClick={() => move(m, -1)} disabled={idx === 0}
                  className="size-5 inline-flex items-center justify-center rounded-[4px] border border-rule text-muted hover:text-primary disabled:opacity-30">
                  <ChevronUp className="size-3" />
                </button>
                <button onClick={() => move(m, 1)} disabled={idx === sorted.length - 1}
                  className="size-5 inline-flex items-center justify-center rounded-[4px] border border-rule text-muted hover:text-primary disabled:opacity-30">
                  <ChevronDown className="size-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">{m.outlet}</span>
                  {!m.published && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rule bg-surface text-muted">Hidden</span>
                  )}
                </div>
                <p className="text-[13px] font-semibold text-heading mb-1">{m.title}</p>
                {m.tag && <p className="text-[11.5px] text-muted mb-1">{m.tag}</p>}
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[11.5px] text-primary hover:underline break-all">
                  {m.url}
                </a>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => togglePublished(m)}
                  className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-body transition"
                  title={m.published ? "Hide" : "Publish"}>
                  {m.published ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <button onClick={() => setModal(m)}
                  className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-primary hover:border-primary transition"
                  title="Edit">
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => del(m)}
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
        <MentionModal m={modal} onClose={() => setModal(undefined)} onSaved={load} />
      )}
    </div>
  );
}
