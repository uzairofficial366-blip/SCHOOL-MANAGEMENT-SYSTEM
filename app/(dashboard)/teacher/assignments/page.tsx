import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";
import TeacherAssignmentsClient from "./TeacherAssignmentsClient";

export const metadata = { title: "Assignments | Teacher" };

export default async function TeacherAssignments() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId = session.user?.id as string;

  const staff = await prisma.staff.findFirst({
    where: { tenantId, userId, deletedAt: null },
  });

  if (!staff) redirect("/login");

  const assignments = await prisma.assignment.findMany({
    where: { tenantId, content: { uploadedById: userId } },
    include: { submissions: true, content: { include: { subject: true } } },
    orderBy: { dueDate: 'asc' },
    take: 10
  });

  const teacherSections = await prisma.timetableSlot.findMany({
    where: { tenantId, staffId: staff.id },
    select: { sectionId: true },
    distinct: ['sectionId']
  });
  const sectionIds = teacherSections.map(s => s.sectionId);
  const totalStudents = await prisma.enrollment.count({
    where: { tenantId, sectionId: { in: sectionIds }, status: "ACTIVE" }
  });

  return (
    <>
      <Topbar title="Assignments" />
      <TeacherAssignmentsClient assignments={assignments} totalStudents={totalStudents} />
    </>
  );
}
