"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw, Plus, Trash2, Eye, EyeOff, FileText, Rss,
  Search, ChevronLeft, ChevronRight, Loader2, X, ExternalLink,
} from "lucide-react";

type RssFeed = { name: string; url: string; enabled: boolean };

type NewsConfig = {
  keywords: string[];
  rssFeeds: RssFeed[];
  aiPrompt: string;
  maxItemsPerFetch: number;
  retentionDays: number;
};

type NewsItem = {
  _id: string;
  title: string;
  url: string;
  source: string;
  aiSummary: string;
  originalExcerpt: string;
  imageUrl: string;
  publishedAt: string;
  isVisible: boolean;
  promotedArticleId: string | null;
};

const DEFAULT_PROMPT =
  "You are a financial news summariser for SIFcase, an Indian SIF (Specialised Investment Fund) education platform. Summarise the following news item in 1-2 concise sentences. Focus on what matters to SIF investors. Be factual, professional, and avoid hype.";

export default function AdminNews() {
  const [tab, setTab] = useState<"config" | "feed">("config");

  // Config state
  const [config, setConfig] = useState<NewsConfig>({
    keywords: [],
    rssFeeds: [],
    aiPrompt: DEFAULT_PROMPT,
    maxItemsPerFetch: 30,
    retentionDays: 30,
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{ stored: number; fetched: number; skipped: number; errors: number } | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [newFeed, setNewFeed] = useState({ name: "", url: "" });

  // Feed state
  const [items, setItems] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sources, setSources] = useState<string[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    const res = await fetch("/api/admin/news-config");
    const data = await res.json();
    if (data.config) setConfig(data.config);
    setConfigLoading(false);
  }, []);

  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    const params = new URLSearchParams({ page: String(page), q: search });
    if (sourceFilter) params.set("source", sourceFilter);
    if (visibilityFilter) params.set("visibility", visibilityFilter);
    const res = await fetch(`/api/admin/news-items?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setSources(data.sources ?? []);
    setFeedLoading(false);
  }, [page, search, sourceFilter, visibilityFilter]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  useEffect(() => { if (tab === "feed") fetchFeed(); }, [tab, fetchFeed]);

  async function saveConfig() {
    setConfigSaving(true);
    setConfigMsg(null);
    const res = await fetch("/api/admin/news-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setConfigSaving(false);
    setConfigMsg(res.ok ? "Saved." : "Failed to save.");
    setTimeout(() => setConfigMsg(null), 3000);
  }

  async function triggerFetch() {
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await fetch("/api/admin/news-trigger", { method: "POST" });
      const data = await res.json();
      setFetchResult(data);
      if (tab === "feed") fetchFeed();
    } catch {
      setFetchResult(null);
    }
    setFetching(false);
  }

  function addKeyword() {
    const kw = newKeyword.trim();
    if (!kw || config.keywords.includes(kw)) return;
    setConfig(c => ({ ...c, keywords: [...c.keywords, kw] }));
    setNewKeyword("");
  }

  function removeKeyword(kw: string) {
    setConfig(c => ({ ...c, keywords: c.keywords.filter(k => k !== kw) }));
  }

  function addFeed() {
    const name = newFeed.name.trim();
    const url = newFeed.url.trim();
    if (!name || !url) return;
    setConfig(c => ({ ...c, rssFeeds: [...c.rssFeeds, { name, url, enabled: true }] }));
    setNewFeed({ name: "", url: "" });
  }

  function removeFeed(idx: number) {
    setConfig(c => ({ ...c, rssFeeds: c.rssFeeds.filter((_, i) => i !== idx) }));
  }

  function toggleFeedEnabled(idx: number) {
    setConfig(c => ({
      ...c,
      rssFeeds: c.rssFeeds.map((f, i) => i === idx ? { ...f, enabled: !f.enabled } : f),
    }));
  }

  async function toggleVisibility(item: NewsItem) {
    setActionLoading(item._id + "vis");
    await fetch(`/api/admin/news-items/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !item.isVisible }),
    });
    setItems(prev => prev.map(i => i._id === item._id ? { ...i, isVisible: !i.isVisible } : i));
    setActionLoading(null);
  }

  async function promote(item: NewsItem) {
    setActionLoading(item._id + "promote");
    const res = await fetch(`/api/admin/news-items/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "promote" }),
    });
    const data = await res.json();
    if (data.articleId) {
      window.open(`/admin/articles/${data.articleId}/edit`, "_blank");
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, promotedArticleId: data.articleId } : i));
    }
    setActionLoading(null);
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this news item?")) return;
    setActionLoading(id + "del");
    await fetch(`/api/admin/news-items/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i._id !== id));
    setTotal(t => t - 1);
    setActionLoading(null);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">SIF News</h1>
          <p className="text-[14px] text-muted mt-1">Configure news sources and manage the fetched news feed</p>
        </div>
        <button
          onClick={triggerFetch}
          disabled={fetching}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {fetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {fetching ? "Fetching…" : "Fetch Now"}
        </button>
      </div>

      {fetchResult && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-[10px] text-[13px] text-green-700 flex items-center gap-4">
          <span>Fetch complete —</span>
          <span><strong>{fetchResult.stored}</strong> new items stored</span>
          <span className="text-green-500">{fetchResult.fetched} found · {fetchResult.skipped} skipped · {fetchResult.errors} errors</span>
          <button onClick={() => setFetchResult(null)} className="ml-auto"><X className="size-3.5" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-rule">
        {(["config", "feed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted hover:text-body"}`}
          >
            {t === "config" ? "Configuration" : `News Feed (${total})`}
          </button>
        ))}
      </div>

      {/* ── Config Tab ──────────────────────────────────────────────────────── */}
      {tab === "config" && (
        <div className="space-y-6 max-w-3xl">
          {configLoading ? (
            <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
          ) : (
            <>
              {/* Keywords */}
              <div className="bg-white rounded-[14px] border border-rule shadow-card p-5">
                <h2 className="text-[14px] font-bold text-heading mb-1">Search Keywords</h2>
                <p className="text-[12px] text-muted mb-4">Google News is searched for each keyword daily. Use specific terms for better results.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {config.keywords.map((kw) => (
                    <span key={kw} className="flex items-center gap-1.5 text-[12px] bg-mist border border-rule px-2.5 py-1 rounded-full">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="text-muted hover:text-loss"><X className="size-3" /></button>
                    </span>
                  ))}
                  {config.keywords.length === 0 && <span className="text-[12px] text-faint">No keywords yet</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addKeyword()}
                    placeholder="e.g. Specialised Investment Fund India"
                    className="flex-1 h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] outline-none focus:border-primary"
                  />
                  <button onClick={addKeyword} className="flex items-center gap-1.5 px-3 h-9 rounded-[8px] border border-rule text-[12px] text-muted hover:text-primary hover:border-primary/40">
                    <Plus className="size-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* RSS Feeds */}
              <div className="bg-white rounded-[14px] border border-rule shadow-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Rss className="size-4 text-muted" />
                  <h2 className="text-[14px] font-bold text-heading">RSS Feeds</h2>
                </div>
                <p className="text-[12px] text-muted mb-4">Add custom RSS feeds from financial news sites (Economic Times, Mint, etc.)</p>

                {config.rssFeeds.length > 0 && (
                  <div className="border border-rule rounded-[10px] overflow-hidden mb-4">
                    <div className="grid grid-cols-[1fr_2fr_80px_40px] gap-3 px-4 py-2 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
                      <div>Name</div><div>URL</div><div>Enabled</div><div></div>
                    </div>
                    {config.rssFeeds.map((feed, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_2fr_80px_40px] gap-3 px-4 py-2.5 border-b border-rule last:border-0 items-center">
                        <div className="text-[12px] text-body truncate">{feed.name}</div>
                        <div className="text-[11px] text-muted font-mono truncate">{feed.url}</div>
                        <div>
                          <button
                            onClick={() => toggleFeedEnabled(idx)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${feed.enabled ? "text-gain bg-green-50 border-green-200" : "text-muted bg-mist border-rule"}`}
                          >
                            {feed.enabled ? "On" : "Off"}
                          </button>
                        </div>
                        <div>
                          <button onClick={() => removeFeed(idx)} className="text-muted hover:text-loss"><Trash2 className="size-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
                  <input
                    value={newFeed.name}
                    onChange={e => setNewFeed(f => ({ ...f, name: e.target.value }))}
                    placeholder="Name (e.g. Economic Times)"
                    className="h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] outline-none focus:border-primary"
                  />
                  <input
                    value={newFeed.url}
                    onChange={e => setNewFeed(f => ({ ...f, url: e.target.value }))}
                    placeholder="RSS URL"
                    className="h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] outline-none focus:border-primary"
                  />
                  <button onClick={addFeed} className="flex items-center gap-1.5 px-3 h-9 rounded-[8px] border border-rule text-[12px] text-muted hover:text-primary hover:border-primary/40">
                    <Plus className="size-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* AI Prompt */}
              <div className="bg-white rounded-[14px] border border-rule shadow-card p-5">
                <h2 className="text-[14px] font-bold text-heading mb-1">AI Summarisation Prompt</h2>
                <p className="text-[12px] text-muted mb-3">This prompt is sent to the AI model configured under Settings → AI Settings → News Summarisation.</p>
                <textarea
                  value={config.aiPrompt}
                  onChange={e => setConfig(c => ({ ...c, aiPrompt: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-[8px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary resize-none"
                />
                <button
                  onClick={() => setConfig(c => ({ ...c, aiPrompt: DEFAULT_PROMPT }))}
                  className="mt-1.5 text-[11px] text-muted hover:text-primary"
                >
                  Reset to default
                </button>
              </div>

              {/* Settings */}
              <div className="bg-white rounded-[14px] border border-rule shadow-card p-5">
                <h2 className="text-[14px] font-bold text-heading mb-4">Fetch Settings</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted mb-1">Max items per fetch</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={config.maxItemsPerFetch}
                      onChange={e => setConfig(c => ({ ...c, maxItemsPerFetch: Number(e.target.value) }))}
                      className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted mb-1">Retention (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={config.retentionDays}
                      onChange={e => setConfig(c => ({ ...c, retentionDays: Number(e.target.value) }))}
                      className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={saveConfig}
                  disabled={configSaving}
                  className="px-5 py-2.5 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {configSaving ? "Saving…" : "Save Configuration"}
                </button>
                {configMsg && <span className="text-[12px] text-gain">{configMsg}</span>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Feed Tab ─────────────────────────────────────────────────────────── */}
      {tab === "feed" && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-rule rounded-[10px] px-3 h-10 shadow-card flex-1 min-w-[200px] max-w-sm">
              <Search className="size-3.5 text-muted shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search news…"
                className="flex-1 text-[13px] bg-transparent outline-none"
              />
            </div>
            <select
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-[10px] border border-rule bg-white text-[13px] text-body outline-none"
            >
              <option value="">All sources</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={visibilityFilter}
              onChange={e => { setVisibilityFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-[10px] border border-rule bg-white text-[13px] text-body outline-none"
            >
              <option value="">All</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
            <button onClick={fetchFeed} className="flex items-center gap-1.5 h-10 px-3 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
              <RefreshCw className="size-3.5" /> Refresh
            </button>
          </div>

          <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
            <div className="grid grid-cols-[60px_minmax(0,2fr)_120px_minmax(0,2fr)_110px_120px] gap-3 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
              <div>Image</div><div>Title</div><div>Source</div><div>AI Summary</div><div>Published</div><div>Actions</div>
            </div>

            {feedLoading ? (
              <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-muted text-[13px]">
                No news items yet. Configure keywords/RSS feeds and click "Fetch Now".
              </div>
            ) : items.map((item) => (
              <div
                key={item._id}
                className={`grid grid-cols-[60px_minmax(0,2fr)_120px_minmax(0,2fr)_110px_120px] gap-3 px-5 py-3 border-b border-rule last:border-0 items-start ${!item.isVisible ? "opacity-50 bg-mist/40" : ""}`}
              >
                <div>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-12 h-10 object-cover rounded-[6px] bg-mist" />
                  ) : (
                    <div className="w-12 h-10 rounded-[6px] bg-mist" />
                  )}
                </div>
                <div className="min-w-0">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-heading hover:text-primary line-clamp-2 flex items-start gap-1">
                    {item.title}
                    <ExternalLink className="size-3 shrink-0 mt-0.5 text-muted" />
                  </a>
                  {item.promotedArticleId && (
                    <span className="text-[9px] font-mono text-primary uppercase tracking-wide mt-0.5 block">Promoted to article</span>
                  )}
                </div>
                <div className="text-[11px] text-muted truncate">{item.source}</div>
                <div className="text-[12px] text-body line-clamp-3">{item.aiSummary || <span className="text-faint italic">No summary</span>}</div>
                <div className="text-[11px] text-muted">{new Date(item.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    title={item.isVisible ? "Hide from landing page" : "Show on landing page"}
                    onClick={() => toggleVisibility(item)}
                    disabled={!!actionLoading}
                    className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-primary hover:border-primary/40 disabled:opacity-40"
                  >
                    {item.isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  </button>
                  <button
                    title={item.promotedArticleId ? "Already promoted" : "Promote to Article draft"}
                    onClick={() => !item.promotedArticleId && promote(item)}
                    disabled={!!actionLoading || !!item.promotedArticleId}
                    className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-gain hover:border-green-300 disabled:opacity-40"
                  >
                    {actionLoading === item._id + "promote"
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <FileText className="size-3.5" />}
                  </button>
                  <button
                    title="Delete"
                    onClick={() => deleteItem(item._id)}
                    disabled={!!actionLoading}
                    className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {pages > 1 && (
              <div className="px-5 py-3 border-t border-rule flex items-center justify-between">
                <span className="text-[12px] text-muted">Page {page} of {pages} · {total} items</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="size-7 inline-flex items-center justify-center rounded-[8px] border border-rule text-muted hover:text-body disabled:opacity-40">
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                    className="size-7 inline-flex items-center justify-center rounded-[8px] border border-rule text-muted hover:text-body disabled:opacity-40">
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
