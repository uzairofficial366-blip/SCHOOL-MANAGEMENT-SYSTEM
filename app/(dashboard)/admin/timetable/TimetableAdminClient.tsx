/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import TimetableGrid from "@/components/timetable/TimetableGrid";

export default function TimetableAdminClient({ sections, subjects, staff }: { sections: any[], subjects: any[], staff: any[] }) {
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiError, setApiError] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      subjectId: "",
      staffId: "",
      dayOfWeek: 0,
      startTime: "08:00",
      endTime: "09:00",
      room: ""
    }
  });

  useEffect(() => {
    if (selectedSection) {
      fetchSlots(selectedSection);
    } else {
      setSlots([]);
    }
  }, [selectedSection]);

  const fetchSlots = async (sectionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timetable?sectionId=${sectionId}`);
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setApiError("");
    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sectionId: selectedSection })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create slot");
      
      setSlots([...slots, resData.slot]);
      setIsModalOpen(false);
      reset();
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Delete this timetable slot?")) return;
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSlots(slots.filter(s => s.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.5rem" }}>Class Timetable</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Select a class section to view and manage its timetable.</p>
        </div>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <select 
            className="form-control" 
            value={selectedSection} 
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{ minWidth: "200px" }}
          >
            <option value="">-- Select Class Section --</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>{s.grade.name} - {s.name}</option>
            ))}
          </select>

          {selectedSection && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Slot</button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading timetable...</div>
      ) : selectedSection ? (
        <TimetableGrid slots={slots} onDeleteSlot={handleDeleteSlot} isAdmin={true} />
      ) : (
        <div style={{ padding: "4rem 2rem", textAlign: "center", background: "hsl(var(--bg))", borderRadius: "12px", border: "1px dashed #ccc" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗓️</div>
          <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>No Section Selected</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Please select a class section from the dropdown above to view its timetable.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "1.5rem", borderRadius: "8px", width: "100%", maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Add Timetable Slot</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              {apiError && <div style={{ padding: "0.5rem", background: "#fee", color: "red", borderRadius: "4px", marginBottom: "1rem" }}>{apiError}</div>}
              
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Day of Week *</label>
                <select className="form-control" {...register("dayOfWeek", { valueAsNumber: true })}>
                  <option value={0}>Monday</option>
                  <option value={1}>Tuesday</option>
                  <option value={2}>Wednesday</option>
                  <option value={3}>Thursday</option>
                  <option value={4}>Friday</option>
                  <option value={5}>Saturday</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input type="time" className="form-control" {...register("startTime", { required: true })} />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input type="time" className="form-control" {...register("endTime", { required: true })} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Subject *</label>
                <select className="form-control" {...register("subjectId", { required: true })}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Teacher *</label>
                <select className="form-control" {...register("staffId", { required: true })}>
                  <option value="">Select Teacher</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Room Number (Optional)</label>
                <input type="text" className="form-control" placeholder="e.g. Room 101" {...register("room")} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

