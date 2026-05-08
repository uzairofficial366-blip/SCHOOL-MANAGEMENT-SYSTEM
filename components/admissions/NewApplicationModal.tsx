"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  cycles: any[];
  grades: any[];
  onClose: () => void;
}

export default function NewApplicationModal({ cycles, grades, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    cycleId: cycles[0]?.id || "",
    studentName: "",
    dateOfBirth: "",
    gender: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    gradeAppliedFor: "",
    previousSchool: "",
  });

  // ── Body scroll lock
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => { document.body.classList.remove("modal-open"); };
  }, []);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.cycleId) return "Select an admission cycle";
      if (!form.studentName.trim()) return "Student name is required";
      if (!form.gradeAppliedFor) return "Select grade";
    }
    if (step === 2) {
      if (!form.parentName.trim()) return "Parent name is required";
      if (!form.parentEmail.trim()) return "Parent email is required";
      if (!form.parentPhone.trim()) return "Parent phone is required";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admissions/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create application");
      router.refresh();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Student Info" },
    { num: 2, label: "Parent Info" },
    { num: 3, label: "Review & Submit" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Application</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem", gap: "0.25rem" }}>
          {steps.map((s, i) => (
            <div key={s.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                background: step > s.num ? "hsl(var(--success))" : step === s.num ? "hsl(var(--primary))" : "hsl(var(--border))",
                color: step >= s.num ? "white" : "hsl(var(--text-muted))",
              }}>
                {step > s.num ? "✓" : s.num}
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: "0 0.4rem", background: step > s.num ? "hsl(var(--success))" : "hsl(var(--border))" }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          {steps.map((s) => (
            <div key={s.num} style={{ fontSize: "0.7rem", color: step === s.num ? "hsl(var(--primary))" : "hsl(var(--text-muted))", textAlign: "center", flex: 1, fontWeight: step === s.num ? 700 : 400 }}>
              {s.label}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: "0.5rem 0.75rem", background: "hsl(var(--danger)/0.08)", border: "1px solid hsl(var(--danger)/0.2)", borderRadius: 8, color: "hsl(var(--danger))", fontSize: "0.82rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* Step 1: Student Info */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {cycles.length === 0 ? (
              <div style={{ padding: "1rem", background: "hsl(var(--warning)/0.1)", border: "1px solid hsl(var(--warning)/0.3)", borderRadius: 8, color: "hsl(var(--warning))", textAlign: "center" }}>
                <strong>No Open Admission Cycles Found</strong>
                <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>You must create and open an admission cycle before creating an application.</p>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Admission Cycle *</label>
                <select className="form-input" value={form.cycleId} onChange={(e) => updateField("cycleId", e.target.value)}>
                  <option value="">Select cycle...</option>
                  {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Student Full Name *</label>
              <input className="form-input" value={form.studentName} onChange={(e) => updateField("studentName", e.target.value)} placeholder="e.g. Ahmed Khan" disabled={cycles.length === 0} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input className="form-input" type="date" value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} disabled={cycles.length === 0} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" value={form.gender} onChange={(e) => updateField("gender", e.target.value)} disabled={cycles.length === 0}>
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Grade Applying For *</label>
              <select className="form-input" value={form.gradeAppliedFor} onChange={(e) => updateField("gradeAppliedFor", e.target.value)} disabled={cycles.length === 0}>
                <option value="">Select grade...</option>
                {grades.map((g: any) => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Previous School</label>
              <input className="form-input" value={form.previousSchool} onChange={(e) => updateField("previousSchool", e.target.value)} placeholder="Name of previous school" disabled={cycles.length === 0} />
            </div>
          </div>
        )}

        {/* Step 2: Parent Info */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Parent/Guardian Name *</label>
              <input className="form-input" value={form.parentName} onChange={(e) => updateField("parentName", e.target.value)} placeholder="e.g. Muhammad Ali" />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Email *</label>
              <input className="form-input" type="email" value={form.parentEmail} onChange={(e) => updateField("parentEmail", e.target.value)} placeholder="parent@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Phone *</label>
              <input className="form-input" type="tel" value={form.parentPhone} onChange={(e) => updateField("parentPhone", e.target.value)} placeholder="+92 300 1234567" />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>Review Application Details</div>
            {[
              { label: "Cycle", value: cycles.find((c: any) => c.id === form.cycleId)?.name || "—" },
              { label: "Student", value: form.studentName },
              { label: "Grade", value: form.gradeAppliedFor },
              { label: "Gender", value: form.gender || "—" },
              { label: "DOB", value: form.dateOfBirth || "—" },
              { label: "Previous School", value: form.previousSchool || "—" },
              { label: "Parent", value: form.parentName },
              { label: "Email", value: form.parentEmail },
              { label: "Phone", value: form.parentPhone },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0.75rem", background: "hsl(var(--bg))", borderRadius: 8, fontSize: "0.82rem" }}>
                <span style={{ color: "hsl(var(--text-muted))", fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={step > 1 ? () => setStep(step - 1) : onClose}>
            {step > 1 ? "← Back" : "Cancel"}
          </button>
          {step < 3 ? (
            <button className="btn btn-primary btn-sm" onClick={handleNext} disabled={step === 1 && cycles.length === 0}>Next →</button>
          ) : (
            <button className="btn btn-primary btn-sm" disabled={loading} onClick={handleSubmit}>
              {loading ? "Creating..." : "Create Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
