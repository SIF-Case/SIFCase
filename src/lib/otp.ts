import crypto from "crypto";
import bcrypt from "bcryptjs";
import { after } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EmailOtp, { type EmailOtpPurpose } from "@/models/EmailOtp";
import PhoneOtp from "@/models/PhoneOtp";
import { sendOtpEmail } from "@/lib/mailer";
import { sendOtpSms } from "@/lib/sms";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - visible.length, 3))}@${domain}`;
}

type IssueResult = { ok: true } | { ok: false; reason: "cooldown" };

export async function issueEmailOtp(opts: {
  purpose: EmailOtpPurpose;
  key: string;
  email: string;
  name?: string;
}): Promise<IssueResult> {
  await connectDB();
  const existing = await EmailOtp.findOne({ key: opts.key, purpose: opts.purpose }).lean();
  if (existing && Date.now() - new Date(existing.createdAt).getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, reason: "cooldown" };
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  await EmailOtp.findOneAndUpdate(
    { key: opts.key, purpose: opts.purpose },
    {
      email: opts.email,
      name: opts.name,
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
    { upsert: true },
  );

  // OTP is already stored — don't make the caller wait on the SMTP round-trip.
  // `after` keeps the function alive past the response so the send isn't killed mid-flight.
  after(() =>
    sendOtpEmail(opts.email, otp).catch((err) => {
      console.error("Failed to send OTP email:", err);
    }),
  );

  return { ok: true };
}

type ConsumeResult =
  | { ok: true; email: string; name?: string }
  | { ok: false; reason: "not-found" | "expired" | "too-many-attempts" | "mismatch" };

export async function consumeEmailOtp(opts: {
  purpose: EmailOtpPurpose;
  key: string;
  otp: string;
}): Promise<ConsumeResult> {
  await connectDB();
  const record = await EmailOtp.findOne({ key: opts.key, purpose: opts.purpose });
  if (!record) return { ok: false, reason: "not-found" };

  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne();
    return { ok: false, reason: "expired" };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    return { ok: false, reason: "too-many-attempts" };
  }

  const valid = await bcrypt.compare(opts.otp, record.otpHash);
  if (!valid) {
    record.attempts += 1;
    await record.save();
    return { ok: false, reason: "mismatch" };
  }

  const { email, name } = record;
  await record.deleteOne();
  return { ok: true, email, name };
}

type PhoneIssueResult = { ok: true } | { ok: false; reason: "cooldown" };

export async function issuePhoneOtp(phone: string): Promise<PhoneIssueResult> {
  await connectDB();
  const existing = await PhoneOtp.findOne({ phone }).lean();
  if (existing && Date.now() - new Date(existing.createdAt).getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, reason: "cooldown" };
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  await PhoneOtp.findOneAndUpdate(
    { phone },
    { otpHash, attempts: 0, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    { upsert: true },
  );

  after(() =>
    sendOtpSms(phone, otp).catch((err) => {
      console.error("Failed to send OTP SMS:", err);
    }),
  );

  return { ok: true };
}

type PhoneConsumeResult =
  | { ok: true }
  | { ok: false; reason: "not-found" | "expired" | "too-many-attempts" | "mismatch" };

export async function consumePhoneOtp(phone: string, otp: string): Promise<PhoneConsumeResult> {
  await connectDB();
  const record = await PhoneOtp.findOne({ phone });
  if (!record) return { ok: false, reason: "not-found" };

  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne();
    return { ok: false, reason: "expired" };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await record.deleteOne();
    return { ok: false, reason: "too-many-attempts" };
  }

  const valid = await bcrypt.compare(otp, record.otpHash);
  if (!valid) {
    record.attempts += 1;
    await record.save();
    return { ok: false, reason: "mismatch" };
  }

  await record.deleteOne();
  return { ok: true };
}

