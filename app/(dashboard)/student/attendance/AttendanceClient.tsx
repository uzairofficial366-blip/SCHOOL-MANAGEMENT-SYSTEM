/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { formatMonthYear, formatTime, formatWeekday } from "@/lib/format";
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from "lucide-react";

const STATUS_CONFIG: any = {
  PRESENT: { icon: CheckCircle, color: "#16a34a", bg: "#dcfce7", label: "Present" },
  ABSENT: { icon: XCircle, color: "#dc2626", bg: "#fee2e2", label: "Absent" },
  LATE: { icon: Clock, color: "#d97706", bg: "#fef3c7", label: "Late" },
  EXCUSED: { icon: AlertCircle, color: "#7c3aed", bg: "#f3e8ff", label: "Leave" },
};

export default function AttendanceClient() {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [overall, setOverall] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState<Date | null>(null);

  useEffect(() => {
    setViewDate(new Date());
  }, []);

  useEffect(() => {
    if (!viewDate) return;
    fetchAttendance();
  }, [viewDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      if (!viewDate) return;
      const month = viewDate.getMonth();
      const year = viewDate.getFullYear();
      const res = await fetch(`/api/attendance/student?month=${month}&year=${year}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
        setSummary(data.monthlySummary);
        setOverall(data.overallPercentage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => viewDate && setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const prevMonth = () => viewDate && setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

  if (!viewDate) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading attendance...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* SUMMARY CARDS */}
      <div className="grid-4">
        <div className="card glass" style={{ textAlign: "center", borderLeft: "4px solid hsl(var(--primary))" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            <TrendingUp size={16} /> Overall Attendance
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800 }}>{overall}%</div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Academic Year</p>
        </div>

        {summary && (
          <>
            <div className="card glass" style={{ textAlign: "center", borderLeft: "4px solid #16a34a" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Present (This Month)</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#16a34a" }}>{summary.present}</div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Days Attended</p>
            </div>
            <div className="card glass" style={{ textAlign: "center", borderLeft: "4px solid #dc2626" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Absent (This Month)</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#dc2626" }}>{summary.absent}</div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Unexcused Days</p>
            </div>
            <div className="card glass" style={{ textAlign: "center", borderLeft: "4px solid #7c3aed" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Leaves (This Month)</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#7c3aed" }}>{summary.excused}</div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Approved Leave</p>
            </div>
          </>
        )}
      </div>

      <div className="grid-3">
        {/* HISTORY LIST */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontWeight: 800, fontSize: "1.25rem" }}>Attendance History</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button className="btn btn-ghost btn-sm" onClick={prevMonth}><ChevronLeft size={20} /></button>
              <span style={{ fontWeight: 700, minWidth: "120px", textAlign: "center" }}>
                {formatMonthYear(viewDate)}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={nextMonth}><ChevronRight size={20} /></button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Loading records...</div>
          ) : records.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", background: "hsl(var(--bg-muted))", borderRadius: "12px", border: "1px dashed #ccc" }}>
              No records found for this month.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {records.map((rec) => {
                const config = STATUS_CONFIG[rec.status];
                const Icon = config.icon;
                return (
                  <div key={rec.id} className="glass" style={{ padding: "1rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ width: "60px", textAlign: "center" }}>
                      <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{new Date(rec.date).getDate()}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        {formatWeekday(rec.date)}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                      <div style={{ background: config.bg, color: config.color, padding: "0.5rem", borderRadius: "50%" }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: config.color }}>{config.label}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Marked by {rec.takenBy.user.name} {rec.remarks && `• ${rec.remarks}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      {formatTime(rec.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CALENDAR VIEW (Simplified) */}
        <div className="card">
          <h3 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "1.5rem" }}>Monthly Grid</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.5rem" }}>{d}</div>
            ))}
            {/* Logic for calendar grid could be added here, using a simpler visual for now */}
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const rec = records.find(r => new Date(r.date).getDate() === day);
              const config = rec ? STATUS_CONFIG[rec.status] : null;
              return (
                <div 
                  key={day} 
                  style={{ 
                    aspectRatio: "1/1", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    borderRadius: "6px",
                    background: config ? config.bg : "hsl(var(--bg-muted))",
                    color: config ? config.color : "hsl(var(--text-muted))",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "default"
                  }}
                  title={rec?.remarks || ""}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Object.keys(STATUS_CONFIG).map(k => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: STATUS_CONFIG[k].bg }} />
                <span style={{ color: "var(--text-muted)" }}>{STATUS_CONFIG[k].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

