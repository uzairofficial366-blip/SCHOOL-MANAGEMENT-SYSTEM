import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatMonthLabel, getNetSalaryAmount } from "@/lib/finance";

export const metadata = { title: "Staff Salary Management" };

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default async function AccountantPayrollPage() {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;
  const currentMonth = startOfMonth(new Date());

  const staffMembers = await prisma.staff.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      user: true,
      salaryPayments: {
        orderBy: { salaryMonth: "desc" },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <>
      <Topbar title="Staff Salary Management" breadcrumbs={[{ label: "Home" }, { label: "Accountant", href: "/accountant" }, { label: "Payroll" }]} />
      <div className="page-body fade-up">
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1.2rem" }}>Salary Status By Staff Member</h3>
            <p style={{ marginTop: "0.35rem", color: "hsl(var(--text-muted))" }}>
              View current salary status, payment history, and pending payroll totals.
            </p>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Employee ID</th>
                  <th>Designation</th>
                  <th>Base Salary</th>
                  <th>Current Month</th>
                  <th>Status</th>
                  <th>Pending Amount</th>
                  <th>History</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((staff) => {
                  const currentPayment = staff.salaryPayments.find(
                    (payment) => payment.salaryMonth.getTime() === currentMonth.getTime(),
                  );
                  const pendingPayments = staff.salaryPayments.filter((payment) => payment.status !== "PAID");
                  const pendingAmount = pendingPayments.reduce(
                    (sum, payment) => sum + getNetSalaryAmount(payment),
                    0,
                  );
                  const isPaid = currentPayment?.status === "PAID";

                  return (
                    <tr key={staff.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <div className="avatar" style={{ width: 34, height: 34, fontSize: "0.82rem", background: "hsl(var(--accent)/0.12)", color: "hsl(var(--accent))" }}>
                            {staff.user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{staff.user.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>{staff.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace" }}>{staff.employeeId}</td>
                      <td>{staff.designation || staff.department || "-"}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(staff.salary)}</td>
                      <td>{currentPayment ? formatMonthLabel(currentPayment.salaryMonth) : "No record"}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: isPaid ? "#dcfce7" : "#fef3c7",
                            color: isPaid ? "#15803d" : "#b45309",
                          }}
                        >
                          {isPaid ? "Given" : "Pending"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(pendingAmount)}</td>
                      <td>
                        <Link href={`/accountant/payroll/${staff.id}`} style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>
                          View history
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {staffMembers.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--text-muted))" }}>
                      No staff members found.
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
