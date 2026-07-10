"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { X, Phone, User, Mail, MessageSquare, Check, TrendingUp, Loader2, ShieldCheck } from "lucide-react";

const AMOUNT_OPTIONS = [
  { label: "₹10L", value: 10 },
  { label: "₹20L", value: 20 },
  { label: "₹30L", value: 30 },
  { label: "₹40L", value: 40 },
  { label: "₹50L+", value: 50 },
];

const RESEND_COOLDOWN = 45;

// Fetch responses aren't guaranteed to have a JSON body (network hiccups, a
// proxy/edge 502, a route that isn't deployed yet) — res.json() throws on an
// empty body, so parse defensively instead of letting that throw crash the form.
async function safeJson(res: Response): Promise<{ error?: string; [key: string]: unknown }> {
  try {
    return await res.json();
  } catch {
    return { error: `Server error (${res.status}). Please try again.` };
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  fund: { fundName: string; schemeCode: string; strategy: string };
  minInvestment?: number | null;
};

// Inline phone/email OTP verification — a compact "Verify" button embedded in the
// field that swaps to an OTP entry row on click, using the same public OTP
// infra as AuthModal (src/lib/otp.ts) but without creating a session.
function VerifyRow({
  icon,
  inputType,
  name,
  value,
  placeholder,
  required,
  disabled,
  onChange,
  verified,
  otpStage,
  otp,
  onOtpChange,
  loading,
  error,
  resendIn,
  onStart,
  onCheck,
  onCancelOtp,
}: {
  icon: React.ReactNode;
  inputType: string;
  name: string;
  value: string;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  verified: boolean;
  otpStage: boolean;
  otp: string;
  onOtpChange: (v: string) => void;
  loading: boolean;
  error: string;
  resendIn: number;
  onStart: () => void;
  onCheck: () => void;
  onCancelOtp: () => void;
}) {
  if (otpStage) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit OTP"
            disabled={loading}
            autoFocus
            className="w-full pl-3 pr-24 py-2 text-[13.5px] tracking-[0.2em] border border-primary rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-body placeholder-muted/65 bg-white disabled:bg-surface disabled:text-muted"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onCheck())}
          />
          <button
            type="button"
            onClick={onCheck}
            disabled={loading || otp.length !== 6}
            className="absolute right-1 top-1 bottom-1 px-3 rounded text-[11.5px] font-semibold bg-primary text-white disabled:opacity-40 flex items-center gap-1"
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : "Confirm"}
          </button>
        </div>
        <div className="flex items-center justify-between px-0.5">
          <button type="button" onClick={onCancelOtp} className="text-[11px] text-muted hover:text-body">
            ← Change
          </button>
          <button
            type="button"
            onClick={onStart}
            disabled={resendIn > 0 || loading}
            className="text-[11px] text-primary font-medium hover:underline disabled:text-faint disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
          </button>
        </div>
        {error && <p className="text-[11px] text-loss">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">{icon}</span>
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className="w-full pl-9 pr-[92px] py-2 text-[13.5px] border border-rule rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body placeholder-muted/65 bg-white disabled:bg-surface disabled:text-muted"
        />
        {verified ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-semibold text-verified">
            <ShieldCheck className="size-3.5" /> Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={disabled || loading || !value.trim()}
            className="absolute right-1.5 top-1 bottom-1 px-3 rounded text-[11.5px] font-semibold text-primary border border-primary/40 hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : "Verify"}
          </button>
        )}
      </div>
      {error && !otpStage && <p className="text-[11px] text-loss">{error}</p>}
    </div>
  );
}

