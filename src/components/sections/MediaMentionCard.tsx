"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ExternalLink, X } from "lucide-react";

type Mention = {
  id: string;
  outlet: string;
  url: string;
  title: string;
  tag: string;
  imageUrl: string;
};

// Known outlet -> logo asset. Falls back to a plain text badge for outlets
// without a stored logo, so adding a mention never requires a design asset.
const OUTLET_LOGOS: Record<string, string> = {
  moneycontrol: "/logos/moneycontrol.png",
};

// Common short-form as it'd appear on the outlet's own site (e.g. Moneycontrol
// calls itself "MC"), falling back to the first two letters of the name.
const OUTLET_ABBR: Record<string, string> = {
  moneycontrol: "MC",
};

function ReadArticleModal({ mention, onClose }: { mention: Mention; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] shadow-premium w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-rule shrink-0">
          <span className="text-[13px] font-semibold text-heading truncate pr-3">{mention.title}</span>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" /> Open in new tab
            </a>
            <button
              onClick={onClose}
              className="size-7 inline-flex items-center justify-center rounded-[6px] text-muted hover:text-body hover:bg-surface"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <iframe
          src={mention.url}
          title={`${mention.outlet} coverage`}
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full flex-1 border-0"
        />
      </div>
    </div>,
    document.body
  );
}

export function MediaMentionCard({ mention }: { mention: Mention }) {
  const [open, setOpen] = useState(false);
  const logo = OUTLET_LOGOS[mention.outlet.trim().toLowerCase()];
  const shortOutlet = OUTLET_ABBR[mention.outlet.trim().toLowerCase()] ?? mention.outlet.trim().split(/\s+/)[0].slice(0, 2).toUpperCase();

  return (
    <div className="bg-white border border-rule rounded-[16px] overflow-hidden shadow-card flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {logo ? (
            <Image src={logo} alt={mention.outlet} width={211} height={48} className="h-6 w-auto shrink-0" />
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-primary-tint text-primary shrink-0">
              {mention.outlet}
            </span>
          )}

          {mention.tag && (
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-rule text-[10.5px] font-bold uppercase tracking-wide text-muted">
              {mention.tag}
            </span>
          )}
        </div>

        <h3 className="text-[15px] font-bold text-heading leading-snug mb-4">{mention.title}</h3>

        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-center text-[13px] font-semibold px-4 py-2.5 rounded-[10px] bg-heading text-white hover:opacity-90 transition-opacity"
          >
            Read Article
          </button>
          <a
            href={mention.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-[10px] border border-rule text-body hover:bg-surface transition-colors"
          >
            <ExternalLink className="size-3.5" /> View on {shortOutlet}
          </a>
        </div>
      </div>

      {open && <ReadArticleModal mention={mention} onClose={() => setOpen(false)} />}
    </div>
  );
}
