import nodemailer from "nodemailer";

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
