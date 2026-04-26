import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import GradesClient from "./GradesClient";

export const metadata = { title: "Grades Management" };

export default async function GradesPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  const grades = await prisma.grade.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      _count: {
        select: { sections: { where: { deletedAt: null } } }
      }
    },
    orderBy: { level: 'asc' }
  });

  return (
    <>
      <Topbar title="Grades Management" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Grades" }]} />
      <div className="page-body fade-up">
        <GradesClient initialGrades={grades} />
      </div>
    </>
  );
}
