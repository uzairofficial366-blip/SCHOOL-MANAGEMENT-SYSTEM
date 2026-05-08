"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type Section = {
  id: string;
  name: string;
  capacity: number;
  gradeId: string;
  academicYearId: string;
  classTeacherId: string | null;
  grade: { id: string; name: string; level: number };
  academicYear: { id: string; name: string };
  _count: { enrollments: number };
  classTeacherName?: string;
};
type Grade = { id: string; name: string; level: number };
type AcademicYear = { id: string; name: string; isCurrent: boolean };
type Teacher = { id: string; user: { name: string } };

export default function SectionsClient({
  initialSections, grades, academicYears, teachers,
}: {
  initialSections: Section[];
  grades: Grade[];
  academicYears: AcademicYear[];
  teachers: Teacher[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradeApiError, setGradeApiError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const { register: rGrade, handleSubmit: hsGrade, reset: resetGrade, formState: { errors: gradeErrors } } = useForm({
    defaultValues: { name: "", level: 1, description: "" },
  });
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      gradeId: "",
      name: "",
      academicYearId: academicYears.find((y) => y.isCurrent)?.id || "",
      capacity: 40,
      classTeacherId: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Body scroll lock ───────────────────────────────────────────────────
  useEffect(() => {
    if (isModalOpen || isGradeModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => { document.body.classList.remove("modal-open"); };
  }, [isModalOpen, isGradeModalOpen]);

  const filteredSections = useMemo(() =>
    sections.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.grade.name.toLowerCase().includes(q) ||
        (s.classTeacherName?.toLowerCase().includes(q) ?? false);
      const matchGrade = gradeFilter ? s.gradeId === gradeFilter : true;
      return matchSearch && matchGrade;
    }), [sections, search, gradeFilter]);

  const openModal = (section?: Section) => {
    if (section) {
      setEditingSection(section);
      setValue("gradeId", section.gradeId);
      setValue("name", section.name);
      setValue("academicYearId", section.academicYearId);
      setValue("capacity", section.capacity);
      setValue("classTeacherId", section.classTeacherId || "");
    } else {
      setEditingSection(null);
      reset();
    }
    setApiError("");
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingSection(null); reset(); };

  const onSubmit = async (data: any) => {
    setApiError("");
    try {
      const url = editingSection ? `/api/sections/${editingSection.id}` : `/api/sections`;
      const res = await fetch(url, {
        method: editingSection ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save section");
      router.refresh(); window.location.reload(); closeModal();
    } catch (err: any) { setApiError(err.message); }
  };

  const onSubmitGrade = async (data: any) => {
    setGradeApiError("");
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create grade");
      router.refresh(); window.location.reload();
      setIsGradeModalOpen(false); resetGrade();
    } catch (err: any) { setGradeApiError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      const res = await fetch(`/api/sections/${id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete");
      setSections(sections.filter((s) => s.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800 }}>Classes &amp; Sections</h3>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem", marginTop: "0.15rem" }}>
            {sections.length} sections across {grades.length} grade{grades.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 Search..."
            className="form-input"
            style={{ width: 200 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="form-input" style={{ width: 160 }} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option value="">All Grades</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsGradeModalOpen(true)}>+ Add Grade</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal()}>+ Add Section</button>
        </div>
      </div>

      {/* ── Row Cards (flex column) ──────────────────────────────────── */}
      {filteredSections.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredSections.map((section) => {
            const occupancy = section.capacity > 0 ? Math.round((section._count.enrollments / section.capacity) * 100) : 0;
            const isFull = occupancy >= 100;
            const isHigh = occupancy >= 80 && !isFull;
            const accentBg = isFull ? "hsl(var(--danger))" : isHigh ? "hsl(var(--warning))" : "linear-gradient(180deg, hsl(var(--primary)), hsl(var(--accent)))";
            const badgeBg = isFull ? "hsl(var(--danger)/0.12)" : isHigh ? "hsl(var(--warning)/0.12)" : "hsl(var(--success)/0.12)";
            const badgeColor = isFull ? "hsl(var(--danger))" : isHigh ? "hsl(var(--warning))" : "hsl(var(--success))";
            const badgeLabel = isFull ? "Full" : isHigh ? "Almost Full" : "Active";

            return (
              <div key={section.id} style={{
                background: "hsl(var(--bg-card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "stretch",
                overflow: "hidden",
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px -4px hsl(var(--primary)/0.15)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ""; (e.currentTarget as HTMLDivElement).style.transform = ""; }}
              >
                {/* Accent left bar */}
                <div style={{ width: 4, flexShrink: 0, background: accentBg }} />

                {/* Grade + Section name */}
                <div style={{ padding: "1rem 1.25rem", minWidth: 160, flexShrink: 0 }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
                    {section.grade.name}
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
                    {section.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "hsl(var(--text-muted))", marginTop: "0.2rem" }}>
                    {section.academicYear.name}
                  </div>
                </div>

                {/* Status badge */}
                <div style={{ display: "flex", alignItems: "center", padding: "0 1rem", flexShrink: 0 }}>
                  <span style={{ display: "inline-flex", padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, background: badgeBg, color: badgeColor, whiteSpace: "nowrap" }}>
                    {badgeLabel}
                  </span>
                </div>

                {/* Class Teacher */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0 1rem", minWidth: 180, flexShrink: 0, borderLeft: "1px solid hsl(var(--border)/0.5)" }}>
                  <span style={{ fontSize: "1rem" }}>👤</span>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "hsl(var(--text-muted))", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Class Teacher</div>
                    {section.classTeacherName
                      ? <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{section.classTeacherName}</div>
                      : <div style={{ fontSize: "0.82rem", color: "hsl(var(--text-muted))", fontStyle: "italic" }}>Unassigned</div>}
                  </div>
                </div>

                {/* Progress + stats */}
                <div style={{ flex: 1, padding: "0.75rem 1.25rem", borderLeft: "1px solid hsl(var(--border)/0.5)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.4rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "hsl(var(--text-muted))" }}>
                    <span>Enrollment</span>
                    <span style={{ fontWeight: 700, color: isFull ? "hsl(var(--danger))" : "inherit" }}>
                      {section._count.enrollments} / {section.capacity} ({occupancy}%)
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${Math.min(occupancy, 100)}%`,
                      background: isFull ? "hsl(var(--danger))" : isHigh ? "hsl(var(--warning))" : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
                    }} />
                  </div>
                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.75rem" }}>
                    <span><b>{section._count.enrollments}</b> <span style={{ color: "hsl(var(--text-muted))" }}>enrolled</span></span>
                    <span><b>{section.capacity}</b> <span style={{ color: "hsl(var(--text-muted))" }}>capacity</span></span>
                    <span><b style={{ color: isFull ? "hsl(var(--danger))" : "hsl(var(--success))" }}>{Math.max(0, section.capacity - section._count.enrollments)}</b> <span style={{ color: "hsl(var(--text-muted))" }}>available</span></span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 1rem", flexShrink: 0, borderLeft: "1px solid hsl(var(--border)/0.5)" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openModal(section)}>✏️ Edit</button>
                  <button className="btn btn-sm" style={{ color: "hsl(var(--danger))", border: "1px solid hsl(var(--border))" }} onClick={() => handleDelete(section.id)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--text-muted))" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏫</div>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>No sections found</div>
          <div style={{ fontSize: "0.85rem" }}>
            {search || gradeFilter ? "Try adjusting your filters." : "Create your first section to get started."}
          </div>
          {!search && !gradeFilter && (
            <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }} onClick={() => openModal()}>+ Add Section</button>
          )}
        </div>
      )}


      {/* ── Section Modal ────────────────────────────────────────────── */}
      {isMounted && isModalOpen && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSection ? `Edit Section — ${editingSection.grade.name} ${editingSection.name}` : "Add New Section"}</h3>
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
                  <div className="form-group">
                    <label className="form-label">Academic Year *</label>
                    <select className="form-input" {...register("academicYearId", { required: "Required" })}>
                      <option value="">Select Academic Year</option>
                      {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name} {y.isCurrent && "(Current)"}</option>)}
                    </select>
                    {errors.academicYearId && <span className="form-error">{errors.academicYearId.message as string}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grade *</label>
                    <select className="form-input" {...register("gradeId", { required: "Required" })}>
                      <option value="">Select Grade</option>
                      {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    {errors.gradeId && <span className="form-error">{errors.gradeId.message as string}</span>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Section Name *</label>
                      <input type="text" className="form-input" placeholder="e.g. A, B, Alpha" {...register("name", { required: "Required" })} />
                      {errors.name && <span className="form-error">{errors.name.message as string}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Capacity</label>
                      <input type="number" className="form-input" {...register("capacity", { min: 1 })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class Teacher <span style={{ color: "hsl(var(--text-muted))", fontWeight: 400 }}>(Optional)</span></label>
                    <select className="form-input" {...register("classTeacherId")}>
                      <option value="">— Unassigned —</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">{editingSection ? "Save Changes" : "Create Section"}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Grade Modal ──────────────────────────────────────────────── */}
      {isMounted && isGradeModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => { setIsGradeModalOpen(false); resetGrade(); }}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Grade</h3>
              <button className="modal-close-btn" onClick={() => { setIsGradeModalOpen(false); resetGrade(); }}>✕</button>
            </div>
            <form onSubmit={hsGrade(onSubmitGrade)}>
              <div className="modal-body">
                {gradeApiError && (
                  <div style={{ padding: "0.6rem 0.8rem", background: "hsl(var(--danger)/0.08)", border: "1px solid hsl(var(--danger)/0.2)", borderRadius: 8, color: "hsl(var(--danger))", fontSize: "0.82rem", marginBottom: "1rem" }}>
                    {gradeApiError}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Grade Name *</label>
                      <input type="text" className="form-input" placeholder="e.g. Grade 5" {...rGrade("name", { required: "Required" })} />
                      {gradeErrors.name && <span className="form-error">{gradeErrors.name.message as string}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Level Number *</label>
                      <input type="number" className="form-input" placeholder="e.g. 5" {...rGrade("level", { required: "Required", min: -5, max: 20 })} />
                      {gradeErrors.level && <span className="form-error">{gradeErrors.level.message as string}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={3} placeholder="Optional description..." {...rGrade("description")} style={{ resize: "vertical" }} />
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", background: "hsl(var(--bg))", padding: "0.6rem 0.8rem", borderRadius: 8 }}>
                    💡 Level number must be unique and determines sorting order. Use 0 for Kindergarten, negative for Pre-K.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setIsGradeModalOpen(false); resetGrade(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create Grade</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
