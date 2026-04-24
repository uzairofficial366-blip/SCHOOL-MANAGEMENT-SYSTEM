import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Classes & Sections" };

export default async function SectionsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "TEACHER"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  const tenantId = session.user?.tenantId as string;

  // Fetch real sections from the database
  const sections = await prisma.section.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      grade: true,
      _count: {
        select: { enrollments: { where: { status: "ACTIVE" } } }
      }
    },
    orderBy: [
      { grade: { level: 'asc' } },
      { name: 'asc' }
    ]
  });

  // Fetch staff separately to map class teachers since the relation isn't in schema
  const staffIds = sections.map(s => s.classTeacherId).filter(Boolean) as string[];
  const staffList = await prisma.staff.findMany({
    where: { id: { in: staffIds } },
    include: { user: true }
  });
  
  const staffMap = new Map(staffList.map(s => [s.id, s]));

  return (
    <>
      <Topbar title="Classes & Sections" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Sections" }]} />
      <div className="page-body fade-up">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Active Classes</h3>
            <button className="btn btn-primary btn-sm">+ Add New Section</button>
          </div>
          
          <div className="grid-4">
            {sections.length > 0 ? sections.map((section) => {
              const occupancyRate = (section._count.enrollments / section.capacity) * 100;
              const isFull = occupancyRate >= 100;
              const classTeacher = section.classTeacherId ? staffMap.get(section.classTeacherId) : null;

              return (
                <div key={section.id} className="card" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", fontWeight: 600 }}>{section.grade.name}</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>Section {section.name}</div>
                    </div>
                    <span className="badge badge-primary">{section._count.enrollments} Students</span>
                  </div>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", marginBottom: "0.25rem" }}>Class Teacher</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="avatar" style={{ width: 24, height: 24, fontSize: "0.6rem" }}>
                        {classTeacher?.user.name.split(" ").map((n: string) => n[0]).join("").substring(0,2) || "?"}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{classTeacher?.user.name || "Unassigned"}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      <span style={{ color: "hsl(var(--text-muted))" }}>Capacity ({section.capacity})</span>
                      <span style={{ fontWeight: 600, color: isFull ? "hsl(var(--danger))" : "inherit" }}>
                        {occupancyRate.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "hsl(var(--border))", borderRadius: "3px", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          height: "100%", 
                          width: `${Math.min(occupancyRate, 100)}%`, 
                          background: isFull ? "hsl(var(--danger))" : "hsl(var(--primary))",
                          borderRadius: "3px"
                        }} 
                      />
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "hsl(var(--text-muted))", border: "1px dashed hsl(var(--border))", borderRadius: "12px" }}>
                No active classes or sections found in the database.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
