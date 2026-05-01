import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Fee Structure Management" };

export default async function FeeStructurePage() {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  const feeStructures = await prisma.feeStructure.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Topbar title="Fee Structure Management" breadcrumbs={[{ label: "Home" }, { label: "Accountant", href: "/accountant" }, { label: "Fee Structure" }]} />
      <div className="page-body fade-up">
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1.2rem" }}>Fee Structures</h3>
            <p style={{ marginTop: "0.35rem", color: "hsl(var(--text-muted))" }}>
              Manage fee structures for the school.
            </p>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Due Day</th>
                  <th>Late Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeStructures.map((fee) => (
                  <tr key={fee.id}>
                    <td>{fee.name}</td>
                    <td>${Number(fee.amount)}</td>
                    <td>{fee.frequency}</td>
                    <td>{fee.dueDay}</td>
                    <td>${Number(fee.lateFee)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm">Edit</button>
                    </td>
                  </tr>
                ))}
                {feeStructures.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--text-muted))" }}>
                      No fee structures found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}