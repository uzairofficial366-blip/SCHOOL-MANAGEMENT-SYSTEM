"use client";

import { useState, useEffect, useMemo } from "react";

interface Grade { id: string; name: string; level: number; }
interface Section { id: string; name: string; gradeId: string; grade: { name: string }; }
interface GradeRecord {
  id: string;
  marksObtained: number;
  totalMarks: number;
  grade: string | null;
  remarks: string | null;
  createdAt: string;
  student: { user: { name: string }; admissionNo: string; enrollments: { section: { id: string; name: string; grade: { name: string } } }[] };
  subject: { id: string; name: string; code: string };
  exam: { id: string; totalMarks: number; examSchedule: { id: string; name: string; type: string } } | null;
}

interface EditingRow {
  id: string;
  marksObtained: string;
  grade: string;
  remarks: string;
}

const GRADE_OPTS = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

function getGradeColor(grade: string | null) {
  if (!grade) return "#64748b";
  if (grade.startsWith("A")) return "#16a34a";
  if (grade.startsWith("B")) return "#2563eb";
  if (grade.startsWith("C")) return "#d97706";
  if (grade.startsWith("D")) return "#ea580c";
  return "#dc2626";
}

function getPercentage(marks: number, total: number) {
  return total > 0 ? ((marks / total) * 100).toFixed(1) : "0.0";
}

