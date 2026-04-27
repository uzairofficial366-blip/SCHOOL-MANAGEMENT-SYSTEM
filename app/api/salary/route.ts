import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET: All staff with salary info + payment history
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");

    if (staffId) {
      const payments = await prisma.salaryPayment.findMany({
        where: { tenantId, staffId },
        orderBy: { salaryMonth: "desc" },
      });
      return NextResponse.json({ payments });
    }

    const staff = await prisma.staff.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        user: { select: { name: true, email: true, phone: true, role: true } },
        salaryPayments: {
          orderBy: { salaryMonth: "desc" },
          take: 12, // last 12 months
        },
      },
      orderBy: { employeeId: "asc" },
    });

    return NextResponse.json({ staff });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new salary payment record
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    const { staffId, salaryMonth, grossAmount, deductions, bonus, amountPaid, paymentDate, method, status, transactionId } = body;

    if (!staffId || !salaryMonth || !grossAmount) {
      return NextResponse.json({ error: "staffId, salaryMonth, and grossAmount are required" }, { status: 400 });
    }

    // Upsert: one record per staff per month
    const payment = await prisma.salaryPayment.upsert({
      where: { tenantId_staffId_salaryMonth: { tenantId, staffId, salaryMonth: new Date(salaryMonth) } },
      update: {
        grossAmount: parseFloat(grossAmount),
        deductions: parseFloat(deductions || 0),
        bonus: parseFloat(bonus || 0),
        amountPaid: parseFloat(amountPaid || 0),
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        method: method || null,
        status: status || "PENDING",
        transactionId: transactionId || null,
      },
      create: {
        tenantId,
        staffId,
        salaryMonth: new Date(salaryMonth),
        grossAmount: parseFloat(grossAmount),
        deductions: parseFloat(deductions || 0),
        bonus: parseFloat(bonus || 0),
        amountPaid: parseFloat(amountPaid || 0),
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        method: method || null,
        status: status || "PENDING",
        transactionId: transactionId || null,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Mark salary as paid
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, amountPaid, paymentDate, method, transactionId } = body;

    if (!id) return NextResponse.json({ error: "Payment ID required" }, { status: 400 });

    const payment = await prisma.salaryPayment.update({
      where: { id },
      data: {
        amountPaid: amountPaid !== undefined ? parseFloat(amountPaid) : undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        method: method || undefined,
        status: "PAID",
        transactionId: transactionId || undefined,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
