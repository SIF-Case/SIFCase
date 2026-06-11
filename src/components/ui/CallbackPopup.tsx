"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, Phone, User, Mail, MessageSquare, Check } from "lucide-react";

export function CallbackPopup() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Exclude admin panel pages, api routes, and auth paths
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/auth")
    ) {
      return;
    }

    // 2. Exclude if user is admin
    if (session?.user?.isAdmin) {
      return;
    }

    // 3. Check dismissal persistence (2 days)
    const dismissedUntil = localStorage.getItem("sif:callback_popup_dismissed_until");
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // 4. Trigger after 1 minute (60,000ms)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, [pathname, session]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      // Dismiss for 2 days (2 * 24 * 60 * 60 * 1000 = 172800000 ms)
      localStorage.setItem(
        "sif:callback_popup_dismissed_until",
        (Date.now() + 172800000).toString()
      );
    }
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Frontend validation
    if (!formData.name.trim()) {
      setErrorMsg("Name is required");
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg("Phone number is required");
      return;
    }
    // Simple phone number validation (must be numeric/spaces/pluses, minimum 8 digits)
    const phoneClean = formData.phone.replace(/[\s\-\+\(\)]/g, "");
    if (!/^\d{8,15}$/.test(phoneClean)) {
      setErrorMsg("Please enter a valid phone number (8-15 digits)");
      return;
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setErrorMsg("Please enter a valid email address");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/public/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request");
      }

      setIsSubmitted(true);
      if (typeof window !== "undefined") {
        // Successful submission also sets 2 days dismissal
        localStorage.setItem(
          "sif:callback_popup_dismissed_until",
          (Date.now() + 172800000).toString()
        );
      }

      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] sm:w-[380px] bg-white border border-rule-strong rounded-[18px] shadow-premium p-5 animate-in fade-in slide-in-from-bottom-5 duration-300"
      role="dialog"
      aria-labelledby="callback-popup-title"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 rounded-full text-muted hover:text-heading hover:bg-surface transition"
        aria-label="Close dialog"
      >
        <X className="size-4" />
      </button>

      {isSubmitted ? (
        <div className="flex flex-col items-center text-center py-6 gap-3">
          <div className="size-12 rounded-full bg-verified/10 flex items-center justify-center text-verified">
            <Check className="size-6 stroke-[3]" />
          </div>
          <h3 id="callback-popup-title" className="text-[16px] font-semibold text-brand-navy">
            Callback Request Received
          </h3>
          <p className="text-[13px] text-body">
            An analyst from our SIF team will contact you shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 id="callback-popup-title" className="text-[16px] font-semibold text-brand-navy">
              Would you like a SIF consultation?
            </h3>
            <p className="text-[12.5px] text-body leading-snug">
              Enter your details below and an analyst will call you back to discuss Specialized Investment Funds.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                <User className="size-4" />
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="Full Name"
                required
                className="w-full pl-9 pr-3 py-2 text-[13.5px] border border-rule rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body placeholder-muted/65 bg-white disabled:bg-surface disabled:text-muted"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                <Phone className="size-4" />
              </span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="Phone Number"
                required
                className="w-full pl-9 pr-3 py-2 text-[13.5px] border border-rule rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body placeholder-muted/65 bg-white disabled:bg-surface disabled:text-muted"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                <Mail className="size-4" />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="Email Address (Optional)"
                className="w-full pl-9 pr-3 py-2 text-[13.5px] border border-rule rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body placeholder-muted/65 bg-white disabled:bg-surface disabled:text-muted"
              />
            </div>

            <div className="relative">
              <span className="absolute top-2.5 left-3 text-muted">
                <MessageSquare className="size-4" />
              </span>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="Brief question or message (Optional)"
                rows={2}
                className="w-full pl-9 pr-3 py-2 text-[13.5px] border border-rule rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-body placeholder-muted/65 bg-white resize-none disabled:bg-surface disabled:text-muted"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="text-[12px] text-loss font-medium" role="alert">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-white text-[13.5px] font-semibold rounded-md shadow-btn disabled:opacity-50 transition"
            >
              {isSubmitting ? "Requesting Callback..." : "Request Callback"}
            </button>
            <p className="text-[9.5px] text-muted text-center leading-snug">
              SIFs are high-ticket investment products. We will only use this information to resolve your inquiry.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
