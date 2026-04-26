"use client";

import { Settings, Download } from "lucide-react";

export default function TeacherGradebookClient({ roster }: any) {
  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem" }}>
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Robust Gradebook</h3>
          <p style={{ color: "hsl(var(--text-muted))" }}>Automated calculations, custom scales, and flagging.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="btn btn-ghost"><Settings size={18} /> Grading Weights</button>
          <button className="btn btn-primary"><Download size={18} /> Export PDF/Excel</button>
        </div>
      </div>

      <div className="card glass">
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
          <select className="form-input" style={{ width: "250px" }}>
            <option>Select Section</option>
            {roster?.map((s: any) => <option key={s.id}>{s.grade.name} - {s.name}</option>)}
          </select>
          <select className="form-input" style={{ width: "250px" }}>
            <option>Select Grading Scale (Percentage)</option>
            <option>Letter Grades (A-F)</option>
          </select>
        </div>
        
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Exam (40%)</th>
                <th>Quiz (30%)</th>
                <th>Homework (30%)</th>
                <th>Final Average</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>JD</div>
                    <strong style={{ fontSize: "0.95rem" }}>John Doe</strong>
                  </div>
                </td>
                <td><input type="text" className="form-input" style={{ width: "80px", padding: "0.3rem" }} defaultValue="88" /></td>
                <td><input type="text" className="form-input" style={{ width: "80px", padding: "0.3rem" }} defaultValue="92" /></td>
                <td><input type="text" className="form-input" style={{ width: "80px", padding: "0.3rem" }} defaultValue="95" /></td>
                <td><strong style={{ fontSize: "1.1rem" }}>91.3%</strong></td>
                <td><span className="badge badge-success">Excellent</span></td>
              </tr>
              <tr>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.8rem", background: "hsl(var(--danger))" }}>JS</div>
                    <strong style={{ fontSize: "0.95rem" }}>Jane Smith</strong>
                  </div>
                </td>
                <td><input type="text" className="form-input" style={{ width: "80px", padding: "0.3rem", border: "1px solid hsl(var(--danger))" }} defaultValue="45" /></td>
                <td><input type="text" className="form-input" style={{ width: "80px", padding: "0.3rem" }} defaultValue="60" /></td>
                <td><input type="text" className="form-input" style={{ width: "80px", padding: "0.3rem" }} defaultValue="50" /></td>
                <td><strong style={{ fontSize: "1.1rem", color: "hsl(var(--danger))" }}>51.0%</strong></td>
                <td><span className="badge badge-danger">Needs Help</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
