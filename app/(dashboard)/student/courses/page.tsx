import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";

export const metadata = { title: "My Courses | Student" };

export default async function StudentCourses() {
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId = session.user?.id as string;

  // 1. Get Student and active enrollment
  const student = await prisma.student.findFirst({
    where: { tenantId, userId, deletedAt: null },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          section: {
            include: {
              grade: true,
              subjectAllocations: {
                include: {
                  subject: true,
                  staff: { include: { user: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!student || student.enrollments.length === 0) {
    return (
      <>
        <Topbar title="My Courses" />
        <div className="page-body fade-up">
          <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
            <h3 style={{ fontWeight: 700 }}>No Active Enrollment</h3>
            <p style={{ color: "var(--text-muted)" }}>You are not currently enrolled in any class.</p>
          </div>
        </div>
      </>
    );
  }

  const enrollment = student.enrollments[0];
  const section = enrollment.section;
  const subjects = section.subjectAllocations;

  return (
    <>
      <Topbar title="My Courses" />
      <div className="page-body fade-up">
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>{section.grade.name} - {section.name}</h2>
          <p style={{ color: "var(--text-muted)" }}>Academic Year: {enrollment.academicYearId} • Your Roll No: {enrollment.rollNo || "N/A"}</p>
        </div>

        <div className="grid-3">
          {subjects.map((alloc) => (
            <div key={alloc.id} className="card hover-lift" style={{ borderLeft: "5px solid hsl(var(--primary))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span className="badge" style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>
                  {alloc.subject.code}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {alloc.subject.creditHours} Credits
                </span>
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.5rem" }}>{alloc.subject.name}</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                {alloc.subject.description || "No description available."}
              </p>
              
              <div style={{ padding: "1rem", background: "hsl(var(--bg-muted))", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "hsl(var(--primary))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem" }}>
                  {alloc.staff.user.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>INSTRUCTOR</div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{alloc.staff.user.name}</div>
                </div>
              </div>
              <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "hsl(var(--primary))", fontWeight: 600 }}>
                This subject is taught by {alloc.staff.user.name}
              </p>
            </div>
          ))}

          {subjects.length === 0 && (
            <div className="card" style={{ gridColumn: "span 3", textAlign: "center", padding: "3rem" }}>
              <p style={{ color: "var(--text-muted)" }}>No subjects allocated to your section yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
