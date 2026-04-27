import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";
import AssignmentsClient from "./AssignmentsClient";

export const metadata = { title: "Class Assignment | Admin" };

export default async function AssignmentsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  const [sections, subjects, staff] = await Promise.all([
    prisma.section.findMany({
      where: { tenantId, deletedAt: null },
      include: { 
        grade: true, 
        academicYear: true,
        subjectAllocations: {
          include: {
            subject: true,
            staff: { include: { user: true } }
          }
        }
      },
      orderBy: [
        { grade: { level: 'asc' } },
        { name: 'asc' }
      ]
    }),
    prisma.subject.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' }
    }),
    prisma.staff.findMany({
      where: { tenantId, deletedAt: null },
      include: { user: true },
      orderBy: { user: { name: 'asc' } }
    })
  ]);

  return (
    <>
      <Topbar title="Class Assignment & Teacher Allocation" />
      <div className="page-body fade-up">
        <AssignmentsClient 
          initialSections={sections} 
          subjects={subjects} 
          staff={staff} 
        />
      </div>
    </>
  );
}
