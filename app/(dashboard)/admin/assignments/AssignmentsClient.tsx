"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssignmentsClient({
  initialSections,
  subjects,
  staff,
}: {
  initialSections: any[];
  subjects: any[];
  staff: any[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [classTeacherId, setClassTeacherId] = useState("");
  const [allocations, setAllocations] = useState<{ subjectId: string; staffId: string }[]>([]);

  // ── Body scroll lock ───────────────────────────────────────────────────
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => { document.body.classList.remove("modal-open"); };
  }, [isModalOpen]);

  const openModal = (section: any) => {
    setSelectedSection(section);
    setClassTeacherId(section.classTeacherId || "");
    setAllocations(
      section.subjectAllocations.map((a: any) => ({
        subjectId: a.subjectId,
        staffId: a.staffId,
      }))
    );
    setError("");
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setSelectedSection(null); setError(""); };

  const addAllocation = () => setAllocations([...allocations, { subjectId: "", staffId: "" }]);
  const removeAllocation = (i: number) => setAllocations(allocations.filter((_, idx) => idx !== i));
  const updateAllocation = (i: number, field: string, value: string) => {
    const next = [...allocations];
    next[i] = { ...next[i], [field]: value };
    setAllocations(next);
  };

  const handleSave = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: selectedSection.id, classTeacherId, allocations }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save"); }
      router.refresh(); window.location.reload(); closeModal();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const filteredSections = sections.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.grade.name.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (staff.find((t: any) => t.id === s.classTeacherId)?.user.name?.toLowerCase().includes(q) ?? false)
    );
  });

  const SUBJECT_COLORS = [
    { bg: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" },
    { bg: "hsl(var(--accent)/0.1)", color: "hsl(var(--accent))" },
    { bg: "hsl(var(--info)/0.1)", color: "hsl(var(--info))" },
    { bg: "hsl(var(--success)/0.1)", color: "hsl(var(--success))" },
    { bg: "hsl(var(--warning)/0.1)", color: "hsl(var(--warning))" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800 }}>Class Assignments</h3>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem", marginTop: "0.15rem" }}>
            Assign class teachers and allocate subjects to sections
          </p>
        </div>
        <input
          type="text"
          placeholder="🔍 Search sections..."
          className="form-input"
          style={{ width: 240 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Card Grid ───────────────────────────────────────────────── */}
      {filteredSections.length > 0 ? (
        <div className="grid-3">
          {filteredSections.map((section: any) => {
            const teacher = staff.find((t: any) => t.id === section.classTeacherId);
            const allocCount = section.subjectAllocations.length;
            const isFullySetup = teacher && allocCount > 0;
            const isPartial = (teacher || allocCount > 0) && !isFullySetup;

            return (
              <div key={section.id} className="admin-card">
                {/* Accent */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: isFullySetup
                    ? "linear-gradient(90deg, hsl(var(--success)), hsl(var(--primary)))"
                    : isPartial
                    ? "hsl(var(--warning))"
                    : "hsl(var(--border))",
                }} />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", marginTop: "0.25rem" }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {section.grade.name}
                    </div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
                      Section {section.name}
                    </div>
                  </div>
                  <span style={{
                    display: "inline-flex", padding: "0.2rem 0.65rem", borderRadius: "999px",
                    fontSize: "0.72rem", fontWeight: 600,
                    background: isFullySetup ? "hsl(var(--success)/0.12)" : isPartial ? "hsl(var(--warning)/0.12)" : "hsl(var(--border)/0.5)",
                    color: isFullySetup ? "hsl(var(--success))" : isPartial ? "hsl(var(--warning))" : "hsl(var(--text-muted))",
                    flexShrink: 0,
                  }}>
                    {isFullySetup ? "✓ Setup" : isPartial ? "Partial" : "Pending"}
                  </span>
                </div>

                {/* Class Teacher */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem", fontSize: "0.85rem", padding: "0.6rem 0.75rem", background: "hsl(var(--bg))", borderRadius: 8 }}>
                  <span>👤</span>
                  {teacher
                    ? <span style={{ fontWeight: 600 }}>{teacher.user.name}</span>
                    : <span style={{ color: "hsl(var(--text-muted))", fontStyle: "italic" }}>No Class Teacher</span>}
                </div>

                {/* Subject Badges */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                    Subjects ({allocCount})
                  </div>
                  {allocCount > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {section.subjectAllocations.slice(0, 5).map((a: any, i: number) => {
                        const c = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                        return (
                          <span key={a.id} style={{ display: "inline-flex", padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, background: c.bg, color: c.color }}>
                            {a.subject.name}
                          </span>
                        );
                      })}
                      {allocCount > 5 && (
                        <span style={{ display: "inline-flex", padding: "0.2rem 0.5rem", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, background: "hsl(var(--border)/0.5)", color: "hsl(var(--text-muted))" }}>
                          +{allocCount - 5} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))", fontStyle: "italic" }}>No subjects allocated</span>
                  )}
                </div>

                {/* Stats */}
                <div className="admin-card-stats" style={{ marginBottom: "0.75rem" }}>
                  <div className="admin-card-stat">
                    <div className="admin-card-stat-value" style={{ color: "hsl(var(--primary))" }}>{allocCount}</div>
                    <div className="admin-card-stat-label">Subjects</div>
                  </div>
                  <div className="admin-card-stat">
                    <div className="admin-card-stat-value">{teacher ? "1" : "0"}</div>
                    <div className="admin-card-stat-label">Class Teacher</div>
                  </div>
                  <div className="admin-card-stat">
                    <div className="admin-card-stat-value">
                      {new Set(section.subjectAllocations.map((a: any) => a.staffId)).size}
                    </div>
                    <div className="admin-card-stat-label">Teachers</div>
                  </div>
                </div>

                {/* Action */}
                <div className="admin-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => openModal(section)}>
                    ✏️ Manage Assignments
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--text-muted))" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>
            {search ? "No sections match your search." : "No sections found."}
          </div>
          {!search && <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>Create sections first in Classes &amp; Sections.</div>}
        </div>
      )}

      {/* ── Assignment Modal ─────────────────────────────────────────── */}
      {isModalOpen && selectedSection && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assignments — {selectedSection.grade.name} Section {selectedSection.name}</h3>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              {error && (
                <div style={{ padding: "0.6rem 0.8rem", background: "hsl(var(--danger)/0.08)", border: "1px solid hsl(var(--danger)/0.2)", borderRadius: 8, color: "hsl(var(--danger))", fontSize: "0.82rem", marginBottom: "1rem" }}>
                  {error}
                </div>
              )}

              {/* Class Teacher */}
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Class Teacher</label>
                <select className="form-input" value={classTeacherId} onChange={(e) => setClassTeacherId(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {staff.map((s: any) => <option key={s.id} value={s.id}>{s.user.name}</option>)}
                </select>
                <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", marginTop: "0.25rem" }}>
                  The class teacher is responsible for overall administration of this section.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Subject Allocations</div>
                  <div style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))" }}>Assign a teacher to each subject taught in this section</div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addAllocation}>+ Add Subject</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {allocations.map((alloc, index) => (
                  <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.6rem", alignItems: "end", background: "hsl(var(--bg))", padding: "0.75rem", borderRadius: 8 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Subject</label>
                      <select className="form-input" value={alloc.subjectId} onChange={(e) => updateAllocation(index, "subjectId", e.target.value)}>
                        <option value="">Select subject...</option>
                        {subjects.map((sub: any) => <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Teacher</label>
                      <select className="form-input" value={alloc.staffId} onChange={(e) => updateAllocation(index, "staffId", e.target.value)}>
                        <option value="">Select teacher...</option>
                        {staff.map((s: any) => <option key={s.id} value={s.id}>{s.user.name}</option>)}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ color: "hsl(var(--danger))", border: "1px solid hsl(var(--border))", padding: "0.5rem 0.75rem" }}
                      onClick={() => removeAllocation(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {allocations.length === 0 && (
                  <div style={{ textAlign: "center", padding: "2rem", border: "2px dashed hsl(var(--border))", borderRadius: 8, color: "hsl(var(--text-muted))" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📚</div>
                    No subject allocations. Click &ldquo;+ Add Subject&rdquo; to begin.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
                {loading ? "Saving…" : "Save Assignments"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
