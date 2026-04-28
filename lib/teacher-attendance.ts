import { prisma } from "@/lib/db/prisma";
import { AttendanceStatus } from "@prisma/client";

export interface TeacherAttendanceSectionOption {
  sectionId: string;
  gradeId: string;
  gradeName: string;
  sectionName: string;
  label: string;
  studentCount: number;
}

export interface TeacherAttendanceRow {
  studentId: string;
  enrollmentId: string;
  studentName: string;
  admissionNo: string;
  rollNo: number | null;
  status: AttendanceStatus | null;
}

const DEFAULT_ATTENDANCE_CUTOFF_HOUR = 18;
const DEFAULT_ATTENDANCE_CUTOFF_MINUTE = 0;

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

function getLocalDateString(date: Date, timeZone: string) {
  const { year, month, day } = getTimeZoneParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getAttendanceDateInfo(
  timeZone: string,
  tenantSettings?: Record<string, any> | null,
  selectedDate?: string | null
) {
  const today = getLocalDateString(new Date(), timeZone);
  const targetDate = selectedDate || today;
  const cutoffHour = Number(
    tenantSettings?.attendanceCutoffHour ?? DEFAULT_ATTENDANCE_CUTOFF_HOUR
  );
  const cutoffMinute = Number(
    tenantSettings?.attendanceCutoffMinute ?? DEFAULT_ATTENDANCE_CUTOFF_MINUTE
  );

  const nowParts = getTimeZoneParts(new Date(), timeZone);
  const isFuture = targetDate > today;
  const isPast = targetDate < today;
  const isAfterCutoff =
    targetDate === today &&
    (nowParts.hour > cutoffHour ||
      (nowParts.hour === cutoffHour && nowParts.minute > cutoffMinute));

  let editable = false;
  let reason = "";

  if (isFuture) {
    reason = "Attendance cannot be marked for future dates.";
  } else if (isPast) {
    reason = "Past attendance is read-only for teachers and requires admin intervention.";
  } else if (isAfterCutoff) {
    reason = "Today's attendance is locked after the school-day cutoff and now requires admin intervention.";
  } else {
    editable = true;
    reason = "Today's attendance is editable until the end-of-day cutoff.";
  }

  return {
    today,
    targetDate,
    editable,
    reason,
    cutoffHour,
    cutoffMinute,
  };
}

export function toAttendanceDate(selectedDate: string) {
  return new Date(`${selectedDate}T00:00:00.000Z`);
}

export async function getTeacherAttendanceScope(tenantId: string, userId: string) {
  const staff = await prisma.staff.findFirst({
    where: { tenantId, userId, deletedAt: null },
  });

  if (!staff) {
    return {
      staff: null,
      sections: [],
      tenant: null,
    };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      timezone: true,
      settings: true,
    },
  });

  const sections = await prisma.section.findMany({
    where: {
      tenantId,
      deletedAt: null,
      OR: [
        { classTeacherId: staff.id },
        { subjectAllocations: { some: { staffId: staff.id } } },
      ],
    },
    include: {
      grade: {
        select: {
          id: true,
          name: true,
          level: true,
        },
      },
      _count: {
        select: {
          enrollments: {
            where: {
              status: "ACTIVE",
            },
          },
        },
      },
    },
    orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
  });

  return {
    staff,
    tenant,
    sections: sections.map<TeacherAttendanceSectionOption>((section) => ({
      sectionId: section.id,
      gradeId: section.grade.id,
      gradeName: section.grade.name,
      sectionName: section.name,
      label: `${section.grade.name} - ${section.name}`,
      studentCount: section._count.enrollments,
    })),
  };
}

export async function assertTeacherSectionAttendanceAccess(
  tenantId: string,
  staffId: string,
  sectionId: string
) {
  const section = await prisma.section.findFirst({
    where: {
      tenantId,
      id: sectionId,
      deletedAt: null,
      OR: [
        { classTeacherId: staffId },
        { subjectAllocations: { some: { staffId } } },
      ],
    },
    include: {
      grade: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!section) {
    throw new Error("FORBIDDEN_SECTION");
  }

  return section;
}

export async function getTeacherAttendanceView(params: {
  tenantId: string;
  staffId: string;
  sectionId: string;
  selectedDate: string;
  timeZone: string;
  tenantSettings?: Record<string, any> | null;
}) {
  const section = await assertTeacherSectionAttendanceAccess(
    params.tenantId,
    params.staffId,
    params.sectionId
  );

  const dateInfo = getAttendanceDateInfo(
    params.timeZone,
    params.tenantSettings,
    params.selectedDate
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
    orderBy: [{ rollNo: "asc" }, { student: { admissionNo: "asc" } }],
  });

  const records = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: params.tenantId,
      sectionId: params.sectionId,
      date: toAttendanceDate(dateInfo.targetDate),
      period: null,
    },
    select: {
      id: true,
      studentId: true,
      status: true,
    },
  });

  const recordMap = new Map(records.map((record) => [record.studentId, record]));

  const rows = enrollments.map<TeacherAttendanceRow>((enrollment) => {
    const existing = recordMap.get(enrollment.studentId);
    return {
      studentId: enrollment.studentId,
      enrollmentId: enrollment.id,
      studentName: enrollment.student.user.name,
      admissionNo: enrollment.student.admissionNo,
      rollNo: enrollment.rollNo ?? null,
      status: existing?.status ?? (dateInfo.editable ? AttendanceStatus.PRESENT : null),
    };
  });

  return {
    section: {
      id: section.id,
      gradeId: section.grade.id,
      gradeName: section.grade.name,
      sectionName: section.name,
      label: `${section.grade.name} - ${section.name}`,
    },
    dateInfo,
    hasSubmittedRecords: records.length > 0,
    rows,
  };
}
