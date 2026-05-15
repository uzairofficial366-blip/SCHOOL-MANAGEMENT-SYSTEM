"use client";

import { useMemo, useState } from "react";
import { FileText, Printer, Search } from "lucide-react";
import DmcPrintTemplate, { DmcPayload } from "@/components/admin/DmcPrintTemplate";

interface Grade {
  id: string;
  name: string;
  level: number;
}

interface Section {
  id: string;
  name: string;
  gradeId: string;
  grade: { name: string; level: number };
}

interface ExamSchedule {
  id: string;
  name: string;
  type: string;
  academicYear: { name: string };
}

interface StudentOption {
  id: string;
  admissionNo: string;
  user?: { name?: string | null };
}

const EXAM_TYPE_OPTIONS = [
  { value: "MIDTERM", label: "Mid Term" },
  { value: "FINAL", label: "Final Term" },
  { value: "PRE_BOARD", label: "Pre Board" },
  { value: "OTHER", label: "Other" },
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "PRACTICAL", label: "Practical" },
];

export default function DmcAdminClient({
  grades,
  sections,
  examSchedules,
}: {
  grades: Grade[];
  sections: Section[];
  examSchedules: ExamSchedule[];
}) {
  const [gradeId, setGradeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [examType, setExamType] = useState("MIDTERM");
  const [examScheduleId, setExamScheduleId] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingDmc, setLoadingDmc] = useState(false);
  const [message, setMessage] = useState("");
  const [dmc, setDmc] = useState<DmcPayload | null>(null);

  const filteredSections = useMemo(
    () => (gradeId ? sections.filter((section) => section.gradeId === gradeId) : sections),
    [gradeId, sections]
  );

  const filteredSchedules = useMemo(
    () => examSchedules.filter((schedule) => schedule.type === examType),
    [examSchedules, examType]
  );

  async function fetchStudents(nextSectionId: string) {
    setStudentId("");
    setDmc(null);
    setStudents([]);
    if (!nextSectionId) return;

    setLoadingStudents(true);
    setMessage("");
    try {
      const res = await fetch(`/api/students?sectionId=${nextSectionId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load students");
      setStudents(data.students || []);
    } catch (error: any) {
      setMessage(error.message || "Could not load students");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function generateDmc() {
    if (!studentId) {
      setMessage("Select a student first.");
      return;
    }

    setLoadingDmc(true);
    setMessage("");
    setDmc(null);
    try {
      const params = new URLSearchParams({ studentId, examType });
      if (examScheduleId) params.set("examScheduleId", examScheduleId);

      const res = await fetch(`/api/admin/dmc?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate DMC");
      setDmc(data);
    } catch (error: any) {
      setMessage(error.message || "Could not generate DMC");
    } finally {
      setLoadingDmc(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        .dmc-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .dmc-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .dmc-preview-wrap {
          margin-top: 1.5rem;
          overflow-x: auto;
        }

        .dmc-sheet {
          width: min(100%, 210mm);
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          color: #111827;
          border: 1px solid #111827;
          padding: 14mm;
          font-family: Arial, Helvetica, sans-serif;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
        }

        .dmc-header {
          display: grid;
          grid-template-columns: 88px 1fr;
          gap: 16px;
          align-items: center;
          border-bottom: 3px double #111827;
          padding-bottom: 14px;
          margin-bottom: 14px;
        }

        .dmc-logo {
          width: 78px;
          height: 78px;
          border: 2px solid #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 20px;
        }

        .dmc-logo img {
          max-width: 70px;
          max-height: 70px;
          object-fit: contain;
        }

        .dmc-school {
          text-align: center;
        }

        .dmc-school h1 {
          font-size: 28px;
          line-height: 1.1;
          margin: 0 0 4px;
          text-transform: uppercase;
        }

        .dmc-school p {
          margin: 0 0 10px;
          font-size: 12px;
        }

        .dmc-school h2 {
          display: inline-block;
          margin: 0 0 6px;
          padding: 6px 16px;
          border: 1px solid #111827;
          font-size: 18px;
          text-transform: uppercase;
        }

        .dmc-section-title {
          margin: 16px 0 8px;
          padding: 6px 10px;
          background: #e5e7eb;
          border: 1px solid #111827;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0;
        }

        .dmc-info-grid,
        .dmc-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border-top: 1px solid #111827;
          border-left: 1px solid #111827;
        }

        .dmc-info-cell {
          min-height: 48px;
          padding: 7px 8px;
          border-right: 1px solid #111827;
          border-bottom: 1px solid #111827;
        }

        .dmc-info-cell span {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          color: #374151;
          margin-bottom: 4px;
        }

        .dmc-info-cell strong {
          display: block;
          font-size: 13px;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .dmc-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #111827;
          font-size: 12px;
        }

        .dmc-table th,
        .dmc-table td {
          border: 1px solid #111827;
          padding: 8px;
          text-align: center;
          color: #111827;
        }

        .dmc-table th {
          background: #e5e7eb;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0;
        }

        .dmc-table td:nth-child(2),
        .dmc-table th:nth-child(2) {
          text-align: left;
        }

        .dmc-table small {
          display: block;
          color: #4b5563;
          margin-top: 2px;
        }

        .dmc-failed-row td {
          background: #fff1f2;
        }

        .dmc-summary {
          grid-template-columns: repeat(6, minmax(0, 1fr));
          margin-top: 16px;
        }

        .dmc-remarks {
          border: 1px solid #111827;
          border-top: 0;
          padding: 10px;
          font-size: 12px;
        }

        .dmc-footer {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-top: 38px;
          align-items: end;
        }

        .dmc-footer div {
          min-height: 64px;
          border-bottom: 1px solid #111827;
          display: flex;
          align-items: end;
          justify-content: center;
          padding-bottom: 6px;
          font-size: 12px;
          font-weight: 700;
        }

        .dmc-stamp {
          border: 1px dashed #111827;
          border-bottom-style: dashed !important;
        }

        .dmc-issue-date {
          margin-top: 12px;
          text-align: right;
          font-size: 11px;
        }

        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          .print-area,
          .print-area * {
            visibility: visible;
          }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 190mm;
            min-height: 277mm;
            margin: 0;
            box-shadow: none;
            border: 1px solid #111827;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print,
          .sidebar,
          .topbar {
            display: none !important;
          }
        }
      `}</style>

      <div className="card no-print">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.25rem" }}>DMC / Result Card</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Select a class, section, student, and exam period to preview a printable result card.
            </p>
          </div>
          {dmc && (
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} /> Print DMC
            </button>
          )}
        </div>

        <div className="dmc-controls">
          <div className="form-group">
            <label className="form-label">Class</label>
            <select
              className="form-input"
              value={gradeId}
              onChange={(event) => {
                setGradeId(event.target.value);
                setSectionId("");
                setStudentId("");
                setStudents([]);
                setDmc(null);
              }}
            >
              <option value="">Select Class</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Section</label>
            <select
              className="form-input"
              value={sectionId}
              onChange={(event) => {
                setSectionId(event.target.value);
                fetchStudents(event.target.value);
              }}
            >
              <option value="">Select Section</option>
              {filteredSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.grade.name} - {section.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Student</label>
            <select className="form-input" value={studentId} onChange={(event) => setStudentId(event.target.value)} disabled={!sectionId || loadingStudents}>
              <option value="">{loadingStudents ? "Loading students..." : "Select Student"}</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.user?.name || "Student"} ({student.admissionNo})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Exam Type</label>
            <select
              className="form-input"
              value={examType}
              onChange={(event) => {
                setExamType(event.target.value);
                setExamScheduleId("");
                setDmc(null);
              }}
            >
              {EXAM_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Exam / Session</label>
            <select className="form-input" value={examScheduleId} onChange={(event) => setExamScheduleId(event.target.value)}>
              <option value="">Latest matching exam</option>
              {filteredSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name} ({schedule.academicYear.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>
            {message}
          </div>
        )}

        <div className="dmc-actions">
          <button className="btn btn-secondary" onClick={generateDmc} disabled={loadingDmc}>
            <Search size={16} /> {loadingDmc ? "Generating..." : "Generate DMC"}
          </button>
          {dmc && (
            <button className="btn btn-primary" onClick={() => window.print()}>
              <FileText size={16} /> Print Result Card
            </button>
          )}
        </div>
      </div>

      <div className="dmc-preview-wrap">
        {dmc ? (
          <DmcPrintTemplate dmc={dmc} />
        ) : (
          <div className="card no-print" style={{ marginTop: "1.5rem", textAlign: "center", color: "var(--text-muted)", padding: "3rem 1rem" }}>
            Generate a DMC to preview the printable A4 result card.
          </div>
        )}
      </div>
    </>
  );
}
