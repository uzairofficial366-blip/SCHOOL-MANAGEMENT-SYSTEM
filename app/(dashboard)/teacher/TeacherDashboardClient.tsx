"use client";

import { useState } from "react";
import { User, BookOpen, CheckSquare, Clock, AlertCircle, ChevronRight, Check } from "lucide-react";

export default function TeacherDashboardClient({ 
  staff, classesToday, pendingGrades, totalStudents, announcements, roster, tenantId 
}: any) {
  const [activeTab, setActiveTab] = useState<"overview" | "roster" | "gradebook">("overview");

  return (
    <div className="page-body fade-up">
      <div className="dashboard-header card glass" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Welcome back, {staff.user.name}</h2>
          <p style={{ color: "hsl(var(--text-muted))" }}>Here is your overview for today.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", background: "hsl(var(--background))", padding: "0.5rem", borderRadius: "1rem" }}>
          {(["overview", "roster", "gradebook"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontWeight: 600,
                textTransform: "capitalize",
                background: activeTab === tab ? "hsl(var(--primary))" : "transparent",
                color: activeTab === tab ? "white" : "hsl(var(--text-muted))",
                transition: "all 0.2s ease"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* WIDGETS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
              <div className="card stat-card" style={{ background: "linear-gradient(135deg, hsl(230 80% 60%), hsl(230 80% 50%))", color: "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ padding: "0.75rem", background: "white", color: "hsl(230 80% 50%)", borderRadius: "0.75rem" }}>
                    <BookOpen size={20} />
                  </div>
                  <span style={{ fontWeight: 600, opacity: 0.9 }}>Classes Today</span>
                </div>
                <h3 style={{ fontSize: "2rem", fontWeight: 800 }}>{classesToday.length}</h3>
              </div>

              <div className="card stat-card" style={{ background: "linear-gradient(135deg, hsl(280 80% 60%), hsl(280 80% 50%))", color: "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ padding: "0.75rem", background: "white", color: "hsl(280 80% 50%)", borderRadius: "0.75rem" }}>
                    <CheckSquare size={20} />
                  </div>
                  <span style={{ fontWeight: 600, opacity: 0.9 }}>To Grade</span>
                </div>
                <h3 style={{ fontSize: "2rem", fontWeight: 800 }}>{pendingGrades}</h3>
              </div>

              <div className="card stat-card" style={{ background: "linear-gradient(135deg, hsl(160 80% 40%), hsl(160 80% 30%))", color: "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ padding: "0.75rem", background: "white", color: "hsl(160 80% 35%)", borderRadius: "0.75rem" }}>
                    <User size={20} />
                  </div>
                  <span style={{ fontWeight: 600, opacity: 0.9 }}>Total Students</span>
                </div>
                <h3 style={{ fontSize: "2rem", fontWeight: 800 }}>{totalStudents}</h3>
              </div>
            </div>

            {/* MY SCHEDULE */}
            <div className="card">
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={20} className="text-primary" /> My Schedule (Today)
              </h3>
              {classesToday.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {classesToday.map((slot: any) => (
                    <div key={slot.id} style={{ display: "flex", alignItems: "center", padding: "1rem", background: "hsl(var(--background))", borderRadius: "0.75rem", gap: "1.5rem" }}>
                      <div style={{ width: "80px", textAlign: "center" }}>
                        <div style={{ fontWeight: 700, color: "hsl(var(--primary))" }}>{slot.startTime}</div>
                        <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>{slot.endTime}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{slot.subject.name}</div>
                        <div style={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>
                          {slot.section.grade.name} - {slot.section.name} • Room {slot.room || "TBA"}
                        </div>
                      </div>
                      <button className="btn btn-outline" onClick={() => setActiveTab("roster")}>
                        Take Attendance
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))", background: "hsl(var(--background))", borderRadius: "0.75rem" }}>
                  <p>No classes scheduled for today. Have a great day!</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* ANNOUNCEMENTS */}
            <div className="card">
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={20} className="text-warning" /> Announcement Board
              </h3>
              {announcements.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {announcements.map((ann: any) => (
                    <div key={ann.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid hsl(var(--border))", padding: "1rem", background: "hsl(var(--background))", borderRadius: "0.75rem" }}>
                      <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", marginBottom: "0.25rem" }}>
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </div>
                      <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{ann.title}</h4>
                      <p style={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))", lineHeight: 1.5 }}>
                        {ann.content.substring(0, 100)}{ann.content.length > 100 ? "..." : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "hsl(var(--text-muted))", textAlign: "center", padding: "1rem" }}>No announcements</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "roster" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Class Roster & Attendance</h3>
            <div style={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>Select a section below to mark attendance</div>
          </div>

          {roster.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {roster.map((section: any) => (
                <div key={section.id} style={{ background: "hsl(var(--background))", padding: "1.5rem", borderRadius: "1rem" }}>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <ChevronRight size={18} className="text-primary" /> {section.grade.name} - {section.name} 
                    <span className="badge" style={{ marginLeft: "auto" }}>{section.enrollments.length} Students</span>
                  </h4>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Admission No</th>
                          <th style={{ textAlign: "right" }}>Today's Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.enrollments.map((enr: any) => (
                          <tr key={enr.id}>
                            <td style={{ fontWeight: 600 }}>{enr.rollNo || "-"}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div className="avatar" style={{ width: 28, height: 28, fontSize: "0.7rem", background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>
                                  {enr.student.user.name.substring(0, 2).toUpperCase()}
                                </div>
                                {enr.student.user.name}
                              </div>
                            </td>
                            <td style={{ fontFamily: "monospace", color: "hsl(var(--text-muted))" }}>{enr.student.admissionNo}</td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", background: "white", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", overflow: "hidden" }}>
                                <button className="btn" style={{ padding: "0.3rem 0.75rem", borderRadius: 0, fontSize: "0.8rem", background: "hsl(var(--success)/0.1)", color: "hsl(var(--success))" }}>
                                  <Check size={14} style={{ marginRight: 4, display: "inline" }}/> Present
                                </button>
                                <button className="btn" style={{ padding: "0.3rem 0.75rem", borderRadius: 0, fontSize: "0.8rem", borderLeft: "1px solid hsl(var(--border))" }}>
                                  Absent
                                </button>
                                <button className="btn" style={{ padding: "0.3rem 0.75rem", borderRadius: 0, fontSize: "0.8rem", borderLeft: "1px solid hsl(var(--border))" }}>
                                  Late
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
              You are not assigned to any sections yet.
            </div>
          )}
        </div>
      )}

      {activeTab === "gradebook" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Gradebook Manager</h3>
            <button className="btn btn-primary">Create Assignment / Exam</button>
          </div>
          
          <div style={{ background: "hsl(var(--background))", padding: "3rem", borderRadius: "1rem", textAlign: "center" }}>
            <div style={{ display: "inline-flex", padding: "1rem", background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", borderRadius: "50%", marginBottom: "1rem" }}>
              <BookOpen size={32} />
            </div>
            <h4 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Gradebook Initialized</h4>
            <p style={{ color: "hsl(var(--text-muted))", maxWidth: 400, margin: "0 auto" }}>
              Select a section and subject to start inputting scores for your students using the data grid interface.
            </p>
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
              <select className="form-input" style={{ width: 200 }}>
                <option value="">Select Section</option>
                {roster.map((s: any) => <option key={s.id} value={s.id}>{s.grade.name} - {s.name}</option>)}
              </select>
              <select className="form-input" style={{ width: 200 }}>
                <option value="">Select Subject</option>
              </select>
              <button className="btn btn-primary">Load Grid</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
