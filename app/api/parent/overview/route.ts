/**
 * GET /api/parent/overview
 *
 * Returns aggregate dashboard stats for the logged-in parent:
 * total outstanding, next due date, paid this month, overdue count,
 * plus per-child summary and recent activity.
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

    // Find linked children
    const guardians = await prisma.guardian.findMany({
      where: { tenantId, userId },
      select: { studentId: true },
    });

    const studentIds = guardians.map((g) => g.studentId);

    if (studentIds.length === 0) {
      return NextResponse.json({
        totalOutstanding: 0,
        totalPaid: 0,
        overdueCount: 0,
        overdueAmount: 0,
        nextDueDate: null,
        paidThisMonth: 0,
        children: [],
        recentActivity: [],
        announcements: [],
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
          orderBy: { dueDate: "asc" },
          include: {
            lineItems: true,
            payments: { orderBy: { paymentDate: "desc" }, take: 5 },
          },
        },
        studentDiscounts: {
          where: {
            effectiveFrom: { lte: now },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
            discountRule: { isActive: true },
          },
          include: { discountRule: true },
        },
        attendanceRecords: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    let totalOutstanding = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let paidThisMonth = 0;
    let nextDueDateMs = Infinity;

    const children = students.map((s) => {
      const enrollment  = s.enrollments[0];
      const invoices    = s.feeInvoices;

      const studentOutstanding = invoices.reduce((sum, inv) => {
        const remaining = Math.max(Number(inv.netDue) - Number(inv.amountPaid), 0);
        return sum + remaining;
      }, 0);
      const studentPaid = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);

      const overdue = invoices.filter(
        (inv) => inv.status !== "PAID" && inv.status !== "WAIVED" && inv.dueDate < now
      );

      // Find next due invoice (unpaid and not yet overdue)
      const upcoming = invoices.find(
        (inv) => inv.status !== "PAID" && inv.status !== "WAIVED" && inv.dueDate >= now
      );
      if (upcoming && upcoming.dueDate.getTime() < nextDueDateMs) {
        nextDueDateMs = upcoming.dueDate.getTime();
      }

      // Paid this month
      const thisMonthPaid = invoices.reduce((sum, inv) => {
        return sum + inv.payments
          .filter((p) => p.paymentDate && p.paymentDate >= startOfMonth && p.status === "PAID")
          .reduce((ps, p) => ps + Number(p.amountPaid), 0);
      }, 0);

      totalOutstanding += studentOutstanding;
      totalPaid += studentPaid;
      overdueCount += overdue.length;
      overdueAmount += overdue.reduce((s, inv) => s + Math.max(Number(inv.netDue) - Number(inv.amountPaid), 0), 0);
      paidThisMonth += thisMonthPaid;

      // Attendance stats
      const attendanceTotal = s.attendanceRecords.length;
      const attendancePresent = s.attendanceRecords.filter((r) => r.status === "PRESENT").length;
      const attendanceRate = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null;

      return {
        id:          s.id,
        name:        s.user.name,
        email:       s.user.email,
        admissionNo: s.admissionNo,
        grade:       enrollment?.section?.grade?.name ?? "N/A",
        section:     enrollment?.section?.name ?? "N/A",
        outstanding: studentOutstanding,
        totalPaid:   studentPaid,
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sm, inv) => sm + Math.max(Number(inv.netDue) - Number(inv.amountPaid), 0), 0),
        nextDueDate: upcoming?.dueDate?.toISOString() ?? null,
        nextDueAmount: upcoming ? Math.max(Number(upcoming.netDue) - Number(upcoming.amountPaid), 0) : 0,
        attendanceRate,
        discounts: s.studentDiscounts.map((sd) => ({
          name:       sd.discountRule.name,
          type:       sd.discountRule.type,
          percentage: Number(sd.discountRule.percentage ?? 0),
        })),
        pendingInvoices: invoices
          .filter((inv) => inv.status !== "PAID" && inv.status !== "WAIVED")
          .map((inv) => ({
            id:          inv.id,
            invoiceNo:   inv.invoiceNo,
            periodLabel: inv.periodLabel,
            dueDate:     inv.dueDate.toISOString(),
            netDue:      Number(inv.netDue),
            amountPaid:  Number(inv.amountPaid),
            status:      inv.status,
          })),
        recentPayments: invoices
          .flatMap((inv) => inv.payments)
          .sort((a, b) => (b.paymentDate?.getTime() ?? 0) - (a.paymentDate?.getTime() ?? 0))
          .slice(0, 5)
          .map((p) => ({
            id:            p.id,
            amountPaid:    Number(p.amountPaid),
            paymentDate:   p.paymentDate?.toISOString() ?? null,
            method:        p.method,
            transactionId: p.transactionId,
            status:        p.status,
          })),
      };
    });

    // Recent school announcements for parents
    const allAnnouncements = await prisma.announcement.findMany({
      where: {
        tenantId,
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
    });

    const announcements = allAnnouncements.filter((ann) => {
      if (!ann.targetRoles) return false;
      try {
        const targetRoles = typeof ann.targetRoles === 'string' && ann.targetRoles.startsWith('[')
          ? JSON.parse(ann.targetRoles)
          : (ann.targetRoles as string).split(',').map((r: string) => r.trim());
        if (!Array.isArray(targetRoles)) return false;
        return targetRoles.includes("PARENT") || targetRoles.includes("ALL");
      } catch (e) {
        return false;
      }
    }).slice(0, 5);

    return NextResponse.json({
      totalOutstanding,
      totalPaid,
      overdueCount,
      overdueAmount,
      nextDueDate: nextDueDateMs < Infinity ? new Date(nextDueDateMs).toISOString() : null,
      paidThisMonth,
      children,
      announcements: announcements.map((a) => ({
        id:          a.id,
        title:       a.title,
        content:     a.content,
        publishedAt: a.publishedAt?.toISOString() ?? null,
      })),
    });
  } catch (err: any) {
    console.error("[Parent Overview GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
