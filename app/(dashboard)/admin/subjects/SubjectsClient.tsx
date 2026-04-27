"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";

export default function SubjectsClient({ initialSubjects, sections, staff }: { initialSubjects: any[], sections: any[], staff: any[] }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>(initialSubjects);
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
      allocations: [] as { sectionId: string, staffId: string }[]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "allocations"
  });

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [subjects, search]);

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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    setApiError("");
    try {
      const url = `/api/subjects`;
      const method = "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      const resData = await res.json();
      
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save subject");
      }

      router.refresh();
      window.location.reload();
      
      closeModal();
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>All Subjects</h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input 
            type="text" 
            placeholder="Search subjects..." 
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={() => openModal()}>+ Add Subject</button>
        </div>
      </div>
      
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Subject Name</th>
              <th>Credit Hours</th>
              <th>Allocations</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.length > 0 ? filteredSubjects.map((subject) => (
              <tr key={subject.id}>
                <td style={{ fontWeight: 600 }}>{subject.code}</td>
                <td style={{ fontWeight: 800 }}>{subject.name}</td>
                <td>{subject.creditHours}</td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {subject.allocations?.map((alloc: any) => (
                      <span key={alloc.id} className="badge" style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", fontSize: "0.75rem", display: "inline-block" }}>
                        {alloc.section.grade.name} - {alloc.section.name} (Teacher: {alloc.staff.user.name})
                      </span>
                    ))}
                    {(!subject.allocations || subject.allocations.length === 0) && (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No allocations</span>
                    )}
                  </div>
                </td>
                <td>
                  <button className="btn btn-sm" onClick={() => openModal(subject)}>Edit / Allocate</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No subjects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>{editingSubject ? "Edit Subject" : "Add Subject"}</h3>
              <button className="btn-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
              {apiError && <div className="alert alert-error" style={{ marginBottom: "1rem", color: "red" }}>{apiError}</div>}
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label>Subject Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Mathematics" 
                    {...register("name", { required: "Name is required" })} 
                  />
                  {errors.name && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.name.message as string}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label>Subject Code *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. MATH101"
                    {...register("code", { required: "Code is required" })} 
                    disabled={!!editingSubject}
                  />
                  {errors.code && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.code.message as string}</span>}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Credit Hours</label>
                <input 
                  type="number" 
                  className="form-control" 
                  {...register("creditHours", { valueAsNumber: true })} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  rows={2}
                  {...register("description")} 
                ></textarea>
              </div>

              <hr style={{ margin: "1rem 0", borderColor: "#eaeaea" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Class Allocations</h4>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => append({ sectionId: "", staffId: "" })}>+ Add Allocation</button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center", background: "#f9f9f9", padding: "0.5rem", borderRadius: "4px" }}>
                  <select className="form-control" {...register(`allocations.${index}.sectionId` as const, { required: true })}>
                    <option value="">Select Section...</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.grade.name} - {sec.name}</option>
                    ))}
                  </select>

                  <select className="form-control" {...register(`allocations.${index}.staffId` as const, { required: true })}>
                    <option value="">Select Teacher...</option>
                    {staff.map(st => (
                      <option key={st.id} value={st.id}>{st.user.name}</option>
                    ))}
                  </select>

                  <button type="button" className="btn btn-sm" style={{ color: "hsl(var(--danger))", padding: "0.25rem 0.5rem" }} onClick={() => remove(index)}>&times;</button>
                </div>
              ))}
              {fields.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No classes allocated. Add an allocation to assign a teacher to a section.</p>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSubject ? "Save Changes" : "Create Subject"}</button>
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
