/**
 * EasyPaisa Server-to-Server Integration
 *
 * Flow:
 *  1. Backend generates a signed payload (Base64 + HMAC) and returns it to frontend
 *  2. Frontend embeds EasyPaisa JS tag, creates iframe, passes signed payload
 *  3. EasyPaisa processes payment, sends webhook + redirect to callback URL
 *
 * Docs: EasyPaisa Merchant Integration Guide v2.x
 */

import crypto from "crypto";

const SANDBOX_BASE   = "https://easypaystg.easypaisa.com.pk";
const LIVE_BASE      = "https://easypay.easypaisa.com.pk";

const isSandbox      = process.env.EASYPAISA_SANDBOX !== "false";
const STORE_ID       = process.env.EASYPAISA_STORE_ID ?? "";
const HASH_KEY       = process.env.EASYPAISA_HASH_KEY ?? "";
const RETURN_URL     = process.env.EASYPAISA_RETURN_URL ?? "";

export const BASE_URL = isSandbox ? SANDBOX_BASE : LIVE_BASE;

export interface EasypaisaPayload {
  storeId:       string;
  amount:        string;      // "1500.00"
  postBackURL:   string;
  orderRefNum:   string;
  expiryDate:    string;      // "20251231 235959"
  autoRedirect:  number;      // 0 | 1
  requestHash:   string;      // HMAC-SHA256 hex
}

/**
 * Build a signed EasyPaisa checkout payload.
 * @param orderRefNum  - unique order reference (e.g. invoice ID)
 * @param amountPKR    - amount in PKR as a number
 */
export function buildEasyPaisaPayload(
  orderRefNum: string,
  amountPKR: number,
): EasypaisaPayload {
  if (!STORE_ID || !HASH_KEY) {
    throw new Error("EasyPaisa credentials not configured (EASYPAISA_STORE_ID / EASYPAISA_HASH_KEY)");
  }

  const amount     = amountPKR.toFixed(2);
  const expiry     = getExpiryDate(72); // 72-hour window
  const postBackURL = RETURN_URL;

  // Canonical string: amount + expiry + orderRef + postBackURL + storeId
  const canonical  = `${amount}&${expiry}&${orderRefNum}&${postBackURL}&${STORE_ID}`;
  const requestHash = crypto
    .createHmac("sha256", HASH_KEY)
    .update(canonical)
    .digest("hex");

  return {
    storeId:      STORE_ID,
    amount,
    postBackURL,
    orderRefNum,
    expiryDate:   expiry,
    autoRedirect: 0,
    requestHash,
  };
}

/**
 * Verify the hash sent back by EasyPaisa in its callback/webhook.
 * Returns true if the signature matches (not spoofed).
 */
export function verifyEasyPaisaCallback(params: Record<string, string>): boolean {
  const {
    storeId, amount, pp_TxnRefNo, pp_ResponseCode, pp_ResponseMessage,
    pp_RetreivalReferenceNo, pp_AuthCode, pp_PaymentMethod, pp_HashValue,
  } = params;

  const canonical = [
    storeId, amount, pp_TxnRefNo, pp_ResponseCode, pp_ResponseMessage,
    pp_RetreivalReferenceNo, pp_AuthCode, pp_PaymentMethod,
  ].join("&");

  const expected = crypto
    .createHmac("sha256", HASH_KEY)
    .update(canonical)
    .digest("hex");

  return expected === pp_HashValue;
}

/** Returns expiry date string "YYYYMMDD HHmmss" for N hours from now. */
function getExpiryDate(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())} ` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** True if the EasyPaisa response code represents a successful payment. */
export function isEasyPaisaSuccess(pp_ResponseCode: string): boolean {
  return pp_ResponseCode === "0000";
}
