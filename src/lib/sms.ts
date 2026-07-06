const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

function toIndianNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function sendOtpSms(phone: string, otp: string) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const senderId = process.env.FAST2SMS_SENDER_ID;
  const messageId = process.env.FAST2SMS_MESSAGE_ID;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY is not set");
  if (!senderId) throw new Error("FAST2SMS_SENDER_ID is not set");
  if (!messageId) throw new Error("FAST2SMS_MESSAGE_ID is not set");

  const params = new URLSearchParams({
    authorization: apiKey,
    route: "dlt",
    sender_id: senderId,
    message: messageId,
    variables_values: otp,
    flash: "0",
    numbers: toIndianNumber(phone),
  });

  const res = await fetch(`${FAST2SMS_URL}?${params.toString()}`, { method: "GET" });
  const data = await res.json();
  if (!res.ok || data.return !== true) {
    console.error("Fast2SMS send failed:", data);
    throw new Error("Failed to send SMS OTP");
  }
}
