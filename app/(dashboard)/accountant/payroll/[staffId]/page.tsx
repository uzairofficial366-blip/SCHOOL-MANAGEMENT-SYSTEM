import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatMonthLabel, getPaymentBadgeStyle, getNetSalaryAmount } from "@/lib/finance";

export const metadata = { title: "Salary History" };

export default async function StaffPayrollDetailsPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const { staffId } = await params;
  const tenantId = session.user?.tenantId as string;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId, deletedAt: null },
    include: {
      user: true,
      salaryPayments: {
        orderBy: [{ salaryMonth: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!staff) notFound();

  const paidMonths = staff.salaryPayments.filter((payment) => payment.status === "PAID").length;
  const pendingMonths = staff.salaryPayments.filter((payment) => payment.status !== "PAID").length;
  const pendingAmount = staff.salaryPayments
    .filter((payment) => payment.status !== "PAID")
    .reduce((sum, payment) => sum + getNetSalaryAmount(payment), 0);

  return (
    <>
      <Topbar
        title={staff.user.name}
        breadcrumbs={[
          { label: "Home" },
          { label: "Accountant", href: "/accountant" },
          { label: "Payroll", href: "/accountant/payroll" },
          { label: staff.user.name },
        ]}
      />
      <div className="page-body fade-up" style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "0.9rem" }}>Staff Details</h3>
            <div style={{ display: "grid", gap: "0.55rem", color: "hsl(var(--text-muted))" }}>
              <div><strong style={{ color: "hsl(var(--text))" }}>Employee ID:</strong> {staff.employeeId}</div>
              <div><strong style={{ color: "hsl(var(--text))" }}>Email:</strong> {staff.user.email}</div>
              <div><strong style={{ color: "hsl(var(--text))" }}>Department:</strong> {staff.department || "-"}</div>
              <div><strong style={{ color: "hsl(var(--text))" }}>Designation:</strong> {staff.designation || "-"}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "0.9rem" }}>Payroll Snapshot</h3>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              <div><strong>{formatCurrency(staff.salary)}</strong><div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Base salary</div></div>
              <div><strong>{paidMonths}</strong><div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Paid months</div></div>
              <div><strong>{pendingMonths}</strong><div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Pending months</div></div>
              <div><strong>{formatCurrency(pendingAmount)}</strong><div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Pending amount</div></div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "1rem" }}>Salary Payment History</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Salary Month</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Bonus</th>
                  <th>Net Amount</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {staff.salaryPayments.map((payment) => {
                  const badgeStyle = getPaymentBadgeStyle(payment.status);
                  const netAmount = getNetSalaryAmount(payment);

                  return (
                    <tr key={payment.id}>
                      <td>{formatMonthLabel(payment.salaryMonth)}</td>
                      <td>{formatCurrency(payment.grossAmount)}</td>
                      <td>{formatCurrency(payment.deductions)}</td>
                      <td>{formatCurrency(payment.bonus)}</td>
                      <td>{formatCurrency(netAmount)}</td>
                      <td>{formatCurrency(payment.amountPaid)}</td>
                      <td>
                        <span className="badge" style={badgeStyle}>{payment.status}</span>
                      </td>
                      <td>{payment.paymentDate ? payment.paymentDate.toLocaleDateString() : "Not paid yet"}</td>
                    </tr>
                  );
                })}
                {staff.salaryPayments.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--text-muted))" }}>
                      No salary payments available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
