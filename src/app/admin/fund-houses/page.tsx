"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Building2, Search, Edit3, X, Check, Loader2,
  Upload, Image as ImageIcon, ExternalLink, ChevronDown,
} from "lucide-react";

interface FundHouseRecord {
  brandName: string;
  logoUrl: string;
  overview: string;
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ── Logo Avatar (mirrors public page) ─────────────────────────────────────────
function LogoAvatar({ logoUrl, brandName, size = 48 }: { logoUrl: string; brandName: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (logoUrl && !err) {
    return (
      <div
        className="rounded-[10px] bg-white border border-rule flex items-center justify-center overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={logoUrl}
          alt={brandName}
          width={size}
          height={size}
          className="object-contain p-1"
          onError={() => setErr(true)}
        />
      </div>
    );
  }
  return (
    <div
      className="rounded-[10px] bg-[#0C3B54] flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-[13px] font-extrabold text-white">{initialsFor(brandName)}</span>
    </div>
  );
}

// ── Edit Drawer ────────────────────────────────────────────────────────────────
function EditDrawer({
  fh,
  onClose,
  onSaved,
}: {
  fh: FundHouseRecord;
  onClose: () => void;
  onSaved: (updated: FundHouseRecord) => void;
}) {
  const [logoUrl, setLogoUrl] = useState(fh.logoUrl);
  const [overview, setOverview] = useState(fh.overview);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/fund-houses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: fh.brandName, logoUrl, overview }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Save failed");
      }
      setSaveOk(true);
      onSaved({ brandName: fh.brandName, logoUrl, overview });
      setTimeout(() => { setSaveOk(false); onClose(); }, 800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "logos");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Upload failed");
      }
      const { url } = await res.json();
      setLogoUrl(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
          <div className="flex items-center gap-3">
            <LogoAvatar logoUrl={logoUrl} brandName={fh.brandName} size={40} />
            <div>
              <p className="text-[15px] font-bold text-heading leading-tight">{fh.brandName}</p>
              <p className="text-[11px] text-muted">Edit logo & overview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Logo URL field */}
          <div>
            <label className="block text-[12px] font-semibold text-heading uppercase tracking-widest mb-2">
              Logo
            </label>

            {/* Preview */}
            <div className="mb-3 flex items-center gap-3">
              <LogoAvatar logoUrl={logoUrl} brandName={fh.brandName} size={64} />
              {logoUrl ? (
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-body truncate">{logoUrl}</p>
                  <button
                    onClick={() => setLogoUrl("")}
                    className="text-[11px] text-loss hover:underline mt-0.5"
                  >
                    Remove logo
                  </button>
                </div>
              ) : (
                <p className="text-[12px] text-muted flex-1">No logo set — showing initials.</p>
              )}
            </div>

            {/* Upload button */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] border border-dashed border-rule-strong text-[13px] font-medium text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? "Uploading…" : "Upload image file"}
            </button>

            {/* URL input */}
            <div className="mt-3">
              <p className="text-[11px] text-muted mb-1.5">Or paste a direct image URL (CDN / external)</p>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://cdn.example.com/logo.png"
                  className="w-full pl-8 pr-3 py-2.5 rounded-[8px] border border-rule text-[13px] text-body bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                {logoUrl && (
                  <a
                    href={logoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-rule" />

          {/* Overview textarea */}
          <div>
            <label className="block text-[12px] font-semibold text-heading uppercase tracking-widest mb-2">
              Overview
            </label>
            <p className="text-[11px] text-muted mb-2">
              Shown on the Fund Houses card. Describe the AMC&apos;s SIF platform, strategy, and key stats.
            </p>
            <textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              rows={8}
              placeholder={`e.g. "Altiva is Edelweiss Mutual Fund's Specialized Investment Fund platform, offering institutional-grade strategies…"`}
              className="w-full px-3 py-2.5 rounded-[8px] border border-rule text-[13px] text-body bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y leading-relaxed"
            />
            <p className="text-[11px] text-faint mt-1">{overview.length} characters</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-rule bg-surface flex items-center gap-3">
          {error && (
            <p className="text-[12px] text-loss flex-1">{error}</p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[8px] border border-rule text-[13px] font-medium text-muted hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saveOk}
              className="px-5 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {saving
                ? <><Loader2 className="size-3.5 animate-spin" /> Saving…</>
                : saveOk
                ? <><Check className="size-3.5" /> Saved!</>
                : "Save Changes"
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminFundHousesPage() {
  const [records, setRecords] = useState<FundHouseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FundHouseRecord | null>(null);
  const [expandedOverview, setExpandedOverview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/fund-houses")
      .then((r) => r.json())
      .then((data: FundHouseRecord[]) => { setRecords(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleSaved(updated: FundHouseRecord) {
    setRecords((prev) =>
      prev.map((r) => r.brandName === updated.brandName ? updated : r)
    );
  }

  const filtered = records.filter((r) =>
    r.brandName.toLowerCase().includes(search.toLowerCase())
  );

  const withLogo = records.filter((r) => r.logoUrl).length;
  const withOverview = records.filter((r) => r.overview).length;

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="size-5 text-primary" />
          <h1 className="text-[24px] font-bold text-heading tracking-[-0.3px]">Fund Houses</h1>
        </div>
        <p className="text-[13px] text-muted">
          Manage logos and overview descriptions for each AMC. Changes appear instantly on the public Fund Houses page.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total AMCs", value: records.length, color: "text-heading" },
          { label: "With Logo", value: withLogo, color: "text-primary" },
          { label: "With Overview", value: withOverview, color: "text-[#0E9F8E]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[12px] border border-rule p-4 shadow-card">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-1">{s.label}</p>
            <p className={`text-[26px] font-bold nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fund houses…"
          className="w-full pl-10 pr-4 py-2.5 rounded-[10px] border border-rule text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-card"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-rule flex items-center justify-between">
          <p className="text-[13px] font-semibold text-heading">
            {filtered.length} fund house{filtered.length !== 1 ? "s" : ""}
          </p>
          <p className="text-[11px] text-muted">Click Edit to update branding</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted gap-2">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-[14px]">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-muted">
            No fund houses match &quot;{search}&quot;
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {filtered.map((fh) => {
              const hasLogo = !!fh.logoUrl;
              const hasOverview = !!fh.overview;
              const expanded = expandedOverview === fh.brandName;

              return (
                <div key={fh.brandName} className="px-5 py-4 hover:bg-surface/60 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <LogoAvatar logoUrl={fh.logoUrl} brandName={fh.brandName} size={44} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold text-heading">{fh.brandName}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          hasLogo
                            ? "text-[#0E9F8E] bg-[#0E9F8E1A] border-[#0E9F8E33]"
                            : "text-muted bg-surface border-rule"
                        }`}>
                          {hasLogo ? "✓ Logo" : "No logo"}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          hasOverview
                            ? "text-primary bg-primary/10 border-primary/20"
                            : "text-muted bg-surface border-rule"
                        }`}>
                          {hasOverview ? "✓ Overview" : "No overview"}
                        </span>
                      </div>

                      {/* Overview preview */}
                      {hasOverview && (
                        <div className="mt-2">
                          <p className={`text-[12px] text-body leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
                            {fh.overview}
                          </p>
                          <button
                            onClick={() => setExpandedOverview(expanded ? null : fh.brandName)}
                            className="text-[11px] text-primary hover:underline mt-0.5 flex items-center gap-0.5"
                          >
                            {expanded ? "Show less" : "Show more"}
                            <ChevronDown className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      )}

                      {!hasOverview && (
                        <p className="text-[12px] text-faint mt-1 italic">No overview set yet.</p>
                      )}
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => setEditing(fh)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-rule text-[13px] font-medium text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors shrink-0"
                    >
                      <Edit3 className="size-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit drawer */}
      {editing && (
        <EditDrawer
          fh={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
