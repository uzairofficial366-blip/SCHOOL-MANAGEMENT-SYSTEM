import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import DmcAdminClient from "./DmcAdminClient";

export const metadata = { title: "DMC / Result Card" };

export default async function DmcPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  const [grades, sections, examSchedules] = await Promise.all([
    prisma.grade.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { level: "asc" },
      select: { id: true, name: true, level: true },
    }),
    prisma.section.findMany({
      where: { tenantId, deletedAt: null },
      include: { grade: { select: { name: true, level: true } } },
      orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
    }),
    prisma.examSchedule.findMany({
      where: { tenantId },
      include: { academicYear: { select: { name: true } } },
      orderBy: { startDate: "desc" },
    }),
  ]);

  return (
    <>
      <Topbar
        title="DMC / Result Card"
        breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "DMC / Result Card" }]}
      />
      <div className="page-body fade-up">
        <DmcAdminClient
          grades={JSON.parse(JSON.stringify(grades))}
          sections={JSON.parse(JSON.stringify(sections))}
          examSchedules={JSON.parse(JSON.stringify(examSchedules))}
        />
      </div>
    </>
  );
}
