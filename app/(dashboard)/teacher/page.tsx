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

  // Pending Assignments to Grade
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

  // Announcements
  const announcements = await prisma.announcement.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Classes Today
  const dayOfWeek = new Date().getDay() - 1; // 0=Mon
  const classesToday = await prisma.timetableSlot.findMany({
    where: { 
      tenantId, 
      staffId: staff.id, 
      dayOfWeek: dayOfWeek >= 0 && dayOfWeek <= 5 ? dayOfWeek : -1 
    },
    include: { section: { include: { grade: true } }, subject: true },
    orderBy: { startTime: 'asc' }
  });

  return (
    <>
      <Topbar title="Teacher Dashboard" />
      <TeacherDashboardClient 
        staff={staff}
        pendingGrades={pendingGrades}
        announcements={announcements}
        classesToday={classesToday}
        tenantId={tenantId}
      />
    </>
  );
}
