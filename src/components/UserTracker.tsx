"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const VISITS_KEY = "sif:pendingVisits";
const ACTIVITIES_KEY = "sif:pendingActivities";

// Helper to track activity from anywhere on the client
export function trackActivity(action: string, description: string) {
  if (typeof window === "undefined") return;

  try {
    const queued = JSON.parse(sessionStorage.getItem(ACTIVITIES_KEY) || "[]");
    queued.push({ action, description, createdAt: new Date().toISOString() });
    sessionStorage.setItem(ACTIVITIES_KEY, JSON.stringify(queued));
    window.dispatchEvent(new Event("sif:syncTracking"));
  } catch (err) {
    console.error("Failed to track activity client-side:", err);
  }
}

export function UserTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSync = async () => {
      if (status !== "authenticated" || !session?.user?.id) return;

      try {
        const queuedVisits = JSON.parse(sessionStorage.getItem(VISITS_KEY) || "[]");
        const queuedActivities = JSON.parse(sessionStorage.getItem(ACTIVITIES_KEY) || "[]");

        if (queuedVisits.length > 0 || queuedActivities.length > 0) {
          // Clear before sending to prevent double-sends in concurrent effects
          sessionStorage.removeItem(VISITS_KEY);
          sessionStorage.removeItem(ACTIVITIES_KEY);

          await fetch("/api/user/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "sync",
              visits: queuedVisits,
              activities: queuedActivities,
            }),
          });
        }
      } catch (err) {
        console.error("Error syncing tracking queue:", err);
      }
    };

    // Sync any queued items whenever authenticated
    if (status === "authenticated") {
      handleSync();
    }

    window.addEventListener("sif:syncTracking", handleSync);
    return () => window.removeEventListener("sif:syncTracking", handleSync);
  }, [status, session]);

  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    const recordVisit = async () => {
      // Exclude admin panel pages from user visit history to keep it clean
      if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

      if (status === "authenticated" && session?.user?.id) {
        try {
          await fetch("/api/user/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "page_visit", path: pathname }),
          });
        } catch (err) {
          console.error("Error logging page visit:", err);
        }
      } else {
        // Queue visit anonymously
        try {
          const queued = JSON.parse(sessionStorage.getItem(VISITS_KEY) || "[]");
          // Avoid consecutive duplicates
          if (queued.length === 0 || queued[queued.length - 1].path !== pathname) {
            queued.push({ path: pathname, visitedAt: new Date().toISOString() });
            // Capped at latest 20 items to prevent sessionStorage bloat
            const trimmed = queued.slice(-20);
            sessionStorage.setItem(VISITS_KEY, JSON.stringify(trimmed));
          }
        } catch (err) {
          console.error("Error queuing page visit:", err);
        }
      }
    };

    recordVisit();
  }, [pathname, status, session]);

  return null;
}
