"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";

export default function SubjectsClient({
  initialSubjects,
  sections,
  staff,
}: {
  initialSubjects: any[];
  sections: any[];
  staff: any[];
}) {
  const router = useRouter();
  const [subjects] = useState<any[]>(initialSubjects);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [apiError, setApiError] = useState("");

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      code: "",
      creditHours: 1,
      description: "",
      allocations: [] as { sectionId: string; staffId: string }[],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "allocations" });

  // ── Body scroll lock ───────────────────────────────────────────────────
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => { document.body.classList.remove("modal-open"); };
  }, [isModalOpen]);

  const filteredSubjects = useMemo(() =>
    subjects.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    ), [subjects, search]);

  const openModal = (subject?: any) => {
    if (subject) {
      setEditingSubject(subject);
      setValue("name", subject.name);
      setValue("code", subject.code);
      setValue("creditHours", subject.creditHours);
      setValue("description", subject.description || "");
      setValue("allocations", subject.allocations || []);
    } else {
      setEditingSubject(null);
      reset();
    }
    setApiError("");
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingSubject(null); reset(); };

  const onSubmit = async (data: any) => {
    setApiError("");
    try {
      const res = await fetch(`/api/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save subject");
      router.refresh(); window.location.reload(); closeModal();
    } catch (err: any) { setApiError(err.message); }
  };

  // Accent colours cycling per subject
  const ACCENTS = [
    { bar: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))", badge: "hsl(var(--primary)/0.1)", text: "hsl(var(--primary))" },
    { bar: "linear-gradient(90deg, hsl(var(--accent)), hsl(var(--info)))", badge: "hsl(var(--accent)/0.1)", text: "hsl(var(--accent))" },
    { bar: "linear-gradient(90deg, hsl(var(--info)), hsl(var(--success)))", badge: "hsl(var(--info)/0.1)", text: "hsl(var(--info))" },
    { bar: "linear-gradient(90deg, hsl(var(--success)), hsl(var(--primary)))", badge: "hsl(var(--success)/0.1)", text: "hsl(var(--success))" },
    { bar: "linear-gradient(90deg, hsl(var(--warning)), hsl(var(--accent)))", badge: "hsl(var(--warning)/0.1)", text: "hsl(var(--warning))" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800 }}>Subjects Management</h3>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem", marginTop: "0.15rem" }}>
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} across all grades
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 Search subjects..."
            className="form-input"
            style={{ width: 240 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={() => openModal()}>+ Add Subject</button>
        </div>
      </div>

      {/* ── Card Grid ───────────────────────────────────────────────── */}
      {filteredSubjects.length > 0 ? (
        <div className="subjects-grid">
          {filteredSubjects.map((subject: any, idx: number) => {
            const accent = ACCENTS[idx % ACCENTS.length];
            const allocCount = subject.allocations?.length ?? 0;
            const sectionSet = new Set(subject.allocations?.map((a: any) => a.sectionId) ?? []);
            const teacherSet = new Set(subject.allocations?.map((a: any) => a.staffId) ?? []);

            return (
              <div key={subject.id} className="admin-card subject-card">
                {/* Gradient accent */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent.bar }} />

                {/* Header */}
                <div className="subject-card-header">
                  <div style={{ flex: 1 }}>
                    <span style={{
                      display: "inline-flex", padding: "0.15rem 0.55rem", borderRadius: 6,
                      fontSize: "0.7rem", fontWeight: 700, fontFamily: "monospace",
                      background: accent.badge, color: accent.text, letterSpacing: "0.04em",
                      marginBottom: "0.4rem",
                    }}>
                      {subject.code}
                    </span>
                    <div className="subject-card-title">
                      {subject.name}
                    </div>
                  </div>
                  <div className="subject-card-icon" style={{ background: accent.badge }}>
                    📚
                  </div>
                </div>

                {/* Description */}
                {subject.description && (
                  <p style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", marginBottom: "0.85rem", lineHeight: 1.5 }}>
                    {subject.description}
                  </p>
                )}

                {/* Credit hours pill */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.25rem 0.75rem", borderRadius: "999px",
                    background: "hsl(var(--bg))", border: "1px solid hsl(var(--border))",
                    fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--text-muted))",
                  }}>
                    ⏱ {subject.creditHours} Credit Hour{subject.creditHours !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Allocated sections preview */}
                {allocCount > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>
                      Taught In
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {subject.allocations.slice(0, 4).map((alloc: any) => (
                        <span key={alloc.id} style={{ display: "inline-flex", padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, background: "hsl(var(--bg))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text))" }}>
                          {alloc.section.grade.name}–{alloc.section.name}
                        </span>
                      ))}
                      {allocCount > 4 && (
                        <span style={{ display: "inline-flex", padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, background: accent.badge, color: accent.text }}>
                          +{allocCount - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="admin-card-stats" style={{ marginBottom: "0.75rem" }}>
                  <div className="admin-card-stat">
                    <div className="admin-card-stat-value" style={{ color: accent.text }}>{subject.creditHours}</div>
                    <div className="admin-card-stat-label">Credits</div>
                  </div>
                  <div className="admin-card-stat">
                    <div className="admin-card-stat-value">{sectionSet.size}</div>
                    <div className="admin-card-stat-label">Sections</div>
                  </div>
                  <div className="admin-card-stat">
                    <div className="admin-card-stat-value">{teacherSet.size}</div>
                    <div className="admin-card-stat-label">Teachers</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="admin-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openModal(subject)}>✏️ Edit / Allocate</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--text-muted))" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
            {search ? "No subjects match your search." : "No subjects found"}
          </div>
          {!search && (
            <>
              <div style={{ fontSize: "0.85rem" }}>Add subjects and allocate them to sections and teachers.</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }} onClick={() => openModal()}>+ Add Subject</button>
            </>
          )}
        </div>
      )}

      {/* ── Subject Modal ────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="modal-overlay subject-modal-overlay" onClick={closeModal}>
          <div className="modal-box subject-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSubject ? `Edit — ${editingSubject.name}` : "Add New Subject"}</h3>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            <form className="subject-modal-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body subject-modal-body">
                {apiError && (
                  <div style={{ padding: "0.6rem 0.8rem", background: "hsl(var(--danger)/0.08)", border: "1px solid hsl(var(--danger)/0.2)", borderRadius: 8, color: "hsl(var(--danger))", fontSize: "0.82rem", marginBottom: "1rem" }}>
                    {apiError}
                  </div>
                )}

                <div className="subject-form-grid subject-form-grid-even">
                  <div className="form-group">
                    <label className="form-label">Subject Name *</label>
                    <input type="text" className="form-input" placeholder="e.g. Mathematics" {...register("name", { required: "Name is required" })} />
                    {errors.name && <span className="form-error">{errors.name.message as string}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MATH101"
                      {...register("code", { required: "Code is required" })}
                      disabled={!!editingSubject}
                      style={{ fontFamily: "monospace" }}
                    />
                    {errors.code && <span className="form-error">{errors.code.message as string}</span>}
                  </div>
                </div>

                <div className="subject-form-grid subject-form-grid-wide">
                  <div className="form-group">
                    <label className="form-label">Credit Hours</label>
                    <input type="number" className="form-input" min={1} max={10} {...register("creditHours", { valueAsNumber: true })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input type="text" className="form-input" placeholder="Optional description" {...register("description")} />
                  </div>
                </div>

                <div className="subject-allocations">
                  <div className="subject-allocations-header">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Class Allocations</div>
                      <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Assign this subject to sections with a teacher</div>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ sectionId: "", staffId: "" })}>+ Add</button>
                  </div>

                  <div className="subject-allocation-list">
                    {fields.map((field, index) => (
                      <div key={field.id} className="subject-allocation-row">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Section</label>
                          <select className="form-input" {...register(`allocations.${index}.sectionId` as const, { required: true })}>
                            <option value="">Select section...</option>
                            {sections.map((sec: any) => (
                              <option key={sec.id} value={sec.id}>{sec.grade.name} — {sec.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Teacher</label>
                          <select className="form-input" {...register(`allocations.${index}.staffId` as const, { required: true })}>
                            <option value="">Select teacher...</option>
                            {staff.map((st: any) => (
                              <option key={st.id} value={st.id}>{st.user.name}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ color: "hsl(var(--danger))", border: "1px solid hsl(var(--border))", padding: "0.45rem 0.65rem" }}
                          onClick={() => remove(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <div className="subject-empty-allocation">
                        No allocations yet. Click &ldquo;+ Add&rdquo; to assign this subject to a section.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">{editingSubject ? "Save Changes" : "Create Subject"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
