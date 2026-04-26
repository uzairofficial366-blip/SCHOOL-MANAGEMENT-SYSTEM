import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";
import AddStaffModal from "@/components/staff/AddStaffModal";

export const metadata = { title: "Staff Directory" };

export default async function StaffPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  // Fetch real staff from the database
  const staffList = await prisma.staff.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      user: true,
    },
    orderBy: { user: { name: 'asc' } }
  });

  return (
    <>
      <Topbar title="Staff Directory" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Staff" }]} />
      <div className="page-body fade-up">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>All Teaching & Non-Teaching Staff</h3>
            <AddStaffModal />
          </div>
          
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Email</th>
                  <th>Subject</th>
                  {/* <th>Designation</th> */}
                  <th>Role Type</th>
                </tr>
              </thead>
              <tbody>
                {staffList.length > 0 ? staffList.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.8rem", background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>
                          {staff.user.name.split(" ").map((n: string) => n[0]).join("").substring(0,2)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{staff.user.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace" }}>{staff.employeeId}</td>
                    <td style={{ color: "hsl(var(--text-muted))" }}>{staff.user.email}</td>
                    <td>{staff.department || "-"}</td>
                    {/* <td>{staff.designation || "-"}</td> */}
                    <td>
                      <span className="badge" style={{ background: "hsl(var(--accent)/0.1)", color: "hsl(var(--accent))" }}>
                        {staff.user.role}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--text-muted))" }}>
                      No staff found in the database.
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
