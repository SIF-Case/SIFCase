'use client';

import { useEffect, useRef, useState } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { X, Loader2, Phone, Mail, ArrowLeft } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

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
  | "phone"            // enter phone number
  | "verify-phone"     // SMS OTP entry (Firebase) — new/unknown numbers, or known numbers without an email
  | "verify-email"     // email OTP entry — returning users with a verified email (no SMS sent)
  | "link"             // phone verified, no email yet — choose Google or Email
  | "link-email-form"  // name + email entry
  | "link-email-otp";  // OTP entry to verify the new email

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

type Props = { open: boolean; onClose: () => void; reason?: string };

export function AuthModal({ open, onClose, reason }: Props) {
  const { data: session, update: updateSession } = useSession();
  const [stage, setStage] = useState<Stage>("phone");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendIn, setResendIn] = useState(0);

  // link-email form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const fullPhone = `${country.dial}${phone.replace(/\D/g, "")}`;

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open || !captchaContainerRef.current || recaptchaRef.current) return;
    try {
      captchaContainerRef.current.innerHTML = "";
    } catch {}
    recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, captchaContainerRef.current, { size: "invisible" });
    return () => {
      try {
        recaptchaRef.current?.clear();
      } catch (e) {
        console.warn("reCAPTCHA cleanup ignored:", e);
      }
      recaptchaRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function reset() {
    setStage("phone");
    setPhone(""); setOtp(""); setError(""); setLoading(false);
    setMaskedEmail(""); setResendIn(0);
    setName(""); setEmail("");
  }

  function handleClose() { reset(); onClose(); }

  async function sendPhoneOtp() {
    const result = await signInWithPhoneNumber(firebaseAuth, fullPhone, recaptchaRef.current!);
    confirmationRef.current = result;
    setStage("verify-phone");
    setResendIn(RESEND_COOLDOWN);
  }

  async function submitPhone() {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) { setError("Enter a valid phone number"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setLoading(false); return; }

      if (data.channel === "email") {
        setMaskedEmail(data.masked ?? "");
        setStage("verify-email");
        setResendIn(RESEND_COOLDOWN);
      } else {
        await sendPhoneOtp();
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (resendIn > 0) return;
    setError(""); setOtp("");
    setLoading(true);
    try {
      if (stage === "verify-phone") {
        await sendPhoneOtp();
      } else if (stage === "verify-email") {
        const res = await fetch("/api/auth/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: fullPhone }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Couldn't resend the code"); }
        else setResendIn(RESEND_COOLDOWN);
      } else if (stage === "link-email-otp") {
        const res = await fetch("/api/auth/link-email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Couldn't resend the code"); }
        else setResendIn(RESEND_COOLDOWN);
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? "Couldn't resend the code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhoneOtp() {
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const result = await confirmationRef.current!.confirm(otp);
      const idToken = await result.user.getIdToken();
      const res = await signIn("phone", { idToken, redirect: false });
      if (res?.error) throw new Error(res.error);
      const freshSession = await getSession();
      if (freshSession?.user?.isAdmin) {
        window.location.href = "/admin";
        return;
      }
      if (freshSession?.user?.email) {
        handleClose();
      } else {
        setOtp(""); setError("");
        setStage("link");
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmailLoginOtp() {
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await signIn("email-otp", { phone: fullPhone, otp, redirect: false });
      if (res?.error) { setError("Incorrect or expired code"); return; }
      const freshSession = await getSession();
      if (freshSession?.user?.isAdmin) {
        window.location.href = "/admin";
        return;
      }
      handleClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function submitLinkEmailForm() {
    setError("");
    if (!name.trim()) { setError("Enter your name"); return; }
    if (!email.trim()) { setError("Enter your email"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/link-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Couldn't send the code"); return; }
      setOtp(""); setError("");
      setStage("link-email-otp");
      setResendIn(RESEND_COOLDOWN);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Couldn't send the code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyLinkEmailOtp() {
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/link-email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Verification failed"); return; }
      await updateSession({});
      handleClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  const isOtpStage = stage === "verify-phone" || stage === "verify-email" || stage === "link-email-otp";
  const verifyHandler =
    stage === "verify-phone" ? verifyPhoneOtp :
      stage === "verify-email" ? verifyEmailLoginOtp :
        verifyLinkEmailOtp;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm ${open ? "" : "hidden"}`}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div className="w-full max-w-[400px] bg-white rounded-[20px] shadow-premium p-6 relative">
        {open && <div ref={captchaContainerRef} />}

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-heading hover:bg-surface transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="mb-6">
          <div className="w-8 h-8 rounded-[8px] bg-brand-navy flex items-center justify-center text-white text-xs font-bold mb-3">S</div>
          <h2 className="text-[20px] font-bold text-heading tracking-[-0.3px]">
            {stage === "phone" && (reason ? `To ${reason}, sign in to SIFcase` : "Sign in to SIFcase")}
            {stage === "verify-phone" && "Enter the code"}
            {stage === "verify-email" && "Check your email"}
            {stage === "link" && "One Last Step, Verify your Email"}
            {stage === "link-email-form" && "Add your email"}
            {stage === "link-email-otp" && "Check your email"}
          </h2>
          <p className="text-[13px] text-muted mt-1">
            {stage === "phone" && "Enter your phone number to get started."}
            {stage === "verify-phone" && `Code sent via SMS to ${country.dial} ${phone}`}
            {stage === "verify-email" && (maskedEmail ? `Enter the code sent to ${maskedEmail}` : "Enter the code we sent to your registered email")}
            {stage === "link" && "Choose how you'd like to continue."}
            {stage === "link-email-form" && "We'll send a verification code to confirm it's you."}
            {stage === "link-email-otp" && `Enter the code sent to ${email}`}
          </p>
        </div>

        {/* ── Stage: Phone entry ── */}
        {stage === "phone" && (
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
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />}
              Continue
            </button>
          </div>
        )}

        {/* ── OTP entry stages (phone SMS / email login / email link) ── */}
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
                  if (stage === "verify-phone") { setStage("phone"); setOtp(""); setError(""); }
                  else if (stage === "link-email-otp") { setStage("link-email-form"); setOtp(""); setError(""); }
                  else { setStage("phone"); setOtp(""); setError(""); }
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

        {/* ── Stage: Link account choice ── */}
        {stage === "link" && (
          <div className="space-y-3">
            <button
              onClick={async () => {
                await fetch("/api/auth/link-google-init", { method: "POST" });
                signIn("google");
              }}
              className="w-full h-11 rounded-[10px] border border-rule bg-white hover:bg-surface text-[13.5px] font-semibold text-heading flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              onClick={() => { setStage("link-email-form"); setError(""); }}
              className="w-full h-11 rounded-[10px] border border-rule bg-white hover:bg-surface text-[13.5px] font-semibold text-heading flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <Mail className="size-4 text-muted" />
              Continue with Email
            </button>
          </div>
        )}

        {/* ── Stage: Link via Email — Name + Email form ── */}
        {stage === "link-email-form" && (
          <div className="space-y-3">
            <button onClick={() => { setStage("link"); setError(""); }} className="flex items-center gap-1.5 text-[12px] text-muted hover:text-body mb-1">
              <ArrowLeft className="size-3" /> Back
            </button>
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                onKeyDown={(e) => e.key === "Enter" && submitLinkEmailForm()} />
            </div>
            {error && <p className="text-[12px] text-loss">{error}</p>}
            <button onClick={submitLinkEmailForm} disabled={loading}
              className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Send code
            </button>
          </div>
        )}

        <p className="mt-5 text-center text-[11px] text-faint">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
