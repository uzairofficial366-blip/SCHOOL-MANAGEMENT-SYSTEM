import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import FeeManagementClient from "./FeeManagementClient";

export const metadata = { title: "Student Fee Management" };

export default async function FeesAdminPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  const feeStructures = await prisma.feeStructure.findMany({
    where: { tenantId, deletedAt: null },
    include: { grade: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Topbar title="Fee Management" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Fees" }]} />
      <div className="page-body fade-up">
        <FeeManagementClient feeStructures={feeStructures.map(f => ({ ...f, amount: Number(f.amount), gradeName: f.grade?.name ?? null }))} />
      </div>
    </>
  );
}
