"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SUBMITTED: "#3b82f6",
  UNDER_REVIEW: "#f59e0b",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  WAITLISTED: "#8b5cf6",
  ENROLLED: "#06b6d4",
  WITHDRAWN: "#6b7280",
};

interface Props {
  stats: {
    totalApplications: number;
    statusCounts: Record<string, number>;
    activeCycles: number;
    totalSeats: number;
    filledSeats: number;
    approvalRate: number;
  };
  applications: any[];
}

export default function AdmissionStats({ stats, applications }: Props) {
  const pieData = Object.entries(stats.statusCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace("_", " "), value, color: STATUS_COLORS[name] || "#94a3b8" }));

  // Grade distribution
  const gradeCounts: Record<string, number> = {};
  applications.forEach((a: any) => {
    gradeCounts[a.gradeAppliedFor] = (gradeCounts[a.gradeAppliedFor] || 0) + 1;
  });
  const gradeData = Object.entries(gradeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({ name, count }));

  // Weekly trend (last 4 weeks)
  const now = new Date();
  const weeklyData = [3, 2, 1, 0].map((weeksAgo) => {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (weeksAgo + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - weeksAgo * 7);
    const count = applications.filter((a: any) => {
      const d = new Date(a.createdAt);
      return d >= weekStart && d < weekEnd;
    }).length;
    return { week: `Week ${4 - weeksAgo}`, applications: count };
  });

  const seatUtilization = stats.totalSeats > 0
    ? Math.round((stats.filledSeats / stats.totalSeats) * 100)
    : 0;

  const statCards = [
    { label: "Total Applications", value: stats.totalApplications.toString(), icon: "📋", color: "#3b82f6", bg: "#eff6ff" },
    { label: "Active Cycles", value: stats.activeCycles.toString(), icon: "🔄", color: "#8b5cf6", bg: "#f5f3ff" },
    { label: "Approval Rate", value: `${stats.approvalRate}%`, icon: "✅", color: "#22c55e", bg: "#f0fdf4" },
    { label: "Pending Review", value: (stats.statusCounts.SUBMITTED + stats.statusCounts.UNDER_REVIEW).toString(), icon: "⏳", color: "#f59e0b", bg: "#fffbeb" },
    { label: "Seats Available", value: `${stats.totalSeats - stats.filledSeats}`, icon: "💺", color: "#06b6d4", bg: "#ecfeff" },
    { label: "Seat Utilization", value: `${seatUtilization}%`, icon: "📊", color: "#10b981", bg: "#ecfdf5" },
    { label: "Waitlisted", value: stats.statusCounts.WAITLISTED.toString(), icon: "📑", color: "#8b5cf6", bg: "#f5f3ff" },
    { label: "Enrolled", value: stats.statusCounts.ENROLLED.toString(), icon: "🎓", color: "#3b82f6", bg: "#eff6ff" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Stat Cards */}
      <div className="grid-4">
        {statCards.map((s, i) => (
          <div className="stat-card" key={s.label} style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "hsl(var(--text))", lineHeight: 1.2, marginTop: "0.2rem" }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Status Distribution Pie */}
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>Application Status</div>
            <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Distribution by current status</div>
          </div>
          {pieData.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}`, ""]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {pieData.map((g) => (
                  <div key={g.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: g.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, minWidth: 80 }}>{g.name}</span>
                    <span style={{ color: "hsl(var(--text-muted))" }}>{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--text-muted))" }}>No application data yet</div>
          )}
        </div>

        {/* Weekly Trend */}
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>Application Trend</div>
            <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Last 4 weeks submissions</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>Applications by Grade</div>
            <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Demand per grade level</div>
          </div>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--text-muted))" }}>No grade data</div>
          )}
        </div>

        {/* Seat Capacity */}
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>Seat Capacity</div>
            <div style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>Active cycles utilization</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1rem 0" }}>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="60" fill="none" stroke="hsl(var(--border))" strokeWidth="12" />
                <circle cx="70" cy="70" r="60" fill="none" stroke={seatUtilization > 90 ? "#ef4444" : "#3b82f6"} strokeWidth="12"
                  strokeDasharray={`${(seatUtilization / 100) * 377} 377`}
                  strokeLinecap="round" transform="rotate(-90 70 70)"
                  style={{ transition: "stroke-dasharray 0.8s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>{seatUtilization}%</div>
                <div style={{ fontSize: "0.7rem", color: "hsl(var(--text-muted))" }}>utilized</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "2rem", fontSize: "0.85rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "1.2rem", fontFamily: "var(--font-display)" }}>{stats.filledSeats}</div>
                <div style={{ color: "hsl(var(--text-muted))", fontSize: "0.75rem" }}>Filled</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "1.2rem", fontFamily: "var(--font-display)" }}>{stats.totalSeats - stats.filledSeats}</div>
                <div style={{ color: "hsl(var(--text-muted))", fontSize: "0.75rem" }}>Available</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "1.2rem", fontFamily: "var(--font-display)" }}>{stats.totalSeats}</div>
                <div style={{ color: "hsl(var(--text-muted))", fontSize: "0.75rem" }}>Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
