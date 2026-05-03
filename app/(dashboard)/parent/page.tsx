import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";
import ParentDashboardClient from "./_dashboard";

export const metadata = { title: "Parent Dashboard | EduERP" };

export default async function ParentDashboard() {
  const session = await auth();
  if (!session || session.user?.role !== "PARENT") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId   = session.user?.id as string;
  const now      = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const guardians = await prisma.guardian.findMany({
    where: { tenantId, userId },
    select: { studentId: true },
  });
  const studentIds = guardians.map((g) => g.studentId);

  let data = {
    totalOutstanding: 0, totalPaid: 0, overdueCount: 0,
    overdueAmount: 0, nextDueDate: null as string | null,
    paidThisMonth: 0, children: [] as any[], announcements: [] as any[],
  };

  if (studentIds.length > 0) {
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
          include: { lineItems: true, payments: { orderBy: { paymentDate: "desc" }, take: 10 } },
        },
        studentDiscounts: {
          where: {
            effectiveFrom: { lte: now },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
            discountRule: { isActive: true },
          },
          include: { discountRule: true },
        },
        attendanceRecords: { orderBy: { date: "desc" }, take: 30 },
      },
    });

    let nextDueDateMs = Infinity;

    data.children = students.map((s) => {
      const enrollment = s.enrollments[0];
      const invoices   = s.feeInvoices;
      const outstanding = invoices.reduce((sum, inv) => sum + Math.max(Number(inv.netDue) - Number(inv.amountPaid), 0), 0);
      const paid        = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
      const overdue     = invoices.filter((inv) => inv.status !== "PAID" && inv.status !== "WAIVED" && inv.dueDate < now);
      const upcoming    = invoices.find((inv) => inv.status !== "PAID" && inv.status !== "WAIVED" && inv.dueDate >= now);
      if (upcoming && upcoming.dueDate.getTime() < nextDueDateMs) nextDueDateMs = upcoming.dueDate.getTime();

      const thisMonthPaid = invoices.reduce((sum, inv) =>
        sum + inv.payments.filter((p) => p.paymentDate && p.paymentDate >= startOfMonth && p.status === "PAID")
          .reduce((ps, p) => ps + Number(p.amountPaid), 0), 0);

      const attTotal   = s.attendanceRecords.length;
      const attPresent = s.attendanceRecords.filter((r) => r.status === "PRESENT").length;

      data.totalOutstanding += outstanding;
      data.totalPaid        += paid;
      data.overdueCount     += overdue.length;
      data.overdueAmount    += overdue.reduce((sm, inv) => sm + Math.max(Number(inv.netDue) - Number(inv.amountPaid), 0), 0);
      data.paidThisMonth    += thisMonthPaid;

      return {
        id: s.id, name: s.user.name, email: s.user.email,
        admissionNo: s.admissionNo,
        grade:   enrollment?.section?.grade?.name ?? "N/A",
        section: enrollment?.section?.name ?? "N/A",
        outstanding, totalPaid: paid,
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sm, inv) => sm + Math.max(Number(inv.netDue) - Number(inv.amountPaid), 0), 0),
        nextDueDate:   upcoming?.dueDate?.toISOString() ?? null,
        nextDueAmount: upcoming ? Math.max(Number(upcoming.netDue) - Number(upcoming.amountPaid), 0) : 0,
        attendanceRate: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : null,
        discounts: s.studentDiscounts.map((sd) => ({
          name: sd.discountRule.name, type: sd.discountRule.type,
          percentage: Number(sd.discountRule.percentage ?? 0),
        })),
        invoices: invoices.map((inv) => ({
          id: inv.id, invoiceNo: inv.invoiceNo, periodLabel: inv.periodLabel,
          issueDate: inv.issueDate.toISOString(), dueDate: inv.dueDate.toISOString(),
          grossAmount: Number(inv.grossAmount), totalDiscount: Number(inv.totalDiscount),
          lateFee: Number(inv.lateFee), netDue: Number(inv.netDue),
          amountPaid: Number(inv.amountPaid), status: inv.status, notes: inv.notes,
          lineItems: inv.lineItems.map((li) => ({
            id: li.id, description: li.description, amount: Number(li.amount),
            discountAmount: Number(li.discountAmount), discountRemarks: li.discountRemarks,
            netAmount: Number(li.netAmount),
          })),
          payments: inv.payments.map((p) => ({
            id: p.id, amountPaid: Number(p.amountPaid),
            paymentDate: p.paymentDate?.toISOString() ?? null,
            method: p.method, transactionId: p.transactionId, status: p.status,
          })),
        })),
      };
    });

    data.nextDueDate = nextDueDateMs < Infinity ? new Date(nextDueDateMs).toISOString() : null;

    const ann = await prisma.announcement.findMany({
      where: {
        tenantId,
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      orderBy: { publishedAt: "desc" },
      take: 4,
    });
    data.announcements = ann.map((a) => ({
      id: a.id, title: a.title, content: a.content,
      publishedAt: a.publishedAt?.toISOString() ?? null,
    }));
  }

  return (
    <>
      <Topbar title="Parent Dashboard" breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]} />
      <div className="page-body fade-up">
        <ParentDashboardClient data={data} />
      </div>
    </>
  );
}
