import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatMonthLabel, getPaymentBadgeStyle } from "@/lib/finance";

export const metadata = { title: "Student Payment Details" };

export default async function StudentPaymentDetailsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const { studentId } = await params;
  const tenantId = session.user?.tenantId as string;

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, deletedAt: null },
    include: {
      user: true,
      guardians: true,
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
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!student) notFound();

  const totalBilled = student.feePayments.reduce(
    (sum, payment) => sum + Number(payment.amount) + Number(payment.lateFee) - Number(payment.discount),
    0,
  );
  const totalPaid = student.feePayments.reduce((sum, payment) => sum + Number(payment.amountPaid), 0);
  const unpaidPayments = student.feePayments.filter((payment) => payment.status !== "PAID");
  const pendingAmount = unpaidPayments.reduce((sum, payment) => {
    const due = Number(payment.amount) + Number(payment.lateFee) - Number(payment.discount);
    return sum + Math.max(due - Number(payment.amountPaid), 0);
  }, 0);
  const unpaidMonths = [...new Set(unpaidPayments.map((payment) => formatMonthLabel(payment.dueDate)))];
  const currentEnrollment = student.enrollments[0];

  return (
    <>
      <Topbar
        title={student.user.name}
        breadcrumbs={[
          { label: "Home" },
          { label: "Accountant", href: "/accountant" },
          { label: "Payments", href: "/accountant/payments" },
          { label: student.user.name },
        ]}
      />
      <div className="page-body fade-up" style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "0.9rem" }}>Student Details</h3>
            <div style={{ display: "grid", gap: "0.55rem", color: "hsl(var(--text-muted))" }}>
              <div><strong style={{ color: "hsl(var(--text))" }}>Admission No:</strong> {student.admissionNo}</div>
              <div><strong style={{ color: "hsl(var(--text))" }}>Email:</strong> {student.user.email}</div>
              <div><strong style={{ color: "hsl(var(--text))" }}>Current Grade:</strong> {currentEnrollment ? `${currentEnrollment.section.grade.name} - ${currentEnrollment.section.name}` : "Not assigned"}</div>
              <div><strong style={{ color: "hsl(var(--text))" }}>Guardians:</strong> {student.guardians.map((guardian) => `${guardian.name} (${guardian.phone})`).join(", ") || "None"}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "0.9rem" }}>Payment Snapshot</h3>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              <div><strong>{formatCurrency(totalBilled)}</strong><div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Total billed</div></div>
              <div><strong>{formatCurrency(totalPaid)}</strong><div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Total paid</div></div>
              <div><strong>{formatCurrency(pendingAmount)}</strong><div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Pending amount</div></div>
              <div><strong>{unpaidMonths.join(", ") || "None"}</strong><div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Unpaid months</div></div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: "1.15rem", marginBottom: "1rem" }}>Payment History</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Fee Head</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {student.feePayments.map((payment) => {
                  const badgeStyle = getPaymentBadgeStyle(payment.status);

                  return (
                    <tr key={payment.id}>
                      <td>{formatMonthLabel(payment.dueDate)}</td>
                      <td>{payment.feeStructure.name}</td>
                      <td>{payment.dueDate.toLocaleDateString()}</td>
                      <td>{formatCurrency(Number(payment.amount) + Number(payment.lateFee) - Number(payment.discount))}</td>
                      <td>{formatCurrency(payment.amountPaid)}</td>
                      <td>
                        <span className="badge" style={badgeStyle}>{payment.status}</span>
                      </td>
                      <td>{payment.paymentDate ? payment.paymentDate.toLocaleDateString() : "Not paid yet"}</td>
                    </tr>
                  );
                })}
                {student.feePayments.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--text-muted))" }}>
                      No payment records available.
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
