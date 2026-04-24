import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  // Fetch real data for the dashboard
  const [
    totalStudents,
    totalStaff,
    activeClasses,
    totalBooks
  ] = await Promise.all([
    prisma.student.count({ where: { tenantId, deletedAt: null } }),
    prisma.staff.count({ where: { tenantId, deletedAt: null } }),
    prisma.section.count({ where: { tenantId, deletedAt: null } }),
    prisma.book.count({ where: { tenantId, deletedAt: null } })
  ]);

  const recentAdmissions = await prisma.student.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { user: { createdAt: "desc" } },
    take: 5,
    include: {
      user: true,
      enrollments: {
        include: { section: { include: { grade: true } } }
      }
    }
  });

  const dashboardData = {
    totalStudents,
    totalStaff,
    activeClasses,
    totalBooks,
    recentAdmissions: recentAdmissions.map(s => ({
      name: s.user.name,
      grade: s.enrollments[0]?.section.grade.name || "N/A",
      date: s.user.createdAt.toLocaleDateString(),
      status: "Active"
    }))
  };

  return (
    <>
      <Topbar title="Admin Dashboard" breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]} />
      <div className="page-body">
        <AdminDashboard userName={session.user?.name ?? "Admin"} dbData={dashboardData} />
      </div>
    </>
  );
}
