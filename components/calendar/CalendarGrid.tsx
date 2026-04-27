"use client";

import { useMemo } from "react";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PARENT_TEACHER_MEETING: { bg: "#ede9fe", border: "#8b5cf6", text: "#6d28d9" },
  RESULT_DECLARATION:     { bg: "#dbeafe", border: "#3b82f6", text: "#1d4ed8" },
  ANNUAL_DAY:             { bg: "#fef3c7", border: "#f59e0b", text: "#b45309" },
  SESSIONAL_EXAM:         { bg: "#fee2e2", border: "#ef4444", text: "#b91c1c" },
  HOLIDAY:                { bg: "#dcfce7", border: "#22c55e", text: "#15803d" },
  SPORTS_DAY:             { bg: "#ffedd5", border: "#f97316", text: "#c2410c" },
  OTHER:                  { bg: "#f1f5f9", border: "#64748b", text: "#334155" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  PARENT_TEACHER_MEETING: "PTM",
  RESULT_DECLARATION: "Result Day",
  ANNUAL_DAY: "Annual Day",
  SESSIONAL_EXAM: "Exam",
  HOLIDAY: "Holiday",
  SPORTS_DAY: "Sports Day",
  OTHER: "Event",
};

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  eventType: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  targetRoles: any;
}

interface Props {
  events: CalendarEvent[];
  year: number;
  month: number; // 0-indexed
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDeleteEvent?: (id: string) => void;
  isAdmin?: boolean;
}

export default function CalendarGrid({ events, year, month, onPrevMonth, onNextMonth, onDeleteEvent, isAdmin }: Props) {
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days: { date: number | null; events: CalendarEvent[] }[] = [];

    // Leading blanks
    for (let i = 0; i < startDow; i++) {
      days.push({ date: null, events: [] });
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      const dayEvents = events.filter((ev) => {
        const start = new Date(ev.startDate);
        const end = new Date(ev.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return dayDate >= start && dayDate <= end;
      });
      days.push({ date: d, events: dayEvents });
    }

    return days;
  }, [events, year, month]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <button onClick={onPrevMonth} className="btn btn-secondary" style={{ padding: "0.4rem 1rem" }}>← Prev</button>
        <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>{MONTH_NAMES[month]} {year}</h3>
        <button onClick={onNextMonth} className="btn btn-secondary" style={{ padding: "0.4rem 1rem" }}>Next →</button>
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", marginBottom: "1px" }}>
        {DAY_LABELS.map((label) => (
          <div key={label} style={{ textAlign: "center", fontWeight: 700, fontSize: "0.8rem", padding: "0.5rem", color: "var(--text-muted)", background: "#f8f9fa", borderRadius: "4px" }}>
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#eaeaea", border: "1px solid #eaeaea", borderRadius: "8px", overflow: "hidden" }}>
        {calendarDays.map((day, i) => {
          const isToday = isCurrentMonth && day.date === today.getDate();
          return (
            <div
              key={i}
              style={{
                minHeight: "100px",
                background: day.date ? "white" : "#fafafa",
                padding: "0.4rem",
                position: "relative",
              }}
            >
              {day.date && (
                <>
                  <div style={{
                    fontSize: "0.8rem",
                    fontWeight: isToday ? 800 : 500,
                    color: isToday ? "white" : "var(--text-muted)",
                    width: isToday ? "24px" : "auto",
                    height: isToday ? "24px" : "auto",
                    borderRadius: "50%",
                    background: isToday ? "hsl(var(--primary))" : "transparent",
                    display: isToday ? "flex" : "block",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.25rem",
                  }}>
                    {day.date}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {day.events.slice(0, 3).map((ev) => {
                      const colors = EVENT_COLORS[ev.eventType] || EVENT_COLORS.OTHER;
                      return (
                        <div
                          key={ev.id}
                          title={`${ev.title} (${EVENT_TYPE_LABELS[ev.eventType] || ev.eventType})`}
                          style={{
                            fontSize: "0.65rem",
                            padding: "2px 4px",
                            borderRadius: "3px",
                            background: colors.bg,
                            color: colors.text,
                            borderLeft: `3px solid ${colors.border}`,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "default",
                            position: "relative",
                          }}
                        >
                          {ev.title}
                          {isAdmin && onDeleteEvent && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev.id); }}
                              style={{ position: "absolute", right: "2px", top: "0", background: "none", border: "none", color: colors.text, cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, lineHeight: 1 }}
                              title="Delete"
                            >×</button>
                          )}
                        </div>
                      );
                    })}
                    {day.events.length > 3 && (
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", paddingLeft: "4px" }}>
                        +{day.events.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem", padding: "0.75rem", background: "#f8f9fa", borderRadius: "8px" }}>
        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => {
          const colors = EVENT_COLORS[key] || EVENT_COLORS.OTHER;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
              <div style={{ width: 12, height: 12, borderRadius: "3px", background: colors.bg, border: `2px solid ${colors.border}` }} />
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
