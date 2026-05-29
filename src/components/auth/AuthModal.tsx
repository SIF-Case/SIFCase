'use client';

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { X, Loader2 } from "lucide-react";
import { PhoneFlow } from "./PhoneFlow";

type Tab = "google" | "email" | "phone";
type EmailMode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function EmailForm({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<EmailMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!email || !password) { setError("Fill in all fields"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);

    if (mode === "signup") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); setLoading(false); return; }
    }

    const res = await signIn("email-password", { email, password, redirect: false });
    if (res?.error) {
      setError(mode === "signin" ? "Invalid email or password" : "Could not sign in after registration");
    } else {
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {mode === "signup" && (
        <div>
          <label className="block text-[12px] font-medium text-muted mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      )}
      <div>
        <label className="block text-[12px] font-medium text-muted mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-muted mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      {error && <p className="text-[12px] text-loss">{error}</p>}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {mode === "signin" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-[12px] text-muted">
        {mode === "signin" ? "No account?" : "Already have one?"}{" "}
        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
          className="text-primary font-medium hover:underline"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

type Props = { open: boolean; onClose: () => void };

export function AuthModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("google");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "google", label: "Google" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone" },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-[400px] bg-white rounded-[20px] shadow-premium p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-heading hover:bg-surface transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="mb-6">
          <div className="w-8 h-8 rounded-[8px] bg-brand-navy flex items-center justify-center text-white text-xs font-bold mb-3">S</div>
          <h2 className="text-[20px] font-bold text-heading tracking-[-0.3px]">Sign in to SIFcase</h2>
          <p className="text-[13px] text-muted mt-1">Access watchlists, compare saves, and more.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface border border-rule rounded-[10px] p-1 mb-5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 h-8 rounded-[7px] text-[12.5px] font-semibold transition-all ${
                tab === t.id ? "bg-white shadow-sm text-heading" : "text-muted hover:text-body"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "google" && (
          <div className="space-y-3">
            <button
              onClick={() => signIn("google", { redirect: false }).then(onClose)}
              className="w-full h-11 rounded-[10px] border border-rule bg-white hover:bg-surface text-[13.5px] font-semibold text-heading flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <p className="text-center text-[11.5px] text-faint">
              You&apos;ll be redirected to Google to sign in.
            </p>
          </div>
        )}

        {tab === "email" && <EmailForm onSuccess={onClose} />}

        {tab === "phone" && <PhoneFlow onSuccess={onClose} />}

        <p className="mt-5 text-center text-[11px] text-faint">
          By signing in you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
