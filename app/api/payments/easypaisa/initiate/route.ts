/**
 * POST /api/payments/easypaisa/initiate
 *
 * Called by the parent dashboard "Pay via EasyPaisa" button.
 * Returns the signed payload for the frontend to render the checkout iframe.
 *
 * Body: { invoiceId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { buildEasyPaisaPayload } from "@/lib/payments/easypaisa";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = session.user?.tenantId as string;
    const { invoiceId } = await req.json();

    if (!invoiceId) return NextResponse.json({ error: "invoiceId required" }, { status: 400 });

    // Fetch the invoice
    const invoice = await prisma.feeInvoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { student: { include: { user: true } } },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "PAID") return NextResponse.json({ error: "Invoice already paid" }, { status: 409 });

    const netDue   = Number(invoice.netDue) - Number(invoice.amountPaid);
    if (netDue <= 0) return NextResponse.json({ error: "Nothing due on this invoice" }, { status: 409 });

    // Unique order reference (idempotent per invoice)
    const orderRefNum = `EP-${invoiceId.slice(-8).toUpperCase()}-${nanoid(6)}`;

    const payload = buildEasyPaisaPayload(orderRefNum, netDue);

    // Log initiation
    await prisma.paymentGatewayLog.create({
      data: {
        tenantId,
        invoiceId,
        gateway:  "EASYPAISA",
        event:    "INITIATE",
        status:   "INITIATED",
        payload:  payload as any,
        verified: true,
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return NextResponse.json({
      success:      true,
      payload,        // frontend uses this to bootstrap iframe
      orderRefNum,
      amountPKR:    netDue,
      invoiceNo:    invoice.invoiceNo,
      studentName:  invoice.student.user.name,
    });
  } catch (err: any) {
    console.error("[EasyPaisa Initiate]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
