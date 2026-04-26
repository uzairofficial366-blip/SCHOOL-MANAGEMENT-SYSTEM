"use client";

import { Plus, FileText, Sliders } from "lucide-react";

export default function TeacherAssignmentsClient({ assignments, totalStudents }: any) {
  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem" }}>
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to right, hsl(var(--bg-card)), hsl(var(--accent)/0.05))" }}>
        <div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Workflow Manager</h3>
          <p style={{ color: "hsl(var(--text-muted))" }}>Creation Wizard, Submission Tracking, Online Grading.</p>
        </div>
        <button className="btn btn-primary"><Plus size={18} /> Create Assignment Wizard</button>
      </div>

      <div className="grid-2">
        {assignments?.map((assign: any) => (
          <div key={assign.id} className="card glass">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "1.2rem", fontWeight: 800 }}>{assign.title}</h4>
              <span className="badge badge-warning">Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))", marginBottom: "1.5rem" }}>
              {assign.instructions || "No instructions provided."}
            </p>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                <strong>Submission Tracking</strong>
                <span>{assign.submissions.length} / {totalStudents} Submitted</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(assign.submissions.length / Math.max(1, totalStudents)) * 100}%`, background: "hsl(var(--primary))" }}></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button className="btn btn-sm btn-ghost"><FileText size={14} /> Annotate PDF</button>
              <button className="btn btn-sm btn-ghost"><Sliders size={14} /> Late Policy</button>
              <button className="btn btn-sm" style={{ background: "hsl(var(--info)/0.1)", color: "hsl(var(--info))", border: "1px solid hsl(var(--info)/0.3)" }}>
                <ShieldCheck size={14} /> Plagiarism Check
              </button>
            </div>
          </div>
        ))}
        {(!assignments || assignments.length === 0) && <p>No assignments found.</p>}
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
