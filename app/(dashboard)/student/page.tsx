import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";
import StudentDashboardClient from "./StudentDashboardClient";

export const metadata = { title: "Student Dashboard" };

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;
  const userId = session.user?.id as string;

  // 1. Get Student and active enrollment
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          section: {
            include: { grade: true }
          }
        }
      }
    }
  });

  if (!student) redirect("/login");

  const enrollment = student.enrollments[0];
  
  // 2. Get Classes Today
  const dayOfWeek = new Date().getDay() - 1; // 0=Mon, 1=Tue...
  const classesToday = enrollment ? await prisma.timetableSlot.findMany({
    where: { 
      tenantId, 
      sectionId: enrollment.sectionId, 
      dayOfWeek: dayOfWeek >= 0 && dayOfWeek <= 5 ? dayOfWeek : -1 
    },
    include: { subject: true, staff: { include: { user: true } } },
    orderBy: { startTime: 'asc' }
  }) : [];

  // 3. Get Announcements
  const announcementsRaw = await prisma.announcement.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // Filter announcements for students
  const announcements = announcementsRaw.filter(ann => {
    const roles = JSON.parse(ann.targetRoles as string);
    return Array.isArray(roles) && roles.includes("STUDENT");
  });

  return (
    <>
      <Topbar title="Dashboard" breadcrumbs={[{ label: "Home" }, { label: "Student" }, { label: "Dashboard" }]} />
      <StudentDashboardClient 
        student={student}
        enrollment={enrollment}
        classesToday={classesToday}
        announcements={announcements}
      />
    </>
  );
}
