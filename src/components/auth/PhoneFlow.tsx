'use client';

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

type Step = "phone" | "otp";

export function PhoneFlow({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, containerRef.current, {
      size: "invisible",
    });
    return () => {
      recaptchaRef.current?.clear();
    };
  }, []);

  async function sendOtp() {
    setError("");
    if (!phone.match(/^\+\d{7,15}$/)) {
      setError("Enter a valid phone number with country code (e.g. +919876543210)");
      return;
    }
    setLoading(true);
    try {
      confirmationRef.current = await signInWithPhoneNumber(
        firebaseAuth,
        phone,
        recaptchaRef.current!,
      );
      setStep("otp");
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to send OTP. Try again.");
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
      onSuccess();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div ref={containerRef} />

      {step === "phone" ? (
        <>
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              onKeyDown={(e) => e.key === "Enter" && sendOtp()}
            />
          </div>
          {error && <p className="text-[12px] text-loss">{error}</p>}
          <button
            onClick={sendOtp}
            disabled={loading}
            className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Send OTP
          </button>
        </>
      ) : (
        <>
          <p className="text-[13px] text-muted">Code sent to <span className="text-body font-medium">{phone}</span></p>
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1.5">6-digit OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading tracking-[0.2em] text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              autoFocus
            />
          </div>
          {error && <p className="text-[12px] text-loss">{error}</p>}
          <button
            onClick={verifyOtp}
            disabled={loading}
            className="w-full h-10 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Verify OTP
          </button>
          <button onClick={() => { setStep("phone"); setOtp(""); setError(""); }} className="w-full text-center text-[12px] text-muted hover:text-body">
            Change number
          </button>
        </>
      )}
    </div>
  );
}
