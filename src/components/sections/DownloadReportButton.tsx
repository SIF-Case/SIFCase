"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { Download } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";

const PENDING_KEY = "sif:pendingReportDownload";

function startDownload(slug: string) {
  window.location.href = `/api/reports/${slug}/download`;
}

export function DownloadReportButton({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for pending download after login
  useEffect(() => {
    if (!session?.user) return;
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(PENDING_KEY);
    } catch {}
    if (pending && pending === slug) {
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch {}
      startDownload(slug);
    }
  }, [session, slug]);

  // Clear pending download when modal is closed without login
  useEffect(() => {
    if (!authOpen && !session?.user) {
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch {}
    }
  }, [authOpen, session]);

  function handleDownload() {
    if (!session?.user) {
      try {
        sessionStorage.setItem(PENDING_KEY, slug);
      } catch {}
      setAuthOpen(true);
      return;
    }
    startDownload(slug);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-2 mt-7 px-6 py-2.5 rounded-full bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover shadow-btn"
      >
        <Download className="w-4 h-4" strokeWidth={2} />
        Download Full Report (PDF)
      </button>

      {mounted && createPortal(
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          reason="download the performance report"
        />,
        document.body
      )}
    </>
  );
}
