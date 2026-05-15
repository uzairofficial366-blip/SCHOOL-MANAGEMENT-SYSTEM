"use client";

import Link from "next/link";
import { formatDate, formatPKR } from "@/lib/format";

const PKR = formatPKR;
const fmtDate = formatDate;

export default function ParentDashboardClient({ data }: { data: any }) {
  if (!data || data.children.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <h2>No students linked</h2>
        <p>Your account is not linked to any students yet. Please contact the school administration.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", paddingBottom: "2rem" }}>
      
      {/* Alerts */}
      {data.overdueCount > 0 && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 12, padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "1.5rem" }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, color: "#b91c1c", fontSize: "1rem", fontWeight: 700 }}>Payment Overdue</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#991b1b" }}>
              You have {data.overdueCount} overdue invoice(s) totaling <strong>{PKR(data.overdueAmount)}</strong>. Please clear your dues immediately.
            </p>
          </div>
          <Link href="/parent/fees" className="btn btn-primary" style={{ background: "#b91c1c", borderColor: "#b91c1c" }}>Pay Now</Link>
        </div>
      )}

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: 16, border: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>Total Outstanding</p>
          <h2 style={{ fontSize: "2rem", margin: "0.5rem 0", color: data.totalOutstanding > 0 ? "#b91c1c" : "var(--text-primary)" }}>{PKR(data.totalOutstanding)}</h2>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: 16, border: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>Next Due Date</p>
          <h2 style={{ fontSize: "1.5rem", margin: "0.5rem 0" }}>{fmtDate(data.nextDueDate)}</h2>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: 16, border: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase" }}>Paid This Month</p>
          <h2 style={{ fontSize: "2rem", margin: "0.5rem 0", color: "#15803d" }}>{PKR(data.paidThisMonth)}</h2>
        </div>
      </div>

      {/* Children List */}
      <div>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>My Children</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
          {data.children.map((child: any) => (
            <div key={child.id} style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: 16, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{child.name}</h4>
                  <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {child.grade} - {child.section} • {child.admissionNo}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, background: "var(--surface)", padding: "0.75rem", borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Outstanding Fee</p>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: child.outstanding > 0 ? "#b91c1c" : "inherit" }}>{PKR(child.outstanding)}</p>
                </div>
                <div style={{ flex: 1, background: "var(--surface)", padding: "0.75rem", borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Attendance</p>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{child.attendanceRate !== null ? `${child.attendanceRate}%` : "N/A"}</p>
                </div>
              </div>

              {child.discounts && child.discounts.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--text-muted)" }}>Active Discounts:</p>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {child.discounts.map((d: any, idx: number) => (
                      <span key={idx} style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 600 }}>
                        {d.name} ({d.percentage}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link href="/parent/fees" className="btn btn-primary" style={{ flex: 1, textAlign: "center", padding: "0.5rem", fontSize: "0.85rem" }}>Manage Fees</Link>
                <Link href="/parent/attendance" className="btn btn-secondary" style={{ flex: 1, textAlign: "center", padding: "0.5rem", fontSize: "0.85rem" }}>Attendance</Link>
                <Link href="/parent/grades" className="btn btn-secondary" style={{ flex: 1, textAlign: "center", padding: "0.5rem", fontSize: "0.85rem" }}>Grades</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Announcements */}
      {data.announcements && data.announcements.length > 0 && (
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>School Notices</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data.announcements.map((ann: any) => (
              <div key={ann.id} style={{ background: "var(--card-bg)", padding: "1rem", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{ann.title}</h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmtDate(ann.publishedAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
