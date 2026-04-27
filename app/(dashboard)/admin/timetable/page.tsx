import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import TimetableAdminClient from "./TimetableAdminClient";

export const metadata = { title: "Timetable Management" };

export default async function TimetablePage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  const sections = await prisma.section.findMany({
    where: { tenantId, deletedAt: null },
    include: { grade: true },
    orderBy: [{ grade: { level: 'asc' } }, { name: 'asc' }]
  });

  const subjects = await prisma.subject.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: 'asc' }
  });

  const staff = await prisma.staff.findMany({
    where: { tenantId, deletedAt: null, user: { role: 'TEACHER' } },
    include: { user: true },
    orderBy: { user: { name: 'asc' } }
  });

  return (
    <>
      <Topbar title="Timetable Management" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Timetable" }]} />
      <div className="page-body fade-up">
        <TimetableAdminClient sections={sections} subjects={subjects} staff={staff} />
      </div>
    </>
  );
}
