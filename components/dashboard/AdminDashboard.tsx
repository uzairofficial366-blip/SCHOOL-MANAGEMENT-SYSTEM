"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const attendanceData = [
  { day: "Mon", present: 420, absent: 30 },
  { day: "Tue", present: 398, absent: 52 },
  { day: "Wed", present: 445, absent: 5 },
  { day: "Thu", present: 411, absent: 39 },
  { day: "Fri", present: 390, absent: 60 },
];

const feeData = [
  { month: "Jan", collected: 285000, pending: 45000 },
  { month: "Feb", collected: 310000, pending: 32000 },
  { month: "Mar", collected: 295000, pending: 58000 },
  { month: "Apr", collected: 325000, pending: 28000 },
];

const gradeDistribution = [
  { name: "A+", value: 22, color: "#22c55e" },
  { name: "A",  value: 31, color: "#3b82f6" },
  { name: "B",  value: 28, color: "#8b5cf6" },
  { name: "C",  value: 12, color: "#f59e0b" },
  { name: "D",  value: 5,  color: "#ef4444" },
  { name: "F",  value: 2,  color: "#6b7280" },
];

const recentAdmissions = [
  { name: "Aisha Malik",   grade: "Grade 8", date: "Apr 22", status: "Active" },
  { name: "Hamza Khan",    grade: "Grade 5", date: "Apr 21", status: "Active" },
  { name: "Sara Ahmed",    grade: "Grade 11",date: "Apr 20", status: "Pending" },
  { name: "Omar Farooq",   grade: "Grade 3", date: "Apr 19", status: "Active" },
  { name: "Fatima Raza",   grade: "Grade 9", date: "Apr 18", status: "Active" },
];

const atRiskStudents = [
  { name: "Bilal Saeed",  attendance: "62%", score: 0.23, trend: "↓" },
  { name: "Nadia Qureshi",attendance: "71%", score: 0.31, trend: "↓" },
  { name: "Usman Ali",    attendance: "68%", score: 0.28, trend: "→" },
];

interface AdminDashboardProps {
  userName: string;
  dbData?: {
    totalStudents: number;
    totalStaff: number;
    activeClasses: number;
    totalBooks: number;
    recentAdmissions: any[];
  };
}

