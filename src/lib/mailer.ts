import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import NotificationSetting, { LEAD_CHANNEL } from "@/models/NotificationSetting";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendOtpEmail(to: string, otp: string) {
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 420px; margin: 0 auto;">
      <div style="width: 32px; height: 32px; border-radius: 8px; background: #0B1F3A; color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">S</div>
      <h2 style="font-size: 18px; color: #0B1F3A; margin: 0 0 8px;">Your verification code</h2>
      <p style="font-size: 14px; color: #5B6B82; margin: 0 0 20px;">Enter this code to continue signing in to SIFcase. It expires in 10 minutes.</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 0.3em; color: #0B1F3A; background: #F4F6F9; border-radius: 10px; padding: 16px; text-align: center; font-family: monospace;">${otp}</div>
      <p style="font-size: 12px; color: #9AA6B5; margin-top: 24px;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
  `;
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `${otp} is your SIFcase verification code`,
    html,
  });
}

// Sales inbox for callback/lead notifications. The live list is managed by
// admins at /admin/settings (NotificationSetting, channel "lead"). The env var
// LEAD_NOTIFY_EMAILS is only the bootstrap default used until someone saves a
// list in the admin panel; the constant below backstops a missing env var so a
// misconfigured deploy can't silently drop leads.
const LEAD_NOTIFY_FALLBACK = "roshanajith7911@gmail.com";

export function envLeadRecipients(): string[] {
  return parseRecipients(process.env.LEAD_NOTIFY_EMAILS || LEAD_NOTIFY_FALLBACK);
}

export function parseRecipients(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(/[,;\n]/)) {
    const v = raw.trim().toLowerCase();
    if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) seen.add(v);
  }
  return [...seen];
}

export type LeadRecipientConfig = { recipients: string[]; enabled: boolean; source: "admin" | "env" };

/**
 * Resolve who gets lead alerts: the admin-managed list wins, env is the
 * fallback. A saved-but-disabled config means alerts are intentionally off.
 */
export async function getLeadRecipientConfig(): Promise<LeadRecipientConfig> {
  try {
    await connectDB();
    const doc = await NotificationSetting.findOne({ channel: LEAD_CHANNEL }).lean();
    if (doc && doc.recipients?.length) {
      return { recipients: doc.recipients, enabled: doc.enabled !== false, source: "admin" };
    }
    if (doc && doc.enabled === false) {
      return { recipients: envLeadRecipients(), enabled: false, source: "admin" };
    }
  } catch (err) {
    // A DB hiccup must not cost us the lead alert — fall through to env.
    console.error("Lead notification settings lookup failed, using env fallback:", err);
  }
  return { recipients: envLeadRecipients(), enabled: true, source: "env" };
}

function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

// Escape anything that lands in the HTML body — lead fields are free text typed
// by a stranger on a public form.
function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type LeadNotification = {
  clientId: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  fundName?: string;
  schemeCode?: string;
  strategy?: string;
  amountLakhs?: number | null;
  /** Signed-in account the request came from, if any. */
  accountEmail?: string;
  source: string;
  /** Marks the mail as an admin-triggered test so nobody chases a fake lead. */
  isTest?: boolean;
};

export async function sendLeadNotificationEmail(
  lead: LeadNotification,
  /** Overrides the configured list — used by the admin "send test" button. */
  overrideRecipients?: string[],
) {
  let to = overrideRecipients ?? [];
  if (!to.length) {
    const config = await getLeadRecipientConfig();
    if (!config.enabled) return { sent: false, reason: "disabled" as const, recipients: [] };
    to = config.recipients;
  }
  if (!to.length) return { sent: false, reason: "no-recipients" as const, recipients: [] };

  const base = siteUrl();
  const fundUrl = lead.schemeCode ? `${base}/sifs/${encodeURIComponent(lead.schemeCode.toLowerCase())}` : "";
  const adminUrl = `${base}/admin/clients/${lead.clientId}`;
  const receivedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const amount = typeof lead.amountLakhs === "number" ? `₹${lead.amountLakhs}L` : "Not specified";
  const prefix = lead.isTest ? "[TEST] " : "";
  const subject = lead.fundName
    ? `${prefix}New callback request · ${lead.name} · ${lead.fundName} (${amount})`
    : `${prefix}New callback request · ${lead.name} (${amount})`;

  const rows: Array<[string, string]> = [
    ["Name", esc(lead.name)],
    ["Phone", `<a href="tel:${esc(lead.phone.replace(/\s/g, ""))}" style="color:#1F5FBF;text-decoration:none;">${esc(lead.phone)}</a>`],
    ["Email", lead.email ? `<a href="mailto:${esc(lead.email)}" style="color:#1F5FBF;text-decoration:none;">${esc(lead.email)}</a>` : "—"],
    ["Planning to invest", esc(amount)],
    ["Fund", lead.fundName ? esc(lead.fundName) : "General enquiry (not fund-specific)"],
    ["Scheme code", lead.schemeCode ? esc(lead.schemeCode) : "—"],
    ["Strategy", lead.strategy ? esc(lead.strategy) : "—"],
    ["Message", lead.message ? esc(lead.message) : "—"],
    ["SIFcase account", lead.accountEmail ? esc(lead.accountEmail) : "Not signed in"],
    ["Submitted from", esc(lead.source)],
    ["Received", esc(receivedAt) + " IST"],
  ];

  const rowsHtml = rows
    .map(
      ([label, value], i) => `
        <tr style="background:${i % 2 ? "#FFFFFF" : "#F7F9FC"};">
          <td style="padding:10px 14px;font-size:12px;color:#5B6B82;width:170px;vertical-align:top;white-space:nowrap;">${label}</td>
          <td style="padding:10px 14px;font-size:13.5px;color:#0B1F3A;font-weight:600;vertical-align:top;">${value}</td>
        </tr>`
    )
    .join("");

  const buttons = [
    `<a href="${adminUrl}" style="display:inline-block;padding:11px 18px;border-radius:8px;background:#0B1F3A;color:#FFFFFF;font-size:13px;font-weight:600;text-decoration:none;">Open lead in admin</a>`,
    fundUrl
      ? `<a href="${fundUrl}" style="display:inline-block;padding:11px 18px;border-radius:8px;background:#FFFFFF;border:1px solid #D7DEE8;color:#0B1F3A;font-size:13px;font-weight:600;text-decoration:none;margin-left:8px;">View fund page</a>`
      : "",
  ].join("");

  const testBanner = lead.isTest
    ? `<div style="padding:10px 24px;background:#FFF6E5;border-bottom:1px solid #F0D9A8;font-size:12px;color:#8A6100;font-weight:600;">
         Test email sent from the SIFcase admin panel. This is not a real lead — no action needed.
       </div>`
    : "";

  const html = `
  <div style="background:#F4F6F9;padding:28px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E4E9F0;border-radius:14px;overflow:hidden;">
      ${testBanner}
      <div style="padding:20px 24px;border-bottom:1px solid #E4E9F0;">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5B6B82;font-weight:700;">SIFcase · Lead alert</div>
        <h1 style="margin:6px 0 0;font-size:19px;color:#0B1F3A;">New callback request</h1>
        <p style="margin:6px 0 0;font-size:13px;color:#5B6B82;">
          ${esc(lead.name)} asked to be contacted${lead.fundName ? ` about <strong style="color:#0B1F3A;">${esc(lead.fundName)}</strong>` : ""}.
          The phone number below was verified by OTP.
        </p>
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        ${rowsHtml}
      </table>

      <div style="padding:20px 24px;border-top:1px solid #E4E9F0;">
        ${buttons}
        <p style="margin:14px 0 0;font-size:11.5px;color:#9AA6B5;line-height:1.5;">
          Automated notification from SIFcase. The request is already saved in the admin panel — no reply to this email is needed.
        </p>
      </div>
    </div>
  </div>`;

  const text = [
    lead.isTest ? `[TEST] New callback request — SIFcase (not a real lead)` : `New callback request — SIFcase`,
    ``,
    ...rows.map(([label, value]) => `${label}: ${value.replace(/<[^>]+>/g, "")}`),
    ``,
    `Open lead in admin: ${adminUrl}`,
    fundUrl ? `View fund page: ${fundUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to,
    replyTo: lead.email || undefined,
    subject,
    html,
    text,
  });

  return { sent: true as const, reason: "ok" as const, recipients: to };
}
