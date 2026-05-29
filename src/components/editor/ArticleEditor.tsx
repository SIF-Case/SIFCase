"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, Send, ArrowLeft, Loader2, Monitor, Smartphone, ToggleLeft, ToggleRight, Search, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import { RichEditor } from "./RichEditor";
import { ImageUploader } from "./ImageUploader";

type ArticleData = {
  _id?: string;
  slug?: string;
  title: string;
  excerpt: string;
  content: string;
  coverDesktop: string;
  coverMobile: string;
  useSeparateMobile: boolean;
  category: string;
  tags: string;
  status: "draft" | "published";
  authorName: string;
  authorBio: string;
  readTime: number;
  // SEO
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  ogImage: string;
  primaryKeyword: string;
  focusKeyphrase: string;
};

const DEFAULTS: ArticleData = {
  title: "", excerpt: "", content: "", coverDesktop: "", coverMobile: "",
  useSeparateMobile: false, category: "General", tags: "", status: "draft",
  authorName: "SIFcase Team", authorBio: "", readTime: 3,
  seoTitle: "", metaDescription: "", canonicalUrl: "", robotsIndex: true,
  ogImage: "", primaryKeyword: "", focusKeyphrase: "",
};

const CATEGORIES = ["General", "Market Insights", "SIF Education", "Strategy", "Regulatory", "Interviews"];

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url;
}

