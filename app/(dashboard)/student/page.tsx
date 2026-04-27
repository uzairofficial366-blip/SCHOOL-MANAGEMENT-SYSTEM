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
  const userId = (session.user as any)?.id as string;

  if (!userId) {
    // If ID is missing, the session might be stale. Force re-login.
    redirect("/login?error=SessionExpired");
  }

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

  if (!enrollment) {
    return (
      <>
        <Topbar title="Dashboard" breadcrumbs={[{ label: "Home" }, { label: "Student" }, { label: "Dashboard" }]} />
        <div className="page-body fade-up" style={{ padding: "2rem" }}>
          <div className="card glass" style={{ textAlign: "center", padding: "4rem" }}>
            <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "1rem" }}>Welcome, {student.user.name}</h2>
            <p style={{ color: "var(--text-muted)" }}>You do not have an active enrollment for the current term.</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>Please contact the administration to complete your enrollment.</p>
          </div>
        </div>
      </>
    );
  }
  
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
    if (!ann.targetRoles) return false;
    try {
      const roles = typeof ann.targetRoles === 'string' && ann.targetRoles.startsWith('[') 
        ? JSON.parse(ann.targetRoles) 
        : (ann.targetRoles as string).split(',');
      return Array.isArray(roles) && roles.map(r => r.trim()).includes("STUDENT");
    } catch (e) {
      console.error("Error parsing targetRoles:", ann.targetRoles);
      return false;
    }
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
