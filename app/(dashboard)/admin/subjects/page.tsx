import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import SubjectsClient from "./SubjectsClient";

export const metadata = { title: "Subjects Management" };

export default async function SubjectsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  const subjects = await prisma.subject.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      allocations: {
        include: {
          section: { include: { grade: true } },
          staff: { include: { user: true } }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  const sections = await prisma.section.findMany({
    where: { tenantId, deletedAt: null },
    include: { grade: true },
    orderBy: [{ grade: { level: 'asc' } }, { name: 'asc' }]
  });

  const staff = await prisma.staff.findMany({
    where: { tenantId, deletedAt: null, user: { role: 'TEACHER' } },
    include: { user: true },
    orderBy: { user: { name: 'asc' } }
  });

  return (
    <>
      <Topbar title="Subjects Management" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Subjects" }]} />
      <div className="page-body fade-up">
        <SubjectsClient initialSubjects={subjects} sections={sections} staff={staff} />
      </div>
    </>
  );
}
