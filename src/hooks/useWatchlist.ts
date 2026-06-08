"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const PENDING_KEY = "sif:pendingWatchlistAdd";

/** Remember a fund to add to the watchlist once the user finishes signing in (called when an anonymous user clicks "save to watchlist"). */
export function rememberPendingWatchlistAdd(schemeCode: string) {
  try { sessionStorage.setItem(PENDING_KEY, schemeCode); } catch {}
}

export function useWatchlist(schemeCode: string) {
  const { data: session } = useSession();
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    let pending: string | null = null;
    try { pending = sessionStorage.getItem(PENDING_KEY); } catch {}
    if (pending === schemeCode) {
      try { sessionStorage.removeItem(PENDING_KEY); } catch {}
      fetch("/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemeCode }),
      }).then(() => setWatching(true));
      return;
    }

    fetch("/api/user/watchlist")
      .then((r) => r.json())
      .then((d) => setWatching((d.schemeCodes ?? []).includes(schemeCode)));
  }, [session, schemeCode]);

  const toggle = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const method = watching ? "DELETE" : "POST";
    await fetch("/api/user/watchlist", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schemeCode }),
    });
    setWatching((w) => !w);
    setLoading(false);
  }, [session, watching, schemeCode]);

  return { watching, toggle, loading, loggedIn: !!session?.user };
}
