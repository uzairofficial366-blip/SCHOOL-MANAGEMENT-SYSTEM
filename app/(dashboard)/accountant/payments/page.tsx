import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatMonthLabel } from "@/lib/finance";

export const metadata = { title: "Student Fee Management" };

export default async function AccountantPaymentsPage() {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  const students = await prisma.student.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      user: true,
      enrollments: {
        where: { academicYear: { isCurrent: true } },
        include: {
          section: {
            include: { grade: true },
          },
        },
      },
      feePayments: {
        include: { feeStructure: true },
        orderBy: { dueDate: "desc" },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <>
      <Topbar title="Student Fee Management" breadcrumbs={[{ label: "Home" }, { label: "Accountant", href: "/accountant" }, { label: "Payments" }]} />
      <div className="page-body fade-up">
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1.2rem" }}>Fee Status By Student</h3>
            <p style={{ marginTop: "0.35rem", color: "hsl(var(--text-muted))" }}>
              Track who is fully paid, who is unpaid, and which months need follow-up.
            </p>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No</th>
                  <th>Current Grade</th>
                  <th>Fee Status</th>
                  <th>Unpaid Months</th>
                  <th>Pending Amount</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const currentEnrollment = student.enrollments[0];
                  const unpaidPayments = student.feePayments.filter((payment) => payment.status !== "PAID");
                  const unpaidMonths = [...new Set(unpaidPayments.map((payment) => formatMonthLabel(payment.dueDate)))];
                  const pendingAmount = unpaidPayments.reduce((sum, payment) => {
                    const due = Number(payment.amount) + Number(payment.lateFee) - Number(payment.discount);
                    return sum + Math.max(due - Number(payment.amountPaid), 0);
                  }, 0);
                  const isPaid = unpaidPayments.length === 0 && student.feePayments.length > 0;

                  return (
                    <tr key={student.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <div className="avatar" style={{ width: 34, height: 34, fontSize: "0.82rem", background: "hsl(var(--primary)/0.12)", color: "hsl(var(--primary))" }}>
                            {student.user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{student.user.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>{student.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace" }}>{student.admissionNo}</td>
                      <td>
                        {currentEnrollment
                          ? `${currentEnrollment.section.grade.name} - ${currentEnrollment.section.name}`
                          : "Not assigned"}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: isPaid ? "#dcfce7" : "#fee2e2",
                            color: isPaid ? "#15803d" : "#b91c1c",
                          }}
                        >
                          {isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        {unpaidMonths.length > 0 ? unpaidMonths.join(", ") : "None"}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(pendingAmount)}</td>
                      <td>
                        <Link href={`/accountant/payments/${student.id}`} style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>
                          View details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--text-muted))" }}>
                      No students found.
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
