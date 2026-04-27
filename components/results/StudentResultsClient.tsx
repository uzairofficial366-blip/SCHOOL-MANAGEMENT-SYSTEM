"use client";

import { useState, useEffect } from "react";

const GRADE_COLORS: Record<string, string> = {
  "A+": "#15803d", "A": "#16a34a", "A-": "#22c55e",
  "B+": "#1d4ed8", "B": "#2563eb", "B-": "#3b82f6",
  "C+": "#b45309", "C": "#d97706", "C-": "#f59e0b",
  "D": "#c2410c", "F": "#b91c1c",
};

export default function StudentResultsClient() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch("/api/results/student");
        const data = await res.json();
        if (res.ok) setRecords(data.gradeRecords || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  if (loading) {
    return <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading your results...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
        <h4 style={{ fontWeight: 600 }}>No Results Yet</h4>
        <p style={{ color: "var(--text-muted)" }}>Your results have not been published yet.</p>
      </div>
    );
  }

  const avgPct = records.reduce((s, r) => s + (Number(r.marksObtained) / Number(r.totalMarks)) * 100, 0) / records.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Total Subjects", value: records.length, color: "#3b82f6" },
          { label: "Average Score", value: `${avgPct.toFixed(1)}%`, color: "#8b5cf6" },
          { label: "Passed", value: records.filter((r) => (Number(r.marksObtained) / Number(r.totalMarks)) >= 0.5).length, color: "#16a34a" },
          { label: "Failed", value: records.filter((r) => (Number(r.marksObtained) / Number(r.totalMarks)) < 0.5).length, color: "#dc2626" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: "center", border: `1px solid ${s.color}30`, background: `${s.color}08` }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Results Table */}
      <div className="card">
        <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1.25rem" }}>My Results</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #eaeaea" }}>Subject</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #eaeaea" }}>Exam</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "2px solid #eaeaea" }}>Marks</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "2px solid #eaeaea" }}>Percentage</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "2px solid #eaeaea" }}>Grade</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #eaeaea" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #eaeaea" }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => {
                const pct = ((Number(rec.marksObtained) / Number(rec.totalMarks)) * 100).toFixed(1);
                const pass = Number(pct) >= 50;
                const gradeColor = GRADE_COLORS[rec.grade] || "#64748b";
                return (
                  <tr key={rec.id} style={{ borderBottom: "1px solid #eaeaea" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 600 }}>{rec.subject?.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{rec.subject?.code}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {rec.exam?.examSchedule?.name || "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontWeight: 600 }}>
                      {Number(rec.marksObtained).toFixed(0)} / {Number(rec.totalMarks).toFixed(0)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <div style={{ position: "relative", height: "6px", background: "#eaeaea", borderRadius: "3px", width: "80px", margin: "0 auto" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: pass ? "#16a34a" : "#dc2626", borderRadius: "3px" }} />
                      </div>
                      <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", fontWeight: 600, color: pass ? "#16a34a" : "#dc2626" }}>{pct}%</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem", color: gradeColor, background: `${gradeColor}15`, padding: "0.2rem 0.6rem", borderRadius: "4px" }}>
                        {rec.grade || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, background: pass ? "#dcfce7" : "#fee2e2", color: pass ? "#15803d" : "#b91c1c" }}>
                        {pass ? "Pass" : "Fail"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {rec.remarks || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
