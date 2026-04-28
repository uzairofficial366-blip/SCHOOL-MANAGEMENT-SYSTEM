import { AttendanceStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import {
  getTeacherAttendanceScope,
  getTeacherAttendanceView,
  getAttendanceDateInfo,
  toAttendanceDate,
} from "@/lib/teacher-attendance";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set<AttendanceStatus>([
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.EXCUSED,
  AttendanceStatus.LATE,
]);

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
    const selectedDate = searchParams.get("date");

    const scope = await getTeacherAttendanceScope(tenantId, userId);
    if (!scope.staff) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const timeZone = scope.tenant?.timezone || "UTC";
    const tenantSettings =
      scope.tenant?.settings && typeof scope.tenant.settings === "object"
        ? (scope.tenant.settings as Record<string, any>)
        : {};

    const dateInfo = getAttendanceDateInfo(timeZone, tenantSettings, selectedDate);

    let view = null;
    if (sectionId) {
      try {
        view = await getTeacherAttendanceView({
          tenantId,
          staffId: scope.staff.id,
          sectionId,
          selectedDate: dateInfo.targetDate,
          timeZone,
          tenantSettings,
        });
      } catch (error: any) {
        if (error.message === "FORBIDDEN_SECTION") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        throw error;
      }
    }

    return NextResponse.json({
      sections: scope.sections,
      timeZone,
      dateInfo,
      view,
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
    const { sectionId, date, records } = body ?? {};

    if (!sectionId || !date) {
      return NextResponse.json({ error: "sectionId and date are required" }, { status: 400 });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "records array is required" }, { status: 400 });
    }

    const scope = await getTeacherAttendanceScope(tenantId, userId);
    if (!scope.staff) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const section = scope.sections.find((entry) => entry.sectionId === sectionId);
    if (!section) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const timeZone = scope.tenant?.timezone || "UTC";
    const tenantSettings =
      scope.tenant?.settings && typeof scope.tenant.settings === "object"
        ? (scope.tenant.settings as Record<string, any>)
        : {};

    const dateInfo = getAttendanceDateInfo(timeZone, tenantSettings, date);
    if (!dateInfo.editable) {
      return NextResponse.json({ error: dateInfo.reason }, { status: 403 });
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
    if (allowedStudentIds.size === 0) {
      return NextResponse.json({ error: "No active students found for this section" }, { status: 400 });
    }

    for (const record of records) {
      if (!record?.studentId || !allowedStudentIds.has(record.studentId)) {
        return NextResponse.json(
          { error: "One or more students are outside your assigned roster" },
          { status: 403 }
        );
      }

      if (!ALLOWED_STATUSES.has(record.status)) {
        return NextResponse.json(
          { error: "One or more attendance statuses are invalid" },
          { status: 400 }
        );
      }
    }

    const normalizedDate = toAttendanceDate(dateInfo.targetDate);
    const savedCount = await prisma.$transaction(async (tx) => {
      await tx.attendanceRecord.deleteMany({
        where: {
          tenantId,
          sectionId,
          studentId: { in: Array.from(allowedStudentIds) },
          date: normalizedDate,
          period: null,
        },
      });

      const createResult = await tx.attendanceRecord.createMany({
        data: records.map((record: { studentId: string; status: AttendanceStatus }) => ({
          tenantId,
          studentId: record.studentId,
          sectionId,
          takenById: scope.staff!.id,
          date: normalizedDate,
          period: null,
          status: record.status,
        })),
      });

      return createResult.count;
    });

    return NextResponse.json({
      success: true,
      count: savedCount,
      date: dateInfo.targetDate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
