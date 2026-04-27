"use client";

import { useState } from "react";
import { 
  User, BookOpen, Clock, AlertCircle, Search, Bell, MessageSquare, AlertTriangle, Briefcase
} from "lucide-react";

export default function TeacherDashboardClient({ 
  staff, classesToday, pendingGrades, totalStudents, announcements, roster, tenantId 
}: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem", background: "hsl(var(--bg))" }}>
      
      {/* GLOBAL HEADER: Search, Notifications, Profile */}
      <div className="glass" style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "1rem 2rem", borderRadius: "1rem", marginBottom: "2rem",
        position: "sticky", top: "1rem", zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--text-muted))" }} />
            <input 
              type="text" 
              placeholder="Search students, documents, classes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input glass"
              style={{ paddingLeft: "2.5rem", borderRadius: "2rem", border: "1px solid hsl(var(--border))" }}
            />
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button className="btn btn-primary btn-sm" style={{ borderRadius: "2rem" }}>
            <MessageSquare size={16} /> Broadcast
          </button>
          <div style={{ position: "relative" }}>
            <button className="btn btn-ghost" style={{ padding: "0.5rem", borderRadius: "50%" }} onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <Bell size={20} />
              <span style={{ position: "absolute", top: "2px", right: "4px", width: "10px", height: "10px", background: "hsl(var(--danger))", borderRadius: "50%", border: "2px solid hsl(var(--bg-card))" }}></span>
            </button>
            {notificationsOpen && (
              <div className="card glass fade-up-1" style={{ position: "absolute", top: "120%", right: "0", width: "320px", padding: "1rem", zIndex: 110 }}>
                <h4 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>Notifications</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem", borderBottom: "1px solid hsl(var(--border))", paddingBottom: "0.5rem" }}>
                    <AlertTriangle size={16} className="text-warning" />
                    <div><strong>Substitute Alert:</strong> Cover Math 101 in Room 4B at 11:00 AM</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <AlertCircle size={16} className="text-primary" />
                    <div><strong>New Announcement:</strong> Staff meeting at 3:00 PM</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="avatar" style={{ width: "40px", height: "40px", fontSize: "1rem" }}>
            {staff.user.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* DASHBOARD HEADER */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }} className="gradient-text">
          Mission Control
        </h2>
        <p style={{ color: "hsl(var(--text-muted))" }}>Welcome back, {staff.user.name}. Here is your at-a-glance overview.</p>
      </div>

      {/* ── DASHBOARD WIDGETS ────────────────────────────────────────── */}
      <div className="grid-3 fade-up">
        <div className="card stat-card" style={{ background: "linear-gradient(135deg, hsl(230 80% 60%), hsl(230 80% 50%))", color: "white", padding: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <span style={{ fontWeight: 600, opacity: 0.9 }}>To Grade</span>
            <h3 style={{ fontSize: "3rem", fontWeight: 800 }}>{pendingGrades}</h3>
            <a href="/teacher/assignments" className="btn" style={{ background: "white", color: "hsl(230 80% 50%)", width: "100%" }}>
              Review Submissions
            </a>
          </div>
        </div>

        <div className="card" style={{ gridColumn: "span 2" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={18} className="text-primary" /> Classes Today
          </h3>
          {classesToday?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {classesToday.map((slot: any) => (
                <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", width: "100px" }}>{slot.startTime} - {slot.endTime}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{slot.subject.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>{slot.section.grade.name} - {slot.section.name} • Room: {slot.room || "TBA"}</div>
                  </div>
                  <a href="/teacher/timetable" className="btn btn-sm btn-ghost">Timetable</a>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "hsl(var(--text-muted))", textAlign: "center", padding: "2rem" }}>No classes for today</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={18} className="text-warning" /> Announcements
          </h3>
          {announcements?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {announcements.slice(0, 3).map((ann: any) => (
                <div key={ann.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid hsl(var(--border))" }}>
                  <h4 style={{ fontWeight: 700, marginBottom: "0.25rem", fontSize: "0.95rem" }}>{ann.title}</h4>
                  <p style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))", lineHeight: 1.5 }}>
                    {ann.content.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "hsl(var(--text-muted))", textAlign: "center", fontSize: "0.9rem" }}>No announcements</p>
          )}
        </div>
      </div>
    </div>
  );
}

