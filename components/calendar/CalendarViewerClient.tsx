"use client";

import { useState, useEffect } from "react";
import CalendarGrid from "./CalendarGrid";

export default function CalendarViewerClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
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
    fetchEvents();
  }, [year, month]);

  const onPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const onNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <div className="card">
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.25rem" }}>School Calendar</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>View upcoming events, holidays, and important dates.</p>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading calendar...</div>
      ) : (
        <CalendarGrid
          events={events}
          year={year}
          month={month}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          isAdmin={false}
        />
      )}

      {/* Upcoming events list */}
      {!loading && events.length > 0 && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
          <h4 style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "1rem" }}>Events This Month</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {events.map((ev) => (
              <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "white", borderRadius: "6px", border: "1px solid #eaeaea" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{ev.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {new Date(ev.startDate).toLocaleDateString()} — {new Date(ev.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
