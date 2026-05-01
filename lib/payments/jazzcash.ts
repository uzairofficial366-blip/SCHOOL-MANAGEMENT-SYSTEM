/**
 * JazzCash Server-Side Integration
 *
 * Supports three payment modes:
 *  1. CARD      - Credit/Debit card via hosted page
 *  2. WALLET    - JazzCash mobile account
 *  3. VOUCHER   - Generate 12-digit voucher for over-the-counter payment
 *
 * Sandbox:  https://sandbox.jazzcash.com.pk/
 * Live:     https://payments.jazzcash.com.pk/
 */

import crypto from "crypto";

const SANDBOX_BASE  = "https://sandbox.jazzcash.com.pk/ApplicationAPI/API";
const LIVE_BASE     = "https://payments.jazzcash.com.pk/ApplicationAPI/API";

const isSandbox     = process.env.JAZZCASH_SANDBOX !== "false";
const MERCHANT_ID   = process.env.JAZZCASH_MERCHANT_ID ?? "";
const PASSWORD      = process.env.JAZZCASH_PASSWORD ?? "";
const INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT ?? "";
const RETURN_URL    = process.env.JAZZCASH_RETURN_URL ?? "";

export const BASE_URL = isSandbox ? SANDBOX_BASE : LIVE_BASE;

export type JazzCashMode = "CARD" | "WALLET" | "VOUCHER";

export interface JazzCashCardRequest {
  pp_MerchantID: string;
  pp_Password:   string;
  pp_TxnRefNo:   string;
  pp_Amount:     string;      // in paise: PKR 1500 → "150000"
  pp_TxnCurrency: "PKR";
  pp_TxnDateTime: string;     // "YYYYMMDDHHmmss"
  pp_BillReference: string;
  pp_Description: string;
  pp_TxnExpiryDateTime: string;
  pp_ReturnURL:  string;
  pp_SecureHash: string;
}

export interface JazzCashVoucherResponse {
  pp_ResponseCode:    string;
  pp_ResponseMessage: string;
  pp_TxnRefNo:        string;
  pp_VoucherNumber:   string; // 12-digit voucher
  pp_VoucherExpiry:   string;
  pp_SecureHash:      string;
}

/**
 * Build a HMAC-SHA256 secure hash for JazzCash requests.
 * All values are sorted alphabetically by key, joined with "&".
 */
function buildSecureHash(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "pp_SecureHash" && params[k] !== "")
    .sort()
    .map((k) => params[k])
    .join("&");

  const message = `${INTEGRITY_SALT}&${sorted}`;
  return crypto
    .createHmac("sha256", INTEGRITY_SALT)
    .update(message)
    .digest("hex");
}

/** Format Date to JazzCash datetime format: YYYYMMDDHHmmss */
function toJCDateTime(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** Convert PKR amount to JazzCash "paise" format (multiply × 100, no decimals). */
function toPaise(pkr: number): string {
  return Math.round(pkr * 100).toString();
}

/**
 * Build parameters for a JazzCash Card/Wallet hosted-page payment.
 * Returns the full params object ready to POST to JazzCash's endpoint.
 */
export function buildCardPaymentRequest(opts: {
  txnRefNo:    string; // unique ref e.g. invoiceId-timestamp
  amountPKR:   number;
  description: string;
  billRef:     string;
}): JazzCashCardRequest {
  if (!MERCHANT_ID || !PASSWORD || !INTEGRITY_SALT) {
    throw new Error("JazzCash credentials not configured");
  }

  const now    = new Date();
  const expiry = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const params: Record<string, string> = {
    pp_MerchantID:          MERCHANT_ID,
    pp_Password:            PASSWORD,
    pp_TxnRefNo:            opts.txnRefNo,
    pp_Amount:              toPaise(opts.amountPKR),
    pp_TxnCurrency:         "PKR",
    pp_TxnDateTime:         toJCDateTime(now),
    pp_BillReference:       opts.billRef,
    pp_Description:         opts.description,
    pp_TxnExpiryDateTime:   toJCDateTime(expiry),
    pp_ReturnURL:           RETURN_URL,
  };

  params.pp_SecureHash = buildSecureHash(params);
  return params as unknown as JazzCashCardRequest;
}

/**
 * Generate a JazzCash over-the-counter VOUCHER via server-to-server API.
 * The returned voucherNumber can be given to the parent to pay at any shop.
 */
export async function generateVoucher(opts: {
  txnRefNo:  string;
  amountPKR: number;
  mobileNo:  string; // parent's mobile e.g. "03001234567"
  cnic:      string; // last 6 digits of CNIC
  description: string;
}): Promise<JazzCashVoucherResponse> {
  const now    = new Date();
  const expiry = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const params: Record<string, string> = {
    pp_MerchantID:        MERCHANT_ID,
    pp_Password:          PASSWORD,
    pp_TxnRefNo:          opts.txnRefNo,
    pp_Amount:            toPaise(opts.amountPKR),
    pp_TxnCurrency:       "PKR",
    pp_TxnDateTime:       toJCDateTime(now),
    pp_TxnExpiryDateTime: toJCDateTime(expiry),
    pp_BillReference:     opts.txnRefNo,
    pp_Description:       opts.description,
    pp_MobileNumber:      opts.mobileNo,
    pp_CNIC:              opts.cnic,
    pp_ReturnURL:         RETURN_URL,
  };

  params.pp_SecureHash = buildSecureHash(params);

  const endpoint = `${BASE_URL}/2.0/Purchase/DoMWalletTransaction`;
  const response  = await fetch(endpoint, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams(params).toString(),
  });

  if (!response.ok) throw new Error(`JazzCash API error: ${response.status}`);
  return response.json() as Promise<JazzCashVoucherResponse>;
}

/**
 * Verify the secure hash from a JazzCash callback to ensure it's authentic.
 */
export function verifyJazzCashCallback(params: Record<string, string>): boolean {
  const { pp_SecureHash, ...rest } = params;
  if (!pp_SecureHash) return false;
  const computed = buildSecureHash(rest);
  return computed === pp_SecureHash;
}

/** True if JazzCash response code indicates success. */
export function isJazzCashSuccess(pp_ResponseCode: string): boolean {
  return pp_ResponseCode === "000";
}

/** Endpoint URLs for hosted page redirect (CARD mode). */
export const JAZZCASH_CHECKOUT_URL = isSandbox
  ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"
  : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";
