/**
 * POST /api/fees/invoices
 *
 * Generate a FeeInvoice for a student for a given billing period.
 * Automatically:
 *  1. Applies sibling discount (20%) if detected
 *  2. Applies all active StudentDiscounts
 *  3. Creates DeferredIncome if payment covers a future period
 *  4. Sends SMS/WhatsApp notification to guardian
 *
 * Access: ACCOUNTANT, ADMIN, SUPER_ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { autoApplySiblingDiscount, calculateStudentDiscount } from "@/lib/payments/sibling-discount";
import { notifyInvoiceGenerated } from "@/lib/notifications/fee-events";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    const {
      studentId,
      periodLabel,   // "May 2025"
      dueDate,       // ISO date string
      lineItems,     // optional [{ description, amount, feeStructureId? }]; defaults to student's class fee structures
      notes,
      academicYearId,
    } = body;

    if (!studentId || !periodLabel || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId, deletedAt: null },
      include: {
        user: true,
        guardians: { take: 1, orderBy: { isEmergency: "desc" } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { section: { include: { grade: true } } },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const activeGradeId = student.enrollments[0]?.section?.gradeId;
    const resolvedLineItems = Array.isArray(lineItems) && lineItems.length > 0
      ? lineItems
      : activeGradeId
        ? (await prisma.feeStructure.findMany({
            where: {
              tenantId,
              deletedAt: null,
              OR: [{ gradeId: activeGradeId }, { gradeId: null }],
            },
            orderBy: [{ gradeId: "desc" }, { name: "asc" }],
          })).map((fee) => ({
            description: fee.name,
            amount: Number(fee.amount),
            feeStructureId: fee.id,
          }))
        : [];

    if (resolvedLineItems.length === 0) {
      return NextResponse.json({ error: "No fee items were provided and no class fee structure exists for this student." }, { status: 400 });
    }

    // ── Auto-detect & apply sibling discount ──────────────────────────────
    await autoApplySiblingDiscount(tenantId, studentId);

    // ── Calculate gross amount from line items ────────────────────────────
    const grossAmount = resolvedLineItems.reduce((sum: number, li: any) => sum + Number(li.amount), 0);

    // ── Calculate all applicable discounts ────────────────────────────────
    const { totalDiscount, breakdown } = await calculateStudentDiscount(tenantId, studentId, grossAmount);

    // Distribute discount across line items proportionally
    const enrichedItems = resolvedLineItems.map((li: any, idx: number) => {
      const liAmount = Number(li.amount);
      const liDiscount = grossAmount > 0 ? (liAmount / grossAmount) * totalDiscount : 0;
      const discountBreakdown = idx === 0 ? breakdown.map((b) => b.name).join(", ") : null;
      return {
        description:     li.description,
        amount:          liAmount,
        discountAmount:  parseFloat(liDiscount.toFixed(2)),
        discountRemarks: discountBreakdown,
        netAmount:       parseFloat((liAmount - liDiscount).toFixed(2)),
        feeStructureId:  li.feeStructureId ?? null,
      };
    });

    const netDue = parseFloat((grossAmount - totalDiscount).toFixed(2));

    // ── Generate unique invoice number ────────────────────────────────────
    const invoiceNo = `INV-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;

    // ── Create invoice + line items atomically ────────────────────────────
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.feeInvoice.create({
        data: {
          tenantId,
          studentId,
          academicYearId:  academicYearId ?? null,
          invoiceNo,
          periodLabel,
          dueDate:         new Date(dueDate),
          grossAmount,
          totalDiscount,
          lateFee:         0,
          netDue,
          amountPaid:      0,
          status:          "PENDING",
          notes:           notes ?? null,
          lineItems: {
            create: enrichedItems.map((li: any) => ({
              tenantId,
              description:     li.description,
              amount:          li.amount,
              discountAmount:  li.discountAmount,
              discountRemarks: li.discountRemarks,
              netAmount:       li.netAmount,
              feeStructureId:  li.feeStructureId,
            })),
          },
        },
        include: { lineItems: true },
      });

      // Deferred income: if dueDate > today, full netDue is deferred until due date
      const dueDateObj = new Date(dueDate);
      if (dueDateObj > new Date()) {
        await tx.deferredIncome.create({
          data: {
            tenantId,
            invoiceId:   inv.id,
            amount:      netDue,
            earnedDate:  dueDateObj,
            recognized:  false,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId:    session.user?.id,
          action:    "INVOICE_CREATED",
          tableName: "fee_invoices",
          recordId:  inv.id,
          newValues: { invoiceNo, grossAmount, totalDiscount, netDue, periodLabel },
        },
      });

      return inv;
    });

    // ── Notify guardian ───────────────────────────────────────────────────
    const guardian = student?.guardians?.[0];
    if (guardian?.phone) {
      await notifyInvoiceGenerated({
        parentPhone:  guardian.phone,
        parentName:   guardian.name,
        studentName:  student!.user.name,
        amountPKR:    netDue,
        invoiceNo,
        dueDate:      new Date(dueDate),
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, invoice, discountBreakdown: breakdown });
  } catch (err: any) {
    console.error("[Invoice Create]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: list invoices with filters
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") ?? undefined;
    const status    = searchParams.get("status") ?? undefined;

    const invoices = await prisma.feeInvoice.findMany({
      where: {
        tenantId,
        ...(studentId ? { studentId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        lineItems: true,
        payments:  { orderBy: { paymentDate: "desc" }, take: 5 },
      },
      orderBy: { dueDate: "desc" },
      take: 200,
    });

    return NextResponse.json({ invoices });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