export function FundCTAModal({ open, onClose, fund, minInvestment }: Props) {
  const { data: session } = useSession();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [amountLakhs, setAmountLakhs] = useState<number | null>(null);

  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });

  // Phone verification state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpStage, setPhoneOtpStage] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneResendIn, setPhoneResendIn] = useState(0);

  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpStage, setEmailOtpStage] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailResendIn, setEmailResendIn] = useState(0);

  // Pre-fill from session whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setFormData({
      name: session?.user?.name ?? "",
      phone: session?.user?.phone ?? "",
      email: session?.user?.email ?? "",
      message: "",
    });
    setAmountLakhs(null);
    setErrorMsg("");
    setIsSubmitted(false);
    setPhoneVerified(false); setPhoneOtpStage(false); setPhoneOtp(""); setPhoneError(""); setPhoneResendIn(0);
    setEmailVerified(false); setEmailOtpStage(false); setEmailOtp(""); setEmailError(""); setEmailResendIn(0);
  }, [open, session]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (phoneResendIn <= 0) return;
    const t = setTimeout(() => setPhoneResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneResendIn]);

  useEffect(() => {
    if (emailResendIn <= 0) return;
    const t = setTimeout(() => setEmailResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [emailResendIn]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Editing a verified field after the fact invalidates the verification.
    if (name === "phone" && phoneVerified) { setPhoneVerified(false); setPhoneOtpStage(false); }
    if (name === "email" && emailVerified) { setEmailVerified(false); setEmailOtpStage(false); }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function startPhoneVerify() {
    const digits = formData.phone.replace(/[\s\-\+\(\)]/g, "");
    if (!/^\d{8,15}$/.test(digits)) { setPhoneError("Enter a valid phone number first"); return; }
    setPhoneLoading(true); setPhoneError("");
    try {
      const res = await fetch("/api/public/verify-phone/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone.trim() }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Couldn't send code");
      setPhoneOtpStage(true); setPhoneResendIn(RESEND_COOLDOWN); setPhoneOtp("");
    } catch (e) {
      setPhoneError((e as Error).message);
    } finally {
      setPhoneLoading(false);
    }
  }

  async function checkPhoneOtp() {
    if (phoneOtp.length !== 6) { setPhoneError("Enter the 6-digit code"); return; }
    setPhoneLoading(true); setPhoneError("");
    try {
      const res = await fetch("/api/auth/verify-phone-only", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone.trim(), otp: phoneOtp }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setPhoneVerified(true); setPhoneOtpStage(false); setPhoneOtp("");
    } catch (e) {
      setPhoneError((e as Error).message);
    } finally {
      setPhoneLoading(false);
    }
  }

  async function startEmailVerify() {
    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setEmailError("Enter a valid email address first"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await fetch("/api/public/verify-email/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Couldn't send code");
      setEmailOtpStage(true); setEmailResendIn(RESEND_COOLDOWN); setEmailOtp("");
    } catch (e) {
      setEmailError((e as Error).message);
    } finally {
      setEmailLoading(false);
    }
  }

  async function checkEmailOtp() {
    if (emailOtp.length !== 6) { setEmailError("Enter the 6-digit code"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await fetch("/api/public/verify-email/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim(), otp: emailOtp }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setEmailVerified(true); setEmailOtpStage(false); setEmailOtp("");
    } catch (e) {
      setEmailError((e as Error).message);
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim()) { setErrorMsg("Name is required"); return; }
    if (!formData.phone.trim()) { setErrorMsg("Phone number is required"); return; }
    const phoneClean = formData.phone.replace(/[\s\-\+\(\)]/g, "");
    if (!/^\d{8,15}$/.test(phoneClean)) { setErrorMsg("Please enter a valid phone number (8-15 digits)"); return; }
    if (!phoneVerified) { setErrorMsg("Please verify your phone number"); return; }
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) { setErrorMsg("Please enter a valid email address"); return; }
      if (!emailVerified) { setErrorMsg("Please verify your email address"); return; }
    }
    if (amountLakhs == null) { setErrorMsg("Please select how much you're planning to invest"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          fundName: fund.fundName,
          schemeCode: fund.schemeCode,
          amountLakhs,
        }),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.error || "Failed to submit request");
      }
      setIsSubmitted(true);
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      setErrorMsg((err as Error).message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-labelledby="fund-cta-title"
    >
      <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-premium p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-heading hover:bg-surface transition-colors"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {isSubmitted ? (
          <div className="flex flex-col items-center text-center py-6 gap-3">
            <div className="size-12 rounded-full bg-verified/10 flex items-center justify-center text-verified">
              <Check className="size-6 stroke-[3]" />
            </div>
            <h3 className="text-[16px] font-semibold text-brand-navy">Callback Request Received</h3>
            <p className="text-[13px] text-body">An analyst from our SIF team will contact you shortly about {fund.fundName}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 id="fund-cta-title" className="text-[19px] font-bold text-heading tracking-[-0.3px]">
                Get Started with This Fund
              </h2>

              {/* Selected fund badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-primary-tint border border-primary/15">
                <TrendingUp className="size-3.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-heading truncate">{fund.fundName}</p>
                  <p className="text-[11px] text-muted">{fund.strategy}{minInvestment ? ` · Min ₹${minInvestment.toLocaleString("en-IN")}` : ""}</p>
                </div>
              </div>

              <p className="text-[14px] text-body leading-snug ">
                This product involves complex derivatives, so it&apos;s worth talking with a consultant to see how it fits your overall portfolio. Let SIFcase expert guide you.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                  <User className="size-4" />
                </span>
                <input
                  type="text" name="name" value={formData.name} onChange={handleInputChange}
                  disabled={isSubmitting} placeholder="Full Name" required
                  className="w-full pl-9 pr-3 py-2 text-[13.5px] border border-rule rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body placeholder-muted/65 bg-white disabled:bg-surface disabled:text-muted"
                />
              </div>

              <VerifyRow
                icon={<Phone className="size-4" />}
                inputType="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone Number"
                required
                disabled={isSubmitting}
                verified={phoneVerified}
                otpStage={phoneOtpStage}
                otp={phoneOtp}
                onOtpChange={setPhoneOtp}
                loading={phoneLoading}
                error={phoneError}
                resendIn={phoneResendIn}
                onStart={startPhoneVerify}
                onCheck={checkPhoneOtp}
                onCancelOtp={() => { setPhoneOtpStage(false); setPhoneError(""); }}
              />

              <VerifyRow
                icon={<Mail className="size-4" />}
                inputType="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address (Optional)"
                disabled={isSubmitting}
                verified={emailVerified}
                otpStage={emailOtpStage}
                otp={emailOtp}
                onOtpChange={setEmailOtp}
                loading={emailLoading}
                error={emailError}
                resendIn={emailResendIn}
                onStart={startEmailVerify}
                onCheck={checkEmailOtp}
                onCancelOtp={() => { setEmailOtpStage(false); setEmailError(""); }}
              />

              <div>
                <p className="text-[12px] font-medium text-muted mb-1.5">How much are you planning to invest?</p>
                <div className="flex flex-wrap gap-2">
                  {AMOUNT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setAmountLakhs(opt.value)}
                      className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-colors ${
                        amountLakhs === opt.value
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-body border-rule hover:border-primary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <textarea
                  name="message" value={formData.message} onChange={handleInputChange}
                  disabled={isSubmitting} placeholder="Brief question or message (Optional)" rows={2}
                  className="w-full px-3 py-2 text-[13.5px] border border-rule rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body placeholder-muted/65 bg-white resize-none disabled:bg-surface disabled:text-muted"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-[12px] text-loss font-medium" role="alert">{errorMsg}</div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="submit" disabled={isSubmitting}
                className="w-full h-10 inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-white text-[13.5px] font-semibold rounded-md shadow-btn disabled:opacity-50 transition"
              >
                {isSubmitting ? "Requesting Callback..." : "Request Callback"}
              </button>
              <p className="text-[9.5px] text-muted text-center leading-snug">
                SIFs are high-ticket investment products. <br />
                We will only use this information to resolve your inquiry.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