export function ArticleEditor({ initial }: { initial?: Partial<ArticleData> & { _id?: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<ArticleData>(() => {
    const rawTags = (initial as { tags?: string[] | string } | undefined)?.tags;
    const tagsStr = Array.isArray(rawTags) ? rawTags.join(", ") : (rawTags ?? "");
    return { ...DEFAULTS, ...initial, tags: tagsStr };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverPreview, setCoverPreview] = useState<"desktop" | "mobile">("desktop");

  function set<K extends keyof ArticleData>(key: K, val: ArticleData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function save(status: "draft" | "published") {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    const payload = {
      ...form,
      status,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    let res: Response;
    if (form._id) {
      res = await fetch(`/api/admin/articles/${form._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      res = await fetch("/api/admin/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    router.push("/admin/articles");
  }

  const coverShown = form.useSeparateMobile && coverPreview === "mobile" ? form.coverMobile : form.coverDesktop;

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-rule px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/articles")} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-body">
            <ArrowLeft className="size-4" /> Articles
          </button>
          <span className="text-rule">/</span>
          <span className="text-[13px] font-semibold text-heading truncate max-w-[300px]">{form.title || "New Article"}</span>
        </div>
        <div className="flex items-center gap-2">
          {form._id && form.status === "published" && (
            <a href={`/read/${(initial as { slug?: string })?.slug ?? ""}`} target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-rule text-[12.5px] text-muted hover:text-body">
              <Eye className="size-3.5" /> Preview
            </a>
          )}
          {error && <p className="text-[12px] text-loss">{error}</p>}
          <button onClick={() => save("draft")} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] border border-rule text-[12.5px] font-semibold text-muted hover:text-body disabled:opacity-60">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save Draft
          </button>
          <button onClick={() => save("published")} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] bg-primary text-white text-[12.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 shadow-btn">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Publish
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-[1fr_300px] gap-6 items-start">
        {/* Main editor */}
        <div className="space-y-5">
          {/* Title */}
          <div className="bg-white rounded-[14px] border border-rule shadow-card px-6 py-5">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Article title…"
              className="w-full text-[28px] font-bold text-heading bg-transparent border-none outline-none placeholder:text-faint"
            />
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="Short excerpt shown in article cards…"
              rows={2}
              className="w-full mt-3 text-[14px] text-muted bg-transparent border-none outline-none placeholder:text-faint resize-none"
            />
          </div>

          {/* Cover image */}
          <div className="bg-white rounded-[14px] border border-rule shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-heading">Cover Image</p>
              {/* Mobile/Desktop preview toggle */}
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <Monitor className="size-3.5" />
                <button onClick={() => setCoverPreview(coverPreview === "desktop" ? "mobile" : "desktop")}
                  className="text-primary">
                  {coverPreview === "desktop" ? "Viewing: Desktop" : "Viewing: Mobile"}
                </button>
                <Smartphone className="size-3.5" />
              </div>
            </div>

            {/* Preview */}
            {coverShown && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverShown} alt="Cover preview" className="w-full h-48 object-cover rounded-[10px] border border-rule" />
            )}

            <div className="grid grid-cols-2 gap-4">
              <ImageUploader label="Desktop Cover" value={form.coverDesktop} onChange={(url) => set("coverDesktop", url)} />
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[12px] font-medium text-muted">Mobile Cover</p>
                  <button
                    type="button"
                    onClick={() => set("useSeparateMobile", !form.useSeparateMobile)}
                    className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors">
                    {form.useSeparateMobile ? <ToggleRight className="size-4 text-primary" /> : <ToggleLeft className="size-4" />}
                    {form.useSeparateMobile ? "Enabled" : "Use desktop"}
                  </button>
                </div>
                {form.useSeparateMobile ? (
                  <ImageUploader label="" value={form.coverMobile} onChange={(url) => set("coverMobile", url)} />
                ) : (
                  <div className="rounded-[12px] border-2 border-dashed border-rule flex items-center justify-center h-[140px] text-[12px] text-faint">
                    Using desktop image
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rich editor */}
          <div>
            <p className="text-[12px] font-medium text-muted mb-1.5">Content</p>
            <RichEditor value={form.content} onChange={(html) => set("content", html)} onImageUpload={uploadImage} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-[14px] border border-rule shadow-card p-4 space-y-4">
            <p className="text-[12px] font-semibold text-heading uppercase tracking-widest text-muted">Settings</p>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] text-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Tags <span className="text-faint">(comma separated)</span></label>
              <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
                placeholder="SIF, NAV, returns…"
                className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Author</label>
              <input value={form.authorName} onChange={(e) => set("authorName", e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Author Bio</label>
              <textarea value={form.authorBio} onChange={(e) => set("authorBio", e.target.value)}
                rows={2} placeholder="Short bio shown below article…"
                className="w-full px-3 py-2 rounded-[8px] border border-rule bg-white text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div className="flex items-center justify-between py-1.5 px-3 rounded-[8px] bg-surface border border-rule">
              <span className="text-[11px] text-muted">Read time</span>
              <span className="text-[12px] font-semibold text-body">
                {Math.max(1, Math.round(form.content.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length / 265))} min
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-[14px] border border-rule shadow-card p-4">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3">Status</p>
            <div className="flex gap-2">
              {(["draft", "published"] as const).map((s) => (
                <button key={s} type="button" onClick={() => set("status", s)}
                  className={`flex-1 py-2 rounded-[8px] text-[12px] font-semibold border transition-colors capitalize ${form.status === s ? "bg-primary text-white border-primary" : "border-rule text-muted hover:text-body"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* SEO Panel */}
          <div className="bg-white rounded-[14px] border border-rule shadow-card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="size-3.5 text-primary" />
              <p className="text-[12px] font-semibold text-heading uppercase tracking-widest text-muted">SEO</p>
            </div>

            {/* SERP preview */}
            <div className="rounded-[10px] border border-rule bg-surface p-3">
              <p className="text-[9px] font-mono uppercase tracking-widest text-faint mb-2">Google Preview</p>
              <p className="text-[14px] text-[#1a0dab] font-medium leading-snug truncate">
                {form.seoTitle || form.title || "Page Title"}
              </p>
              <p className="text-[11px] text-[#006621] truncate">sifcase.in/read/{form.slug ?? "article-slug"}</p>
              <p className="text-[11px] text-[#545454] line-clamp-2 mt-0.5">
                {form.metaDescription || form.excerpt || "Meta description will appear here…"}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-muted">Title Tag <span className="text-faint">(50–60 chars)</span></label>
                <span className={`text-[10px] font-mono ${form.seoTitle.length > 60 ? "text-loss" : form.seoTitle.length >= 50 ? "text-gain" : "text-muted"}`}>
                  {form.seoTitle.length}/60
                </span>
              </div>
              <input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)}
                placeholder={form.title || "SEO title…"}
                className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-muted">Meta Description <span className="text-faint">(150–160)</span></label>
                <span className={`text-[10px] font-mono ${form.metaDescription.length > 160 ? "text-loss" : form.metaDescription.length >= 150 ? "text-gain" : "text-muted"}`}>
                  {form.metaDescription.length}/160
                </span>
              </div>
              <textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)}
                rows={3} placeholder={form.excerpt || "Meta description…"}
                className="w-full px-3 py-2 rounded-[8px] border border-rule bg-white text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Focus Keyphrase</label>
              <input value={form.focusKeyphrase} onChange={(e) => set("focusKeyphrase", e.target.value)}
                placeholder="e.g. Specialised Investment Fund"
                className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Primary Keyword</label>
              <input value={form.primaryKeyword} onChange={(e) => set("primaryKeyword", e.target.value)}
                placeholder="e.g. SIF returns India"
                className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">OG Image URL <span className="text-faint">(defaults to cover)</span></label>
              <input value={form.ogImage} onChange={(e) => set("ogImage", e.target.value)}
                placeholder="Leave blank to use desktop cover"
                className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Canonical URL <span className="text-faint">(optional)</span></label>
              <input value={form.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)}
                placeholder="https://sifcase.in/read/…"
                className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {/* Robots + OG preview */}
            <div className="flex items-center justify-between py-2 border-t border-rule">
              <div className="flex items-center gap-2">
                <Globe className="size-3.5 text-muted" />
                <span className="text-[11px] font-medium text-muted">Robots</span>
              </div>
              <button type="button" onClick={() => set("robotsIndex", !form.robotsIndex)}
                className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${form.robotsIndex ? "text-gain" : "text-loss"}`}>
                {form.robotsIndex
                  ? <><CheckCircle2 className="size-3.5" /> index, follow</>
                  : <><AlertCircle className="size-3.5" /> noindex</>}
              </button>
            </div>

            {/* SEO checklist */}
            {form.focusKeyphrase && (() => {
              const kw = form.focusKeyphrase.toLowerCase();
              const checks = [
                { label: "Keyphrase in title", ok: form.title.toLowerCase().includes(kw) },
                { label: "Keyphrase in meta description", ok: form.metaDescription.toLowerCase().includes(kw) },
                { label: "Keyphrase in slug", ok: (form.slug ?? "").toLowerCase().includes(kw.replace(/\s+/g, "-")) },
                { label: "Meta description filled", ok: form.metaDescription.length >= 50 },
                { label: "SEO title set", ok: form.seoTitle.length > 0 },
                { label: "Cover image set", ok: !!form.coverDesktop },
              ];
              const score = checks.filter((c) => c.ok).length;
              return (
                <div className="border-t border-rule pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted">SEO Score</p>
                    <span className={`text-[12px] font-bold ${score >= 5 ? "text-gain" : score >= 3 ? "text-amber-500" : "text-loss"}`}>{score}/{checks.length}</span>
                  </div>
                  <div className="space-y-1">
                    {checks.map((c) => (
                      <div key={c.label} className="flex items-center gap-2">
                        {c.ok ? <CheckCircle2 className="size-3 text-gain shrink-0" /> : <AlertCircle className="size-3 text-muted shrink-0" />}
                        <span className={`text-[11px] ${c.ok ? "text-body" : "text-muted"}`}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
