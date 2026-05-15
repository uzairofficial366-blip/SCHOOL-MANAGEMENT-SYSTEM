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

    if (studentIds.length === 0) return NextResponse.json({ children: [], records: [] });

    const [children, records] = await Promise.all([
      prisma.student.findMany({
        where: { tenantId, id: { in: studentIds }, deletedAt: null },
        select: {
          id: true,
          admissionNo: true,
          user: { select: { name: true } },
          enrollments: {
            where: { status: "ACTIVE" },
            take: 1,
            include: { section: { include: { grade: true } } },
          },
        },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.attendanceRecord.findMany({
        where: { tenantId, studentId: { in: studentIds } },
        include: {
          student: { include: { user: { select: { name: true } } } },
          section: { include: { grade: true } },
        },
        orderBy: [{ date: "desc" }, { period: "asc" }],
        take: 300,
      }),
    ]);

    return NextResponse.json({
      children: children.map((student) => ({
        id: student.id,
        name: student.user.name,
        admissionNo: student.admissionNo,
        className: student.enrollments[0]
          ? `${student.enrollments[0].section.grade.name} - ${student.enrollments[0].section.name}`
          : "Not assigned",
      })),
      records: records.map((record) => ({
        id: record.id,
        studentId: record.studentId,
        studentName: record.student.user.name,
        className: `${record.section.grade.name} - ${record.section.name}`,
        date: record.date.toISOString(),
        status: record.status,
        remarks: record.remarks,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/parent/attendance error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
