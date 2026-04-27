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
    <div className="timetable-wrapper" style={{ overflowX: "auto", background: "white", borderRadius: "12px", border: "1px solid #eaeaea" }}>
      <table style={{ width: "100%", minWidth: "800px", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ width: "100px", padding: "1rem", borderBottom: "2px solid #eaeaea", borderRight: "1px solid #eaeaea", background: "#f8f9fa" }}>Time</th>
            {DAYS.map((day, i) => (
              <th key={day} style={{ padding: "1rem", borderBottom: "2px solid #eaeaea", borderRight: "1px solid #eaeaea", background: "#f8f9fa", textAlign: "center" }}>
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
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #eaeaea", borderRight: "1px solid #eaeaea", fontWeight: 600, color: "var(--text-muted)", textAlign: "center" }}>
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
                    <td key={dayIndex} style={{ padding: "0.5rem", borderBottom: "1px solid #eaeaea", borderRight: "1px solid #eaeaea", verticalAlign: "top", height: "80px", position: "relative" }}>
                      {slot && (
                        <div style={{
                          background: "hsl(var(--primary) / 0.1)",
                          border: "1px solid hsl(var(--primary) / 0.2)",
                          borderRadius: "6px",
                          padding: "0.5rem",
                          height: "100%",
                          position: "relative"
                        }}>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "hsl(var(--primary))" }}>{slot.subject.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{slot.section.grade.name} - {slot.section.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{slot.staff.user.name}</div>
                          
                          {/* Class Teacher Info */}
                          {slot.section.classTeacher && (
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.1rem", borderTop: "1px solid hsl(var(--primary)/0.1)", paddingTop: "0.1rem" }}>
                              CT: {slot.section.classTeacher.user.name}
                            </div>
                          )}

                          <div style={{ fontSize: "0.7rem", marginTop: "0.2rem", fontWeight: 600 }}>
                            {slot.startTime} - {slot.endTime} {slot.room && `| Rm: ${slot.room}`}
                          </div>
                          
                          {isAdmin && onDeleteSlot && (
                            <button 
                              onClick={() => onDeleteSlot(slot.id)}
                              style={{ position: "absolute", top: "4px", right: "4px", background: "none", border: "none", color: "hsl(var(--danger))", cursor: "pointer", fontSize: "1rem" }}
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
