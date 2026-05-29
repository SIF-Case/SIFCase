"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export function useWatchlist(schemeCode: string) {
  const { data: session } = useSession();
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
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
