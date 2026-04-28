import { prisma } from "@/lib/db/prisma";

export interface TeacherGradebookSectionOption {
  sectionId: string;
  gradeId: string;
  gradeName: string;
  sectionName: string;
  label: string;
  academicYearId: string;
  subjects: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
  }[];
}

export interface TeacherGradebookExamScheduleOption {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
}

export interface TeacherGradebookRow {
  studentId: string;
  gradeRecordId: string | null;
  studentName: string;
  admissionNo: string;
  rollNo: number | null;
  marksObtained: number | null;
  remarks: string;
}

export async function getTeacherGradebookScope(tenantId: string, userId: string) {
  const staff = await prisma.staff.findFirst({
    where: { tenantId, userId, deletedAt: null },
  });

  if (!staff) {
    return { staff: null, sections: [], examSchedules: [] };
  }

  const allocations = await prisma.subjectAllocation.findMany({
    where: { tenantId, staffId: staff.id },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      section: {
        select: {
          id: true,
          name: true,
          academicYearId: true,
          grade: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [
      { section: { grade: { level: "asc" } } },
      { section: { name: "asc" } },
      { subject: { name: "asc" } },
    ],
  });

  const sectionMap = new Map<string, TeacherGradebookSectionOption>();

  for (const allocation of allocations) {
    const existing = sectionMap.get(allocation.sectionId);

    if (!existing) {
      sectionMap.set(allocation.sectionId, {
        sectionId: allocation.section.id,
        gradeId: allocation.section.grade.id,
        gradeName: allocation.section.grade.name,
        sectionName: allocation.section.name,
        label: `${allocation.section.grade.name} - ${allocation.section.name}`,
        academicYearId: allocation.section.academicYearId,
        subjects: [
          {
            subjectId: allocation.subject.id,
            subjectName: allocation.subject.name,
            subjectCode: allocation.subject.code,
          },
        ],
      });
      continue;
    }

    existing.subjects.push({
      subjectId: allocation.subject.id,
      subjectName: allocation.subject.name,
      subjectCode: allocation.subject.code,
    });
  }

  const sections = Array.from(sectionMap.values());
  const academicYearIds = Array.from(new Set(sections.map((section) => section.academicYearId)));

  const examSchedules = await prisma.examSchedule.findMany({
    where: academicYearIds.length > 0 ? { tenantId, academicYearId: { in: academicYearIds } } : { tenantId },
    orderBy: [{ startDate: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      startDate: true,
      endDate: true,
    },
  });

  return {
    staff,
    sections,
    examSchedules: examSchedules.map<TeacherGradebookExamScheduleOption>((schedule) => ({
      id: schedule.id,
      name: schedule.name,
      type: schedule.type,
      startDate: schedule.startDate.toISOString(),
      endDate: schedule.endDate.toISOString(),
    })),
  };
}

export async function assertTeacherAllocationAccess(
  tenantId: string,
  staffId: string,
  sectionId: string,
  subjectId: string
) {
  const allocation = await prisma.subjectAllocation.findFirst({
    where: {
      tenantId,
      staffId,
      sectionId,
      subjectId,
    },
    include: {
      section: {
        select: {
          id: true,
          name: true,
          academicYearId: true,
          grade: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!allocation) {
    throw new Error("FORBIDDEN_ALLOCATION");
  }

  return allocation;
}

export async function getTeacherGradebookGrid(params: {
  tenantId: string;
  staffId: string;
  sectionId: string;
  subjectId: string;
  examScheduleId?: string | null;
}) {
  const allocation = await assertTeacherAllocationAccess(
    params.tenantId,
    params.staffId,
    params.sectionId,
    params.subjectId
  );

  const enrollments = await prisma.enrollment.findMany({
    where: {
      tenantId: params.tenantId,
      sectionId: params.sectionId,
      status: "ACTIVE",
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ rollNo: "asc" }, { student: { user: { name: "asc" } } }],
  });

  let exam = null;
  if (params.examScheduleId) {
    exam = await prisma.exam.findFirst({
      where: {
        tenantId: params.tenantId,
        examScheduleId: params.examScheduleId,
        subjectId: params.subjectId,
      },
      select: {
        id: true,
        totalMarks: true,
        passingMarks: true,
        examScheduleId: true,
      },
    });
  }

  const studentIds = enrollments.map((enrollment) => enrollment.studentId);
  const gradeRecords =
    exam && studentIds.length > 0
      ? await prisma.gradeRecord.findMany({
          where: {
            tenantId: params.tenantId,
            subjectId: params.subjectId,
            examId: exam.id,
            studentId: { in: studentIds },
          },
          select: {
            id: true,
            studentId: true,
            marksObtained: true,
            remarks: true,
          },
        })
      : [];

  const recordMap = new Map(gradeRecords.map((record) => [record.studentId, record]));

  const rows = enrollments.map<TeacherGradebookRow>((enrollment) => {
    const existing = recordMap.get(enrollment.studentId);
    return {
      studentId: enrollment.studentId,
      gradeRecordId: existing?.id ?? null,
      studentName: enrollment.student.user.name,
      admissionNo: enrollment.student.admissionNo,
      rollNo: enrollment.rollNo ?? null,
      marksObtained: existing ? Number(existing.marksObtained) : null,
      remarks: existing?.remarks ?? "",
    };
  });

  return {
    section: {
      id: allocation.section.id,
      name: allocation.section.name,
      gradeId: allocation.section.grade.id,
      gradeName: allocation.section.grade.name,
      label: `${allocation.section.grade.name} - ${allocation.section.name}`,
    },
    subject: {
      id: allocation.subject.id,
      name: allocation.subject.name,
      code: allocation.subject.code,
    },
    exam: exam
      ? {
          id: exam.id,
          examScheduleId: exam.examScheduleId,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
        }
      : null,
    rubric: {
      totalMarks: exam?.totalMarks ?? 100,
      passingMarks: exam?.passingMarks ?? 40,
    },
    rows,
  };
}

export async function findOrCreateExamForTeacherSave(params: {
  tenantId: string;
  subjectId: string;
  examScheduleId: string;
  totalMarks: number;
  passingMarks: number;
}) {
  const existing = await prisma.exam.findFirst({
    where: {
      tenantId: params.tenantId,
      subjectId: params.subjectId,
      examScheduleId: params.examScheduleId,
    },
  });

  if (existing) {
    if (existing.totalMarks !== params.totalMarks || existing.passingMarks !== params.passingMarks) {
      return prisma.exam.update({
        where: { id: existing.id },
        data: {
          totalMarks: params.totalMarks,
          passingMarks: params.passingMarks,
        },
      });
    }

    return existing;
  }

  const schedule = await prisma.examSchedule.findFirst({
    where: {
      id: params.examScheduleId,
      tenantId: params.tenantId,
    },
    select: {
      id: true,
      academicYearId: true,
      startDate: true,
    },
  });

  if (!schedule) {
    throw new Error("EXAM_SCHEDULE_NOT_FOUND");
  }

  const term =
    (await prisma.term.findFirst({
      where: {
        academicYearId: schedule.academicYearId,
        startDate: { lte: schedule.startDate },
        endDate: { gte: schedule.startDate },
      },
      orderBy: { startDate: "asc" },
    })) ??
    (await prisma.term.findFirst({
      where: { academicYearId: schedule.academicYearId },
      orderBy: { startDate: "asc" },
    }));

  if (!term) {
    throw new Error("TERM_NOT_FOUND");
  }

  return prisma.exam.create({
    data: {
      tenantId: params.tenantId,
      examScheduleId: schedule.id,
      termId: term.id,
      subjectId: params.subjectId,
      date: schedule.startDate,
      duration: 60,
      totalMarks: params.totalMarks,
      passingMarks: params.passingMarks,
    },
  });
}

export function computeStoredGrade(marksObtained: number, totalMarks: number, passingMarks: number) {
  if (totalMarks <= 0) {
    return "F";
  }

  const percentage = (marksObtained / totalMarks) * 100;
  const passingPercentage = (passingMarks / totalMarks) * 100;

  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= passingPercentage) return "D";
  return "F";
}
