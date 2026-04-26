import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";
import TeacherDashboardClient from "./TeacherDashboardClient";

export const metadata = { title: "Teacher Dashboard" };

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId = session.user?.id as string;

  const staff = await prisma.staff.findFirst({
    where: { tenantId, userId, deletedAt: null },
    include: { user: true }
  });

  if (!staff) {
    return (
      <>
        <Topbar title="Teacher Dashboard" />
        <div className="page-body fade-up">
          <div className="card">Teacher profile not found. Please contact administrator.</div>
        </div>
      </>
    );
  }

  // 1. Classes Today (dayOfWeek 0=Mon, 1=Tue etc...)
  const dayOfWeek = new Date().getDay() - 1; 
  const classesToday = await prisma.timetableSlot.findMany({
    where: { tenantId, staffId: staff.id, dayOfWeek: dayOfWeek >= 0 && dayOfWeek <= 4 ? dayOfWeek : -1 },
    include: { section: { include: { grade: true } }, subject: true },
    orderBy: { startTime: 'asc' }
  });

  // 2. Pending Assignments to Grade
  const pendingGrades = await prisma.submission.count({
    where: {
      tenantId,
      marksObtained: null,
      assignment: {
        content: {
          uploadedById: userId
        }
      }
    }
  });

  // 3. Total Students
  const teacherSections = await prisma.timetableSlot.findMany({
    where: { tenantId, staffId: staff.id },
    select: { sectionId: true },
    distinct: ['sectionId']
  });
  const sectionIds = teacherSections.map(s => s.sectionId);
  const totalStudents = await prisma.enrollment.count({
    where: { tenantId, sectionId: { in: sectionIds }, status: "ACTIVE" }
  });

  // Announcements
  const announcements = await prisma.announcement.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Students in sections (for Roster & Attendance)
  const roster = await prisma.section.findMany({
    where: { id: { in: sectionIds } },
    include: {
      grade: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: { include: { user: true } } }
      }
    }
  });

  return (
    <>
      <Topbar title="Teacher Dashboard" />
      <TeacherDashboardClient 
        staff={staff}
        classesToday={classesToday}
        pendingGrades={pendingGrades}
        totalStudents={totalStudents}
        announcements={announcements}
        roster={roster}
        tenantId={tenantId}
      />
    </>
  );
}
