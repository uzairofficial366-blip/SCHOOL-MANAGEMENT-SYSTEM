/**
 * SMS & WhatsApp Notification Client (Twilio)
 *
 * Supports:
 *  - Plain SMS via Twilio Programmable SMS
 *  - WhatsApp via Twilio WhatsApp API (preferred in Pakistan)
 *
 * Usage:
 *  await sendSMS({ to: "+923001234567", body: "Your fee is due..." });
 *  await sendWhatsApp({ to: "+923001234567", body: "Your fee is due..." });
 */

const ACCOUNT_SID      = process.env.TWILIO_ACCOUNT_SID ?? "";
const AUTH_TOKEN       = process.env.TWILIO_AUTH_TOKEN ?? "";
const FROM_PHONE       = process.env.TWILIO_PHONE ?? "";           // "+1234567890"
const FROM_WHATSAPP    = process.env.TWILIO_WHATSAPP_FROM ?? "";   // "whatsapp:+14155238886"

const TWILIO_BASE      = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
const BASIC_AUTH       = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");

export interface SmsResult {
  sid:    string;
  status: string;
}

async function twilioPost(body: URLSearchParams): Promise<SmsResult> {
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    console.warn("[SMS] Twilio credentials not configured — notification skipped.");
    return { sid: "mock", status: "skipped" };
  }

  const res = await fetch(TWILIO_BASE, {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${BASIC_AUTH}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return { sid: json.sid, status: json.status };
}

/** Send a plain SMS. `to` must be E.164 format e.g. "+923001234567" */
export async function sendSMS(opts: { to: string; body: string }): Promise<SmsResult> {
  const params = new URLSearchParams({
    To:   opts.to,
    From: FROM_PHONE,
    Body: opts.body,
  });
  return twilioPost(params);
}

/** Send a WhatsApp message via Twilio. `to` must be E.164 format. */
export async function sendWhatsApp(opts: { to: string; body: string }): Promise<SmsResult> {
  const params = new URLSearchParams({
    To:   `whatsapp:${opts.to}`,
    From: FROM_WHATSAPP,
    Body: opts.body,
  });
  return twilioPost(params);
}

/** Normalize Pakistani mobile number to E.164 e.g. "03001234567" → "+923001234567" */
export function normalizePakistaniPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92"))  return `+${digits}`;
  if (digits.startsWith("0"))   return `+92${digits.slice(1)}`;
  if (digits.length === 10)     return `+92${digits}`;
  return `+${digits}`;
}
