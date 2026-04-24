"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  academicYears: any[];
  onClose: () => void;
}

export default function NewCycleModal({ academicYears, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    academicYearId: academicYears[0]?.id || "",
    startDate: "",
    endDate: "",
    totalSeats: "",
    status: "OPEN",
  });

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Cycle name is required"); return; }
    if (!form.academicYearId) { setError("Select an academic year"); return; }
    if (!form.startDate) { setError("Start date is required"); return; }
    if (!form.endDate) { setError("End date is required"); return; }
    if (!form.totalSeats) { setError("Total seats is required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create cycle");
      router.refresh();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
    }} onClick={onClose}>
      <div className="card" style={{
        width: "100%", maxWidth: 520, padding: "2rem", animation: "fadeUp 0.3s ease",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>New Admission Cycle</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "hsl(var(--text-muted))" }}>✕</button>
        </div>

        {error && (
          <div style={{ padding: "0.5rem 0.75rem", background: "hsl(var(--danger)/0.08)", border: "1px solid hsl(var(--danger)/0.2)", borderRadius: 8, color: "hsl(var(--danger))", fontSize: "0.82rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Cycle Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Admissions 2026-27" />
          </div>

          <div className="form-group">
            <label className="form-label">Academic Year *</label>
            <select className="form-input" value={form.academicYearId} onChange={(e) => updateField("academicYearId", e.target.value)}>
              <option value="">Select year...</option>
              {academicYears.map((ay: any) => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="form-input" type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input className="form-input" type="date" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Total Seats *</label>
              <input className="form-input" type="number" value={form.totalSeats} onChange={(e) => updateField("totalSeats", e.target.value)} placeholder="e.g. 200" />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select className="form-input" value={form.status} onChange={(e) => updateField("status", e.target.value)}>
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open (Accepting)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid hsl(var(--border))" }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={loading} onClick={handleSubmit}>
            {loading ? "Creating..." : "Create Cycle"}
          </button>
        </div>
      </div>
    </div>
  );
}