export default function ResultsAdminClient({
  grades,
  sections,
}: {
  grades: Grade[];
  sections: Section[];
}) {
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRows, setEditingRows] = useState<Record<string, EditingRow>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ studentId: "", subjectId: "", marksObtained: "", totalMarks: "100", grade: "A", remarks: "" });
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<{ id: string; name: string; admissionNo: string }[]>([]);

  const filteredSections = useMemo(
    () => (selectedGradeId ? sections.filter((s) => s.gradeId === selectedGradeId) : sections),
    [selectedGradeId, sections]
  );

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSectionId) params.set("sectionId", selectedSectionId);
      else if (selectedGradeId) params.set("gradeId", selectedGradeId);

      const res = await fetch(`/api/results?${params}`);
      const data = await res.json();
      if (res.ok) setGradeRecords(data.gradeRecords || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledData = async () => {
    try {
      const [studRes, subRes] = await Promise.all([
        fetch(`/api/students?sectionId=${selectedSectionId}`),
        fetch(`/api/subjects`),
      ]);
      if (studRes.ok) {
        const d = await studRes.json();
        setEnrolledStudents((d.students || []).map((s: any) => ({ id: s.id, name: s.user?.name || s.name, admissionNo: s.admissionNo })));
      }
      if (subRes.ok) {
        const d = await subRes.json();
        setSubjects(d.subjects || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedGradeId || selectedSectionId) {
      fetchResults();
      if (selectedSectionId) fetchEnrolledData();
    } else {
      setGradeRecords([]);
    }
  }, [selectedGradeId, selectedSectionId]); // eslint-disable-line react-hooks/set-state-in-effect,react-hooks/exhaustive-deps

  const startEditing = (rec: GradeRecord) => {
    setEditingRows((prev) => ({
      ...prev,
      [rec.id]: {
        id: rec.id,
        marksObtained: String(rec.marksObtained),
        grade: rec.grade || "",
        remarks: rec.remarks || "",
      },
    }));
  };

  const cancelEditing = (id: string) => {
    setEditingRows((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const handleEditChange = (id: string, field: string, value: string) => {
    setEditingRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const saveAll = async () => {
    setSaving(true);
    setSaveMsg("");
    const records = Object.values(editingRows).map((row) => {
      const original = gradeRecords.find((r) => r.id === row.id)!;
      return {
        studentId: original.student ? original.student.admissionNo : "",
        subjectId: original.subject.id,
        examId: original.exam?.id || null,
        marksObtained: parseFloat(row.marksObtained),
        totalMarks: original.totalMarks,
        grade: row.grade,
        remarks: row.remarks,
      };
    });

    // Build proper payload using IDs from records
    const properRecords = Object.values(editingRows).map((row) => {
      const original = gradeRecords.find((r) => r.id === row.id)!;
      return {
        gradeRecordId: row.id,
        studentId: original.student?.enrollments?.[0]?.section?.id || "",
        subjectId: original.subject.id,
        examId: original.exam?.id || null,
        marksObtained: row.marksObtained,
        totalMarks: String(original.totalMarks),
        grade: row.grade || null,
        remarks: row.remarks || null,
      };
    });

    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: properRecords }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg(`✅ ${data.count} result(s) saved successfully`);
        setEditingRows({});
        fetchResults();
      } else {
        setSaveMsg(`❌ ${data.error}`);
      }
    } catch (err: any) {
      setSaveMsg(`❌ ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.studentId || !newRecord.subjectId || !newRecord.marksObtained) return;

    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: [{
            studentId: newRecord.studentId,
            subjectId: newRecord.subjectId,
            marksObtained: newRecord.marksObtained,
            totalMarks: newRecord.totalMarks,
            grade: newRecord.grade,
            remarks: newRecord.remarks,
          }],
        }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewRecord({ studentId: "", subjectId: "", marksObtained: "", totalMarks: "100", grade: "A", remarks: "" });
        fetchResults();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const hasEdits = Object.keys(editingRows).length > 0;

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>Student Results</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Filter by class and section to view and update results.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {hasEdits && (
            <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
              {saving ? "Saving..." : `Save ${Object.keys(editingRows).length} Change(s)`}
            </button>
          )}
          {selectedSectionId && (
            <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(true)}>+ Add Result</button>
          )}
        </div>
      </div>

      {saveMsg && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem", background: saveMsg.startsWith("✅") ? "#dcfce7" : "#fee2e2", color: saveMsg.startsWith("✅") ? "#15803d" : "#b91c1c", fontWeight: 600 }}>
          {saveMsg}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "180px" }}>
          <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>Filter by Class</label>
          <select
            className="form-control"
            value={selectedGradeId}
            onChange={(e) => { setSelectedGradeId(e.target.value); setSelectedSectionId(""); }}
          >
            <option value="">All Classes</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: "180px" }}>
          <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>Filter by Section</label>
          <select
            className="form-control"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
          >
            <option value="">All Sections</option>
            {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.grade.name} - {s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading results...</div>
      ) : gradeRecords.length === 0 ? (
        <div style={{ padding: "4rem 2rem", textAlign: "center", background: "hsl(var(--bg))", borderRadius: "12px", border: "1px dashed #ccc" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{selectedGradeId || selectedSectionId ? "No Results Found" : "Select a Class or Section"}</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {selectedGradeId || selectedSectionId ? "No grade records found for the selected filters." : "Please select a class or section to view results."}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #eaeaea", fontWeight: 700 }}>Student</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #eaeaea", fontWeight: 700 }}>Class/Section</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #eaeaea", fontWeight: 700 }}>Subject</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #eaeaea", fontWeight: 700 }}>Exam</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "2px solid #eaeaea", fontWeight: 700 }}>Marks</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "2px solid #eaeaea", fontWeight: 700 }}>%</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "2px solid #eaeaea", fontWeight: 700 }}>Grade</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", borderBottom: "2px solid #eaeaea", fontWeight: 700 }}>Remarks</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "2px solid #eaeaea", fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gradeRecords.map((rec) => {
                const editing = editingRows[rec.id];
                const section = rec.student?.enrollments?.[0]?.section;
                const marks = editing ? parseFloat(editing.marksObtained) || 0 : Number(rec.marksObtained);
                const pct = getPercentage(marks, Number(rec.totalMarks));
                const grade = editing?.grade || rec.grade;

                return (
                  <tr key={rec.id} style={{ borderBottom: "1px solid #eaeaea", background: editing ? "hsl(var(--primary) / 0.03)" : "white" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 600 }}>{rec.student?.user?.name || "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{rec.student?.admissionNo}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {section ? `${section.grade.name} - ${section.name}` : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div>{rec.subject?.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{rec.subject?.code}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {rec.exam?.examSchedule?.name || "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      {editing ? (
                        <input
                          type="number"
                          value={editing.marksObtained}
                          onChange={(e) => handleEditChange(rec.id, "marksObtained", e.target.value)}
                          style={{ width: "70px", padding: "0.25rem 0.5rem", border: "1px solid hsl(var(--primary))", borderRadius: "4px", textAlign: "center" }}
                          min={0}
                          max={Number(rec.totalMarks)}
                        />
                      ) : (
                        <span>{Number(rec.marksObtained).toFixed(0)}/{Number(rec.totalMarks).toFixed(0)}</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <span style={{ fontWeight: 600, color: parseFloat(pct) >= 50 ? "#16a34a" : "#dc2626" }}>{pct}%</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      {editing ? (
                        <select
                          value={editing.grade}
                          onChange={(e) => handleEditChange(rec.id, "grade", e.target.value)}
                          style={{ padding: "0.25rem 0.5rem", border: "1px solid hsl(var(--primary))", borderRadius: "4px" }}
                        >
                          <option value="">—</option>
                          {GRADE_OPTS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontWeight: 700, color: getGradeColor(rec.grade), padding: "0.2rem 0.5rem", background: `${getGradeColor(rec.grade)}15`, borderRadius: "4px" }}>
                          {rec.grade || "—"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {editing ? (
                        <input
                          type="text"
                          value={editing.remarks}
                          onChange={(e) => handleEditChange(rec.id, "remarks", e.target.value)}
                          placeholder="Optional..."
                          style={{ width: "120px", padding: "0.25rem 0.5rem", border: "1px solid hsl(var(--primary))", borderRadius: "4px" }}
                        />
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{rec.remarks || "—"}</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      {editing ? (
                        <button onClick={() => cancelEditing(rec.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}>
                          Cancel
                        </button>
                      ) : (
                        <button onClick={() => startEditing(rec)} style={{ background: "hsl(var(--primary) / 0.1)", border: "none", color: "hsl(var(--primary))", cursor: "pointer", padding: "0.25rem 0.75rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {gradeRecords.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
          {[
            { label: "Total Records", value: gradeRecords.length, color: "#3b82f6" },
            { label: "Avg Score", value: `${(gradeRecords.reduce((s, r) => s + (Number(r.marksObtained) / Number(r.totalMarks)) * 100, 0) / gradeRecords.length).toFixed(1)}%`, color: "#8b5cf6" },
            { label: "Pass Rate", value: `${((gradeRecords.filter((r) => (Number(r.marksObtained) / Number(r.totalMarks)) >= 0.5).length / gradeRecords.length) * 100).toFixed(0)}%`, color: "#16a34a" },
            { label: "Fail Rate", value: `${((gradeRecords.filter((r) => (Number(r.marksObtained) / Number(r.totalMarks)) < 0.5).length / gradeRecords.length) * 100).toFixed(0)}%`, color: "#dc2626" },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: "1rem", background: `${stat.color}10`, borderRadius: "8px", border: `1px solid ${stat.color}30`, textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Result Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "1.5rem", borderRadius: "8px", width: "100%", maxWidth: "460px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: 700 }}>Add Result</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Student *</label>
              <select className="form-control" value={newRecord.studentId} onChange={(e) => setNewRecord({ ...newRecord, studentId: e.target.value })}>
                <option value="">Select Student</option>
                {enrolledStudents.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label>Subject *</label>
              <select className="form-control" value={newRecord.subjectId} onChange={(e) => setNewRecord({ ...newRecord, subjectId: e.target.value })}>
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div className="form-group">
                <label>Marks Obtained *</label>
                <input type="number" className="form-control" placeholder="e.g. 85" value={newRecord.marksObtained} onChange={(e) => setNewRecord({ ...newRecord, marksObtained: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Total Marks *</label>
                <input type="number" className="form-control" value={newRecord.totalMarks} onChange={(e) => setNewRecord({ ...newRecord, totalMarks: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="form-group">
                <label>Grade</label>
                <select className="form-control" value={newRecord.grade} onChange={(e) => setNewRecord({ ...newRecord, grade: e.target.value })}>
                  {GRADE_OPTS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <input type="text" className="form-control" placeholder="Optional" value={newRecord.remarks} onChange={(e) => setNewRecord({ ...newRecord, remarks: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddRecord}>Add Result</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
