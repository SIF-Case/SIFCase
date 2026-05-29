"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, Send, ArrowLeft, Loader2, Monitor, Smartphone, ToggleLeft, ToggleRight } from "lucide-react";
import { RichEditor } from "./RichEditor";
import { ImageUploader } from "./ImageUploader";

type ArticleData = {
  _id?: string;
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
  readTime: number;
};

const DEFAULTS: ArticleData = {
  title: "", excerpt: "", content: "", coverDesktop: "", coverMobile: "",
  useSeparateMobile: false, category: "General", tags: "", status: "draft",
  authorName: "SIFcase Team", readTime: 3,
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
              <label className="block text-[11px] font-medium text-muted mb-1">Read time (min)</label>
              <input type="number" min={1} value={form.readTime} onChange={(e) => set("readTime", parseInt(e.target.value) || 1)}
                className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
        </div>
      </div>
    </div>
  );
}
