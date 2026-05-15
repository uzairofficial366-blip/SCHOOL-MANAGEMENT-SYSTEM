"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type ParentOption = {
  parentId: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
};

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const currentAcademicYear = academicYears.find(y => y.isCurrent)?.id || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    gradeId: "",
    sectionId: "",
    academicYearId: currentAcademicYear
  });
  const [parentMode, setParentMode] = useState<"create" | "existing">("create");
  const [parentForm, setParentForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    relationship: "Father",
  });
  const [existingParentId, setExistingParentId] = useState("");
  const [parentSearch, setParentSearch] = useState("");
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);

  const availableSections = sections.filter(s => s.gradeId === form.gradeId && s.academicYearId === form.academicYearId);

  useEffect(() => {
    if (parentMode !== "existing") return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/parents?search=${encodeURIComponent(parentSearch)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok) setParentOptions(data.parents || []);
      } catch (err: any) {
        if (err.name !== "AbortError") setParentOptions([]);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [parentMode, parentSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (parentMode === "create") {
      if (!parentForm.name.trim()) return setError("Parent name is required");
      if (!parentForm.email.trim()) return setError("Parent email/login ID is required");
      if (!parentForm.password) return setError("Parent password is required");
    }
    if (parentMode === "existing" && !existingParentId) {
      return setError("Select an existing parent account");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student: form,
          parentMode,
          parent: parentMode === "create" ? parentForm : undefined,
          existingParentId: parentMode === "existing" ? existingParentId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create student");

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem"
    }} onClick={onClose}>
      <div className="card" style={{
        width: "100%", maxWidth: 650, padding: "2rem", animation: "fadeUp 0.3s ease",
        maxHeight: "calc(100vh - 3rem)", overflowY: "auto"
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
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>Parent/Guardian Login</div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <button type="button" className={`btn btn-sm ${parentMode === "create" ? "btn-primary" : "btn-ghost"}`} onClick={() => setParentMode("create")}>Create New Parent</button>
              <button type="button" className={`btn btn-sm ${parentMode === "existing" ? "btn-primary" : "btn-ghost"}`} onClick={() => setParentMode("existing")}>Select Existing Parent</button>
            </div>

            {parentMode === "create" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Parent Name *</label>
                  <input required className="form-input" value={parentForm.name} onChange={(e) => setParentForm({ ...parentForm, name: e.target.value })} placeholder="e.g. Muhammad Ali" />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Email/Login ID *</label>
                  <input required type="email" className="form-input" value={parentForm.email} onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })} placeholder="parent@school.edu" />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Phone</label>
                  <input className="form-input" value={parentForm.phone} onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })} placeholder="+92 300 1234567" />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Password *</label>
                  <input required type="password" className="form-input" value={parentForm.password} onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })} placeholder="Create password" />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship *</label>
                  <select required className="form-input" value={parentForm.relationship} onChange={(e) => setParentForm({ ...parentForm, relationship: e.target.value })}>
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Guardian</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">Search Parent</label>
                  <input className="form-input" value={parentSearch} onChange={(e) => setParentSearch(e.target.value)} placeholder="Search by name, email, or phone" />
                </div>
                <div className="form-group">
                  <label className="form-label">Existing Parent Account *</label>
                  <select required className="form-input" value={existingParentId} onChange={(e) => setExistingParentId(e.target.value)}>
                    <option value="">Select parent...</option>
                    {parentOptions.map((parent) => (
                      <option key={parent.parentId} value={parent.parentId}>
                        {parent.name} - {parent.email || parent.phone} ({parent.relationship})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
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
  , document.body);
}
