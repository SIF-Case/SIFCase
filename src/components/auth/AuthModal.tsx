'use client';

import { useEffect, useRef, useState } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { X, Loader2, Phone, Mail, ArrowLeft } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

const COUNTRIES = [
  { code: "IN", dial: "+91",  flag: "🇮🇳", name: "India" },
  { code: "US", dial: "+1",   flag: "🇺🇸", name: "United States" },
  { code: "GB", dial: "+44",  flag: "🇬🇧", name: "United Kingdom" },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "SG", dial: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "AU", dial: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "CA", dial: "+1",   flag: "🇨🇦", name: "Canada" },
  { code: "DE", dial: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "FR", dial: "+33",  flag: "🇫🇷", name: "France" },
  { code: "JP", dial: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "CN", dial: "+86",  flag: "🇨🇳", name: "China" },
  { code: "BR", dial: "+55",  flag: "🇧🇷", name: "Brazil" },
  { code: "ZA", dial: "+27",  flag: "🇿🇦", name: "South Africa" },
  { code: "NG", dial: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "KE", dial: "+254", flag: "🇰🇪", name: "Kenya" },
];

type Stage =
  | "phone"      // enter phone number (+ OTP shown inline after send)
  | "link";      // phone verified — choose Google or email/password

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

type Props = { open: boolean; onClose: () => void };

export function AuthModal({ open, onClose }: Props) {
  const { data: session } = useSession();
  const [stage, setStage] = useState<Stage>("phone");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // email/password form state
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open || !captchaContainerRef.current || recaptchaRef.current) return;
    recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, captchaContainerRef.current, { size: "invisible" });
    return () => { recaptchaRef.current?.clear(); recaptchaRef.current = null; };
  }, [open]);

  function reset() {
    setStage("phone");
    setPhone(""); setOtp(""); setOtpSent(false); setError(""); setLoading(false);
    setShowEmailForm(false); setEmail(""); setPassword(""); setName("");
  }

  function handleClose() { reset(); onClose(); }

  async function sendOtp() {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) { setError("Enter a valid phone number"); return; }
    const fullPhone = `${country.dial}${digits}`;
    setLoading(true);
    try {
      confirmationRef.current = await signInWithPhoneNumber(firebaseAuth, fullPhone, recaptchaRef.current!);
      setOtpSent(true);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const result = await confirmationRef.current!.confirm(otp);
      const idToken = await result.user.getIdToken();
      const res = await signIn("phone", { idToken, redirect: false });
      if (res?.error) throw new Error(res.error);
      // Check if user already has email linked — if so, login is complete
      const session = await getSession();
      if (session?.user?.email) {
        handleClose();
      } else {
        setStage("link");
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function submitEmail() {
    setError("");
    if (emailMode === "signup" && !name.trim()) { setError("Enter your name"); return; }
    if (!email || !password) { setError("Fill in all fields"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    if (emailMode === "signup") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phoneUserId: session?.user?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); setLoading(false); return; }
    }
    const res = await signIn("email-password", { email, password, redirect: false });
    if (res?.error) {
      setError(emailMode === "signin" ? "Invalid email or password" : "Sign-in after registration failed");
    } else {
      handleClose();
    }
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div className="w-full max-w-[400px] bg-white rounded-[20px] shadow-premium p-6 relative">
        <div ref={captchaContainerRef} />

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-heading hover:bg-surface transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Logo + title */}
        <div className="mb-6">
          <div className="w-8 h-8 rounded-[8px] bg-brand-navy flex items-center justify-center text-white text-xs font-bold mb-3">S</div>
          <h2 className="text-[20px] font-bold text-heading tracking-[-0.3px]">
            {stage === "phone" && "Sign in to SIFcase"}
            {stage === "link" && "You're verified!"}
          </h2>
          <p className="text-[13px] text-muted mt-1">
            {stage === "phone" && !otpSent && "Enter your phone number to get started."}
            {stage === "phone" && otpSent && `Code sent to ${country.dial} ${phone}`}
            {stage === "link" && "Choose how you'd like to continue."}
          </p>
        </div>

        {/* ── Stage 1: Phone + inline OTP ── */}
        {stage === "phone" && (
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Phone Number</label>
              <div className="flex gap-2">
                {/* Country dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => !otpSent && setCountryOpen((o) => !o)}
                    disabled={otpSent}
                    className="h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading flex items-center gap-1.5 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{country.flag}</span>
                    <span className="text-muted">{country.dial}</span>
                    <span className="text-muted text-[10px]">▼</span>
                  </button>
                  {countryOpen && !otpSent && (
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
                {/* Number input */}
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => !otpSent && setPhone(e.target.value.replace(/[^\d\s\-]/g, ""))}
                  readOnly={otpSent}
                  placeholder="98765 43210"
                  autoFocus
                  className={`flex-1 h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${otpSent ? "opacity-60 cursor-not-allowed" : ""}`}
                  onKeyDown={(e) => !otpSent && e.key === "Enter" && sendOtp()}
                />
              </div>
            </div>

            {/* OTP field appears inline after send */}
            {otpSent && (
              <div>
                <label className="block text-[12px] font-medium text-muted mb-1.5">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  className="w-full h-12 px-3 rounded-[10px] border border-rule bg-white text-[20px] text-heading tracking-[0.3em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                />
              </div>
            )}

            {error && <p className="text-[12px] text-loss">{error}</p>}

            {!otpSent ? (
              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />}
                Send OTP
              </button>
            ) : (
              <>
                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Verify
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                  className="w-full flex items-center justify-center gap-1.5 text-[12px] text-muted hover:text-body"
                >
                  <ArrowLeft className="size-3" /> Change number
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Stage 3: Link account ── */}
        {stage === "link" && !showEmailForm && (
          <div className="space-y-3">
            <button
              onClick={async () => {
                // Mark this as a linking flow so the OAuth callback can merge accounts
                await fetch("/api/auth/link-google-init", { method: "POST" });
                signIn("google");
              }}
              className="w-full h-11 rounded-[10px] border border-rule bg-white hover:bg-surface text-[13.5px] font-semibold text-heading flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full h-11 rounded-[10px] border border-rule bg-white hover:bg-surface text-[13.5px] font-semibold text-heading flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <Mail className="size-4 text-muted" />
              Continue with Email
            </button>
          </div>
        )}

        {/* ── Stage 3b: Email form ── */}
        {stage === "link" && showEmailForm && (
          <div className="space-y-3">
            <button onClick={() => { setShowEmailForm(false); setError(""); }} className="flex items-center gap-1.5 text-[12px] text-muted hover:text-body mb-1">
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
                className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                onKeyDown={(e) => e.key === "Enter" && submitEmail()} />
            </div>
            {error && <p className="text-[12px] text-loss">{error}</p>}
            <button onClick={submitEmail} disabled={loading}
              className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {emailMode === "signin" ? "Sign in" : "Create account"}
            </button>
            <p className="text-center text-[12px] text-muted">
              {emailMode === "signin" ? "No account?" : "Already have one?"}{" "}
              <button onClick={() => { setEmailMode(emailMode === "signin" ? "signup" : "signin"); setError(""); }} className="text-primary font-medium hover:underline">
                {emailMode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        )}

        <p className="mt-5 text-center text-[11px] text-faint">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
