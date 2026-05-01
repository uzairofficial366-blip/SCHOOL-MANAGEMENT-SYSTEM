/**
 * Fee Notification Event Dispatchers
 *
 * Called by:
 *  - Invoice generation (server action / API route)
 *  - Webhook handlers (EasyPaisa / JazzCash) on successful payment
 *  - Cron job for overdue reminders
 */

import { sendSMS, sendWhatsApp, normalizePakistaniPhone } from "./sms";

export interface FeeNotificationPayload {
  parentPhone:   string;   // raw phone from DB
  parentName:    string;
  studentName:   string;
  amountPKR:     number;
  invoiceNo:     string;
  dueDate?:      Date;
  transactionId?: string;
  daysOverdue?:  number;
}

/** Sends both SMS and WhatsApp (WhatsApp preferred in Pakistan). */
async function dispatch(phone: string, body: string) {
  const e164 = normalizePakistaniPhone(phone);
  // Fire both; don't crash if one fails
  await Promise.allSettled([
    sendSMS({ to: e164, body }),
    sendWhatsApp({ to: e164, body }),
  ]);
}

/** Triggered when a new fee invoice is generated for a student. */
export async function notifyInvoiceGenerated(p: FeeNotificationPayload) {
  const due = p.dueDate
    ? new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(p.dueDate)
    : "N/A";

  const body =
    `Dear ${p.parentName},\n` +
    `A fee invoice of PKR ${p.amountPKR.toLocaleString()} has been generated for ` +
    `${p.studentName} (Invoice: ${p.invoiceNo}).\n` +
    `Due Date: ${due}.\n` +
    `Please pay on time to avoid late charges.\n` +
    `– School Finance Office`;

  await dispatch(p.parentPhone, body);
}

/** Triggered after a successful payment is reconciled via webhook. */
export async function notifyPaymentSuccess(p: FeeNotificationPayload) {
  const body =
    `Dear ${p.parentName},\n` +
    `Payment of PKR ${p.amountPKR.toLocaleString()} for ${p.studentName} has been received successfully.\n` +
    `Invoice: ${p.invoiceNo} | Txn ID: ${p.transactionId ?? "N/A"}.\n` +
    `Thank you!\n` +
    `– School Finance Office`;

  await dispatch(p.parentPhone, body);
}

/** Triggered by the overdue cron job. */
export async function notifyPaymentOverdue(p: FeeNotificationPayload) {
  const body =
    `Dear ${p.parentName},\n` +
    `REMINDER: The fee of PKR ${p.amountPKR.toLocaleString()} for ${p.studentName} ` +
    `(Invoice: ${p.invoiceNo}) is overdue by ${p.daysOverdue ?? 1} day(s).\n` +
    `Please pay immediately to avoid further late charges.\n` +
    `– School Finance Office`;

  await dispatch(p.parentPhone, body);
}
