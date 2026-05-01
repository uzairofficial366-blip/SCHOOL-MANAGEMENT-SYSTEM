/**
 * POST /api/webhooks/jazzcash
 *
 * Receives payment result from JazzCash (IPN / webhook).
 *
 * Security:
 *  1. HMAC-SHA256 integrity verification
 *  2. Idempotency via pp_TxnRefNo uniqueness
 *  3. Atomic DB transaction
 *  4. SMS/WhatsApp notification to parent
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyJazzCashCallback, isJazzCashSuccess } from "@/lib/payments/jazzcash";
import { notifyPaymentSuccess } from "@/lib/notifications/fee-events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let rawBody: Record<string, string> = {};

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      rawBody = await req.json();
    } else {
      const text   = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((v, k) => { rawBody[k] = v; });
    }

    const ipAddress = req.headers.get("x-forwarded-for") ?? "unknown";

    // ── Step 1: Verify signature ──────────────────────────────────────────────
    const signatureValid = verifyJazzCashCallback(rawBody);

    // Attempt to extract invoiceId from our txnRefNo format: "JC-{suffix}-{random}"
    const txnRefNo  = rawBody.pp_TxnRefNo ?? "";
    const invoiceId = await resolveInvoiceFromTxnRef(txnRefNo);

    await prisma.paymentGatewayLog.create({
      data: {
        tenantId:  rawBody.pp_MerchantID ?? "",
        invoiceId: invoiceId ?? undefined,
        gateway:   "JAZZCASH",
        event:     "WEBHOOK",
        status:    rawBody.pp_ResponseCode ?? "UNKNOWN",
        payload:   rawBody as any,
        signature: rawBody.pp_SecureHash ?? null,
        verified:  signatureValid,
        ipAddress,
      },
    });

    if (!signatureValid) {
      console.warn("[JazzCash Webhook] Invalid signature from IP:", ipAddress);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    if (!isJazzCashSuccess(rawBody.pp_ResponseCode)) {
      return NextResponse.json({ received: true, status: "FAILED" });
    }

    // ── Step 2: Idempotency ───────────────────────────────────────────────────
    const existing = await prisma.feePayment.findFirst({ where: { transactionId: txnRefNo } });
    if (existing) {
      return NextResponse.json({ received: true, status: "ALREADY_PROCESSED" });
    }

    if (!invoiceId) {
      return NextResponse.json({ received: true, status: "INVOICE_NOT_FOUND" });
    }

    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: { student: { include: { user: true, guardians: true } } },
    });

    if (!invoice) return NextResponse.json({ received: true, status: "INVOICE_NOT_FOUND" });

    const tenantId   = invoice.tenantId;
    // JazzCash amounts are in paise (×100)
    const amountPaid = parseInt(rawBody.pp_Amount ?? "0", 10) / 100;
    const isCard     = !rawBody.pp_VoucherNumber;

    // ── Step 3: Atomic update ─────────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      const newPaid  = Number(invoice.amountPaid) + amountPaid;
      const isPaidOff = newPaid >= Number(invoice.netDue);

      await tx.feeInvoice.update({
        where: { id: invoiceId },
        data:  { amountPaid: newPaid, status: isPaidOff ? "PAID" : "PARTIAL" },
      });

      const firstStructure = await tx.feeStructure.findFirst({ where: { tenantId } });

      await tx.feePayment.create({
        data: {
          tenantId,
          studentId:      invoice.studentId,
          feeStructureId: firstStructure?.id ?? "",
          invoiceId,
          amount:         invoice.netDue,
          amountPaid,
          paymentDate:    new Date(),
          dueDate:        invoice.dueDate,
          method:         isCard ? "JAZZCASH" : "JAZZCASH_VOUCHER",
          transactionId:  txnRefNo,
          voucherNo:      rawBody.pp_VoucherNumber ?? null,
          gatewayRef:     rawBody.pp_TransactionID ?? txnRefNo,
          status:         isPaidOff ? "PAID" : "PARTIAL",
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          action:    "PAYMENT_RECEIVED",
          tableName: "fee_invoices",
          recordId:  invoiceId,
          newValues: { amountPaid, txnRefNo, gateway: "JAZZCASH" },
          ipAddress,
        },
      });
    });

    // ── Step 4: Notify parent ─────────────────────────────────────────────────
    const guardian = invoice.student.guardians[0];
    if (guardian?.phone) {
      await notifyPaymentSuccess({
        parentPhone:    guardian.phone,
        parentName:     guardian.name,
        studentName:    invoice.student.user.name,
        amountPKR:      amountPaid,
        invoiceNo:      invoice.invoiceNo,
        transactionId:  txnRefNo,
      }).catch(console.error);
    }

    return NextResponse.json({ received: true, status: "PROCESSED" });
  } catch (err: any) {
    console.error("[JazzCash Webhook Error]", err);
    return NextResponse.json({ received: true, error: "internal" }, { status: 200 });
  }
}

/**
 * Also handle GET (some gateways send GET for redirect callbacks).
 * Redirect user to parent dashboard after payment.
 */
export async function GET(req: NextRequest) {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => { params[k] = v; });

  const txnRefNo = params.pp_TxnRefNo ?? "";
  const success  = isJazzCashSuccess(params.pp_ResponseCode ?? "");

  if (success && txnRefNo) {
    return Response.redirect(
      new URL(`/parent/fees?payment=success&ref=${txnRefNo}`, req.nextUrl.origin)
    );
  }

  return Response.redirect(
    new URL(`/parent/fees?payment=failed`, req.nextUrl.origin)
  );
}

/** Resolve invoice ID from txnRefNo using the gateway log. */
async function resolveInvoiceFromTxnRef(txnRefNo: string): Promise<string | null> {
  const log = await prisma.paymentGatewayLog.findFirst({
    where: {
      gateway: "JAZZCASH",
      event:   "INITIATE",
      payload: { path: ["txnRefNo"], equals: txnRefNo },
    },
    select: { invoiceId: true },
  });
  return log?.invoiceId ?? null;
}
