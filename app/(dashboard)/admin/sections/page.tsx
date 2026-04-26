import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import SectionsClient from "./SectionsClient";

export const metadata = { title: "Classes & Sections" };

export default async function SectionsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "TEACHER"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  // Fetch real sections from the database
  const sections = await prisma.section.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      grade: true,
      academicYear: true,
      _count: {
        select: { enrollments: { where: { status: "ACTIVE" } } }
      }
    },
    orderBy: [
      { grade: { level: 'asc' } },
      { name: 'asc' }
    ]
  });

  const staffIds = sections.map(s => s.classTeacherId).filter(Boolean) as string[];
  const classTeachers = await prisma.staff.findMany({
    where: { id: { in: staffIds } },
    include: { user: { select: { name: true } } }
  });
  
  const teacherMap = classTeachers.reduce((acc, t) => {
    acc[t.id] = t.user.name;
    return acc;
  }, {} as Record<string, string>);

  const initialSections = sections.map(s => ({
    id: s.id,
    name: s.name,
    capacity: s.capacity,
    gradeId: s.gradeId,
    academicYearId: s.academicYearId,
    classTeacherId: s.classTeacherId,
    grade: s.grade,
    academicYear: s.academicYear,
    _count: { enrollments: s._count.enrollments },
    classTeacherName: s.classTeacherId ? teacherMap[s.classTeacherId] : undefined
  }));

  const grades = await prisma.grade.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { level: 'asc' }
  });

  const academicYears = await prisma.academicYear.findMany({
    where: { tenantId }
  });

  const teachers = await prisma.staff.findMany({
    where: { tenantId, user: { role: "TEACHER" }, deletedAt: null },
    select: {
      id: true,
      user: {
        select: { name: true }
      }
    }
  });

  return (
    <>
      <Topbar title="Classes & Sections" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Sections" }]} />
      <div className="page-body fade-up">
        <SectionsClient 
          initialSections={initialSections} 
          grades={grades} 
          academicYears={academicYears} 
          teachers={teachers} 
        />
      </div>
    </>
  );
}
