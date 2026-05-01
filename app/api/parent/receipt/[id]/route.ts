/**
 * GET /api/parent/receipt/[id]
 *
 * Streams a PDF receipt for a given FeeInvoice.
 * Accessible by PARENT (own children only), ACCOUNTANT, and ADMIN.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
// jsPDF is imported dynamically to avoid SSR issues
import type { jsPDF as JsPDFType } from "jspdf";

export const dynamic = "force-dynamic";

// ── Types ───────────────────────────────────────────────────────────────────
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role     = session.user?.role as string;
    const tenantId = session.user?.tenantId as string;
    const userId   = session.user?.id as string;
    const { id: invoiceId } = await params;

    const invoice = await prisma.feeInvoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        student: {
          include: {
            user:      { select: { name: true, email: true } },
            guardians: { take: 1, orderBy: { isEmergency: "desc" } },
            enrollments: {
              where: { status: "ACTIVE" },
              include: { section: { include: { grade: true } } },
              take: 1,
            },
          },
        },
        lineItems: true,
        payments:  { where: { status: "PAID" }, orderBy: { paymentDate: "desc" }, take: 5 },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // PARENT: ensure invoice belongs to their child
    if (role === "PARENT") {
      const guardian = await prisma.guardian.findFirst({
        where: { tenantId, userId, studentId: invoice.studentId },
      });
      if (!guardian) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (!["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Generate PDF ────────────────────────────────────────────────────────
    const pdfBytes = await generateReceiptPDF(invoice);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${invoice.invoiceNo}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: any) {
    console.error("[Receipt PDF]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PDF Generation ───────────────────────────────────────────────────────────
async function generateReceiptPDF(invoice: any): Promise<ArrayBuffer> {
  // Dynamic import — jspdf is a large library
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc: JsPDFType = new (jsPDF as any)({ orientation: "portrait", unit: "mm", format: "a4" });

  const student    = invoice.student;
  const guardian   = student.guardians?.[0];
  const enrollment = student.enrollments?.[0];
  const grade      = enrollment?.section?.grade?.name ?? "N/A";
  const section    = enrollment?.section?.name ?? "N/A";

  const PKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const fmtDate = (d: Date | string | null) =>
    d ? new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)) : "N/A";

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FEE RECEIPT", 15, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice: ${invoice.invoiceNo}`, 15, 23);
  doc.text(`Period: ${invoice.periodLabel}`, 15, 29);

  // Status badge
  const statusColor = invoice.status === "PAID" ? [21, 128, 61] : [185, 28, 28];
  doc.setFillColor(...(statusColor as [number, number, number]));
  doc.roundedRect(155, 10, 40, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.status, 175, 18, { align: "center" });

  // ── Student Info ────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Student Information", 15, 45);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const infoRows = [
    ["Name",          student.user.name],
    ["Admission No",  student.admissionNo],
    ["Class / Section", `${grade} — ${section}`],
    ["Parent / Guardian", guardian?.name ?? "N/A"],
    ["Contact",       guardian?.phone ?? "N/A"],
  ];

  let y = 51;
  for (const [label, value] of infoRows) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 60, y);
    y += 6;
  }

  // Issue / Due dates
  doc.setFont("helvetica", "bold");
  doc.text("Issue Date:", 130, 51);
  doc.setFont("helvetica", "normal");
  doc.text(fmtDate(invoice.issueDate), 165, 51);
  doc.setFont("helvetica", "bold");
  doc.text("Due Date:", 130, 57);
  doc.setFont("helvetica", "normal");
  doc.text(fmtDate(invoice.dueDate), 165, 57);

  // ── Line Items Table ────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y + 5,
    head: [["Description", "Amount (PKR)", "Discount", "Net Amount"]],
    body: invoice.lineItems.map((li: any) => [
      li.description,
      PKR(Number(li.amount)),
      li.discountAmount > 0 ? `- ${PKR(Number(li.discountAmount))}${li.discountRemarks ? ` (${li.discountRemarks})` : ""}` : "—",
      PKR(Number(li.netAmount)),
    ]),
    styles:       { fontSize: 9, cellPadding: 3 },
    headStyles:   { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 80 }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  // ── Totals ──────────────────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  const totals = [
    ["Gross Amount",    PKR(Number(invoice.grossAmount))],
    ["Total Discount",  `- ${PKR(Number(invoice.totalDiscount))}`],
    ["Late Fee",        `+ ${PKR(Number(invoice.lateFee))}`],
    ["Net Due",         PKR(Number(invoice.netDue))],
    ["Amount Paid",     PKR(Number(invoice.amountPaid))],
    ["Balance",         PKR(Math.max(Number(invoice.netDue) - Number(invoice.amountPaid), 0))],
  ];

  let ty = finalY;
  for (const [label, value] of totals) {
    const isTotal = label === "Net Due" || label === "Balance";
    if (isTotal) {
      doc.setFillColor(15, 23, 42);
      doc.rect(120, ty - 4, 75, 7, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(50, 50, 50);
    }
    doc.setFontSize(isTotal ? 10 : 9);
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.text(label, 125, ty);
    doc.text(value, 193, ty, { align: "right" });
    doc.setTextColor(30, 30, 30);
    ty += 8;
  }

  // ── Payment History ─────────────────────────────────────────────────────
  if (invoice.payments.length > 0) {
    ty += 4;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Payment History", 15, ty);
    ty += 2;

    autoTable(doc, {
      startY: ty,
      head:   [["Date", "Method", "Transaction ID", "Amount Paid"]],
      body:   invoice.payments.map((p: any) => [
        fmtDate(p.paymentDate),
        p.method ?? "—",
        p.transactionId ?? "—",
        PKR(Number(p.amountPaid)),
      ]),
      styles:       { fontSize: 8, cellPadding: 2.5 },
      headStyles:   { fillColor: [55, 65, 81], textColor: 255 },
      columnStyles: { 3: { halign: "right" } },
    });
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "This is a computer-generated document and does not require a signature.",
    105,
    pageH - 8,
    { align: "center" }
  );
  doc.text(
    `Generated on ${fmtDate(new Date())} | ${process.env.NEXT_PUBLIC_APP_NAME ?? "EduERP"}`,
    105,
    pageH - 4,
    { align: "center" }
  );

  return doc.output("arraybuffer");
}
