import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatMonthLabel, getNetSalaryAmount } from "@/lib/finance";

export const metadata = { title: "Accountant Dashboard" };

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default async function AccountantPage() {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;
  const currentMonth = startOfMonth(new Date());

  const [students, staffMembers] = await Promise.all([
    prisma.student.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        user: true,
        feePayments: {
          include: { feeStructure: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.staff.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        user: true,
        salaryPayments: {
          orderBy: { salaryMonth: "desc" },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const studentSummaries = students.map((student) => {
    const unpaid = student.feePayments.filter((payment) => payment.status !== "PAID");
    const pendingAmount = unpaid.reduce((sum, payment) => {
      const due = Number(payment.amount) + Number(payment.lateFee) - Number(payment.discount);
      return sum + Math.max(due - Number(payment.amountPaid), 0);
    }, 0);

    return {
      id: student.id,
      name: student.user.name,
      unpaidCount: unpaid.length,
      pendingAmount,
      latestDueMonth: unpaid[0]?.dueDate ? formatMonthLabel(unpaid[0].dueDate) : null,
    };
  });

  const staffSummaries = staffMembers.map((staff) => {
    const currentMonthPayment = staff.salaryPayments.find(
      (payment) => payment.salaryMonth.getTime() === currentMonth.getTime(),
    );
    const pendingPayments = staff.salaryPayments.filter((payment) => payment.status !== "PAID");
    const pendingAmount = pendingPayments.reduce(
      (sum, payment) => sum + getNetSalaryAmount(payment),
      0,
    );

    return {
      id: staff.id,
      name: staff.user.name,
      currentStatus: currentMonthPayment?.status ?? "PENDING",
      pendingAmount,
      nextMonth: currentMonthPayment ? formatMonthLabel(currentMonthPayment.salaryMonth) : "No record",
    };
  });

  const totalPendingFees = studentSummaries.reduce((sum, student) => sum + student.pendingAmount, 0);
  const totalPendingSalaries = staffSummaries.reduce((sum, staff) => sum + staff.pendingAmount, 0);
  const unpaidStudents = studentSummaries.filter((student) => student.unpaidCount > 0).length;
  const pendingStaff = staffSummaries.filter((staff) => staff.currentStatus !== "PAID").length;

  return (
    <>
      <Topbar title="Finance Dashboard" breadcrumbs={[{ label: "Home" }, { label: "Accountant" }]} />
      <div className="page-body fade-up" style={{ display: "grid", gap: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {[
            { label: "Students With Unpaid Fees", value: unpaidStudents.toString(), hint: `${students.length} total students` },
            { label: "Pending Fee Amount", value: formatCurrency(totalPendingFees), hint: "Across all unpaid invoices" },
            { label: "Staff Pending Salary", value: pendingStaff.toString(), hint: `${staffMembers.length} total staff members` },
            { label: "Pending Salary Amount", value: formatCurrency(totalPendingSalaries), hint: "Across unpaid payroll months" },
          ].map((card) => (
            <div key={card.label} className="card">
              <div style={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))", marginBottom: "0.4rem" }}>{card.label}</div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800 }}>{card.value}</div>
              <div style={{ marginTop: "0.35rem", fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>{card.hint}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Student Fee Follow-up</h3>
              <Link href="/accountant/payments" style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>Open all</Link>
            </div>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {studentSummaries.filter((student) => student.unpaidCount > 0).slice(0, 5).map((student) => (
                <div key={student.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid hsl(var(--border))" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>
                      {student.unpaidCount} unpaid record{student.unpaidCount === 1 ? "" : "s"}
                      {student.latestDueMonth ? ` • latest ${student.latestDueMonth}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(student.pendingAmount)}</div>
                    <Link href={`/accountant/payments/${student.id}`} style={{ fontSize: "0.8rem", color: "hsl(var(--primary))" }}>View details</Link>
                  </div>
                </div>
              ))}
              {unpaidStudents === 0 && <div style={{ color: "hsl(var(--text-muted))" }}>All student fee records are fully paid.</div>}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Payroll Follow-up</h3>
              <Link href="/accountant/payroll" style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>Open all</Link>
            </div>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {staffSummaries.filter((staff) => staff.currentStatus !== "PAID").slice(0, 5).map((staff) => (
                <div key={staff.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid hsl(var(--border))" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{staff.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>
                      Status for {staff.nextMonth}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(staff.pendingAmount)}</div>
                    <Link href={`/accountant/payroll/${staff.id}`} style={{ fontSize: "0.8rem", color: "hsl(var(--primary))" }}>View history</Link>
                  </div>
                </div>
              ))}
              {pendingStaff === 0 && <div style={{ color: "hsl(var(--text-muted))" }}>Current payroll has been settled for all staff.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
