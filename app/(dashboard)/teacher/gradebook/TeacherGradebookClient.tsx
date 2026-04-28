"use client";

import { useEffect, useState } from "react";

interface SubjectOption {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
}

interface SectionOption {
  sectionId: string;
  gradeId: string;
  gradeName: string;
  sectionName: string;
  label: string;
  academicYearId: string;
  subjects: SubjectOption[];
}

interface ExamScheduleOption {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
}

interface GridRow {
  studentId: string;
  gradeRecordId: string | null;
  studentName: string;
  admissionNo: string;
  rollNo: number | null;
  marksObtained: number | null;
  remarks: string;
}

interface EditableRow extends GridRow {
  marksInput: string;
}

const DEFAULT_RUBRIC = {
  totalMarks: 100,
  passingMarks: 40,
};

function getPercentage(marksInput: string, totalMarks: number) {
  const marks = Number(marksInput);
  if (!marksInput || !Number.isFinite(marks) || totalMarks <= 0) {
    return "";
  }

  return ((marks / totalMarks) * 100).toFixed(1);
}

function getStatus(marksInput: string, passingMarks: number) {
  const marks = Number(marksInput);
  if (!marksInput || !Number.isFinite(marks)) {
    return {
      label: "Pending",
      color: "#64748b",
      background: "rgba(100, 116, 139, 0.12)",
    };
  }

  if (marks >= passingMarks) {
    return {
      label: "Pass",
      color: "#15803d",
      background: "rgba(22, 163, 74, 0.12)",
    };
  }

  return {
    label: "Fail",
    color: "#b91c1c",
    background: "rgba(220, 38, 38, 0.12)",
  };
}

function formatExamScheduleLabel(schedule: ExamScheduleOption) {
  return `${schedule.name} (${schedule.type})`;
}

