"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function Footer() {
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<{ totalFunds: number; uniqueAMCs: number } | null>(null);

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((d) => setStats({ totalFunds: d.totalFunds, uniqueAMCs: d.uniqueAMCs }))
      .catch(() => {});
  }, []);

  return (
    <footer className="footer">
      {/* ── TOP: Newsletter + Social ── */}
      <div className="footer-top">
        <div className="newsletter-group">
          <span className="nl-eyebrow">SIF Alerts</span>
          <div className="nl-form">
            <input
              className="nl-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="nl-btn">Get NFO &amp; NAV updates</button>
          </div>
        </div>
        <div className="social-row">
          <span className="social-lbl">Follow</span>
          <a className="soc" href="#" title="Twitter / X">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.257 5.622 5.907-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a className="soc" href="#" title="LinkedIn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <a className="soc" href="#" title="YouTube">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
            </svg>
          </a>
          <a className="soc" href="#" title="WhatsApp">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="footer-main">
        {/* Brand */}
        <div className="brand-col">
          <div className="logo-wrap">
            <Link href="/" aria-label="Go to home page">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="SIFcase" width={1560} height={337} className="h-7 w-auto" />
            </Link>
          </div>
          <p className="brand-desc">
            India&apos;s dedicated SIF distribution &amp; research platform. Compare every SEBI-registered Specialised Investment Fund with verified data.
          </p>
          <div className="status-list">
            <div className="status-item">
              <span className="dot dot-live"></span> NAV updated daily · AMFI source
            </div>
            <div className="status-item">
              <span className="dot dot-teal"></span>
              {stats ? `${stats.totalFunds} SIFs · ${stats.uniqueAMCs} AMCs tracked` : "Loading tracked SIFs…"}
            </div>
            <div className="status-item">
              <span className="dot dot-navy"></span> AMFI-registered distributor
            </div>
          </div>
        </div>

        {/* Platform */}
        <div className="nav-col">
          <div className="col-head">Platform</div>
          <ul>
            <li>
              <Link href="/sifs">Explore SIFs</Link>
            </li>
            <li>
              <Link href="/compare">Compare funds</Link>
            </li>
            <li>
              <Link href="/fund-houses">Fund houses</Link>
            </li>
            <li>
              <Link href="/performance">Performance analytics</Link>
            </li>
            <li>
              <Link href="/dashboard">Market dashboard</Link>
            </li>
            <li>
              <Link href="/nfos">
                NFO tracker <span className="pill-new">Live</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Research */}
        <div className="nav-col">
          <div className="col-head">Research</div>
          <ul>
            <li>
              <Link href="/research">Monthly reports</Link>
            </li>
            <li>
              <Link href="/strategy">Strategy notes</Link>
            </li>
            <li>
              <Link href="/learn">SIF 101 guide</Link>
            </li>
            <li>
              <Link href="/calculators">Tools &amp; calculators</Link>
            </li>
            <li>
              <Link href="/read">Insights</Link>
            </li>
            <li>
              <Link href="/news">News</Link>
            </li>
          </ul>
        </div>

        {/* Invest */}
        <div className="nav-col">
          <div className="col-head">Invest</div>
          <ul>
            <li>
              <Link href="/suitability">Find my SIF</Link>
            </li>
            <li>
              <Link href="/advisor">Expert connect</Link>
            </li>
            <li>
              <Link href="/contact">Callback request</Link>
            </li>
            <li>
              <Link href="/about">About SIFcase</Link>
            </li>
            <li>
              <Link href="/partner">Partner with us</Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div className="nav-col">
          <div className="col-head">Legal</div>
          <ul>
            <li>
              <Link href="/disclaimer">Disclaimer</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms of use</Link>
            </li>
            <li>
              <Link href="/sebi">SEBI disclosure</Link>
            </li>
            <li>
              <Link href="/grievance">Grievance redressal</Link>
            </li>
            <li>
              <a
                href="https://scores.sebi.gov.in"
                target="_blank"
                rel="noopener noreferrer"
              >
                SCORES · SEBI
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* ── REGISTRATION STRIP ── */}
      <div className="footer-reg">
        <div>
          <div className="reg-head">Entity details</div>
          <div className="reg-val">
            <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>
              Aureva Capital Private Limited
            </strong>
            <br />
            CIN: U66190MH2025PTC460862
            <br />
            Awfis, B Wing 6F, Supreme Business Park,
            <br />
            Hiranandani Gardens, Powai, Mumbai 400076
          </div>
        </div>
        <div>
          <div className="reg-head">Registrations</div>
          <div className="tag-row">
            <span className="rtag">
              <span
                className="td"
                style={{ background: "var(--green)" }}
              ></span>
              AMFI MFD &amp; SIF Distributor
            </span>
            <span className="rtag">
              <span
                className="td"
                style={{ background: "var(--green)" }}
              ></span>
              ARN-346247
            </span>
            <span className="rtag">
              <span
                className="td"
                style={{ background: "var(--teal)" }}
              ></span>
              APRN: APRN0797924
            </span>
            <span className="rtag">
              <span
                className="td"
                style={{ background: "var(--teal)" }}
              ></span>
              Startup India: DIPP232750
            </span>
          </div>
          <div className="reg-val">
            Principal Officer:{" "}
            <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>
              Smita Sahai
            </strong>
            <br />
            <a href="mailto:smita.sahai@aurevawealth.com">
              smita.sahai@aurevawealth.com
            </a>
          </div>
        </div>
        <div>
          <div className="reg-head">Grievance &amp; escalation</div>
          <div className="reg-val">
            <a href="mailto:support@sifcase.com">support@sifcase.com</a>
            <br />
            <br />
            SEBI Complaints (SCORES):
            <br />
            <a
              href="https://scores.sebi.gov.in"
              target="_blank"
              rel="noopener noreferrer"
            >
              scores.sebi.gov.in
            </a>
            <br />
            Online Dispute Resolution:{" "}
            <a href="#" target="_blank" rel="noopener noreferrer">
              SMART ODR Portal
            </a>
          </div>
        </div>
      </div>

      {/* ── SEBI DISCLAIMER ── */}
      <div className="footer-disclaimer">
        <div className="disc-label">SEBI statutory disclaimer</div>
        <p className="disc-text">
          Investments in Specialized Investment Fund involves relatively higher risk including potential loss of capital, liquidity risk and market volatility. Please read all investment strategy related documents carefully before making the investment decision.
        </p>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="footer-bottom">
        <div className="copy">
          © 2026 SIFcase by Aureva Capital · All rights reserved
        </div>
        <div className="bottom-links">
          <Link href="/sitemap">Sitemap</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/cookies">Cookie preferences</Link>
        </div>
        <div className="india-seal">
          <div className="flag">
            <span style={{ background: "#FF9933" }}></span>
            <span
              style={{
                background: "#FFFFFF",
                borderTop: "0.5px solid #eee",
                borderBottom: "0.5px solid #eee",
              }}
            ></span>
            <span style={{ background: "#138808" }}></span>
          </div>
          SEBI Regulated Product · India
        </div>
      </div>
    </footer>
  );
}
