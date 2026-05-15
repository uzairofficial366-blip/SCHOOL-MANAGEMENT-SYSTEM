import { NextRequest, NextResponse } from "next/server";
import { ExamType } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

function getOverallGrade(percentage: number) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

function examTypeLabel(type: string) {
  const labels: Record<string, string> = {
    MIDTERM: "Mid Term",
    FINAL: "Final Term",
    PRE_BOARD: "Pre Board",
    OTHER: "Other",
    QUIZ: "Quiz",
    ASSIGNMENT: "Assignment",
    PRACTICAL: "Practical",
  };

  return labels[type] ?? type.replace(/_/g, " ");
}

function examTitle(type: string, name: string) {
  if (type === "MIDTERM") return "Mid Term Examination Result Card";
  if (type === "FINAL") return "Final Term Examination Result Card";
  if (type === "PRE_BOARD") return "Pre Board Examination Result Card";
  return `${examTypeLabel(type)} Result Card${name ? ` - ${name}` : ""}`;
}

function settingsValue(settings: unknown, keys: string[]) {
  if (!settings || typeof settings !== "object") return null;
  const record = settings as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = session?.user?.role as string | undefined;
    if (!session || !role || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant is required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const examScheduleId = searchParams.get("examScheduleId");
    const examType = searchParams.get("examType");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    if (examType && !Object.values(ExamType).includes(examType as ExamType)) {
      return NextResponse.json({ error: "Invalid exam type" }, { status: 400 });
    }

    const [tenant, student] = await Promise.all([
      prisma.tenant.findFirst({
        where: { id: tenantId, isActive: true, deletedAt: null },
        select: { id: true, name: true, logoUrl: true, settings: true },
      }),
      prisma.student.findFirst({
        where: { id: studentId, tenantId, deletedAt: null },
        include: {
          user: { select: { name: true } },
          guardians: {
            where: { tenantId },
            orderBy: [{ isEmergency: "desc" }, { relation: "asc" }],
            select: { name: true, relation: true, phone: true, email: true },
          },
          enrollments: {
            where: { tenantId, status: "ACTIVE" },
            include: {
              academicYear: { select: { id: true, name: true } },
              section: {
                include: {
                  grade: { select: { id: true, name: true, level: true } },
                },
              },
            },
            orderBy: { enrolledAt: "desc" },
          },
        },
      }),
    ]);

    if (!tenant) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    let schedule = null;

    if (examScheduleId) {
      schedule = await prisma.examSchedule.findFirst({
        where: {
          id: examScheduleId,
          tenantId,
          ...(examType ? { type: examType as ExamType } : {}),
        },
        include: { academicYear: { select: { id: true, name: true } } },
      });
    } else if (examType) {
      schedule = await prisma.examSchedule.findFirst({
        where: {
          tenantId,
          type: examType as ExamType,
          exams: {
            some: {
              tenantId,
              gradeRecords: { some: { tenantId, studentId } },
            },
          },
        },
        include: { academicYear: { select: { id: true, name: true } } },
        orderBy: { startDate: "desc" },
      });
    }

    if (!schedule) {
      return NextResponse.json({ error: "Exam/session not found for this student" }, { status: 404 });
    }

    const records = await prisma.gradeRecord.findMany({
      where: {
        tenantId,
        studentId,
        exam: {
          tenantId,
          examScheduleId: schedule.id,
        },
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        exam: { select: { id: true, totalMarks: true, passingMarks: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const subjectMarks = records.map((record, index) => {
      const totalMarks = numberValue(record.totalMarks || record.exam?.totalMarks);
      const marksObtained = numberValue(record.marksObtained);
      const passingMarks = record.exam?.passingMarks ?? null;
      const failedSubject = passingMarks !== null && marksObtained < passingMarks;

      return {
        serialNo: index + 1,
        subjectId: record.subjectId,
        subjectName: record.subject.name,
        subjectCode: record.subject.code,
        totalMarks,
        passingMarks,
        marksObtained,
        grade: record.grade ?? null,
        remarks: record.remarks ?? null,
        failedSubject,
      };
    });

    const totalMarks = subjectMarks.reduce((sum, item) => sum + item.totalMarks, 0);
    const obtainedMarks = subjectMarks.reduce((sum, item) => sum + item.marksObtained, 0);
    const percentage = totalMarks > 0 ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0;
    const overallGrade = getOverallGrade(percentage);
    const failedBySubject = subjectMarks.some((item) => item.failedSubject);
    const resultStatus = failedBySubject || percentage < 40 ? "Fail" : "Pass";
    const enrollment = student.enrollments[0] ?? null;
    const parent =
      student.guardians.find((guardian) => /father/i.test(guardian.relation)) ??
      student.guardians.find((guardian) => /parent|guardian/i.test(guardian.relation)) ??
      student.guardians[0] ??
      null;

    return NextResponse.json({
      school: {
        id: tenant.id,
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        address: settingsValue(tenant.settings, ["address", "schoolAddress"]),
        contact: settingsValue(tenant.settings, ["contact", "phone", "schoolPhone"]),
        email: settingsValue(tenant.settings, ["email", "schoolEmail"]),
      },
      student: {
        id: student.id,
        name: student.user.name,
        admissionNo: student.admissionNo,
        rollNo: enrollment?.rollNo ?? null,
        dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
        className: enrollment?.section.grade.name ?? null,
        sectionName: enrollment?.section.name ?? null,
        academicYear: enrollment?.academicYear.name ?? schedule.academicYear.name,
        fatherName: parent?.name ?? null,
        parentRelation: parent?.relation ?? null,
      },
      exam: {
        id: schedule.id,
        name: schedule.name,
        type: schedule.type,
        typeLabel: examTypeLabel(schedule.type),
        title: examTitle(schedule.type, schedule.name),
        session: schedule.academicYear.name,
        startDate: schedule.startDate.toISOString(),
        endDate: schedule.endDate.toISOString(),
      },
      marks: subjectMarks,
      summary: {
        totalMarks,
        obtainedMarks,
        percentage,
        overallGrade,
        resultStatus,
        position: null,
        attendance: null,
        remarks:
          resultStatus === "Pass"
            ? "Promoted subject to school policy."
            : "Needs improvement in the highlighted subjects.",
      },
      issuedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
