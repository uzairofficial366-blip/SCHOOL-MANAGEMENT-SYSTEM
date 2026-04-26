"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type Grade = {
  id: string;
  name: string;
  level: number;
  description: string | null;
  _count: { sections: number };
};

export default function GradesClient({ initialGrades }: { initialGrades: Grade[] }) {
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [apiError, setApiError] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      level: 1,
      description: ""
    }
  });

  const filteredGrades = useMemo(() => {
    return grades.filter(g => 
      g.name.toLowerCase().includes(search.toLowerCase()) || 
      g.level.toString().includes(search)
    );
  }, [grades, search]);

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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGrade(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    setApiError("");
    try {
      const url = editingGrade ? `/api/grades/${editingGrade.id}` : `/api/grades`;
      const method = editingGrade ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      const resData = await res.json();
      
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save grade");
      }

      router.refresh();
      window.location.reload();
      
      closeModal();
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this grade?")) return;
    try {
      const res = await fetch(`/api/grades/${id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete");
      setGrades(grades.filter(g => g.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>All Grades</h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input 
            type="text" 
            placeholder="Search grades..." 
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={() => openModal()}>+ Add New Grade</button>
        </div>
      </div>
      
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Level Number</th>
              <th>Grade Name</th>
              <th>Description</th>
              <th>Sections Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.length > 0 ? filteredGrades.map((grade) => (
              <tr key={grade.id}>
                <td style={{ fontWeight: 600 }}>{grade.level}</td>
                <td style={{ fontWeight: 800 }}>{grade.name}</td>
                <td style={{ color: "var(--text-muted)" }}>{grade.description || "-"}</td>
                <td>
                  <span className="badge" style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>
                    {grade._count.sections} Sections
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-sm" onClick={() => openModal(grade)}>Edit</button>
                    <button className="btn btn-sm" style={{ color: "hsl(var(--danger))" }} onClick={() => handleDelete(grade.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No grades found.
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
              <h3>{editingGrade ? "Edit Grade" : "Add New Grade"}</h3>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
              {apiError && <div className="alert alert-error" style={{ marginBottom: "1rem", color: "red" }}>{apiError}</div>}
              
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Grade Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Grade 1, Kindergarten, Grade 10" 
                  {...register("name", { required: "Grade name is required" })} 
                />
                {errors.name && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.name.message as string}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Level Number *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 1 (Must be unique)"
                  {...register("level", { required: "Level is required", min: -5, max: 20 })} 
                />
                <small style={{ color: "var(--text-muted)" }}>Numeric representation for sorting (e.g. 10 for Grade 10, 0 for Kindergarten).</small>
                {errors.level && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.level.message as string}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  rows={3}
                  {...register("description")} 
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingGrade ? "Save Changes" : "Create Grade"}</button>
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
