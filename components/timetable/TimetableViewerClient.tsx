"use client";

import { useState, useEffect } from "react";
import TimetableGrid from "./TimetableGrid";

export default function TimetableViewerClient() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch("/api/timetable");
        const data = await res.json();
        if (res.ok) {
          setSlots(data.slots || []);
        } else {
          setError(data.error || "Failed to load timetable");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, []);

  return (
    <div className="card">
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.5rem" }}>My Timetable</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Here is your schedule for the week.</p>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading timetable...</div>
      ) : error ? (
        <div style={{ padding: "1rem", color: "red", background: "#fee", borderRadius: "8px" }}>{error}</div>
      ) : slots.length === 0 ? (
        <div style={{ padding: "4rem 2rem", textAlign: "center", background: "hsl(var(--bg))", borderRadius: "12px", border: "1px dashed #ccc" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗓️</div>
          <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>No Classes Scheduled</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>You do not have any timetable slots assigned currently.</p>
        </div>
      ) : (
        <TimetableGrid slots={slots} isAdmin={false} />
      )}
    </div>
  );
}
