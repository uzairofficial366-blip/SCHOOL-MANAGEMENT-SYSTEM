import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const userId = session.user?.id as string;

    const guardians = await prisma.guardian.findMany({
      where: { tenantId, userId },
      select: { studentId: true },
    });
    const studentIds = guardians.map((guardian) => guardian.studentId);

    if (studentIds.length === 0) return NextResponse.json({ children: [] });

    const students = await prisma.student.findMany({
      where: { tenantId, id: { in: studentIds }, deletedAt: null },
      include: {
        user: { select: { name: true } },
        transportAssignment: { include: { vehicle: true } },
      },
      orderBy: { user: { name: "asc" } },
    });

    return NextResponse.json({
      children: students.map((student) => ({
        id: student.id,
        name: student.user.name,
        admissionNo: student.admissionNo,
        routeName: student.transportAssignment?.vehicle?.routeName ?? null,
        vehicleNumber: student.transportAssignment?.vehicle?.plateNo ?? null,
        driverName: student.transportAssignment?.vehicle?.driverName ?? null,
        driverContact: student.transportAssignment?.vehicle?.driverPhone ?? null,
        pickupPoint: student.transportAssignment?.pickupStop ?? null,
        dropPoint: student.transportAssignment?.dropStop ?? null,
        monthlyTransportFee: null,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/parent/transport error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
