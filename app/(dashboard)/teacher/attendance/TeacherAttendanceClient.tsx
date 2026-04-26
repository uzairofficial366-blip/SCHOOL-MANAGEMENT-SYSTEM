"use client";

import { ChevronRight, CheckCircle, XCircle } from "lucide-react";

export default function TeacherAttendanceClient({ roster }: any) {
  const sparklineData = [80, 85, 90, 88, 92, 95, 90];
  
  const renderSparkline = () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '40px', gap: '6px' }} title="7-day Attendance Trend">
      {sparklineData.map((val, i) => (
        <div key={i} style={{ 
          width: '10px', 
          height: `${val}%`, 
          background: 'hsl(var(--success))', 
          borderRadius: '3px 3px 0 0',
          opacity: val > 85 ? 1 : 0.6
        }}></div>
      ))}
    </div>
  );

  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem" }}>
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to right, hsl(var(--bg-card)), hsl(var(--primary)/0.05))" }}>
        <div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Attendance specific to {new Date().toLocaleDateString()}</h3>
          <p style={{ color: "hsl(var(--text-muted))" }}>Speed and accuracy are the priorities.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ textAlign: "right", marginRight: "1rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--text-muted))", textTransform: "uppercase" }}>7-Day Trend</div>
            {renderSparkline()}
          </div>
          <button className="btn btn-success"><CheckCircle size={18} /> Mark All Present</button>
          <button className="btn btn-danger"><XCircle size={18} /> Mark All Absent</button>
        </div>
      </div>

      <div className="grid-3">
        {roster?.map((section: any) => (
          <div key={section.id} className="card glass" style={{ gridColumn: "span 3" }}>
            <h4 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ChevronRight size={20} className="text-primary" /> {section.grade.name} - {section.name} 
              <span className="badge" style={{ marginLeft: "auto" }}>{section.enrollments.length} Students</span>
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {section.enrollments.map((enr: any) => (
                <div key={enr.id} style={{ 
                  display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", 
                  background: "hsl(var(--bg))", borderRadius: "1rem", border: "1px solid hsl(var(--border))",
                  transition: "all 0.2s"
                }}>
                  <div className="avatar" style={{ width: 48, height: 48, fontSize: "1.2rem" }}>
                    {enr.student.user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>{enr.student.user.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>ID: {enr.student.admissionNo}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ display: "flex", background: "hsl(var(--bg-card))", borderRadius: "0.5rem", overflow: "hidden", border: "1px solid hsl(var(--border))" }}>
                      <button style={{ padding: "0.4rem 0.6rem", background: "hsl(var(--success)/0.1)", color: "hsl(var(--success))", border: "none", fontWeight: 600, cursor: "pointer", flex: 1 }}>P</button>
                      <button style={{ padding: "0.4rem 0.6rem", background: "transparent", color: "hsl(var(--text-muted))", border: "none", borderLeft: "1px solid hsl(var(--border))", cursor: "pointer", flex: 1 }}>A</button>
                      <button style={{ padding: "0.4rem 0.6rem", background: "transparent", color: "hsl(var(--text-muted))", border: "none", borderLeft: "1px solid hsl(var(--border))", cursor: "pointer", flex: 1 }}>L</button>
                    </div>
                    <div style={{ fontSize: "0.7rem", textAlign: "center", color: "hsl(var(--success))", fontWeight: 600 }}>Real-time Sync</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
