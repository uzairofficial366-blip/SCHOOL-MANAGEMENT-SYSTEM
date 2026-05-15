import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";
import ParentFeesClient from "./_client";

export const metadata = { title: "My Fee Account" };
export const dynamic = "force-dynamic";

export default async function ParentFeesPage() {
  const session = await auth();
  if (!session || session.user?.role !== "PARENT") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId   = session.user?.id as string;

  const guardians = await prisma.guardian.findMany({
    where: { tenantId, userId },
    select: { studentId: true },
  });

  const studentIds = guardians.map((g) => g.studentId);

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, tenantId, deletedAt: null },
    include: {
      user: { select: { name: true } },
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

  const now = new Date();

  const children = students.map((s) => {
    const enrollment = s.enrollments[0];
    const invoices   = s.feeInvoices;
    const totalDue   = invoices.reduce((sum, i) => sum + Number(i.netDue), 0);
    const totalPaid  = invoices.reduce((sum, i) => sum + Number(i.amountPaid), 0);
    const outstanding = Math.max(totalDue - totalPaid, 0);
    const overdue    = invoices.filter((i) => i.status !== "PAID" && i.status !== "WAIVED" && i.dueDate < now);

    return {
      id:          s.id,
      name:        s.user.name,
      admissionNo: s.admissionNo,
      grade:       enrollment?.section?.grade?.name ?? "N/A",
      section:     enrollment?.section?.name ?? "N/A",
      outstanding,
      totalPaid,
      overdueCount:  overdue.length,
      overdueAmount: overdue.reduce((sum, i) => sum + Math.max(Number(i.netDue) - Number(i.amountPaid), 0), 0),
      discounts: s.studentDiscounts.map((sd) => ({
        name:       sd.discountRule.name,
        type:       sd.discountRule.type,
        percentage: Number(sd.discountRule.percentage ?? 0),
      })),
      invoices: invoices.map((inv) => ({
        id:            inv.id,
        invoiceNo:     inv.invoiceNo,
        periodLabel:   inv.periodLabel,
        issueDate:     inv.issueDate.toISOString(),
        dueDate:       inv.dueDate.toISOString(),
        grossAmount:   Number(inv.grossAmount),
        totalDiscount: Number(inv.totalDiscount),
        lateFee:       Number(inv.lateFee),
        netDue:        Number(inv.netDue),
        amountPaid:    Number(inv.amountPaid),
        status:        inv.status,
        notes:         inv.notes,
        lineItems:     inv.lineItems.map((li) => ({
          id:              li.id,
          description:     li.description,
          amount:          Number(li.amount),
          discountAmount:  Number(li.discountAmount),
          discountRemarks: li.discountRemarks,
          netAmount:       Number(li.netAmount),
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

  return (
    <>
      <Topbar title="My Fee Account" breadcrumbs={[{ label: "Home" }, { label: "Fees" }]} />
      <div className="page-body fade-up">
        <ParentFeesClient initialData={children} />
      </div>
    </>
  );
}
