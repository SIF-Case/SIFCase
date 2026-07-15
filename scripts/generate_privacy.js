const fs = require('fs');
const content = `import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Shield } from "lucide-react";
import { getTickerNavs } from "@/lib/sifData";

export const metadata: Metadata = {
  title: "Privacy Policy — SIFCase",
  description: "Privacy Policy for SIFCase by Aureva Capital Private Limited.",
};

export default async function PrivacyPage() {
  const tickerNavs = await getTickerNavs();

  return (
    <main className="flex flex-col min-h-screen bg-surface">
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-rule pt-10 pb-10">
        <div className="max-w-[760px] mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4.5 h-4.5 text-primary" strokeWidth={1.75} />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary">Legal</span>
          </div>
          <h1 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.8px] text-heading mb-3 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-[15px] text-body leading-relaxed max-w-[600px]">
            This Privacy Policy explains how Aureva Capital Private Limited ("Aureva," "we," "us," or "our"), the operator of SIFcase, collects, uses, discloses, and protects information.
          </p>
          <p className="text-[12px] text-muted mt-4">
            Last updated: 15th July 2026 &nbsp;·&nbsp; Issued by <span className="font-medium text-body">Aureva Capital Private Limited</span> &nbsp;·&nbsp; CIN: U66190MH2025PTC460862
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-[760px] mx-auto px-6 lg:px-8">
          <div className="space-y-8">
            
            {/* 1. Introduction */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">01</span>
                <h2 className="text-[15px] font-semibold text-heading">Introduction</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>This Privacy Policy explains how Aureva Capital Private Limited (“Aureva,” “we,” “us,” or “our”), the operator of SIFcase (the “Platform”), collects, uses, discloses, and protects information when you visit sifcase.com or interact with our services. It applies to all visitors, registered users, and anyone who submits information through the Platform.</p>
                <p>By using SIFcase, you agree to the collection and use of information in accordance with this Policy. If you do not agree, please do not use the Platform. This Policy should be read together with our Disclaimer and Terms of Use.</p>
              </div>
            </div>

            {/* 2. Information We Collect */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">02</span>
                <h2 className="text-[15px] font-semibold text-heading">Information We Collect</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-4">
                <div>
                  <h3 className="font-medium text-heading mb-2">2.1 Information you provide directly</h3>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Phone number</strong> — collected when you sign in via OTP-based login, to create and authenticate your account.</li>
                    <li><strong>Email address</strong> — collected when you subscribe to SIF Alerts, unlock a monthly performance report, or contact us for support.</li>
                    <li><strong>Name and contact details</strong> — if you request a callback or expert connect.</li>
                    <li>Any information you voluntarily submit in correspondence with us, including grievances or support queries sent to support@sifcase.com.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-heading mb-2">2.2 Information collected automatically</h3>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Usage data</strong> — pages visited, funds viewed or compared, time spent, referring URLs, and general navigation patterns.</li>
                    <li><strong>Device and technical data</strong> — IP address, browser type, operating system, and device identifiers.</li>
                    <li><strong>Cookies and similar technologies</strong> — see Section 4 below.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-heading mb-2">2.3 Information from third parties</h3>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Publicly available fund data</strong> (NAV, scheme documents, AUM) sourced from AMFI and asset management companies. This is fund-level market data, not personal information about you.</li>
                    <li>If you choose to invest in a scheme through Aureva as your distributor, we may receive transaction-related information in connection with that transaction.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. How We Use Your Information */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">03</span>
                <h2 className="text-[15px] font-semibold text-heading">How We Use Your Information</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Authenticate your account and provide access to the Platform;</li>
                  <li>Send the monthly performance reports or any other notifications you've requested;</li>
                  <li>Respond to support requests, callback requests, and grievances;</li>
                  <li>Understand how the Platform is used, and to maintain, improve, and secure it;</li>
                  <li>Comply with applicable law, and with our obligations as an AMFI-registered Mutual Fund Distributor (ARN-346247); and</li>
                  <li>Where you have separately consented, communicate with you about SIF launches, market updates, or educational content.</li>
                </ul>
                <p>SIFcase is a research and distribution platform, not a SEBI-registered Investment Adviser, and nothing in your use of the Platform creates an advisory relationship.</p>
              </div>
            </div>

            {/* 4. Cookies and Analytics */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">04</span>
                <h2 className="text-[15px] font-semibold text-heading">Cookies and Analytics</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>We use cookies and similar technologies such as Google Analytics to understand aggregate site usage and improve the Platform. These may include:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Essential cookies</strong> — required for login sessions and core site functionality.</li>
                  <li><strong>Analytics cookies</strong> — used to measure traffic and usage patterns in aggregate.</li>
                  <li><strong>Preference cookies</strong> — used to remember settings such as your last-viewed fund comparisons.</li>
                </ul>
                <p>You can control or disable cookies through your browser settings. Disabling essential cookies may affect the Platform's functionality, including your ability to stay logged in.</p>
              </div>
            </div>

            {/* 5. Legal Basis and Consent */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">05</span>
                <h2 className="text-[15px] font-semibold text-heading">Legal Basis and Consent</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>We process your personal data on the basis of your consent (for example, when you provide your phone number to log in, or your email to subscribe to alerts), and, where applicable, to comply with our legal and regulatory obligations as an AMFI-registered distributor. Where the Digital Personal Data Protection Act, 2023 applies, we process personal data as a “Data Fiduciary” and will provide the notice and consent mechanisms required under that Act. You may withdraw consent at any time by contacting us at the details in Section 9, though this may limit your ability to use certain features.</p>
              </div>
            </div>

            {/* 6. How We Share Your Information */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">06</span>
                <h2 className="text-[15px] font-semibold text-heading">How We Share Your Information</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>We do not sell your personal information. We may share it with:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Service providers</strong> who help us operate the Platform (for example, hosting, cloud storage, email delivery, and SMS/OTP providers), who are contractually bound to use your data only to provide services to us;</li>
                  <li><strong>Asset management companies, registrars and transfer agents (RTAs), or KYC Registration Agencies (KRAs)</strong>, but only where you choose to invest through us and only to the extent needed to process that transaction;</li>
                  <li><strong>Regulators and authorities</strong>, including SEBI and AMFI, where required by law or in response to a valid legal process;</li>
                  <li><strong>A successor entity</strong>, in the event of a merger, acquisition, or sale of assets, subject to the same protections described in this Policy.</li>
                </ul>
              </div>
            </div>

            {/* 7. Data Retention */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">07</span>
                <h2 className="text-[15px] font-semibold text-heading">Data Retention</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>We retain personal information for as long as necessary to provide the Platform's services, comply with our legal and regulatory record-keeping obligations as a mutual fund distributor, and resolve disputes. When no longer required, we take reasonable steps to delete or anonymize your data.</p>
              </div>
            </div>

            {/* 8. Data Security */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">08</span>
                <h2 className="text-[15px] font-semibold text-heading">Data Security</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>We use reasonable technical and organizational safeguards designed to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.</p>
              </div>
            </div>

            {/* 9. Your Rights */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">09</span>
                <h2 className="text-[15px] font-semibold text-heading">Your Rights</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>Subject to applicable law, you may have the right to:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Access the personal information we hold about you;</li>
                  <li>Correct inaccurate or incomplete information;</li>
                  <li>Withdraw consent or request erasure of your data, subject to our legal retention obligations;</li>
                  <li>Object to or restrict certain processing, such as marketing communications; and</li>
                  <li>Lodge a grievance with our Grievance Officer, and if unresolved, escalate to the appropriate regulatory authority.</li>
                </ul>
                <p>To exercise any of these rights, contact us using the details in Section 10. We will respond within a reasonable time and in accordance with applicable law.</p>
              </div>
            </div>

            {/* 10. Grievance Officer and Contact */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">10</span>
                <h2 className="text-[15px] font-semibold text-heading">Grievance Officer and Contact</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>In accordance with applicable law, the following is our designated contact for privacy-related queries and grievances:</p>
                <div className="pl-4 py-2 border-l-2 border-rule">
                  <p><strong>Email:</strong> <a href="mailto:smita.sahai@aurevawealth.com" className="text-primary hover:underline">smita.sahai@aurevawealth.com</a></p>
                  <p><strong>Grievance & escalation:</strong> <a href="mailto:support@sifcase.com" className="text-primary hover:underline">support@sifcase.com</a></p>
                </div>
                <p>If you are not satisfied with our response, you may escalate a SEBI-related grievance through the SCORES portal (<a href="https://scores.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">scores.sebi.gov.in</a>) or the SMART ODR Portal, consistent with our Grievance Redressal page.</p>
              </div>
            </div>

            {/* 11. Children's Privacy */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">11</span>
                <h2 className="text-[15px] font-semibold text-heading">Children's Privacy</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>SIFcase is intended for use by individuals capable of entering into a binding contract under Indian law and is not directed at children. SIFs also carry a regulatory minimum investment threshold (₹10 lakh), which inherently limits the Platform's relevance to minors. We do not knowingly collect personal information from children.</p>
              </div>
            </div>

            {/* 12. Changes to This Policy */}
            <div className="bg-white rounded-[16px] border border-rule shadow-card p-6">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[11px] font-mono text-faint mt-1 w-5 flex-shrink-0">12</span>
                <h2 className="text-[15px] font-semibold text-heading">Changes to This Policy</h2>
              </div>
              <div className="text-[13.5px] text-body leading-[1.7] pl-8 space-y-3">
                <p>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will post the updated version on this page with a revised “Last updated” date. Continued use of the Platform after changes are posted constitutes acceptance of the revised Policy. We encourage you to review this page periodically.</p>
              </div>
            </div>

          </div>

          {/* Contact note */}
          <div className="mt-10 rounded-[16px] border border-rule bg-white p-6 flex items-start gap-4">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <p className="text-[13.5px] font-semibold text-heading mb-1">Questions about privacy?</p>
              <p className="text-[13px] text-body leading-relaxed">
                Reach us at{" "}
                <a href="mailto:smita.sahai@aurevawealth.com" className="text-primary hover:underline">
                  smita.sahai@aurevawealth.com
                </a>{" "}
                or write to us at Awfis, B Wing 6F, Supreme Business Park, Hiranandani Gardens, Powai, Mumbai 400076.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
`;
fs.writeFileSync('src/app/privacy/page.tsx', content);
console.log('Updated privacy page');
