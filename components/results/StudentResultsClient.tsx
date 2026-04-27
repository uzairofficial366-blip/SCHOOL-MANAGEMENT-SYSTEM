"use client";

import { useState, useEffect } from "react";

const GRADE_COLORS: Record<string, string> = {
  "A+": "#15803d", "A": "#16a34a", "A-": "#22c55e",
  "B+": "#1d4ed8", "B": "#2563eb", "B-": "#3b82f6",
  "C+": "#b45309", "C": "#d97706", "C-": "#f59e0b",
  "D": "#c2410c", "F": "#b91c1c",
};

import { Printer, Filter, Download, GraduationCap, BookOpen, AlertCircle, TrendingUp } from "lucide-react";

export default function StudentResultsClient() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [termFilter, setTermFilter] = useState("");

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

  const handlePrint = () => {
    window.print();
  };

  const filteredRecords = records.filter(rec => {
    const matchSubject = !subjectFilter || rec.subjectId === subjectFilter;
    const matchTerm = !termFilter || rec.exam?.examSchedule?.id === termFilter;
    return matchSubject && matchTerm;
  });

  const subjects = Array.from(new Set(records.map(r => r.subject))).filter(Boolean);
  const terms = Array.from(new Set(records.map(r => r.exam?.examSchedule))).filter(Boolean);

  if (loading) {
    return <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading your results...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="card glass" style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem" }}>🎓</div>
        <h3 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>No Results Published</h3>
        <p style={{ color: "var(--text-muted)" }}>Your performance records will appear here once they are published by the administration.</p>
      </div>
    );
  }

  const avgPct = filteredRecords.length > 0 
    ? filteredRecords.reduce((s, r) => s + (Number(r.marksObtained) / Number(r.totalMarks)) * 100, 0) / filteredRecords.length
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* ACTION BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-control" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} style={{ minWidth: "180px" }}>
              <option value="">All Subjects</option>
              {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-control" value={termFilter} onChange={(e) => setTermFilter(e.target.value)} style={{ minWidth: "180px" }}>
              <option value="">All Terms</option>
              {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        
        <button onClick={handlePrint} className="btn btn-secondary no-print">
          <Printer size={18} /> Print Report
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid-4">
        <div className="card glass" style={{ borderBottom: "4px solid #3b82f6" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <BookOpen size={14} /> Total Subjects
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem" }}>{filteredRecords.length}</div>
        </div>
        <div className="card glass" style={{ borderBottom: "4px solid #8b5cf6" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <TrendingUp size={14} /> Average Score
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem" }}>{avgPct.toFixed(1)}%</div>
        </div>
        <div className="card glass" style={{ borderBottom: "4px solid #16a34a" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <GraduationCap size={14} /> GPA
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem" }}>{(avgPct / 25).toFixed(2)}</div>
        </div>
        <div className="card glass" style={{ borderBottom: "4px solid #eab308" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <AlertCircle size={14} /> Rank
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.5rem" }}>N/A</div>
        </div>
      </div>

      {/* RESULTS TABLE */}
      <div className="card print-p-0">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "hsl(var(--bg-muted))" }}>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Subject</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Term/Exam</th>
                <th style={{ padding: "1rem", textAlign: "center", borderBottom: "1px solid var(--border)" }}>Marks</th>
                <th style={{ padding: "1rem", textAlign: "center", borderBottom: "1px solid var(--border)" }}>Grade</th>
                <th style={{ padding: "1rem", textAlign: "center", borderBottom: "1px solid var(--border)" }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => {
                const pct = (Number(rec.marksObtained) / Number(rec.totalMarks)) * 100;
                const isPass = pct >= 50;
                const color = GRADE_COLORS[rec.grade] || "hsl(var(--primary))";
                
                return (
                  <tr key={rec.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 700 }}>{rec.subject?.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{rec.subject?.code}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{rec.exam?.examSchedule?.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(rec.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{Number(rec.marksObtained)} / {Number(rec.totalMarks)}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{pct.toFixed(1)}%</div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span style={{ 
                        background: `${color}15`, 
                        color: color, 
                        padding: "0.4rem 0.8rem", 
                        borderRadius: "6px", 
                        fontWeight: 800,
                        fontSize: "1rem"
                      }}>
                        {rec.grade || "N/A"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span style={{ 
                        background: isPass ? "#dcfce7" : "#fee2e2", 
                        color: isPass ? "#16a34a" : "#dc2626",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "2rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase"
                      }}>
                        {isPass ? "Pass" : "Fail"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .app-layout { display: block !important; }
          .main-content { margin-left: 0 !important; padding: 0 !important; }
          .page-body { padding: 0 !important; }
          .card { border: none !important; box-shadow: none !important; }
          .print-p-0 { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
