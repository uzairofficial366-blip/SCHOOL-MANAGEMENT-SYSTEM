"use client";

import { useEffect, useState } from "react";

type AttendanceChoice = "PRESENT" | "ABSENT" | "EXCUSED" | "LATE" | "";

interface SectionOption {
  sectionId: string;
  gradeId: string;
  gradeName: string;
  sectionName: string;
  label: string;
  studentCount: number;
}

interface AttendanceRow {
  studentId: string;
  enrollmentId: string;
  studentName: string;
  admissionNo: string;
  rollNo: number | null;
  status: AttendanceChoice;
}

interface DateInfo {
  today: string;
  targetDate: string;
  editable: boolean;
  reason: string;
  cutoffHour: number;
  cutoffMinute: number;
}

const STATUS_OPTIONS: { value: Exclude<AttendanceChoice, "">; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "EXCUSED", label: "Leave" },
  { value: "LATE", label: "Late" },
];

function formatCutoff(hour: number, minute: number) {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function TeacherAttendanceClient({
  initialSections,
  initialSelectedSectionId,
  tenantTimeZone,
}: {
  initialSections: SectionOption[];
  initialSelectedSectionId: string;
  tenantTimeZone: string;
}) {
  const [selectedSectionId, setSelectedSectionId] = useState(initialSelectedSectionId);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasSubmittedRecords, setHasSubmittedRecords] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (selectedSectionId) params.set("sectionId", selectedSectionId);
        if (selectedDate) params.set("date", selectedDate);

        const res = await fetch(`/api/attendance/teacher?${params.toString()}`);
        const data = await res.json();

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to load attendance");
        }

        setDateInfo(data.dateInfo || null);
        if (!selectedDate && data.dateInfo?.targetDate) {
          setSelectedDate(data.dateInfo.targetDate);
        }

        if (data.view) {
          setRows(data.view.rows || []);
          setHasSubmittedRecords(Boolean(data.view.hasSubmittedRecords));
        } else {
          setRows([]);
          setHasSubmittedRecords(false);
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load attendance");
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [selectedSectionId, selectedDate]);

  const selectedSection =
    initialSections.find((section) => section.sectionId === selectedSectionId) ?? null;
  const isEditable = Boolean(dateInfo?.editable && selectedSectionId);

  function updateRow(studentId: string, status: AttendanceChoice) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.studentId === studentId ? { ...row, status } : row))
    );
  }

  function markAll(status: Exclude<AttendanceChoice, "">) {
    if (!isEditable) {
      return;
    }

    setRows((currentRows) => currentRows.map((row) => ({ ...row, status })));
    setSuccess("");
    setError("");
  }

  async function submitAttendance() {
    if (!selectedSectionId || !dateInfo || !isEditable) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/attendance/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          date: dateInfo.targetDate,
          records: rows.map((row) => ({
            studentId: row.studentId,
            status: (row.status || "PRESENT") as Exclude<AttendanceChoice, "">,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit attendance");
      }

      setHasSubmittedRecords(true);
      setSuccess(
        `Attendance saved for ${selectedSection?.label || "the selected class"} on ${data.date}.`
      );
    } catch (saveError: any) {
      setError(saveError.message || "Failed to submit attendance");
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
              Class Attendance
            </h3>
            <p style={{ color: "hsl(var(--text-muted))", maxWidth: "760px" }}>
              Teachers can mark attendance only for assigned classes. Past dates are view-only,
              future dates are blocked, and today's record locks after{" "}
              {dateInfo ? formatCutoff(dateInfo.cutoffHour, dateInfo.cutoffMinute) : "the cutoff"}{" "}
              in {tenantTimeZone}.
            </p>
          </div>
          <button className="btn btn-primary" onClick={submitAttendance} disabled={!isEditable || saving || rows.length === 0}>
            {saving
              ? "Submitting..."
              : hasSubmittedRecords
                ? "Submit Attendance Update"
                : "Submit Attendance"}
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
            <label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 700, fontSize: "0.85rem" }}>
              Class & Section
            </label>
            <select
              className="form-input"
              value={selectedSectionId}
              onChange={(event) => {
                setSelectedSectionId(event.target.value);
                setSuccess("");
                setError("");
              }}
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
            <label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 700, fontSize: "0.85rem" }}>
              Date
            </label>
            <input
              type="date"
              className="form-input"
              value={selectedDate || dateInfo?.targetDate || ""}
              max={dateInfo?.today || undefined}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSuccess("");
                setError("");
              }}
            />
          </div>
        </div>

        {dateInfo && (
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              background: dateInfo.editable ? "rgba(59, 130, 246, 0.08)" : "rgba(245, 158, 11, 0.12)",
              color: dateInfo.editable ? "#1d4ed8" : "#b45309",
              fontWeight: 600,
            }}
          >
            {dateInfo.reason}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btn-success" onClick={() => markAll("PRESENT")} disabled={!isEditable || rows.length === 0}>
            Mark All Present
          </button>
          <button className="btn btn-danger" onClick={() => markAll("ABSENT")} disabled={!isEditable || rows.length === 0}>
            Mark All Absent
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
            Loading attendance roster...
          </div>
        ) : !selectedSectionId ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
            Select one of your assigned classes to mark attendance.
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
            No active students found for this class section.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800 }}>
                  {selectedSection?.label}
                </h4>
                <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem" }}>
                  {rows.length} student(s) for {dateInfo?.targetDate}
                </p>
              </div>
              {hasSubmittedRecords && (
                <span
                  className="badge"
                  style={{
                    background: "rgba(22, 163, 74, 0.12)",
                    color: "#15803d",
                    fontWeight: 700,
                  }}
                >
                  Attendance already submitted
                </span>
              )}
            </div>

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
                    <th style={{ padding: "0.9rem 1rem", textAlign: "left", borderBottom: "1px solid hsl(var(--border))" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
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
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <select
                          className="form-input"
                          value={row.status || ""}
                          disabled={!isEditable}
                          onChange={(event) =>
                            updateRow(row.studentId, event.target.value as AttendanceChoice)
                          }
                          style={{ maxWidth: "180px" }}
                        >
                          <option value="">Not marked</option>
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
