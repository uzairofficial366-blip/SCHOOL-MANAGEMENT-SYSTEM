/**
 * GET /api/parent/fees
 *
 * Returns all fee invoices for the logged-in parent's children.
 * Supports multi-child families (tabs per student).
 *
 * Access: PARENT role only
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const userId   = session.user?.id as string;

    // Find all students linked to this parent via guardians (userId matches)
    const guardians = await prisma.guardian.findMany({
      where: { tenantId, userId },
      select: { studentId: true },
    });

    if (guardians.length === 0) {
      return NextResponse.json({ children: [] });
    }

    const studentIds = guardians.map((g) => g.studentId);

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds }, tenantId, deletedAt: null },
      include: {
        user: { select: { name: true, email: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { section: { include: { grade: true } } },
          take: 1,
        },
        feeInvoices: {
          orderBy: { dueDate: "desc" },
          include: {
            lineItems: true,
            payments:  { orderBy: { paymentDate: "desc" }, take: 10 },
          },
        },
        studentDiscounts: {
          where: {
            effectiveFrom: { lte: new Date() },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
            discountRule: { isActive: true },
          },
          include: { discountRule: true },
        },
      },
    });

    // Compute summary stats per student
    const children = students.map((student) => {
      const enrollment   = student.enrollments[0];
      const invoices     = student.feeInvoices;
      const totalDue     = invoices.reduce((s, i) => s + Number(i.netDue), 0);
      const totalPaid    = invoices.reduce((s, i) => s + Number(i.amountPaid), 0);
      const outstanding  = Math.max(totalDue - totalPaid, 0);
      const overdue      = invoices.filter(
        (i) => i.status !== "PAID" && i.status !== "WAIVED" && i.dueDate < new Date()
      );

      return {
        id:          student.id,
        name:        student.user.name,
        admissionNo: student.admissionNo,
        grade:       enrollment?.section?.grade?.name ?? "N/A",
        section:     enrollment?.section?.name ?? "N/A",
        outstanding,
        totalPaid,
        overdueCount:  overdue.length,
        overdueAmount: overdue.reduce((s, i) => s + Math.max(Number(i.netDue) - Number(i.amountPaid), 0), 0),
        discounts:     student.studentDiscounts.map((sd) => ({
          name:       sd.discountRule.name,
          type:       sd.discountRule.type,
          percentage: Number(sd.discountRule.percentage ?? 0),
        })),
        invoices: invoices.map((inv) => ({
          id:           inv.id,
          invoiceNo:    inv.invoiceNo,
          periodLabel:  inv.periodLabel,
          issueDate:    inv.issueDate.toISOString(),
          dueDate:      inv.dueDate.toISOString(),
          grossAmount:  Number(inv.grossAmount),
          totalDiscount: Number(inv.totalDiscount),
          lateFee:      Number(inv.lateFee),
          netDue:       Number(inv.netDue),
          amountPaid:   Number(inv.amountPaid),
          status:       inv.status,
          notes:        inv.notes,
          lineItems:    inv.lineItems.map((li) => ({
            id:             li.id,
            description:    li.description,
            amount:         Number(li.amount),
            discountAmount: Number(li.discountAmount),
            discountRemarks: li.discountRemarks,
            netAmount:      Number(li.netAmount),
          })),
          payments: inv.payments.map((p) => ({
            id:            p.id,
            amountPaid:    Number(p.amountPaid),
            paymentDate:   p.paymentDate?.toISOString() ?? null,
            method:        p.method,
            transactionId: p.transactionId,
            status:        p.status,
          })),
        })),
      };
    });

    return NextResponse.json({ children });
  } catch (err: any) {
    console.error("[Parent Fees GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
