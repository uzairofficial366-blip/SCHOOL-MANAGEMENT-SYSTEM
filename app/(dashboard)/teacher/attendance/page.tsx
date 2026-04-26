import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";
import TeacherAttendanceClient from "./TeacherAttendanceClient";

export const metadata = { title: "Attendance | Teacher" };

export default async function TeacherAttendance() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId = session.user?.id as string;

  const staff = await prisma.staff.findFirst({
    where: { tenantId, userId, deletedAt: null },
  });

  if (!staff) redirect("/login");

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
        include: { student: { include: { user: true } } }
      }
    }
  });

  return (
    <>
      <Topbar title="Attendance" />
      <TeacherAttendanceClient roster={roster} />
    </>
  );
}
