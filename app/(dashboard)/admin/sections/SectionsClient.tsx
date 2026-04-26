"use client";

import { useState, useMemo } from "react";
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
  initialSections,
  grades,
  academicYears,
  teachers
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

  const { register: registerGrade, handleSubmit: handleSubmitGrade, reset: resetGrade, formState: { errors: gradeErrors } } = useForm({
    defaultValues: { name: "", level: 1, description: "" }
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      gradeId: "",
      name: "",
      academicYearId: academicYears.find(y => y.isCurrent)?.id || "",
      capacity: 40,
      classTeacherId: ""
    }
  });

  const filteredSections = useMemo(() => {
    return sections.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.grade.name.toLowerCase().includes(search.toLowerCase()) ||
                            (s.classTeacherName && s.classTeacherName.toLowerCase().includes(search.toLowerCase()));
      const matchesGrade = gradeFilter ? s.gradeId === gradeFilter : true;
      return matchesSearch && matchesGrade;
    });
  }, [sections, search, gradeFilter]);

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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSection(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    setApiError("");
    try {
      const url = editingSection ? `/api/sections/${editingSection.id}` : `/api/sections`;
      const method = editingSection ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      const resData = await res.json();
      
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save section");
      }

      router.refresh();
      // To immediately reflect changes without waiting for refresh:
      // (Simplified approach here)
      window.location.reload(); 
      
      closeModal();
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  const onSubmitGrade = async (data: any) => {
    setGradeApiError("");
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create grade");
      
      router.refresh();
      window.location.reload();
      
      setIsGradeModalOpen(false);
      resetGrade();
    } catch (err: any) {
      setGradeApiError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      const res = await fetch(`/api/sections/${id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete");
      setSections(sections.filter(s => s.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>All Sections</h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input 
            type="text" 
            placeholder="Search sections..." 
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="form-control"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="">All Grades</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsGradeModalOpen(true)}>+ Add New Grade</button>
          <button className="btn btn-primary btn-sm" onClick={() => openModal()}>+ Add New Section</button>
        </div>
      </div>
      
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Grade</th>
              <th>Section</th>
              <th>Class Teacher</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSections.length > 0 ? filteredSections.map((section) => {
              const occupancyRate = (section._count.enrollments / section.capacity) * 100;
              const isFull = occupancyRate >= 100;

              return (
                <tr key={section.id}>
                  <td style={{ fontWeight: 600 }}>{section.grade.name}</td>
                  <td style={{ fontWeight: 800 }}>{section.name}</td>
                  <td>
                    {section.classTeacherName ? (
                      <span style={{ fontWeight: 500 }}>{section.classTeacherName}</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>{section._count.enrollments} / {section.capacity}</span>
                      {isFull && <span className="badge" style={{ background: "hsl(var(--danger)/0.1)", color: "hsl(var(--danger))", fontSize: "0.7rem" }}>Full</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn btn-sm" onClick={() => openModal(section)}>Edit</button>
                      <button className="btn btn-sm" style={{ color: "hsl(var(--danger))" }} onClick={() => handleDelete(section.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No sections found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "500px", width: "100%" }}>
            <div className="modal-header">
              <h3>{editingSection ? "Edit Section" : "Add New Section"}</h3>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
              {apiError && <div className="alert alert-error" style={{ marginBottom: "1rem", color: "red" }}>{apiError}</div>}
              
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Academic Year *</label>
                <select className="form-control" {...register("academicYearId", { required: "Academic Year is required" })}>
                  <option value="">Select Academic Year</option>
                  {academicYears.map(y => (
                    <option key={y.id} value={y.id}>{y.name} {y.isCurrent && "(Current)"}</option>
                  ))}
                </select>
                {errors.academicYearId && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.academicYearId.message as string}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Grade Level *</label>
                <select className="form-control" {...register("gradeId", { required: "Grade is required" })}>
                  <option value="">Select Grade</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                {errors.gradeId && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.gradeId.message as string}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Section Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. A, B, C or Alpha" 
                  {...register("name", { required: "Section name is required" })} 
                />
                {errors.name && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.name.message as string}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Capacity *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  {...register("capacity", { required: "Capacity is required", min: 1 })} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Class Teacher</label>
                <select className="form-control" {...register("classTeacherId")}>
                  <option value="">Select Teacher (Optional)</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.user.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSection ? "Save Changes" : "Create Section"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGradeModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "500px", width: "100%" }}>
            <div className="modal-header">
              <h3>Add New Grade</h3>
              <button className="btn-close" onClick={() => { setIsGradeModalOpen(false); resetGrade(); }}>&times;</button>
            </div>
            <form onSubmit={handleSubmitGrade(onSubmitGrade)} className="modal-body">
              {gradeApiError && <div className="alert alert-error" style={{ marginBottom: "1rem", color: "red" }}>{gradeApiError}</div>}
              
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Grade Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Grade 1, Kindergarten" 
                  {...registerGrade("name", { required: "Grade name is required" })} 
                />
                {gradeErrors.name && <span style={{ color: "red", fontSize: "0.8rem" }}>{gradeErrors.name.message as string}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Level Number *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 1"
                  {...registerGrade("level", { required: "Level is required", min: -5, max: 20 })} 
                />
                <small style={{ color: "var(--text-muted)" }}>Numeric representation for sorting.</small>
                {gradeErrors.level && <span style={{ color: "red", fontSize: "0.8rem" }}>{gradeErrors.level.message as string}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  rows={3}
                  {...registerGrade("description")} 
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsGradeModalOpen(false); resetGrade(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Grade</button>
              </div>
            </form>
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
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          padding: 1rem 1.5rem;
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
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
