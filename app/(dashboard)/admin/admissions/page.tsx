import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import AdmissionsDashboard from "@/components/admissions/AdmissionsDashboard";

export const metadata = { title: "Admission Management" };

export default async function AdmissionsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  // Fetch all data in parallel
  const [
    cycles,
    applications,
    academicYears,
    grades,
  ] = await Promise.all([
    prisma.admissionCycle.findMany({
      where: { tenantId },
      include: {
        academicYear: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.admissionApplication.findMany({
      where: { tenantId },
      include: {
        cycle: { select: { name: true, status: true } },
        documents: { select: { id: true, docType: true, status: true } },
        reviews: {
          select: { id: true, decision: true, completedAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        fees: { select: { id: true, status: true, amount: true, amountPaid: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.academicYear.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
    }),
    prisma.grade.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { level: "asc" },
    }),
  ]);

  // Compute stats
  const totalApplications = applications.length;
  const statusCounts = {
    DRAFT: 0, SUBMITTED: 0, UNDER_REVIEW: 0, APPROVED: 0,
    REJECTED: 0, WAITLISTED: 0, ENROLLED: 0, WITHDRAWN: 0,
  };
  applications.forEach((a) => {
    if (a.status in statusCounts) statusCounts[a.status as keyof typeof statusCounts]++;
  });

  const activeCycles = cycles.filter((c) => c.status === "OPEN");
  const totalSeats = activeCycles.reduce((s, c) => s + c.totalSeats, 0);
  const filledSeats = activeCycles.reduce((s, c) => s + c.filledSeats, 0);

  // Approval rate
  const decided = statusCounts.APPROVED + statusCounts.REJECTED;
  const approvalRate = decided > 0 ? Math.round((statusCounts.APPROVED / decided) * 100) : 0;

  // Serialize dates for client
  const serializedCycles = cycles.map((c) => ({
    ...c,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    academicYear: {
      ...c.academicYear,
      startDate: c.academicYear.startDate.toISOString(),
      endDate: c.academicYear.endDate.toISOString(),
      createdAt: c.academicYear.createdAt.toISOString(),
    },
  }));

  const serializedApplications = applications.map((a) => ({
    ...a,
    dateOfBirth: a.dateOfBirth?.toISOString() || null,
    submittedAt: a.submittedAt?.toISOString() || null,
    approvedAt: a.approvedAt?.toISOString() || null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    fees: a.fees.map((f) => ({
      ...f,
      amount: Number(f.amount),
      amountPaid: Number(f.amountPaid),
    })),
  }));

  const serializedAcademicYears = academicYears.map((ay) => ({
    ...ay,
    startDate: ay.startDate.toISOString(),
    endDate: ay.endDate.toISOString(),
    createdAt: ay.createdAt.toISOString(),
  }));

  return (
    <>
      <Topbar
        title="Admission Management"
        breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Admissions" }]}
      />
      <div className="page-body">
        <AdmissionsDashboard
          cycles={serializedCycles}
          applications={serializedApplications}
          academicYears={serializedAcademicYears}
          grades={grades}
          stats={{
            totalApplications,
            statusCounts,
            activeCycles: activeCycles.length,
            totalSeats,
            filledSeats,
            approvalRate,
          }}
        />
      </div>
    </>
  );
}
