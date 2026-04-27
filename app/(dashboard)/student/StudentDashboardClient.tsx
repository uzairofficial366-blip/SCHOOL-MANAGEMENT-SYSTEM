"use client";

import { 
  BookOpen, Clock, AlertCircle, Calendar, GraduationCap, TrendingUp, Bell
} from "lucide-react";
import Link from "next/link";

export default function StudentDashboardClient({ 
  student, 
  classesToday, 
  announcements, 
  enrollment 
}: any) {
  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem", background: "hsl(var(--bg))" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.5rem" }} className="gradient-text">
            Welcome back, {student.user.name}
          </h2>
          <p style={{ color: "hsl(var(--text-muted))" }}>
            You are enrolled in <strong>{enrollment.section.grade.name} - {enrollment.section.name}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/student/timetable" className="btn btn-primary" style={{ borderRadius: "2rem" }}>
            <Calendar size={18} /> View Full Timetable
          </Link>
        </div>
      </div>

      <div className="grid-3 fade-up">
        
        {/* STATS */}
        <div className="card" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "0.9rem", opacity: 0.9, fontWeight: 600 }}>ATTENDANCE</p>
              <h3 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0.5rem 0" }}>92%</h3>
              <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>3 Absences this term</p>
            </div>
            <TrendingUp size={32} style={{ opacity: 0.5 }} />
          </div>
        </div>

        <div className="card" style={{ background: "linear-gradient(135deg, hsl(280 80% 60%), hsl(280 80% 50%))", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "0.9rem", opacity: 0.9, fontWeight: 600 }}>CURRENT GPA</p>
              <h3 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0.5rem 0" }}>3.8</h3>
              <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>Top 15% of Class</p>
            </div>
            <GraduationCap size={32} style={{ opacity: 0.5 }} />
          </div>
        </div>

        <div className="card" style={{ background: "linear-gradient(135deg, hsl(150 80% 40%), hsl(150 80% 30%))", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "0.9rem", opacity: 0.9, fontWeight: 600 }}>COURSES</p>
              <h3 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0.5rem 0" }}>8</h3>
              <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>All materials active</p>
            </div>
            <BookOpen size={32} style={{ opacity: 0.5 }} />
          </div>
        </div>

        {/* TODAY'S CLASSES */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={20} className="text-primary" /> Classes Today
          </h3>
          {classesToday?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {classesToday.map((slot: any) => (
                <div key={slot.id} className="glass" style={{ padding: "1.25rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ width: "80px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{slot.startTime}</div>
                    <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>{slot.endTime}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{slot.subject.name}</div>
                    <div style={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))" }}>
                      Instructor: {slot.staff.user.name} • Room: {slot.room || "TBA"}
                    </div>
                  </div>
                  <Link href={`/student/courses`} className="btn btn-sm btn-ghost">View Course</Link>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "3rem", textAlign: "center", background: "hsl(var(--bg-muted))", borderRadius: "12px", border: "1px dashed #ccc" }}>
              <p style={{ color: "hsl(var(--text-muted))" }}>No classes scheduled for today.</p>
            </div>
          )}
        </div>

        {/* ANNOUNCEMENTS */}
        <div className="card">
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bell size={20} className="text-warning" /> Announcements
          </h3>
          {announcements?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {announcements.slice(0, 4).map((ann: any) => (
                <div key={ann.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid hsl(var(--border))" }}>
                  <h4 style={{ fontWeight: 700, marginBottom: "0.25rem", fontSize: "0.9rem" }}>{ann.title}</h4>
                  <p style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", lineHeight: 1.4 }}>
                    {ann.content.substring(0, 80)}...
                  </p>
                </div>
              ))}
              <Link href="/student/announcements" style={{ fontSize: "0.85rem", color: "hsl(var(--primary))", fontWeight: 600, textAlign: "center", display: "block", marginTop: "0.5rem" }}>
                View All Announcements
              </Link>
            </div>
          ) : (
            <p style={{ color: "hsl(var(--text-muted))", textAlign: "center", fontSize: "0.9rem" }}>No announcements</p>
          )}
        </div>

      </div>
    </div>
  );
}
