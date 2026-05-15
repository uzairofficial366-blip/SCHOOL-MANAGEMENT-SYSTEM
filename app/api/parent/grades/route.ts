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
        select: { id: true, admissionNo: true, user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.gradeRecord.findMany({
        where: { tenantId, studentId: { in: studentIds } },
        include: {
          student: { include: { user: { select: { name: true } } } },
          subject: true,
          exam: { include: { examSchedule: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 300,
      }),
    ]);

    return NextResponse.json({
      children: children.map((student) => ({
        id: student.id,
        name: student.user.name,
        admissionNo: student.admissionNo,
      })),
      records: records.map((record) => ({
        id: record.id,
        studentId: record.studentId,
        studentName: record.student.user.name,
        examName: record.exam?.examSchedule?.name ?? "General Result",
        subject: record.subject.name,
        marksObtained: Number(record.marksObtained),
        totalMarks: Number(record.totalMarks),
        grade: record.grade,
        remarks: record.remarks,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/parent/grades error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
