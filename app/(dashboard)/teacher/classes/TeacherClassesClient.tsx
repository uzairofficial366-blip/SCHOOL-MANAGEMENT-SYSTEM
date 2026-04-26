"use client";

import { User, BookOpen, AlertTriangle } from "lucide-react";

export default function TeacherClassesClient({ classesToday, roster }: any) {
  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }} className="gradient-text">
          My Classes & Schedule
        </h2>
        <p style={{ color: "hsl(var(--text-muted))" }}>Manage your daily timetable and assigned sections.</p>
      </div>

      <div className="grid-4">
        <div style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Substitute Alerts */}
          <div className="card" style={{ background: "linear-gradient(135deg, hsl(var(--warning)/0.1), hsl(var(--warning)/0.05))", border: "1px solid hsl(var(--warning)/0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ padding: "0.75rem", background: "hsl(var(--warning))", color: "white", borderRadius: "50%" }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, color: "hsl(var(--text))", fontSize: "1.1rem" }}>Substitute Alert</h3>
                <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem" }}>You have been assigned to cover <strong>Grade 10-A Biology</strong> at 11:30 AM (Room 204).</p>
              </div>
              <button className="btn btn-primary" style={{ marginLeft: "auto" }}>Acknowledge</button>
            </div>
          </div>

          {/* Class Cards */}
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>My Sections</h3>
          <div className="grid-3">
            {roster?.map((section: any) => (
              <div key={section.id} className="card" style={{ position: "relative", overflow: "hidden", borderTop: "4px solid hsl(var(--primary))" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h4 style={{ fontWeight: 800, fontSize: "1.2rem" }}>{section.grade.name} - {section.name}</h4>
                  <span className="badge badge-info">{section.enrollments.length} Students</span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))", marginBottom: "1.5rem" }}>
                  Room: <strong>{section.room || "TBA"}</strong>
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <a href="/teacher/attendance" className="btn btn-sm btn-ghost" style={{ flex: 1 }}><User size={14} /> Attendance</a>
                  <a href="/teacher/gradebook" className="btn btn-sm btn-ghost" style={{ flex: 1 }}><BookOpen size={14} /> Grades</a>
                </div>
              </div>
            ))}
            {(!roster || roster.length === 0) && <p style={{ color: "hsl(var(--text-muted))" }}>No sections assigned.</p>}
          </div>

          {/* Active Timetable */}
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "1rem" }}>Active Timetable (Today)</h3>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {classesToday?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {classesToday.map((slot: any, idx: number) => {
                  const isNext = idx === 0; // Fake logic for "Next Class"
                  return (
                    <div key={slot.id} style={{ 
                      display: "flex", alignItems: "center", padding: "1.25rem", gap: "1.5rem",
                      borderBottom: idx === classesToday.length - 1 ? "none" : "1px solid hsl(var(--border))",
                      background: isNext ? "hsl(var(--primary)/0.05)" : "transparent",
                      borderLeft: isNext ? "4px solid hsl(var(--primary))" : "4px solid transparent"
                    }}>
                      <div style={{ width: "100px", textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: isNext ? "hsl(var(--primary))" : "hsl(var(--text))", fontSize: "1.1rem" }}>{slot.startTime}</div>
                        <div style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>{slot.endTime}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{slot.subject.name} {isNext && <span className="badge badge-primary" style={{ marginLeft: "0.5rem" }}>Up Next</span>}</div>
                        <div style={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>
                          {slot.section.grade.name} - {slot.section.name} • Room {slot.room || "TBA"}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
                No classes scheduled for today. Have a great day!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
