"use client";

export interface DmcPayload {
  school: {
    name: string;
    logoUrl: string | null;
    address: string | null;
    contact: string | null;
    email: string | null;
  };
  student: {
    name: string;
    admissionNo: string;
    rollNo: number | null;
    dateOfBirth: string | null;
    className: string | null;
    sectionName: string | null;
    academicYear: string | null;
    fatherName: string | null;
    parentRelation: string | null;
  };
  exam: {
    name: string;
    typeLabel: string;
    title: string;
    session: string;
  };
  marks: Array<{
    serialNo: number;
    subjectName: string;
    subjectCode: string;
    totalMarks: number;
    passingMarks: number | null;
    marksObtained: number;
    grade: string | null;
    remarks: string | null;
    failedSubject: boolean;
  }>;
  summary: {
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    overallGrade: string;
    resultStatus: string;
    position: string | null;
    attendance: string | null;
    remarks: string | null;
  };
  issuedAt: string;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function numberText(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function InfoCell({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="dmc-info-cell">
      <span>{label}</span>
      <strong>{value ?? "-"}</strong>
    </div>
  );
}

export default function DmcPrintTemplate({ dmc }: { dmc: DmcPayload }) {
  const issueDate = formatDate(dmc.issuedAt);

  return (
    <section className="print-area dmc-sheet" aria-label="Detailed Marks Certificate">
      <header className="dmc-header">
        <div className="dmc-logo">
          {dmc.school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dmc.school.logoUrl} alt={dmc.school.name} />
          ) : (
            <span>{dmc.school.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="dmc-school">
          <h1>{dmc.school.name}</h1>
          <p>{[dmc.school.address, dmc.school.contact, dmc.school.email].filter(Boolean).join(" | ")}</p>
          <h2>{dmc.exam.title}</h2>
          <div>
            {dmc.exam.name} | Academic Session: {dmc.exam.session}
          </div>
        </div>
      </header>

      <div className="dmc-section-title">Student Information</div>
      <div className="dmc-info-grid">
        <InfoCell label="Student Name" value={dmc.student.name} />
        <InfoCell label="Father / Parent" value={dmc.student.fatherName} />
        <InfoCell label="Admission No" value={dmc.student.admissionNo} />
        <InfoCell label="Roll No" value={dmc.student.rollNo} />
        <InfoCell label="Class" value={dmc.student.className} />
        <InfoCell label="Section" value={dmc.student.sectionName} />
        <InfoCell label="Date of Birth" value={formatDate(dmc.student.dateOfBirth)} />
        <InfoCell label="Exam Type" value={dmc.exam.typeLabel} />
      </div>

      <div className="dmc-section-title">Subject-wise Marks</div>
      <table className="dmc-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Subject</th>
            <th>Total Marks</th>
            <th>Passing Marks</th>
            <th>Marks Obtained</th>
            <th>Grade</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {dmc.marks.map((mark) => (
            <tr key={`${mark.subjectCode}-${mark.serialNo}`} className={mark.failedSubject ? "dmc-failed-row" : ""}>
              <td>{mark.serialNo}</td>
              <td>
                <strong>{mark.subjectName}</strong>
                <small>{mark.subjectCode}</small>
              </td>
              <td>{numberText(mark.totalMarks)}</td>
              <td>{mark.passingMarks ?? "-"}</td>
              <td>{numberText(mark.marksObtained)}</td>
              <td>{mark.grade ?? "-"}</td>
              <td>{mark.remarks ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="dmc-summary">
        <InfoCell label="Total Marks" value={numberText(dmc.summary.totalMarks)} />
        <InfoCell label="Total Obtained" value={numberText(dmc.summary.obtainedMarks)} />
        <InfoCell label="Percentage" value={`${dmc.summary.percentage.toFixed(2)}%`} />
        <InfoCell label="Overall Grade" value={dmc.summary.overallGrade} />
        <InfoCell label="Result Status" value={dmc.summary.resultStatus} />
        <InfoCell label="Attendance" value={dmc.summary.attendance} />
      </div>

      <div className="dmc-remarks">
        <strong>Remarks:</strong> {dmc.summary.remarks ?? "-"}
      </div>

      <footer className="dmc-footer">
        <div>
          <span>Prepared By</span>
        </div>
        <div>
          <span>Checked By</span>
        </div>
        <div>
          <span>Principal Signature</span>
        </div>
        <div className="dmc-stamp">
          <span>School Stamp</span>
        </div>
      </footer>

      <div className="dmc-issue-date">Date of Issue: {issueDate}</div>
    </section>
  );
}