export default function AdminDashboard({ userName, dbData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "finance" | "ai">("overview");

  const actualAdmissions = dbData?.recentAdmissions || recentAdmissions;

  const stats = [
    { label: "Total Students",    value: dbData ? dbData.totalStudents.toString() : "1,248",  change: "Active in school",  icon: "🎓", color: "#3b82f6", bg: "#eff6ff" },
    { label: "Teaching Staff",    value: dbData ? dbData.totalStaff.toString() : "84",     change: "Current staff",   icon: "👩‍🏫", color: "#8b5cf6", bg: "#f5f3ff" },
    { label: "Attendance Today",  value: "94.2%",  change: "+1.4% vs last wk",icon: "✅", color: "#22c55e", bg: "#f0fdf4" },
    { label: "Fee Collection",    value: "₨3.2L",  change: "88% of target",   icon: "💳", color: "#f59e0b", bg: "#fffbeb" },
    { label: "Active Classes",    value: dbData ? dbData.activeClasses.toString() : "36",     change: "Currently running",  icon: "🏛️", color: "#06b6d4", bg: "#ecfeff" },
    { label: "Pending Fees",      value: "₨28K",   change: "14 students",     icon: "⚠️", color: "#ef4444", bg: "#fef2f2" },
    { label: "Library Books",     value: dbData ? dbData.totalBooks.toString() : "4,820",  change: "Total catalog",      icon: "📚", color: "#10b981", bg: "#ecfdf5" },
    { label: "AI Risk Alerts",    value: "3",      change: "Needs attention",  icon: "🤖", color: "#f43f5e", bg: "#fff1f2" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Welcome */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800 }}>
            Good morning, {userName.split(" ")[0]} 👋
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Here&apos;s what&apos;s happening at your institution today.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-ghost btn-sm">📅 Apr 23, 2026</button>
          <Link href="/admin/admissions?new=true" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>+ New Admission</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4 fade-up fade-up-1">
        {stats.map((s, i) => (
          <div className="stat-card" key={s.label} style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "hsl(var(--text))", lineHeight: 1.2, marginTop: "0.2rem" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.72rem", color: s.color, marginTop: "0.2rem", fontWeight: 500 }}>
                {s.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="fade-up fade-up-2" style={{ display: "flex", gap: "0.25rem", background: "hsl(var(--bg))", padding: "0.25rem", borderRadius: "10px", width: "fit-content", border: "1px solid hsl(var(--border))" }}>
        {(["overview", "finance", "ai"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="btn btn-sm"
            style={{
              background: activeTab === t ? "hsl(var(--primary))" : "transparent",
              color: activeTab === t ? "white" : "hsl(var(--text-muted))",
              boxShadow: activeTab === t ? "0 2px 8px hsl(var(--primary)/0.3)" : "none",
              textTransform: "capitalize",
            }}>
            {t === "ai" ? "🤖 AI Insights" : t === "finance" ? "💳 Finance" : "📊 Overview"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="fade-up">
          {/* Attendance Chart */}
          <div className="card">
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>Weekly Attendance</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Present vs Absent this week</div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="present" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="absent"  fill="#fca5a5" radius={[4, 4, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Grade Distribution */}
          <div className="card">
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>Grade Distribution</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Current term results</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {gradeDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {gradeDistribution.map((g) => (
                  <div key={g.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: g.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, width: 24 }}>{g.name}</span>
                    <span style={{ color: "hsl(var(--text-muted))" }}>{g.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Admissions */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Recent Admissions</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th><th>Grade</th><th>Date</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {actualAdmissions.map((s) => (
                    <tr key={s.name}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div className="avatar" style={{ width: 30, height: 30, fontSize: "0.7rem" }}>
                            {s.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>{s.grade}</td>
                      <td style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>{s.date}</td>
                      <td>
                        <span className={`badge ${s.status === "Active" ? "badge-success" : "badge-warning"}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { icon: "📝", label: "New Admission", color: "#3b82f6", href: "/admin/admissions?new=true" },
                { icon: "📢", label: "Announcement", color: "#8b5cf6" },
                { icon: "🗓️", label: "Timetable AI", color: "#22c55e" },
                { icon: "📊", label: "Generate Report", color: "#f59e0b" },
                { icon: "💳", label: "Fee Reminder", color: "#ef4444" },
                { icon: "👥", label: "Add Staff", color: "#06b6d4" },
              ].map((a) => (
                <Link key={a.label} href={a.href || "#"}
                  className="btn btn-ghost"
                  style={{ justifyContent: "flex-start", gap: "0.6rem", height: "44px", fontSize: "0.82rem", textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: "1rem" }}>{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === "finance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="fade-up">
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>Fee Collection Trend</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Collected vs Pending (PKR)</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={feeData}>
                <defs>
                  <linearGradient id="colCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₨${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  formatter={(v: any) => [`₨${Number(v || 0).toLocaleString()}`, ""]} />
                <Area type="monotone" dataKey="collected" stroke="#3b82f6" fill="url(#colCollected)" strokeWidth={2} name="Collected" />
                <Area type="monotone" dataKey="pending"   stroke="#ef4444" fill="url(#colPending)"   strokeWidth={2} name="Pending" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {[
            { label: "Total Collected",  value: "₨12,15,000", icon: "💰", color: "#22c55e" },
            { label: "Pending Amount",   value: "₨1,63,000",  icon: "⏳", color: "#f59e0b" },
            { label: "Concessions Given",value: "₨45,000",    icon: "🏷️", color: "#8b5cf6" },
            { label: "Overdue (30d+)",   value: "₨28,000",    icon: "🚨", color: "#ef4444" },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color, fontSize: "1.5rem" }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-display)", marginTop: "0.2rem" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Tab */}
      {activeTab === "ai" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="fade-up">
          <div className="card" style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, hsl(262 83% 62% / 0.08), hsl(224 71% 55% / 0.08))", borderColor: "hsl(var(--primary)/0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>AI Predictive Engine</div>
                <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>
                  P(success) = f(attendance, LMS_engagement, grade_trajectory)
                </div>
              </div>
              <span className="badge badge-primary" style={{ marginLeft: "auto" }}>Live</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
              {[
                { label: "Students Analysed", value: "1,248", icon: "📊" },
                { label: "At-Risk Detected",  value: "3",     icon: "🚨" },
                { label: "Avg Success Score",  value: "0.78",  icon: "🎯" },
              ].map((m) => (
                <div key={m.label} style={{ textAlign: "center", padding: "1rem", background: "hsl(var(--bg-card))", borderRadius: "10px", border: "1px solid hsl(var(--border))" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{m.icon}</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>{m.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>🚨 At-Risk Students</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {atRiskStudents.map((s) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "hsl(var(--danger)/0.05)", borderRadius: "8px", border: "1px solid hsl(var(--danger)/0.15)" }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: "0.8rem", background: "hsl(var(--danger)/0.15)", color: "hsl(var(--danger))" }}>
                    {s.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Attendance: {s.attendance}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--danger))" }}>
                      Risk: {(s.score * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>{s.trend} trending</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-danger btn-sm" style={{ marginTop: "1rem", width: "100%" }}>
              📧 Send Parent Alerts
            </button>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>💬 AI Tutor Assistant</div>
            <div style={{ padding: "1rem", background: "hsl(var(--bg))", borderRadius: "8px", fontSize: "0.85rem", color: "hsl(var(--text-muted))", lineHeight: 1.6, marginBottom: "0.75rem", minHeight: "120px" }}>
              Based on current data, <strong style={{ color: "hsl(var(--text))" }}>3 students</strong> show dropout risk above 25%. 
              Recommend scheduling parent-teacher meetings and assigning supplementary LMS content for Grade 7 Mathematics.
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input className="form-input" placeholder="Ask the AI anything…" style={{ fontSize: "0.82rem" }} />
              <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Ask →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
