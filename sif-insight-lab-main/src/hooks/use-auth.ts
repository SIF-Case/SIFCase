import { useEffect, useState } from "react";

export type User = { name: string; email: string };

const KEY = "sifhub-user";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
    const onStorage = () => {
      try {
        const raw = localStorage.getItem(KEY);
        setUser(raw ? JSON.parse(raw) : null);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("sifhub-auth", onStorage as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("sifhub-auth", onStorage as EventListener);
    };
  }, []);

  const signIn = (u: User) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
    window.dispatchEvent(new Event("sifhub-auth"));
  };
  const signOut = () => {
    localStorage.removeItem(KEY);
    setUser(null);
    window.dispatchEvent(new Event("sifhub-auth"));
  };

  return { user, ready, signIn, signOut };
}
