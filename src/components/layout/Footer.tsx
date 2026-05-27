"use client";

import { useState } from "react";
import {
  ChevronRight,
  Shield,
  Clock,
  CalendarDays,
  FileText,
  MapPin,
  Activity,
  Mail,
  Headphones,
  Building2,
} from "lucide-react";

// ── Section heading with blue underline ──────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <h3 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand-navy mb-1">
        {children}
      </h3>
      <div className="w-8 h-[2.5px] bg-primary rounded-full" />
    </div>
  );
}

// ── Nav link with chevron ────────────────────────────────────────────────────
function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        className="flex items-center gap-1.5 text-[13.5px] text-body hover:text-primary group"
      >
        <ChevronRight className="w-3 h-3 text-faint group-hover:text-primary flex-shrink-0" strokeWidth={2.5} />
        {label}
      </a>
    </li>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-white border-t border-rule">

      {/* ── MAIN SECTION ──────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-8 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_220px] gap-7">

          {/* ── Brand ─────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 flex-shrink-0">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20 2 L35 10 L35 30 L20 38 L5 30 L5 10 Z"
                    fill="#1E4ED8"
                    stroke="#1B43B8"
                    strokeWidth="1"
                  />
                  <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
                    fill="white" fontSize="13" fontWeight="700" fontFamily="Inter,sans-serif">
                    SC
                  </text>
                </svg>
              </div>
              <div>
                <span className="text-[16px] font-bold text-brand-navy tracking-tight">
                  SIFCase
                </span>
                <span className="text-[12px] font-medium text-muted ml-1.5">
                  by Aureva
                </span>
              </div>
            </div>

            <p className="text-[13px] text-body leading-relaxed mb-3 max-w-[240px]">
              Aureva&apos;s intelligence platform for Specialized Investment Funds.
              Research, compare, and analyze SIFs with institutional-grade depth.
            </p>

            <div className="flex items-center gap-2 text-[12px] text-muted">
              <Activity className="w-3.5 h-3.5 text-verified flex-shrink-0" strokeWidth={2} />
              Data cadence: Live NAV &nbsp;·&nbsp; Research refreshed regularly
            </div>
          </div>

          {/* ── Nav columns ───────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {/* PLATFORM */}
            <div>
              <SectionHeading>Platform</SectionHeading>
              <ul className="space-y-2">
                <FooterLink href="/sifs" label="Explore SIFs" />
                <FooterLink href="/compare" label="Compare Funds" />
                <FooterLink href="/performance" label="Performance Analytics" />
                <FooterLink href="/dashboard" label="Market Dashboard" />
              </ul>
            </div>

            {/* RESEARCH */}
            <div>
              <SectionHeading>Research</SectionHeading>
              <ul className="space-y-2">
                <FooterLink href="/research" label="Research Reports" />
                <FooterLink href="/strategy" label="Strategy Intelligence" />
                <FooterLink href="/learn" label="Learn SIFs" />
                <FooterLink href="/calculators" label="Tools &amp; Calculators" />
              </ul>
            </div>

            {/* INSTITUTIONAL */}
            <div>
              <SectionHeading>Institutional</SectionHeading>
              <ul className="space-y-2">
                <FooterLink href="/about" label="About SIFCase" />
                <FooterLink href="/advisor" label="Advisor Connect" />
                <FooterLink href="/contact" label="Callback Request" />
              </ul>
            </div>

            {/* LEGAL */}
            <div>
              <SectionHeading>Legal</SectionHeading>
              <ul className="space-y-2">
                <FooterLink href="/disclaimer" label="Disclaimer" />
                <FooterLink href="/privacy" label="Privacy Policy" />
                <FooterLink href="/terms" label="Terms of Use" />
                <FooterLink href="/sebi" label="SEBI Disclosure" />
              </ul>
            </div>
          </div>

          {/* ── Stay updated + social ─────────────── */}
          <div>
            <SectionHeading>Stay Updated</SectionHeading>
            <p className="text-[13px] text-body leading-relaxed mb-3">
              Subscribe for market insights and SIF updates.
            </p>

            {/* Email form */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center rounded-[10px] border border-rule overflow-hidden shadow-card">
                <div className="flex items-center pl-3">
                  <Mail className="w-4 h-4 text-faint flex-shrink-0" strokeWidth={1.75} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-2.5 py-2.5 text-[13px] text-body placeholder:text-faint bg-transparent outline-none min-w-0"
                />
              </div>
              <button className="w-full py-2.5 rounded-[10px] bg-brand-navy text-white text-[12.5px] font-semibold hover:bg-ink">
                Subscribe
              </button>
            </div>

            {/* Social icons */}
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand-navy mb-3">
                Follow Us
              </p>
              <div className="flex items-center gap-2.5">
                <a href="#" aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-90">
                  <span className="text-white text-[13px] font-bold">f</span>
                </a>
                <a href="#" aria-label="X"
                  className="w-9 h-9 rounded-full bg-[#0F1419] flex items-center justify-center hover:opacity-80">
                  <span className="text-white text-[11px] font-bold">𝕏</span>
                </a>
                <a href="#" aria-label="LinkedIn"
                  className="w-9 h-9 rounded-full bg-[#0A66C2] flex items-center justify-center hover:opacity-90">
                  <span className="text-white text-[11px] font-bold">in</span>
                </a>
                <a href="#" aria-label="Instagram"
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90"
                  style={{ background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)" }}>
                  <span className="text-white text-[13px]">⬡</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPLIANCE SECTION ────────────────────────────────────────────── */}
      <div className="border-t border-rule bg-surface">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule">

            {/* Registration details */}
            <div className="py-5 pr-0 md:pr-6">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Building2 className="w-4 h-4 text-brand-navy flex-shrink-0" strokeWidth={1.75} />
                <SectionHeading>Aureva Capital Private Limited</SectionHeading>
              </div>
              <ul className="space-y-2">
                {[
                  { Icon: Shield, text: "SEBI Registration No: Awaiting" },
                  { Icon: Clock, text: "AMFI-registered MFD: ARN-346247" },
                  { Icon: CalendarDays, text: "Validity: 24-NOV-2025 to 23-NOV-2028" },
                  { Icon: FileText, text: "CIN: U66190MH2025PTC460862" },
                  { Icon: MapPin, text: "Awfis, B Wing 6F, Supreme Business Park, Hiranandani Gardens, Powai, Mumbai 400076" },
                ].map(({ Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-[2px]" strokeWidth={1.75} />
                    <span className="text-[12px] text-muted leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Principal officer + escalation */}
            <div className="py-5 px-0 md:px-6">
              <div className="mb-4">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-full bg-mist flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-brand-navy">PO</span>
                  </div>
                  <SectionHeading>Principal Officer</SectionHeading>
                </div>
                <p className="text-[15px] font-bold text-heading mb-2">Smita Sahai</p>
                <a
                  href="mailto:Smita.sahai@aurevawealth.com"
                  className="flex items-center gap-2 text-[13px] text-primary hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Smita.sahai@aurevawealth.com
                </a>
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <Headphones className="w-4 h-4 text-brand-navy flex-shrink-0" strokeWidth={1.75} />
                  <SectionHeading>Escalation</SectionHeading>
                </div>
                <p className="text-[12.5px] text-body leading-relaxed">
                  You may also write to SEBI on SEBI Complaints Redress System (SCORES) at{" "}
                  <a href="https://scores.sebi.gov.in" target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline">
                    https://scores.sebi.gov.in
                  </a>
                  <br />
                  For Online Dispute Resolution Portal click SMART ODR.
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="py-5 pl-0 md:pl-6">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Shield className="w-4 h-4 text-brand-navy flex-shrink-0" strokeWidth={1.75} />
                <SectionHeading>Disclaimer</SectionHeading>
              </div>
              <div className="space-y-2 text-[12px] text-body leading-relaxed">
                <p>
                  Unless otherwise stated, all content on this website is issued by Aureva Capital
                  Private Limited (&ldquo;Aureva&rdquo;) and is meant for general information and
                  educational purposes only. It may be updated or changed without notice.
                </p>
                <p>
                  Nothing here should be considered an offer, solicitation, or recommendation to
                  buy or sell any financial product or service, or to provide investment or
                  portfolio advice. The information should not be relied upon for making financial
                  or investment decisions.
                </p>
                <p>
                  This content does not constitute financial, tax, legal, or accounting advice,
                  and visitors are advised to seek independent professional guidance before acting
                  on any information.
                </p>
                <p>
                  Investments in Specialized Investment Fund involves relatively higher risk including potential loss of capital, liquidity risk and market volatility.  Please read all investment strategy related documents carefully before making the investment decision.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────────────────────────────── */}
      <div className="bg-brand-navy py-4">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] text-white/70">
            <Shield className="w-4 h-4 text-verified flex-shrink-0" strokeWidth={1.75} />
            <span>© 2026 SIFCase by Aureva &nbsp;·&nbsp; Research &amp; Analytics</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-white/50">
            <Activity className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
            <span>
              For analytical purposes only &nbsp;·&nbsp; SIFs involve capital risk
              &nbsp;·&nbsp; Consult your financial &amp; tax advisor
            </span>
          </div>
        </div>
      </div>

    </footer>
  );
}
