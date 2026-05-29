"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
};

export function ImageUploader({ label, value, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Upload failed"); }
    else { onChange(data.url); }
    setUploading(false);
  }

  return (
    <div>
      <p className="text-[12px] font-medium text-muted mb-1.5">{label}</p>
      <div
        onClick={() => !uploading && ref.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
        onDragOver={(e) => e.preventDefault()}
        className={`relative rounded-[12px] border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${value ? "border-rule" : "border-rule hover:border-primary"}`}
        style={{ minHeight: 140 }}>
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 right-2 size-7 bg-white rounded-full shadow flex items-center justify-center text-muted hover:text-loss border border-rule">
              <X className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
              className="absolute bottom-2 right-2 px-2.5 py-1 bg-white rounded-full shadow text-[11px] font-medium text-body border border-rule hover:border-primary">
              Replace
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted">
            {uploading
              ? <Loader2 className="size-6 animate-spin text-primary" />
              : <Upload className="size-6" />}
            <p className="text-[12px]">{uploading ? "Uploading…" : "Click or drag to upload"}</p>
            <p className="text-[10px] text-faint">JPG, PNG, WebP · Max 5MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-loss mt-1">{error}</p>}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  );
}
