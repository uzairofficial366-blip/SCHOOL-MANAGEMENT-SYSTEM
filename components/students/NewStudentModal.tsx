"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStudentModal({ 
  onClose, 
  grades, 
  sections, 
  academicYears 
}: { 
  onClose: () => void;
  grades: any[];
  sections: any[];
  academicYears: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const currentAcademicYear = academicYears.find(y => y.isCurrent)?.id || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    parentName: "",
    parentPhone: "",
    gradeId: "",
    sectionId: "",
    academicYearId: currentAcademicYear
  });

  const availableSections = sections.filter(s => s.gradeId === form.gradeId && s.academicYearId === form.academicYearId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create Student
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create student");

      // 2. Enroll Student if section is selected
      if (form.sectionId && form.academicYearId) {
        const enrollRes = await fetch("/api/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: data.student.id,
            sectionId: form.sectionId,
            academicYearId: form.academicYearId
          })
        });
        
        const enrollData = await enrollRes.json();
        if (!enrollRes.ok) {
          // Note: The student is created, but enrollment failed
          throw new Error(`Student created, but enrollment failed: ${enrollData.error}`);
        }
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", overflowY: "auto"
    }} onClick={onClose}>
      <div className="card" style={{
        width: "100%", maxWidth: 650, padding: "2rem", animation: "fadeUp 0.3s ease", margin: "auto"
      }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>Direct Student Registration</h2>
            <p style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>Bypass admission workflow, register and enroll a student immediately.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "hsl(var(--text-muted))" }}>✕</button>
        </div>

        {error && (
          <div style={{ padding: "0.5rem 0.75rem", background: "hsl(var(--danger)/0.08)", border: "1px solid hsl(var(--danger)/0.2)", borderRadius: 8, color: "hsl(var(--danger))", fontSize: "0.82rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Student Full Name *</label>
              <input required className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ahmed Khan" />
            </div>
            <div className="form-group">
              <label className="form-label">Student Login Email *</label>
              <input required type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ahmed@school.edu" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input required className="form-input" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select required className="form-input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ padding: "1rem", background: "hsl(var(--primary)/0.05)", border: "1px solid hsl(var(--primary)/0.2)", borderRadius: 8, marginTop: "0.5rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem", color: "hsl(var(--primary))" }}>Enrollment Details (Optional)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <select className="form-input" value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value, sectionId: "" })}>
                  <option value="">Select Year</option>
                  {academicYears.map(y => (
                    <option key={y.id} value={y.id}>{y.name} {y.isCurrent && "(Current)"}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Grade Level</label>
                <select className="form-input" value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value, sectionId: "" })}>
                  <option value="">Select Grade</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <select className="form-input" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} disabled={!form.gradeId || !form.academicYearId}>
                  <option value="">Select Section</option>
                  {availableSections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ padding: "1rem", background: "hsl(var(--bg))", borderRadius: 8, marginTop: "0.5rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>Parent/Guardian Details (Optional)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Parent Name</label>
                <input className="form-input" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder="e.g. Muhammad Ali" />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Phone</label>
                <input className="form-input" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="+92 300 1234567" />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid hsl(var(--border))" }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? "Registering..." : "Register & Enroll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