export default function TeacherGradebookClient({
  initialSections,
  initialExamSchedules,
}: {
  initialSections: SectionOption[];
  initialExamSchedules: ExamScheduleOption[];
}) {
  const [selectedSectionId, setSelectedSectionId] = useState(
    initialSections.length === 1 ? initialSections[0].sectionId : ""
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    initialSections.length === 1 && initialSections[0].subjects.length === 1
      ? initialSections[0].subjects[0].subjectId
      : ""
  );
  const [selectedExamScheduleId, setSelectedExamScheduleId] = useState("");
  const [subjects, setSubjects] = useState<SubjectOption[]>(
    initialSections.length === 1 ? initialSections[0].subjects : []
  );
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [rubric, setRubric] = useState(DEFAULT_RUBRIC);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subjectAutoSelected, setSubjectAutoSelected] = useState(false);

  const selectedSection =
    initialSections.find((section) => section.sectionId === selectedSectionId) ?? null;
  const selectedSubject =
    subjects.find((subject) => subject.subjectId === selectedSubjectId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadGrid() {
      if (!selectedSectionId) {
        setSubjects([]);
        setRows([]);
        setRubric(DEFAULT_RUBRIC);
        setSubjectAutoSelected(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ sectionId: selectedSectionId });
        if (selectedSubjectId) params.set("subjectId", selectedSubjectId);
        if (selectedExamScheduleId) params.set("examScheduleId", selectedExamScheduleId);

        const res = await fetch(`/api/results/teacher?${params.toString()}`);
        const data = await res.json();

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to load gradebook");
        }

        setSubjects(data.subjects || []);

        if (data.autoSelectedSubjectId && data.autoSelectedSubjectId !== selectedSubjectId) {
          setSelectedSubjectId(data.autoSelectedSubjectId);
          setSubjectAutoSelected(true);
        } else if (!data.autoSelectedSubjectId) {
          setSubjectAutoSelected(false);
        }

        if (data.grid) {
          setRows(
            (data.grid.rows || []).map((row: GridRow) => ({
              ...row,
              marksInput:
                row.marksObtained === null || row.marksObtained === undefined
                  ? ""
                  : String(row.marksObtained),
            }))
          );
          setRubric({
            totalMarks: Number(data.grid.rubric?.totalMarks ?? DEFAULT_RUBRIC.totalMarks),
            passingMarks: Number(data.grid.rubric?.passingMarks ?? DEFAULT_RUBRIC.passingMarks),
          });
        } else {
          setRows([]);
          setRubric(DEFAULT_RUBRIC);
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load gradebook");
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGrid();

    return () => {
      cancelled = true;
    };
  }, [selectedSectionId, selectedSubjectId, selectedExamScheduleId]);

  const enteredRows = rows.filter((row) => row.marksInput.trim() !== "");
  const existingRows = rows.filter((row) => row.gradeRecordId);
  const canSave =
    !!selectedSectionId &&
    !!selectedSubjectId &&
    !!selectedExamScheduleId &&
    enteredRows.length > 0 &&
    !loading &&
    !saving;

  async function reloadCurrentContext() {
    const params = new URLSearchParams({ sectionId: selectedSectionId });
    if (selectedSubjectId) params.set("subjectId", selectedSubjectId);
    if (selectedExamScheduleId) params.set("examScheduleId", selectedExamScheduleId);

    const res = await fetch(`/api/results/teacher?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh gradebook");
    }

    setSubjects(data.subjects || []);
    if (data.grid) {
      setRows(
        (data.grid.rows || []).map((row: GridRow) => ({
          ...row,
          marksInput:
            row.marksObtained === null || row.marksObtained === undefined
              ? ""
              : String(row.marksObtained),
        }))
      );
      setRubric({
        totalMarks: Number(data.grid.rubric?.totalMarks ?? DEFAULT_RUBRIC.totalMarks),
        passingMarks: Number(data.grid.rubric?.passingMarks ?? DEFAULT_RUBRIC.passingMarks),
      });
    } else {
      setRows([]);
    }
  }

  function updateRow(studentId: string, patch: Partial<EditableRow>) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.studentId === studentId ? { ...row, ...patch } : row))
    );
  }

  function handleSectionChange(sectionId: string) {
    setSelectedSectionId(sectionId);
    setSelectedSubjectId("");
    setSelectedExamScheduleId("");
    setRows([]);
    setRubric(DEFAULT_RUBRIC);
    setError("");
    setSuccess("");
    setSubjectAutoSelected(false);
    const section = initialSections.find((entry) => entry.sectionId === sectionId);
    setSubjects(section?.subjects ?? []);
  }

  async function handleSave() {
    if (!selectedSection || !selectedSubjectId || !selectedExamScheduleId) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        gradeId: selectedSection.gradeId,
        sectionId: selectedSection.sectionId,
        subjectId: selectedSubjectId,
        examScheduleId: selectedExamScheduleId,
        totalMarks: rubric.totalMarks,
        passingMarks: rubric.passingMarks,
        records: enteredRows.map((row) => ({
          studentId: row.studentId,
          marksObtained: Number(row.marksInput),
          remarks: row.remarks.trim() || null,
        })),
      };

      const res = await fetch("/api/results/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save results");
      }

      await reloadCurrentContext();
      setSuccess(`${data.count} result(s) saved for ${selectedSection.label} - ${selectedSubject?.subjectName}.`);
    } catch (saveError: any) {
      setError(saveError.message || "Failed to save results");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem" }}>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.45rem", fontWeight: 800, marginBottom: "0.35rem" }}>
              Teacher Results Entry
            </h3>
            <p style={{ color: "hsl(var(--text-muted))", maxWidth: "780px" }}>
              Only your assigned class, section, and subject combinations are available here.
              Select the class context first, then enter or update marks for that exact cohort.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
            {saving
              ? "Saving..."
              : existingRows.length > 0
                ? "Update Results"
                : "Save Results"}
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              background: "rgba(220, 38, 38, 0.1)",
              color: "#b91c1c",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              background: "rgba(22, 163, 74, 0.1)",
              color: "#15803d",
              fontWeight: 600,
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              Class & Section
            </label>
            <select
              className="form-input"
              value={selectedSectionId}
              onChange={(event) => handleSectionChange(event.target.value)}
            >
              <option value="">Select assigned class</option>
              {initialSections.map((section) => (
                <option key={section.sectionId} value={section.sectionId}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              Subject
            </label>
            <select
              className="form-input"
              value={selectedSubjectId}
              onChange={(event) => {
                setSelectedSubjectId(event.target.value);
                setError("");
                setSuccess("");
              }}
              disabled={!selectedSectionId || subjects.length === 0}
            >
              <option value="">
                {selectedSectionId ? "Select assigned subject" : "Select class first"}
              </option>
              {subjects.map((subject) => (
                <option key={subject.subjectId} value={subject.subjectId}>
                  {subject.subjectName} ({subject.subjectCode})
                </option>
              ))}
            </select>
            {subjectAutoSelected && selectedSubject && (
              <div style={{ marginTop: "0.4rem", fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>
                {selectedSubject.subjectName} was auto-selected because this is your only assigned subject for the chosen class.
              </div>
            )}
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              Term / Exam
            </label>
            <select
              className="form-input"
              value={selectedExamScheduleId}
              onChange={(event) => {
                setSelectedExamScheduleId(event.target.value);
                setError("");
                setSuccess("");
              }}
            >
              <option value="">Select assessment period</option>
              {initialExamSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {formatExamScheduleLabel(schedule)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              Total Marks
            </label>
            <input
              type="number"
              className="form-input"
              min={1}
              value={rubric.totalMarks}
              onChange={(event) =>
                setRubric((current) => ({
                  ...current,
                  totalMarks: Math.max(1, Number(event.target.value) || 1),
                }))
              }
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.35rem",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              Pass Marks
            </label>
            <input
              type="number"
              className="form-input"
              min={0}
              max={rubric.totalMarks}
              value={rubric.passingMarks}
              onChange={(event) =>
                setRubric((current) => ({
                  ...current,
                  passingMarks: Math.max(
                    0,
                    Math.min(current.totalMarks, Number(event.target.value) || 0)
                  ),
                }))
              }
            />
          </div>

          <div style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem" }}>
            {selectedSection && selectedSubject ? (
              <span>
                Enter marks for <strong>{selectedSection.label}</strong> in{" "}
                <strong>{selectedSubject.subjectName}</strong>. Percentage and pass/fail update as you type.
              </span>
            ) : (
              <span>Select a class and subject to load the roster.</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
            Loading assigned roster...
          </div>
        ) : !selectedSectionId ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
            Select one of your assigned classes to begin grading.
          </div>
        ) : !selectedSubjectId ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
            Select the subject you are grading for this class.
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
            No active students are enrolled in this class section.
          </div>
        ) : (
          <>
            {!selectedExamScheduleId && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "#b45309",
                  fontWeight: 600,
                }}
              >
                Select a term or exam period before saving. The roster is shown now so you can prepare marks entry in context.
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "hsl(var(--bg))" }}>
                    <th style={{ padding: "0.9rem 1rem", textAlign: "left", borderBottom: "1px solid hsl(var(--border))" }}>
                      Student
                    </th>
                    <th style={{ padding: "0.9rem 1rem", textAlign: "left", borderBottom: "1px solid hsl(var(--border))" }}>
                      Roll No.
                    </th>
                    <th style={{ padding: "0.9rem 1rem", textAlign: "center", borderBottom: "1px solid hsl(var(--border))" }}>
                      Marks
                    </th>
                    <th style={{ padding: "0.9rem 1rem", textAlign: "center", borderBottom: "1px solid hsl(var(--border))" }}>
                      Percentage
                    </th>
                    <th style={{ padding: "0.9rem 1rem", textAlign: "center", borderBottom: "1px solid hsl(var(--border))" }}>
                      Status
                    </th>
                    <th style={{ padding: "0.9rem 1rem", textAlign: "left", borderBottom: "1px solid hsl(var(--border))" }}>
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const percentage = getPercentage(row.marksInput, rubric.totalMarks);
                    const status = getStatus(row.marksInput, rubric.passingMarks);

                    return (
                      <tr key={row.studentId} style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                        <td style={{ padding: "0.9rem 1rem" }}>
                          <div style={{ fontWeight: 700 }}>{row.studentName}</div>
                          <div style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>
                            {row.admissionNo}
                          </div>
                        </td>
                        <td style={{ padding: "0.9rem 1rem", color: "hsl(var(--text-muted))" }}>
                          {row.rollNo ?? "-"}
                        </td>
                        <td style={{ padding: "0.9rem 1rem", textAlign: "center" }}>
                          <input
                            type="number"
                            className="form-input"
                            min={0}
                            max={rubric.totalMarks}
                            value={row.marksInput}
                            onChange={(event) => updateRow(row.studentId, { marksInput: event.target.value })}
                            style={{ width: "110px", margin: "0 auto", textAlign: "center" }}
                          />
                        </td>
                        <td style={{ padding: "0.9rem 1rem", textAlign: "center", fontWeight: 700 }}>
                          {percentage ? `${percentage}%` : "-"}
                        </td>
                        <td style={{ padding: "0.9rem 1rem", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "72px",
                              padding: "0.35rem 0.65rem",
                              borderRadius: "999px",
                              color: status.color,
                              background: status.background,
                              fontWeight: 700,
                              fontSize: "0.78rem",
                            }}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: "0.9rem 1rem" }}>
                          <input
                            type="text"
                            className="form-input"
                            value={row.remarks}
                            onChange={(event) => updateRow(row.studentId, { remarks: event.target.value })}
                            placeholder="Optional remark"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
