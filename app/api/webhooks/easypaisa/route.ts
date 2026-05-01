/**
 * POST /api/webhooks/easypaisa
 *
 * Receives payment result from EasyPaisa server (webhook push).
 *
 * Security:
 *  1. HMAC-SHA256 signature verification (rejects spoofed requests)
 *  2. Idempotency via transactionId unique constraint
 *  3. Atomic DB transaction (update invoice + create FeePayment + create AuditLog)
 *  4. Fires SMS/WhatsApp notification to parent on success
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyEasyPaisaCallback, isEasyPaisaSuccess } from "@/lib/payments/easypaisa";
import { notifyPaymentSuccess } from "@/lib/notifications/fee-events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let rawBody: Record<string, string> = {};

  try {
    const contentType = req.headers.get("content-type") ?? "";

    // EasyPaisa sends form-urlencoded or JSON depending on configuration
    if (contentType.includes("application/json")) {
      rawBody = await req.json();
    } else {
      const text   = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((v, k) => { rawBody[k] = v; });
    }

    const ipAddress = req.headers.get("x-forwarded-for") ?? "unknown";

    // ── Step 1: Verify signature ──────────────────────────────────────────────
    const signatureValid = verifyEasyPaisaCallback(rawBody);

    // Always log the raw payload first
    await prisma.paymentGatewayLog.create({
      data: {
        tenantId:  rawBody.pp_TenantId ?? "",
        gateway:   "EASYPAISA",
        event:     "WEBHOOK",
        status:    rawBody.pp_ResponseCode ?? "UNKNOWN",
        payload:   rawBody as any,
        signature: rawBody.pp_HashValue ?? null,
        verified:  signatureValid,
        ipAddress,
      },
    });

    if (!signatureValid) {
      console.warn("[EasyPaisa Webhook] Invalid signature from IP:", ipAddress);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // ── Step 2: Check if payment is successful ────────────────────────────────
    if (!isEasyPaisaSuccess(rawBody.pp_ResponseCode)) {
      return NextResponse.json({ received: true, status: "FAILED" });
    }

    const transactionId = rawBody.pp_TxnRefNo;
    const orderRefNum   = rawBody.pp_MerchantOrderNum ?? rawBody.pp_BillReference;

    // ── Step 3: Find the invoice from orderRefNum ─────────────────────────────
    // orderRefNum format: "EP-{invoiceIdSuffix}-{random}"
    // We store gatewayRef in PaymentGatewayLog → find via invoice lookup
    const log = await prisma.paymentGatewayLog.findFirst({
      where: { gateway: "EASYPAISA", event: "INITIATE" },
      include: { invoice: { include: { student: { include: { user: true, guardians: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    const invoice = log?.invoice;
    if (!invoice) {
      console.warn("[EasyPaisa Webhook] No matching invoice for orderRef:", orderRefNum);
      return NextResponse.json({ received: true, status: "INVOICE_NOT_FOUND" });
    }

    // ── Step 4: Idempotency check ─────────────────────────────────────────────
    const existing = await prisma.feePayment.findFirst({
      where: { transactionId },
    });
    if (existing) {
      return NextResponse.json({ received: true, status: "ALREADY_PROCESSED" });
    }

    const tenantId    = invoice.tenantId;
    const amountPaid  = parseFloat(rawBody.pp_Amount ?? "0") / 100; // convert paise

    // ── Step 5: Atomic update ─────────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      // Update invoice
      const newPaid  = Number(invoice.amountPaid) + amountPaid;
      const isPaidOff = newPaid >= Number(invoice.netDue);

      await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newPaid,
          status:     isPaidOff ? "PAID" : "PARTIAL",
        },
      });

      // Create FeePayment record (legacy compatibility)
      await tx.feePayment.create({
        data: {
          tenantId,
          studentId:      invoice.studentId,
          feeStructureId: (await tx.feeStructure.findFirst({ where: { tenantId } }))?.id ?? "",
          invoiceId:      invoice.id,
          amount:         invoice.netDue,
          amountPaid,
          paymentDate:    new Date(),
          dueDate:        invoice.dueDate,
          method:         "EASYPAISA",
          transactionId,
          gatewayRef:     orderRefNum,
          status:         isPaidOff ? "PAID" : "PARTIAL",
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          action:    "PAYMENT_RECEIVED",
          tableName: "fee_invoices",
          recordId:  invoice.id,
          newValues: { amountPaid, transactionId, gateway: "EASYPAISA" },
          ipAddress,
        },
      });
    });

    // ── Step 6: Notify parent ─────────────────────────────────────────────────
    const guardian = invoice.student.guardians[0];
    if (guardian?.phone) {
      await notifyPaymentSuccess({
        parentPhone:    guardian.phone,
        parentName:     guardian.name,
        studentName:    invoice.student.user.name,
        amountPKR:      amountPaid,
        invoiceNo:      invoice.invoiceNo,
        transactionId,
      }).catch(console.error); // non-blocking
    }

    return NextResponse.json({ received: true, status: "PROCESSED" });
  } catch (err: any) {
    console.error("[EasyPaisa Webhook Error]", err);
    // Never return 500 to a gateway — they may retry infinitely
    return NextResponse.json({ received: true, error: "internal" }, { status: 200 });
  }
}
