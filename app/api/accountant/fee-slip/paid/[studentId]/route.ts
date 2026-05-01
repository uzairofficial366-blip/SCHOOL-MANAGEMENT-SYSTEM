import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import jsPDF from "jspdf";
import "jspdf-autotable";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user?.tenantId as string;
  const { studentId } = await params;

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
        where: { status: "PAID" },
        include: { feeStructure: true },
        orderBy: { dueDate: "desc" },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const doc = new jsPDF();

  // School Info
  doc.setFontSize(20);
  doc.text("Demo School", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text("Fee Receipt", 105, 30, { align: "center" });

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

  // Fee Details
  const tableData = student.feePayments.map((payment) => [
    payment.feeStructure.name,
    new Date(payment.dueDate).toLocaleDateString(),
    `$${payment.amountPaid}`,
  ]);

  (doc as any).autoTable({
    head: [["Fee Type", "Month", "Amount Paid"]],
    body: tableData,
    startY: 110,
  });

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fee-slip-${student.user.name}.pdf"`,
    },
  });
}