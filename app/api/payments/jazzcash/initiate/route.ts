/**
 * POST /api/payments/jazzcash/initiate
 *
 * Initiates a JazzCash payment session.
 * Supports three modes: CARD, WALLET (mobile account), VOUCHER (OTC)
 *
 * Body: { invoiceId, mode: "CARD" | "WALLET" | "VOUCHER", mobileNo?, cnic? }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import {
  buildCardPaymentRequest,
  generateVoucher,
  JAZZCASH_CHECKOUT_URL,
  type JazzCashMode,
} from "@/lib/payments/jazzcash";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = session.user?.tenantId as string;
    const body = await req.json();
    const { invoiceId, mode = "CARD", mobileNo, cnic } = body;

    if (!invoiceId) return NextResponse.json({ error: "invoiceId required" }, { status: 400 });

    const invoice = await prisma.feeInvoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { student: { include: { user: true } } },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "PAID") return NextResponse.json({ error: "Invoice already paid" }, { status: 409 });

    const netDue = Number(invoice.netDue) - Number(invoice.amountPaid);
    if (netDue <= 0) return NextResponse.json({ error: "Nothing due" }, { status: 409 });

    const txnRefNo = `JC-${invoiceId.slice(-8).toUpperCase()}-${nanoid(6)}`;
    const description = `Fee: ${invoice.invoiceNo} | ${invoice.student.user.name}`;

    let responseData: Record<string, unknown>;

    if ((mode as JazzCashMode) === "VOUCHER") {
      if (!mobileNo || !cnic) {
        return NextResponse.json(
          { error: "mobileNo and cnic (last 6 digits) are required for VOUCHER mode" },
          { status: 400 }
        );
      }

      const voucherResp = await generateVoucher({
        txnRefNo,
        amountPKR:   netDue,
        mobileNo,
        cnic,
        description,
      });

      responseData = {
        mode:          "VOUCHER",
        voucherNumber: voucherResp.pp_VoucherNumber,
        voucherExpiry: voucherResp.pp_VoucherExpiry,
        txnRefNo,
        amountPKR:     netDue,
        responseCode:  voucherResp.pp_ResponseCode,
        responseMsg:   voucherResp.pp_ResponseMessage,
      };
    } else {
      // CARD or WALLET — return params for frontend hosted-page redirect
      const params = buildCardPaymentRequest({
        txnRefNo,
        amountPKR:   netDue,
        description,
        billRef:     invoice.invoiceNo,
      });

      responseData = {
        mode,
        checkoutUrl: JAZZCASH_CHECKOUT_URL,
        params,      // frontend POSTs these to checkoutUrl
        amountPKR:   netDue,
        txnRefNo,
      };
    }

    // Log initiation
    await prisma.paymentGatewayLog.create({
      data: {
        tenantId,
        invoiceId,
        gateway:  "JAZZCASH",
        event:    "INITIATE",
        status:   "INITIATED",
        payload:  responseData as any,
        verified: true,
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return NextResponse.json({ success: true, ...responseData });
  } catch (err: any) {
    console.error("[JazzCash Initiate]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
