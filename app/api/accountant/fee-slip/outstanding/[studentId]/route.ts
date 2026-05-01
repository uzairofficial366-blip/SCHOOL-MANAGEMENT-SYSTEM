import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatMonthLabel } from "@/lib/finance";

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user?.tenantId as string;
  const { studentId } = params;
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const student = await prisma.student.findUnique({
    where: { id: studentId, tenantId },
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
        where: { status: { not: "PAID" }, dueDate: { lte: currentMonth } },
        include: { feeStructure: true },
        orderBy: { dueDate: "desc" },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const unpaidPayments = student.feePayments;
  const totalDue = unpaidPayments.reduce((sum, payment) => {
    const due = Number(payment.amount) + Number(payment.lateFee) - Number(payment.discount);
    return sum + Math.max(due - Number(payment.amountPaid), 0);
  }, 0);

  const doc = new jsPDF();

  // School Info
  doc.setFontSize(20);
  doc.text("Demo School", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text("Outstanding Fee Notice", 105, 30, { align: "center" });

  // Student Details
  doc.setFontSize(14);
  doc.text("Student Details", 20, 50);
  doc.setFontSize(10);
  doc.text(`Name: ${student.user.name}`, 20, 60);
  const father = student.guardians.find((g) => g.relation.toLowerCase() === "father");
  doc.text(`Father Name: ${father?.name || "N/A"}`, 20, 70);
  doc.text(`Admission No: ${student.admissionNo}`, 20, 80);
  const enrollment = student.enrollments[0];
  doc.text(`Class: ${enrollment ? enrollment.section.grade.name : "N/A"}`, 20, 90);
  doc.text(`Section: ${enrollment ? enrollment.section.name : "N/A"}`, 20, 100);

  // Outstanding Details
  doc.setFontSize(14);
  doc.text("Outstanding Fees", 20, 120);
  doc.setFontSize(10);
  const pendingMonths = [...new Set(unpaidPayments.map((payment) => formatMonthLabel(payment.dueDate)))];
  doc.text(`Pending Months: ${pendingMonths.join(", ")}`, 20, 130);
  doc.text(`Total Due: $${totalDue}`, 20, 140);

  const tableData = unpaidPayments.map((payment) => [
    payment.feeStructure.name,
    formatMonthLabel(payment.dueDate),
    `$${Number(payment.amount) + Number(payment.lateFee) - Number(payment.discount) - Number(payment.amountPaid)}`,
  ]);

  (doc as any).autoTable({
    head: [["Fee Type", "Month", "Amount Due"]],
    body: tableData,
    startY: 150,
  });

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="outstanding-fee-${student.user.name}.pdf"`,
    },
  });
}