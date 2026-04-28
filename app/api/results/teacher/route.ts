import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import {
  computeStoredGrade,
  findOrCreateExamForTeacherSave,
  getTeacherGradebookGrid,
  getTeacherGradebookScope,
} from "@/lib/teacher-gradebook";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const userId = session.user?.id as string;
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("sectionId");
    const subjectId = searchParams.get("subjectId");
    const examScheduleId = searchParams.get("examScheduleId");

    const scope = await getTeacherGradebookScope(tenantId, userId);

    if (!scope.staff) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const selectedSection = sectionId
      ? scope.sections.find((section) => section.sectionId === sectionId) ?? null
      : null;

    if (sectionId && !selectedSection) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subjects = selectedSection?.subjects ?? [];
    const autoSelectedSubjectId =
      !subjectId && subjects.length === 1 ? subjects[0].subjectId : null;
    const effectiveSubjectId = subjectId ?? autoSelectedSubjectId;

    let grid = null;
    if (selectedSection && effectiveSubjectId) {
      try {
        grid = await getTeacherGradebookGrid({
          tenantId,
          staffId: scope.staff.id,
          sectionId: selectedSection.sectionId,
          subjectId: effectiveSubjectId,
          examScheduleId,
        });
      } catch (error: any) {
        if (error.message === "FORBIDDEN_ALLOCATION") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        throw error;
      }
    }

    return NextResponse.json({
      sections: scope.sections,
      examSchedules: scope.examSchedules,
      subjects,
      autoSelectedSubjectId,
      grid,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const userId = session.user?.id as string;
    const body = await req.json();
    const {
      gradeId,
      sectionId,
      subjectId,
      examScheduleId,
      totalMarks,
      passingMarks,
      records,
    } = body ?? {};

    if (!sectionId || !subjectId || !examScheduleId) {
      return NextResponse.json(
        { error: "sectionId, subjectId, and examScheduleId are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "records array is required" }, { status: 400 });
    }

    const scope = await getTeacherGradebookScope(tenantId, userId);
    if (!scope.staff) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const sectionScope = scope.sections.find((section) => section.sectionId === sectionId);
    if (!sectionScope) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (gradeId && sectionScope.gradeId !== gradeId) {
      return NextResponse.json({ error: "Mismatched class context" }, { status: 400 });
    }

    const allowedSubject = sectionScope.subjects.find((subject) => subject.subjectId === subjectId);
    if (!allowedSubject) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        tenantId,
        sectionId,
        status: "ACTIVE",
      },
      select: {
        studentId: true,
      },
    });

    const allowedStudentIds = new Set(enrollments.map((enrollment) => enrollment.studentId));
    for (const record of records) {
      if (!record?.studentId || !allowedStudentIds.has(record.studentId)) {
        return NextResponse.json(
          { error: "One or more students are outside the allowed roster" },
          { status: 403 }
        );
      }
    }

    const parsedTotalMarks = Number(totalMarks);
    const parsedPassingMarks = Number(passingMarks);

    if (!Number.isFinite(parsedTotalMarks) || parsedTotalMarks <= 0) {
      return NextResponse.json({ error: "totalMarks must be greater than zero" }, { status: 400 });
    }

    if (
      !Number.isFinite(parsedPassingMarks) ||
      parsedPassingMarks < 0 ||
      parsedPassingMarks > parsedTotalMarks
    ) {
      return NextResponse.json(
        { error: "passingMarks must be between 0 and totalMarks" },
        { status: 400 }
      );
    }

    const exam = await findOrCreateExamForTeacherSave({
      tenantId,
      subjectId,
      examScheduleId,
      totalMarks: parsedTotalMarks,
      passingMarks: parsedPassingMarks,
    });

    const saved = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const record of records) {
        const numericMarks = Number(record?.marksObtained);
        if (!Number.isFinite(numericMarks) || numericMarks < 0 || numericMarks > parsedTotalMarks) {
          throw new Error("INVALID_MARKS");
        }

        const grade = computeStoredGrade(numericMarks, parsedTotalMarks, parsedPassingMarks);
        const gpa = Number(((numericMarks / parsedTotalMarks) * 4).toFixed(2));

        const existing = await tx.gradeRecord.findFirst({
          where: {
            tenantId,
            studentId: record.studentId,
            subjectId,
            examId: exam.id,
          },
        });

        if (existing) {
          const updated = await tx.gradeRecord.update({
            where: { id: existing.id },
            data: {
              marksObtained: numericMarks,
              totalMarks: parsedTotalMarks,
              grade,
              gpa,
              remarks: typeof record.remarks === "string" ? record.remarks : null,
            },
          });
          results.push(updated);
        } else {
          const created = await tx.gradeRecord.create({
            data: {
              tenantId,
              studentId: record.studentId,
              subjectId,
              examId: exam.id,
              marksObtained: numericMarks,
              totalMarks: parsedTotalMarks,
              grade,
              gpa,
              remarks: typeof record.remarks === "string" ? record.remarks : null,
            },
          });
          results.push(created);
        }
      }

      return results;
    });

    return NextResponse.json({
      success: true,
      count: saved.length,
      examId: exam.id,
    });
  } catch (error: any) {
    if (error.message === "INVALID_MARKS") {
      return NextResponse.json({ error: "Each mark must be within the selected rubric" }, { status: 400 });
    }

    if (error.message === "EXAM_SCHEDULE_NOT_FOUND") {
      return NextResponse.json({ error: "Exam schedule not found" }, { status: 404 });
    }

    if (error.message === "TERM_NOT_FOUND") {
      return NextResponse.json(
        { error: "No academic term exists for the selected exam schedule" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
