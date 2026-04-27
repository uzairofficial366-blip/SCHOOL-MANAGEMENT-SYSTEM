"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AssignmentsClient({ 
  initialSections, 
  subjects, 
  staff 
}: { 
  initialSections: any[], 
  subjects: any[], 
  staff: any[] 
}) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [classTeacherId, setClassTeacherId] = useState("");
  const [allocations, setAllocations] = useState<{ subjectId: string, staffId: string }[]>([]);

  const openModal = (section: any) => {
    setSelectedSection(section);
    setClassTeacherId(section.classTeacherId || "");
    setAllocations(section.subjectAllocations.map((a: any) => ({
      subjectId: a.subjectId,
      staffId: a.staffId
    })));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSection(null);
    setError("");
  };

  const addAllocation = () => {
    setAllocations([...allocations, { subjectId: "", staffId: "" }]);
  };

  const removeAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, field: string, value: string) => {
    const newAllocations = [...allocations];
    newAllocations[index] = { ...newAllocations[index], [field]: value };
    setAllocations(newAllocations);
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: selectedSection.id,
          classTeacherId,
          allocations
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save assignments");
      }

      router.refresh();
      window.location.reload();
      closeModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1.5rem" }}>Class Assignments</h3>
      
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Class & Section</th>
              <th>Class Teacher</th>
              <th>Subject Allocations</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map(section => (
              <tr key={section.id}>
                <td style={{ fontWeight: 700 }}>
                  {section.grade.name} - {section.name}
                </td>
                <td>
                  {staff.find(s => s.id === section.classTeacherId)?.user.name || (
                    <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Not Assigned</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {section.subjectAllocations.map((a: any) => (
                      <span key={a.id} className="badge" style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", fontSize: "0.75rem" }}>
                        {a.subject.name}: {a.staff.user.name}
                      </span>
                    ))}
                    {section.subjectAllocations.length === 0 && (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No subjects allocated</span>
                    )}
                  </div>
                </td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => openModal(section)}>
                    Update Assignments
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedSection && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>Assigning: {selectedSection.grade.name} - {selectedSection.name}</h3>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: "1rem", color: "red" }}>{error}</div>}

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Class Teacher</label>
                <select 
                  className="form-control" 
                  value={classTeacherId} 
                  onChange={(e) => setClassTeacherId(e.target.value)}
                >
                  <option value="">Select Class Teacher...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.user.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  The class teacher is responsible for overall administration of this section.
                </p>
              </div>

              <hr style={{ margin: "1.5rem 0", borderColor: "#eaeaea" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Subject Allocation</h4>
                <button type="button" className="btn btn-sm btn-secondary" onClick={addAllocation}>+ Add Subject</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {allocations.map((alloc, index) => (
                  <div key={index} style={{ display: "flex", gap: "0.75rem", alignItems: "center", background: "#f9f9f9", padding: "1rem", borderRadius: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Subject</label>
                      <select 
                        className="form-control" 
                        value={alloc.subjectId} 
                        onChange={(e) => updateAllocation(index, "subjectId", e.target.value)}
                      >
                        <option value="">Select Subject...</option>
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Teacher</label>
                      <select 
                        className="form-control" 
                        value={alloc.staffId} 
                        onChange={(e) => updateAllocation(index, "staffId", e.target.value)}
                      >
                        <option value="">Select Teacher...</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.user.name}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-sm" 
                      style={{ color: "hsl(var(--danger))", marginTop: "1rem" }} 
                      onClick={() => removeAllocation(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}

                {allocations.length === 0 && (
                  <div style={{ textAlign: "center", padding: "2rem", border: "1px dashed #ccc", borderRadius: "8px", color: "var(--text-muted)" }}>
                    No subject allocations yet. Click "Add Subject" to begin.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSave} 
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Assignments"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #eaeaea;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 { margin: 0; font-size: 1.25rem; }
        .btn-close {
          background: none; border: none; font-size: 1.5rem; cursor: pointer;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .form-control {
          padding: 0.6rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          width: 100%;
          font-size: 0.9rem;
        }
        .form-control:focus {
          border-color: hsl(var(--primary));
          outline: none;
        }
        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
