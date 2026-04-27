import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import ResultsAdminClient from "./ResultsAdminClient";

export const metadata = { title: "Student Results" };

export default async function ResultsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  const [grades, sections] = await Promise.all([
    prisma.grade.findMany({
      where: { tenantId },
      orderBy: { level: "asc" },
    }),
    prisma.section.findMany({
      where: { tenantId, deletedAt: null },
      include: { grade: true },
      orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
    }),
  ]);

  return (
    <>
      <Topbar
        title="Student Results"
        breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Results" }]}
      />
      <div className="page-body fade-up">
        <ResultsAdminClient grades={grades} sections={sections} />
      </div>
    </>
  );
}
