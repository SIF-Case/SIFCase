'use client';

import { useEffect, useRef, useState } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { X, Loader2, ArrowLeft } from "lucide-react";

const COUNTRIES = [
  { code: "IN", dial: "+91", flag: "🇮🇳", name: "India" },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "United States" },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "SG", dial: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "AU", dial: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "CA", dial: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "DE", dial: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "FR", dial: "+33", flag: "🇫🇷", name: "France" },
  { code: "JP", dial: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "CN", dial: "+86", flag: "🇨🇳", name: "China" },
  { code: "BR", dial: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "ZA", dial: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "NG", dial: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "KE", dial: "+254", flag: "🇰🇪", name: "Kenya" },
];

type Stage =
  | "email"          // enter email (or continue with Google)
  | "verify-email"   // email OTP entry — logs in / creates the account
  | "collect-phone"  // enter phone — mandatory once logged in without one
  | "verify-phone";  // SMS OTP entry — attaches the phone

const RESEND_COOLDOWN = 45;

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

// mode "phone" mounts straight into the mandatory phone-collection step — used by
// the global phone gate for logged-in users who have no phone yet.
type Props = { open: boolean; onClose: () => void; reason?: string; mode?: "full" | "phone" };

export function AuthModal({ open, onClose, reason, mode = "full" }: Props) {
  const { update: updateSession } = useSession();
  const [stage, setStage] = useState<Stage>(mode === "phone" ? "collect-phone" : "email");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const overlayRef = useRef<HTMLDivElement>(null);
  const fullPhone = `${country.dial}${phone.replace(/\D/g, "")}`;

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Keep the initial stage in sync with the mode when the modal (re)opens.
  useEffect(() => {
    if (open) setStage(mode === "phone" ? "collect-phone" : "email");
  }, [open, mode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function reset() {
    setStage(mode === "phone" ? "collect-phone" : "email");
    setPhone(""); setOtp(""); setEmail(""); setMaskedEmail("");
    setError(""); setLoading(false); setResendIn(0);
  }

  function handleClose() { reset(); onClose(); }

  // After any successful sign-in: admins skip the phone step; everyone else must
  // add a phone if their account doesn't have one yet.
  async function afterAuth() {
    const session = await getSession();
    if (session?.user?.isAdmin) { window.location.href = "/admin"; return; }
    if (!session?.user?.phone) {
      setOtp(""); setError(""); setStage("collect-phone");
      return;
    }
    handleClose();
  }

  async function submitEmail() {
    setError("");
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setMaskedEmail(data.masked ?? value);
      setOtp(""); setStage("verify-email");
      setResendIn(RESEND_COOLDOWN);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmailOtp() {
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await signIn("email-otp", { email: email.trim().toLowerCase(), otp, redirect: false });
      if (res?.error) { setError("Incorrect or expired code"); return; }
      await afterAuth();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function submitPhone() {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) { setError("Enter a valid phone number"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Couldn't send the code"); return; }
      setOtp(""); setStage("verify-phone");
      setResendIn(RESEND_COOLDOWN);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhoneOtp() {
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Verification failed"); return; }
      await updateSession(); // pull the freshly-attached phone into the JWT/session
      const session = await getSession();
      if (session?.user?.isAdmin) { window.location.href = "/admin"; return; }
      handleClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (resendIn > 0) return;
    setError(""); setOtp(""); setLoading(true);
    try {
      const endpoint = stage === "verify-email" ? "/api/auth/email/start" : "/api/auth/phone/send";
      const payload = stage === "verify-email" ? { email: email.trim().toLowerCase() } : { phone: fullPhone };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Couldn't resend the code");
      else setResendIn(RESEND_COOLDOWN);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Couldn't resend the code");
    } finally {
      setLoading(false);
    }
  }

  const isOtpStage = stage === "verify-email" || stage === "verify-phone";
  const verifyHandler = stage === "verify-email" ? verifyEmailOtp : verifyPhoneOtp;

  // Once the user is signed in (collect-phone / verify-phone), the phone step is
  // mandatory — the modal can't be dismissed until a phone is attached.
  const canClose = stage === "email" || stage === "verify-email";

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && canClose) handleClose();
  };

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm ${open ? "" : "hidden"}`}
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-[400px] bg-white rounded-[20px] shadow-premium p-6 relative">
        {canClose && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-heading hover:bg-surface transition-colors"
          >
            <X className="size-4" />
          </button>
        )}

        <div className="mb-6">
          <div className="w-8 h-8 rounded-[8px] bg-brand-navy flex items-center justify-center text-white text-xs font-bold mb-3">S</div>
          <h2 className="text-[20px] font-bold text-heading tracking-[-0.3px]">
            {stage === "email" && (reason ? `To ${reason}, sign in to SIFcase` : "Sign in to SIFcase")}
            {stage === "verify-email" && "Check your email"}
            {stage === "collect-phone" && "Add your phone number"}
            {stage === "verify-phone" && "Enter the code"}
          </h2>
          <p className="text-[13px] text-muted mt-1">
            {stage === "email" && "Continue with your email or Google."}
            {stage === "verify-email" && `Enter the code sent to ${maskedEmail || "your email"}`}
            {stage === "collect-phone" && "One last step — verify your phone number to continue."}
            {stage === "verify-phone" && `Code sent via SMS to ${country.dial} ${phone}`}
          </p>
        </div>

        {/* ── Stage: Email entry + Google ── */}
        {stage === "email" && (
          <div className="space-y-3">
            <button
              onClick={() => signIn("google")}
              className="w-full h-11 rounded-[10px] border border-rule bg-white hover:bg-surface text-[13.5px] font-semibold text-heading flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-rule" />
              <span className="text-[11px] text-faint">or</span>
              <div className="flex-1 h-px bg-rule" />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                onKeyDown={(e) => e.key === "Enter" && submitEmail()}
              />
            </div>

            {error && <p className="text-[12px] text-loss">{error}</p>}

            <button
              onClick={submitEmail}
              disabled={loading}
              className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Continue"}
            </button>
          </div>
        )}

        {/* ── Stage: Phone entry ── */}
        {stage === "collect-phone" && (
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCountryOpen((o) => !o)}
                    className="h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading flex items-center gap-1.5 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 whitespace-nowrap"
                  >
                    <span>{country.flag}</span>
                    <span className="text-muted">{country.dial}</span>
                    <span className="text-muted text-[10px]">▼</span>
                  </button>
                  {countryOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setCountryOpen(false)} />
                      <div className="absolute z-20 top-full mt-1 left-0 w-56 bg-white border border-rule rounded-[12px] shadow-premium py-1 max-h-52 overflow-y-auto">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => { setCountry(c); setCountryOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-surface text-left transition-colors ${country.code === c.code ? "text-primary font-medium" : "text-body"}`}
                          >
                            <span>{c.flag}</span>
                            <span className="flex-1 truncate">{c.name}</span>
                            <span className="text-muted text-[11px]">{c.dial}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s\-]/g, ""))}
                  placeholder="98765 43210"
                  autoFocus
                  className="flex-1 h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  onKeyDown={(e) => e.key === "Enter" && submitPhone()}
                />
              </div>
            </div>

            {error && <p className="text-[12px] text-loss">{error}</p>}

            <button
              onClick={submitPhone}
              disabled={loading}
              className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Send code"}
            </button>
          </div>
        )}

        {/* ── OTP entry stages (email / phone) ── */}
        {isOtpStage && (
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                className="w-full h-12 px-3 rounded-[10px] border border-rule bg-white text-[20px] text-heading tracking-[0.3em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                onKeyDown={(e) => e.key === "Enter" && verifyHandler()}
              />
            </div>

            {error && <p className="text-[12px] text-loss">{error}</p>}

            <button
              onClick={verifyHandler}
              disabled={loading}
              className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Verify
            </button>
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setOtp(""); setError("");
                  setStage(stage === "verify-email" ? "email" : "collect-phone");
                }}
                className="flex items-center gap-1.5 text-[12px] text-muted hover:text-body"
              >
                <ArrowLeft className="size-3" /> Back
              </button>
              <button
                onClick={resendCode}
                disabled={resendIn > 0 || loading}
                className="text-[12px] text-primary font-medium hover:underline disabled:text-faint disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-[11px] text-faint">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
