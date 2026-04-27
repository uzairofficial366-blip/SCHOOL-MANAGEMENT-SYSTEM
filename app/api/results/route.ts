import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const { searchParams } = new URL(req.url);
    const gradeId = searchParams.get("gradeId");
    const sectionId = searchParams.get("sectionId");
    const examScheduleId = searchParams.get("examScheduleId");

    // Build the student filter via enrollments
    let studentIds: string[] | undefined;

    if (sectionId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { tenantId, sectionId, status: "ACTIVE" },
        select: { studentId: true },
      });
      studentIds = enrollments.map((e) => e.studentId);
    } else if (gradeId) {
      // Get all sections for this grade, then their enrollments
      const sections = await prisma.section.findMany({
        where: { tenantId, gradeId, deletedAt: null },
        select: { id: true },
      });
      const sectionIds = sections.map((s) => s.id);
      const enrollments = await prisma.enrollment.findMany({
        where: { tenantId, sectionId: { in: sectionIds }, status: "ACTIVE" },
        select: { studentId: true },
      });
      studentIds = enrollments.map((e) => e.studentId);
    }

    let gradeRecordWhere: any = { tenantId };
    if (studentIds !== undefined) {
      gradeRecordWhere.studentId = { in: studentIds };
    }
    if (examScheduleId) {
      gradeRecordWhere.exam = { examScheduleId };
    }

    const gradeRecords = await prisma.gradeRecord.findMany({
      where: gradeRecordWhere,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            enrollments: {
              where: { status: "ACTIVE" },
              include: { section: { include: { grade: true } } },
            },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        exam: {
          select: {
            id: true,
            totalMarks: true,
            examSchedule: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ gradeRecords });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    // Support bulk upsert: body.records = [{ studentId, subjectId, examId, marksObtained, totalMarks, grade, remarks }]
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "records array is required" }, { status: 400 });
    }

    const results = [];
    for (const rec of records) {
      const { studentId, subjectId, examId, marksObtained, totalMarks, grade, remarks } = rec;

      if (!studentId || !subjectId || marksObtained === undefined || !totalMarks) {
        continue; // Skip invalid records
      }

      // Upsert: find existing or create
      const existing = await prisma.gradeRecord.findFirst({
        where: { tenantId, studentId, subjectId, examId: examId || null },
      });

      if (existing) {
        const updated = await prisma.gradeRecord.update({
          where: { id: existing.id },
          data: {
            marksObtained: parseFloat(marksObtained),
            totalMarks: parseFloat(totalMarks),
            grade: grade || null,
            remarks: remarks || null,
          },
        });
        results.push(updated);
      } else {
        const created = await prisma.gradeRecord.create({
          data: {
            tenantId,
            studentId,
            subjectId,
            examId: examId || null,
            marksObtained: parseFloat(marksObtained),
            totalMarks: parseFloat(totalMarks),
            grade: grade || null,
            remarks: remarks || null,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
