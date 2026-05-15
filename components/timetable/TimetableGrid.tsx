"use client";

import { useMemo } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 AM to 5:00 PM

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  section: { 
    name: string; 
    grade: { name: string };
    classTeacher?: { user: { name: string } } | null;
  };
  subject: { name: string; code: string };
  staff: { user: { name: string } };
}

interface Props {
  slots: TimetableSlot[];
  onDeleteSlot?: (id: string) => void;
  isAdmin?: boolean;
}

export default function TimetableGrid({ slots, onDeleteSlot, isAdmin }: Props) {
  // Group slots by day
  const slotsByDay = useMemo(() => {
    const grouped: Record<number, TimetableSlot[]> = {};
    slots.forEach(slot => {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = [];
      grouped[slot.dayOfWeek].push(slot);
    });
    return grouped;
  }, [slots]);

  return (
    <div className="timetable-wrapper" style={{ overflowX: "auto", background: "white", borderRadius: "12px", border: "1px solid #eaeaea", fontSize: "0.78rem" }}>
      <table style={{ width: "100%", minWidth: "640px", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ width: "72px", borderBottom: "2px solid #eaeaea", borderRight: "1px solid #eaeaea", background: "#f8f9fa", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.7rem" }}>Time</th>
            {DAYS.map((day, i) => (
              <th key={day} style={{ padding: "0.4rem 0.25rem", borderBottom: "2px solid #eaeaea", borderRight: "1px solid #eaeaea", background: "#f8f9fa", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.7rem" }}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(hour => {
            const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
            return (
              <tr key={hour}>
                <td style={{ padding: "0.25rem 0.3rem", borderBottom: "1px solid #eaeaea", borderRight: "1px solid #eaeaea", fontWeight: 600, color: "var(--text-muted)", textAlign: "center", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                  {timeLabel}
                </td>
                {DAYS.map((_, dayIndex) => {
                  const daySlots = slotsByDay[dayIndex] || [];
                  // Find slot that overlaps with this hour
                  const slot = daySlots.find(s => {
                    const startH = parseInt(s.startTime.split(':')[0]);
                    return startH === hour;
                  });

                  return (
                    <td key={dayIndex} style={{ padding: "0.25rem", borderBottom: "1px solid #eaeaea", borderRight: "1px solid #eaeaea", verticalAlign: "top", height: "60px", position: "relative" }}>
                      {slot && (
                        <div style={{
                          background: isAdmin ? "#f8fafc" : "hsl(var(--primary) / 0.1)",
                          border: isAdmin ? "1px solid #cbd5e1" : "1px solid hsl(var(--primary) / 0.2)",
                          borderRadius: "5px",
                          padding: "0.2rem 0.3rem",
                          height: "100%",
                          position: "relative",
                          overflow: "hidden"
                        }}>
                          {isAdmin && (
                            <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.2 }}>
                              Occupied / Closed
                            </div>
                          )}
                          <div style={{ fontWeight: 700, fontSize: "0.75rem", color: isAdmin ? "#334155" : "hsl(var(--primary))", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{slot.subject.name}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.2 }}>{slot.section.grade.name} · {slot.section.name}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{slot.staff.user.name}</div>

                          {/* Class Teacher Info — only show if different from staff */}
                          {slot.section.classTeacher && slot.section.classTeacher.user.name !== slot.staff.user.name && (
                            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineHeight: 1.2, borderTop: "1px solid hsl(var(--primary)/0.15)", paddingTop: "0.1rem", marginTop: "0.1rem" }}>
                              CT: {slot.section.classTeacher.user.name}
                            </div>
                          )}

                          {/* Room only — time is already in the left column */}
                          {slot.room && (
                            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineHeight: 1.2 }}>
                              Rm: {slot.room}
                            </div>
                          )}

                          {isAdmin && onDeleteSlot && (
                            <button
                              onClick={() => onDeleteSlot(slot.id)}
                              style={{ position: "absolute", top: "2px", right: "3px", background: "none", border: "none", color: "hsl(var(--danger))", cursor: "pointer", fontSize: "0.8rem", lineHeight: 1, padding: 0 }}
                              title="Delete Slot"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
