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

  // 2. Sections
  const teacherSections = await prisma.timetableSlot.findMany({
    where: { tenantId, staffId: staff.id },
    select: { sectionId: true },
    distinct: ['sectionId']
  });
  const sectionIds = teacherSections.map(s => s.sectionId);

  const roster = await prisma.section.findMany({
    where: { id: { in: sectionIds } },
    include: {
      grade: true,
      enrollments: {
        where: { status: "ACTIVE" },
      }
    }
  });

  return (
    <>
      <Topbar title="My Classes" />
      <TeacherClassesClient classesToday={classesToday} roster={roster} />
    </>
  );
}
