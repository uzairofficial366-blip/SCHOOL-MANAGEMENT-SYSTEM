"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { formatDate } from "@/lib/format";

const EVENT_TYPES = [
  { value: "PARENT_TEACHER_MEETING", label: "Parents Teacher Meeting" },
  { value: "RESULT_DECLARATION", label: "Result Declaration Day" },
  { value: "ANNUAL_DAY", label: "Annual Day / School Event" },
  { value: "SESSIONAL_EXAM", label: "Sessional Examinations" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "SPORTS_DAY", label: "Sports Day" },
  { value: "OTHER", label: "Other Special Event" },
];

export default function CalendarAdminClient() {
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiError, setApiError] = useState("");

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      description: "",
      eventType: "OTHER",
      startDate: "",
      endDate: "",
      allDay: true,
      targetAll: true,
      targetStudents: false,
      targetTeachers: false,
      targetStaff: false,
    },
  });

  const fetchEvents = async () => {
    if (year === null || month === null) return;
    setLoading(true);
    try {
      const m = `${year}-${String(month + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/events?month=${m}`);
      const data = await res.json();
      if (res.ok) setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }, []);

  useEffect(() => {
    fetchEvents(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [year, month]);

  const onPrevMonth = () => {
    if (year === null || month === null) return;
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const onNextMonth = () => {
    if (year === null || month === null) return;
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const onSubmit = async (data: any) => {
    setApiError("");

    const targetRoles: string[] = [];
    if (data.targetAll) {
      targetRoles.push("ALL");
    } else {
      if (data.targetStudents) targetRoles.push("STUDENT");
      if (data.targetTeachers) targetRoles.push("TEACHER");
      if (data.targetStaff) targetRoles.push("STAFF");
    }

    if (targetRoles.length === 0) {
      setApiError("Please select at least one target audience.");
      return;
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          eventType: data.eventType,
          startDate: data.startDate,
          endDate: data.endDate || data.startDate,
          allDay: data.allDay,
          targetRoles,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create event");

      fetchEvents();
      setIsModalOpen(false);
      reset();
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents(events.filter((e) => e.id !== id));
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
          <h3 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>School Calendar</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Manage events, holidays, and important dates.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Event</button>
      </div>

      {loading || year === null || month === null ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading calendar...</div>
      ) : (
        <CalendarGrid
          events={events}
          year={year}
          month={month}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onDeleteEvent={handleDeleteEvent}
          isAdmin={true}
        />
      )}

      {/* Upcoming Events Sidebar */}
      {!loading && events.length > 0 && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
          <h4 style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "1rem" }}>Events This Month</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {events.map((ev) => (
              <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "white", borderRadius: "6px", border: "1px solid #eaeaea" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{ev.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {formatDate(ev.startDate)} - {formatDate(ev.endDate)}
                  </div>
                </div>
                <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", background: "#eaeaea", borderRadius: "4px" }}>
                  {EVENT_TYPES.find((t) => t.value === ev.eventType)?.label || ev.eventType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "1.5rem", borderRadius: "8px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: 700 }}>Add New Event</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {apiError && <div style={{ padding: "0.5rem", background: "#fee", color: "red", borderRadius: "4px", marginBottom: "1rem" }}>{apiError}</div>}

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Event Title *</label>
                <input type="text" className="form-control" placeholder="e.g. Annual Sports Day" {...register("title", { required: true })} />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Description</label>
                <textarea className="form-control" rows={3} placeholder="Optional details..." {...register("description")} />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Event Type *</label>
                <select className="form-control" {...register("eventType", { required: true })}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" className="form-control" {...register("startDate", { required: true })} />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input type="date" className="form-control" {...register("endDate", { required: true })} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input type="checkbox" {...register("allDay")} /> All Day Event
                </label>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Visible To *</label>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" {...register("targetAll")} /> Everyone
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" {...register("targetStudents")} /> Students
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" {...register("targetTeachers")} /> Teachers
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" {...register("targetStaff")} /> Other Staff
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

