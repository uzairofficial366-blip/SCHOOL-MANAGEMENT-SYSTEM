import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const money = z.coerce.number().min(0);

const createPaymentSchema = z.object({
  studentId: z.string().min(1),
  feeStructureId: z.string().min(1),
  amount: money,
  amountPaid: money.default(0),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
  discountValue: money.default(0),
  discountRemarks: z.string().trim().max(500).optional().nullable(),
  dueDate: z.string().min(1),
  paymentDate: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  status: z.string().optional(),
  transactionId: z.string().optional().nullable(),
});

const patchPaymentSchema = z.object({
  id: z.string().min(1),
  amountPaid: money.optional(),
  discountType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
  discountValue: money.default(0),
  discountRemarks: z.string().trim().max(500).optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  status: z.string().optional(),
  transactionId: z.string().optional().nullable(),
});

function calculateDiscount(amount: number, discountType?: "FIXED" | "PERCENTAGE", discountValue = 0) {
  if (!discountType || discountValue === 0) return 0;
  const discount = discountType === "PERCENTAGE" ? amount * (discountValue / 100) : discountValue;
  return Number(Math.min(discount, amount).toFixed(2));
}

function paymentStatus(netAmount: number, amountPaid: number, explicitStatus?: string) {
  if (explicitStatus === "WAIVED") return "WAIVED";
  if (amountPaid <= 0) return explicitStatus === "OVERDUE" ? "OVERDUE" : "PENDING";
  if (amountPaid >= netAmount) return "PAID";
  return "PARTIAL";
}

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
    const parsed = createPaymentSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    }

    const { studentId, feeStructureId, amount, amountPaid, dueDate, paymentDate, method, status, transactionId, discountType, discountValue, discountRemarks } = parsed.data;
    const [student, feeStructure] = await Promise.all([
      prisma.student.findFirst({ where: { id: studentId, tenantId, deletedAt: null } }),
      prisma.feeStructure.findFirst({ where: { id: feeStructureId, tenantId, deletedAt: null } }),
    ]);

    if (!student || !feeStructure) {
      return NextResponse.json({ error: "Selected student or fee structure was not found." }, { status: 404 });
    }

    const discount = calculateDiscount(amount, discountType, discountValue);
    if (discountValue > 0 && discount === amount && discountValue > amount && discountType === "FIXED") {
      return NextResponse.json({ error: "Discount cannot exceed total payable amount." }, { status: 400 });
    }
    const netAmount = Number((amount - discount).toFixed(2));
    const normalizedPaid = Math.min(amountPaid, netAmount);

    const payment = await prisma.feePayment.create({
      data: {
        tenantId,
        studentId,
        feeStructureId,
        amount,
        discount,
        discountRemarks: discountRemarks || null,
        amountPaid: normalizedPaid,
        dueDate: new Date(dueDate),
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        method: method || null,
        status: paymentStatus(netAmount, normalizedPaid, status),
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
    const parsed = patchPaymentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    }

    const { id, amountPaid, paymentDate, method, status, transactionId, discountType, discountValue, discountRemarks } = parsed.data;
    const existing = await prisma.feePayment.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const amount = Number(existing.amount);
    const discount = discountValue > 0 ? calculateDiscount(amount, discountType, discountValue) : Number(existing.discount);
    if (discountValue > 0 && discount === amount && discountValue > amount && discountType === "FIXED") {
      return NextResponse.json({ error: "Discount cannot exceed total payable amount." }, { status: 400 });
    }
    const netAmount = Number((amount - discount).toFixed(2));
    const normalizedPaid = Math.min(amountPaid ?? netAmount, netAmount);

    const payment = await prisma.feePayment.update({
      where: { id },
      data: {
        amountPaid: normalizedPaid,
        discount,
        discountRemarks: discountRemarks === undefined ? undefined : discountRemarks || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        method: method || undefined,
        status: paymentStatus(netAmount, normalizedPaid, status),
        transactionId: transactionId || undefined,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
