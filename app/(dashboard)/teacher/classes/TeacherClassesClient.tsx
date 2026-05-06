"use client";

import { User, BookOpen, AlertTriangle } from "lucide-react";

export default function TeacherClassesClient({ classesToday, roster, staffId }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden", padding: "0.75rem 1.25rem", gap: "0.75rem" }}>

      {/* ── Page Header (fixed height) ── */}
      <div style={{ flexShrink: 0 }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.1rem" }} className="gradient-text">
          My Classes &amp; Schedule
        </h2>
        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem" }}>
          Manage your daily timetable and assigned sections.
        </p>
      </div>

      {/* ── Substitute Alert (fixed height, only if needed) ── */}
      <div className="card" style={{ flexShrink: 0, padding: "0.75rem 1rem", background: "linear-gradient(135deg, hsl(var(--warning)/0.1), hsl(var(--warning)/0.05))", border: "1px solid hsl(var(--warning)/0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ padding: "0.5rem", background: "hsl(var(--warning))", color: "white", borderRadius: "50%", flexShrink: 0 }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontWeight: 800, color: "hsl(var(--text))", fontSize: "0.95rem" }}>Substitute Alert</h3>
            <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem" }}>
              You have been assigned to cover <strong>Grade 10-A Biology</strong> at 11:30 AM (Room 204).
            </p>
          </div>
          <button className="btn btn-sm btn-primary" style={{ flexShrink: 0 }}>Acknowledge</button>
        </div>
      </div>

      {/* ── Scrollable Content Area ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", gap: "1rem" }}>

        {/* Left: My Sections grid */}
        <div style={{ flex: "0 0 65%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, flexShrink: 0 }}>My Sections</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {roster?.map((section: any) => {
              const isClassTeacher = section.classTeacherId === staffId;
              return (
                <div key={section.id} className="card" style={{ position: "relative", overflow: "hidden", borderTop: "3px solid hsl(var(--primary))", padding: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem", alignItems: "flex-start" }}>
                    <div>
                      <h4 style={{ fontWeight: 800, fontSize: "1rem" }}>{section.grade.name} - {section.name}</h4>
                      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                        {isClassTeacher && (
                          <span className="badge" style={{ background: "hsl(var(--success)/0.1)", color: "hsl(var(--success))", fontSize: "0.65rem" }}>Class Teacher</span>
                        )}
                        <span className="badge badge-info" style={{ fontSize: "0.65rem" }}>{section.enrollments.length} Students</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "0.5rem", marginBottom: "0.75rem" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "hsl(var(--text-muted))", marginBottom: "0.2rem" }}>TEACHING SUBJECTS:</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                      {section.subjectAllocations.map((a: any) => (
                        <span key={a.id} className="badge" style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", fontSize: "0.68rem" }}>
                          {a.subject.name}
                        </span>
                      ))}
                      {section.subjectAllocations.length === 0 && !isClassTeacher && (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>No subjects assigned</span>
                      )}
                      {section.subjectAllocations.length === 0 && isClassTeacher && (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>Admin role only</span>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", marginBottom: "0.75rem" }}>
                    Room: <strong>{section.roomNumber || section.room || "TBA"}</strong>
                  </p>

                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <a href={`/teacher/attendance?sectionId=${section.id}`} className="btn btn-sm btn-ghost" style={{ flex: 1, fontSize: "0.75rem" }}>
                      <User size={12} /> Attendance
                    </a>
                    <a href={`/teacher/gradebook?sectionId=${section.id}`} className="btn btn-sm btn-ghost" style={{ flex: 1, fontSize: "0.75rem" }}>
                      <BookOpen size={12} /> Grades
                    </a>
                  </div>
                </div>
              );
            })}
            {(!roster || roster.length === 0) && (
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem" }}>No sections assigned.</p>
            )}
          </div>
        </div>

        {/* Right: Active Timetable (Today) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, flexShrink: 0 }}>Active Timetable (Today)</h3>
          <div className="card" style={{ padding: 0, overflow: "hidden", flex: 1, minHeight: 0, overflowY: "auto" }}>
            {classesToday?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {classesToday.map((slot: any, idx: number) => {
                  const isNext = idx === 0;
                  return (
                    <div key={slot.id} style={{
                      display: "flex", alignItems: "center", padding: "0.85rem 1rem", gap: "1rem",
                      borderBottom: idx === classesToday.length - 1 ? "none" : "1px solid hsl(var(--border))",
                      background: isNext ? "hsl(var(--primary)/0.05)" : "transparent",
                      borderLeft: isNext ? "4px solid hsl(var(--primary))" : "4px solid transparent"
                    }}>
                      <div style={{ width: "80px", textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, color: isNext ? "hsl(var(--primary))" : "hsl(var(--text))", fontSize: "0.95rem" }}>{slot.startTime}</div>
                        <div style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>{slot.endTime}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          {slot.subject.name}
                          {isNext && <span className="badge badge-primary" style={{ fontSize: "0.65rem" }}>Up Next</span>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", marginTop: "0.1rem" }}>
                          {slot.section.grade.name} - {slot.section.name} • Room {slot.room || "TBA"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "hsl(var(--text-muted))", fontSize: "0.875rem" }}>
                No classes scheduled for today. Have a great day!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
