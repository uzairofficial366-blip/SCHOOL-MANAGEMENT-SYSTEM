import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatMonthLabel } from "@/lib/finance";

export const metadata = { title: "Accountant Dashboard" };
export const dynamic = "force-dynamic";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default async function AccountantPage({ searchParams }: { searchParams: Promise<{ grade?: string; section?: string }> }) {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const { grade: selectedGrade = "", section: selectedSection = "" } = await searchParams;
  const tenantId = session.user?.tenantId as string;
  const currentMonth = startOfMonth(new Date());

  const grades = await prisma.grade.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  const sections = await prisma.section.findMany({
    where: { tenantId, deletedAt: null },
    include: { grade: true },
    orderBy: [{ gradeId: "asc" }, { name: "asc" }],
  });

  sections.sort((a, b) => {
    if (a.grade.name === b.grade.name) return a.name.localeCompare(b.name);
    return a.grade.name.localeCompare(b.grade.name);
  });

  const students = await prisma.student.findMany({
    where: { tenantId, deletedAt: null },
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
        orderBy: { dueDate: "desc" },
      },
    },
    orderBy: { user: { name: "asc" } },
  });



  let filteredStudents = students;
  if (selectedGrade) {
    filteredStudents = filteredStudents.filter((student) =>
      student.enrollments.some((enrollment) => enrollment.section.gradeId === selectedGrade)
    );
  }
  if (selectedSection) {
    filteredStudents = filteredStudents.filter((student) =>
      student.enrollments.some((enrollment) => enrollment.sectionId === selectedSection)
    );
  }

  const studentData = filteredStudents.map((student) => {
    const father = student.guardians.find((g) => g.relation.toLowerCase() === "father");
    const contact = student.user.phone || father?.phone || "N/A";

    const unpaidPayments = student.feePayments.filter((payment) => payment.status !== "PAID" && payment.dueDate <= currentMonth);
    const pendingMonths = [...new Set(unpaidPayments.map((payment) => formatMonthLabel(payment.dueDate)))];
    const pendingAmount = unpaidPayments.reduce((sum, payment) => {
      const due = Number(payment.amount) + Number(payment.lateFee) - Number(payment.discount);
      return sum + Math.max(due - Number(payment.amountPaid), 0);
    }, 0);

    const feeStatus = unpaidPayments.length === 0 ? "Paid" : "Unpaid";
    const remarks = pendingMonths.length > 0 ? `${pendingMonths.join(", ")} – Unpaid` : "";

    const currentEnrollment = student.enrollments[0];

    return {
      id: student.id,
      name: student.user.name,
      fatherName: father?.name || "N/A",
      contact,
      grade: currentEnrollment ? currentEnrollment.section.grade.name : "N/A",
      section: currentEnrollment ? currentEnrollment.section.name : "N/A",
      feeStatus,
      remarks,
      pendingAmount,
    };
  });

  return (
    <>
      <Topbar title="Accountant Dashboard" breadcrumbs={[{ label: "Home" }, { label: "Accountant" }]} />
      <div className="page-body fade-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Student Fee Management</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/accountant/fee-structure" className="btn btn-secondary">Fee Structure</Link>
            <Link href="/accountant/concession" className="btn btn-secondary">Concession</Link>
            <Link href="/accountant/reports" className="btn btn-secondary">Reports</Link>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <form method="get" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <label>
              Class:
              <select name="grade" style={{ marginLeft: "0.5rem" }} defaultValue={selectedGrade}>
                <option value="">All</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Section:
              <select name="section" style={{ marginLeft: "0.5rem" }} defaultValue={selectedSection}>
                <option value="">All</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.grade.name} - {section.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary">Filter</button>
          </form>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Father Name</th>
                  <th>Contact</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Fee Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentData.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.fatherName}</td>
                    <td>{student.contact}</td>
                    <td>{student.grade}</td>
                    <td>{student.section}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: student.feeStatus === "Paid" ? "#dcfce7" : "#fee2e2",
                          color: student.feeStatus === "Paid" ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {student.feeStatus}
                      </span>
                    </td>
                    <td>{student.remarks}</td>
                    <td>
                      {student.feeStatus === "Paid" ? (
                        <a href={`/api/accountant/fee-slip/paid/${student.id}`} className="btn btn-primary btn-sm" target="_blank">
                          Download Paid Slip
                        </a>
                      ) : (
                        <a href={`/api/accountant/fee-slip/outstanding/${student.id}`} className="btn btn-warning btn-sm" target="_blank">
                          Download Outstanding Slip
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
