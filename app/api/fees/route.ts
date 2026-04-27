import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET: List all students with their fee payments summary
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (studentId) {
      // Detailed payment history for one student
      const payments = await prisma.feePayment.findMany({
        where: { tenantId, studentId },
        include: { feeStructure: true },
        orderBy: { dueDate: "desc" },
      });
      return NextResponse.json({ payments });
    }

    // Summary: all students + their payment counts
    const students = await prisma.student.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { section: { include: { grade: true } } },
        },
        feePayments: {
          orderBy: { dueDate: "desc" },
          include: { feeStructure: { select: { name: true, amount: true } } },
        },
      },
      orderBy: { admissionNo: "asc" },
    });

    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Record a fee payment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    const { studentId, feeStructureId, amount, amountPaid, dueDate, paymentDate, method, status, transactionId } = body;

    if (!studentId || !feeStructureId || !amount || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payment = await prisma.feePayment.create({
      data: {
        tenantId,
        studentId,
        feeStructureId,
        amount: parseFloat(amount),
        amountPaid: parseFloat(amountPaid || 0),
        dueDate: new Date(dueDate),
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        method: method || null,
        status: status || "PENDING",
        transactionId: transactionId || null,
      },
      include: {
        feeStructure: true,
        student: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Mark a payment as paid
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const body = await req.json();
    const { id, amountPaid, paymentDate, method, status, transactionId } = body;

    if (!id) return NextResponse.json({ error: "Payment ID required" }, { status: 400 });

    const payment = await prisma.feePayment.update({
      where: { id },
      data: {
        amountPaid: amountPaid !== undefined ? parseFloat(amountPaid) : undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        method: method || undefined,
        status: status || "PAID",
        transactionId: transactionId || undefined,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
