"use client";

import { openCallbackRequest } from "@/components/ui/CallbackPopup";

/**
 * Thin client wrapper so the hero itself stays a server component — the only
 * interactive bit is opening the shared callback popup (there is no /contact
 * page, and the site never completes an investment, so a callback is the
 * handoff).
 */
export function TalkToAdvisorButton({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <button type="button" onClick={openCallbackRequest} className={className} style={style}>
      Talk to an advisor
    </button>
  );
}
