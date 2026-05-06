import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";
import TeacherClassesClient from "./TeacherClassesClient";

export const metadata = { title: "My Classes | Teacher" };

export default async function TeacherClasses() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId = session.user?.id as string;

  const staff = await prisma.staff.findFirst({
    where: { tenantId, userId, deletedAt: null },
  });

  if (!staff) redirect("/login");

  // 1. Classes Today
  const dayOfWeek = new Date().getDay() - 1; 
  const classesToday = await prisma.timetableSlot.findMany({
    where: { tenantId, staffId: staff.id, dayOfWeek: dayOfWeek >= 0 && dayOfWeek <= 4 ? dayOfWeek : -1 },
    include: { section: { include: { grade: true } }, subject: true },
    orderBy: { startTime: 'asc' }
  });

  // 2. All assigned sections (Class Teacher or Subject Teacher)
  const sectionsAsClassTeacher = await prisma.section.findMany({
    where: { tenantId, classTeacherId: staff.id, deletedAt: null },
    select: { id: true }
  });

  const sectionsAsSubjectTeacher = await prisma.subjectAllocation.findMany({
    where: { tenantId, staffId: staff.id },
    select: { sectionId: true },
    distinct: ['sectionId']
  });

  const allSectionIds = Array.from(new Set([
    ...sectionsAsClassTeacher.map(s => s.id),
    ...sectionsAsSubjectTeacher.map(s => s.sectionId)
  ]));

  const roster = await prisma.section.findMany({
    where: { id: { in: allSectionIds } },
    include: {
      grade: true,
      enrollments: {
        where: { status: "ACTIVE" },
      },
      subjectAllocations: {
        where: { staffId: staff.id },
        include: { subject: true }
      }
    }
  });

  return (
    <>
      <style>{`
        /* Scope full-height layout to My Classes page only */
        .main-content { height: 100vh; overflow: hidden; }
        .page-body     { overflow: hidden; display: flex; flex-direction: column; height: calc(100vh - 64px); padding: 0; }
      `}</style>
      <Topbar title="My Assigned Classes" />
      <div className="page-body fade-up">
        <TeacherClassesClient
          classesToday={classesToday}
          roster={roster}
          staffId={staff.id}
        />
      </div>
    </>
  );
}
