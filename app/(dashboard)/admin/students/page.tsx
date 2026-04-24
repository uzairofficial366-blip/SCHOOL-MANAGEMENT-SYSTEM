import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "TEACHER"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  // Fetch real students from the database
  const students = await prisma.student.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      user: true,
      enrollments: {
        where: { academicYear: { isCurrent: true } },
        include: {
          section: {
            include: { grade: true }
          }
        }
      }
    },
    orderBy: { user: { name: 'asc' } }
  });

  return (
    <>
      <Topbar title="Students Directory" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Students" }]} />
      <div className="page-body fade-up">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>All Enrolled Students</h3>
            <button className="btn btn-primary btn-sm">+ Add New Student</button>
          </div>
          
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Admission No</th>
                  <th>Email</th>
                  <th>Current Grade/Section</th>
                  <th>Gender</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? students.map((student) => {
                  const enrollment = student.enrollments[0];
                  const gradeSection = enrollment 
                    ? `${enrollment.section.grade.name} - ${enrollment.section.name}` 
                    : "Not assigned";

                  return (
                    <tr key={student.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.8rem", background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>
                            {student.user.name.split(" ").map((n: string) => n[0]).join("").substring(0,2)}
                          </div>
                          <span style={{ fontWeight: 600 }}>{student.user.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace" }}>{student.admissionNo}</td>
                      <td style={{ color: "hsl(var(--text-muted))" }}>{student.user.email}</td>
                      <td>
                        <span className="badge" style={{ background: "hsl(var(--secondary)/0.1)", color: "hsl(var(--secondary))" }}>
                          {gradeSection}
                        </span>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{student.gender}</td>
                      <td>
                        <span className={`badge ${student.user.isActive ? 'badge-success' : 'badge-warning'}`}>
                          {student.user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--text-muted))" }}>
                      No students found in the database.
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
