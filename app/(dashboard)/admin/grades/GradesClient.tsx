"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type Grade = {
  id: string;
  name: string;
  level: number;
  description: string | null;
  _count: { sections: number };
};

const LEVEL_EMOJIS: Record<number, string> = {
  "-2": "🌱", "-1": "🌱", 0: "🌟", 1: "📚", 2: "📚", 3: "📚",
  4: "📚", 5: "📖", 6: "📖", 7: "📖", 8: "🎓", 9: "🎓", 10: "🎓",
  11: "🏆", 12: "🏆",
};

export default function GradesClient({ initialGrades }: { initialGrades: Grade[] }) {
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [apiError, setApiError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { name: "", level: 1, description: "" },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Body scroll lock ───────────────────────────────────────────────────
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => { document.body.classList.remove("modal-open"); };
  }, [isModalOpen]);

  const filteredGrades = useMemo(() =>
    grades.filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.level.toString().includes(search)
    ), [grades, search]);

  const openModal = (grade?: Grade) => {
    if (grade) {
      setEditingGrade(grade);
      setValue("name", grade.name);
      setValue("level", grade.level);
      setValue("description", grade.description || "");
    } else {
      setEditingGrade(null);
      reset();
    }
    setApiError("");
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingGrade(null); reset(); };

  const onSubmit = async (data: any) => {
    setApiError("");
    try {
      const url = editingGrade ? `/api/grades/${editingGrade.id}` : `/api/grades`;
      const res = await fetch(url, {
        method: editingGrade ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save grade");
      router.refresh(); window.location.reload(); closeModal();
    } catch (err: any) { setApiError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this grade?")) return;
    try {
      const res = await fetch(`/api/grades/${id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete");
      setGrades(grades.filter((g) => g.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  // Gradient colors cycling for variety
  const GRADIENTS = [
    "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
    "linear-gradient(90deg, hsl(var(--accent)), hsl(var(--info)))",
    "linear-gradient(90deg, hsl(var(--info)), hsl(var(--success)))",
    "linear-gradient(90deg, hsl(var(--success)), hsl(var(--primary)))",
    "linear-gradient(90deg, hsl(var(--warning)), hsl(var(--accent)))",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800 }}>Grades Management</h3>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem", marginTop: "0.15rem" }}>
            {grades.length} grade{grades.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 Search grades..."
            className="form-input"
            style={{ width: 220 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal()}>+ Add Grade</button>
        </div>
      </div>

      {/* ── Card Grid ───────────────────────────────────────────────── */}
      {filteredGrades.length > 0 ? (
        <div className="grid-3">
          {filteredGrades.map((grade, idx) => {
            const emoji = LEVEL_EMOJIS[grade.level] ?? "📋";
            const gradient = GRADIENTS[idx % GRADIENTS.length];
            const hasSections = grade._count.sections > 0;

            return (
              <div key={grade.id} className="admin-card">
                {/* Accent line with cycling gradient */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: gradient }} />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", marginTop: "0.25rem" }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
                      Grade Level {grade.level}
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
                      {grade.name}
                    </div>
                  </div>
                  <div style={{ fontSize: "2rem", lineHeight: 1 }}>{emoji}</div>
                </div>

                {/* Description */}
                {grade.description && (
                  <p style={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))", marginBottom: "1rem", lineHeight: 1.5 }}>
                    {grade.description}
                  </p>
                )}

                {/* Stats */}
                <div className="admin-card-stats" style={{ marginBottom: "0.75rem" }}>
                  <div className="admin-card-stat">
                    <div className="admin-card-stat-value">{grade.level}</div>
                    <div className="admin-card-stat-label">Level</div>
                  </div>
                  <div className="admin-card-stat">
                    <div className="admin-card-stat-value" style={{ color: "hsl(var(--primary))" }}>{grade._count.sections}</div>
                    <div className="admin-card-stat-label">Sections</div>
                  </div>
                  <div className="admin-card-stat">
                    <div className="admin-card-stat-value">
                      <span style={{
                        display: "inline-flex", padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 600,
                        background: hasSections ? "hsl(var(--success)/0.12)" : "hsl(var(--text-muted)/0.12)",
                        color: hasSections ? "hsl(var(--success))" : "hsl(var(--text-muted))",
                      }}>
                        {hasSections ? "Active" : "Empty"}
                      </span>
                    </div>
                    <div className="admin-card-stat-label">Status</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="admin-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openModal(grade)}>✏️ Edit</button>
                  <button
                    className="btn btn-sm"
                    style={{ color: "hsl(var(--danger))", border: "1px solid hsl(var(--border))" }}
                    onClick={() => handleDelete(grade.id)}
                    title={hasSections ? "Delete all sections first" : "Delete grade"}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--text-muted))" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎓</div>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
            {search ? "No grades match your search." : "No grades configured yet"}
          </div>
          {!search && (
            <>
              <div style={{ fontSize: "0.85rem" }}>Grades define your academic levels (e.g. Grade 1, Grade 10, Kindergarten).</div>
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }} onClick={() => openModal()}>+ Add First Grade</button>
            </>
          )}
        </div>
      )}

      {/* ── Grade Modal ──────────────────────────────────────────────── */}
      {isMounted && isModalOpen && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingGrade ? `Edit — ${editingGrade.name}` : "Add New Grade"}</h3>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                {apiError && (
                  <div style={{ padding: "0.6rem 0.8rem", background: "hsl(var(--danger)/0.08)", border: "1px solid hsl(var(--danger)/0.2)", borderRadius: 8, color: "hsl(var(--danger))", fontSize: "0.82rem", marginBottom: "1rem" }}>
                    {apiError}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Grade Name *</label>
                      <input type="text" className="form-input" placeholder="e.g. Grade 5" {...register("name", { required: "Name is required" })} />
                      {errors.name && <span className="form-error">{errors.name.message as string}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Level Number *</label>
                      <input type="number" className="form-input" placeholder="e.g. 5" {...register("level", { required: "Level is required", min: -5, max: 20 })} />
                      {errors.level && <span className="form-error">{errors.level.message as string}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={3} placeholder="Optional description..." {...register("description")} style={{ resize: "vertical" }} />
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", background: "hsl(var(--bg))", padding: "0.6rem 0.8rem", borderRadius: 8 }}>
                    💡 Level number must be unique and determines sorting order. Use 0 for Kindergarten, negative for Pre-K.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">{editingGrade ? "Save Changes" : "Create Grade"}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
