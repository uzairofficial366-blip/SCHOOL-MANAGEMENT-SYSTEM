"use client";

const CYCLE_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "hsl(220 14% 46% / 0.12)", text: "hsl(220 14% 46%)", label: "Draft" },
  OPEN: { bg: "hsl(142 71% 45% / 0.12)", text: "hsl(142 71% 45%)", label: "Open" },
  CLOSED: { bg: "hsl(0 84% 60% / 0.12)", text: "hsl(0 84% 60%)", label: "Closed" },
  ARCHIVED: { bg: "hsl(220 9% 46% / 0.12)", text: "hsl(220 9% 46%)", label: "Archived" },
};

interface Props {
  cycles: any[];
  onNewCycle: () => void;
}

export default function CyclesTab({ cycles, onNewCycle }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontWeight: 700, fontSize: "1.15rem" }}>Admission Cycles</h3>
        <button className="btn btn-primary btn-sm" onClick={onNewCycle}>+ New Cycle</button>
      </div>

      {cycles.length > 0 ? (
        <div className="grid-3">
          {cycles.map((cycle: any) => {
            const ss = CYCLE_STATUS_STYLES[cycle.status] || CYCLE_STATUS_STYLES.DRAFT;
            const utilization = cycle.totalSeats > 0
              ? Math.round((cycle.filledSeats / cycle.totalSeats) * 100)
              : 0;
            const isFull = utilization >= 100;
            const startDate = new Date(cycle.startDate);
            const endDate = new Date(cycle.endDate);
            const now = new Date();
            const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / 86400000);
            const elapsed = Math.max(0, (now.getTime() - startDate.getTime()) / 86400000);
            const progress = Math.min(100, Math.round((elapsed / totalDays) * 100));

            return (
              <div key={cycle.id} className="card" style={{ padding: "1.25rem", position: "relative", overflow: "hidden" }}>
                {/* Decorative gradient line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: cycle.status === "OPEN"
                    ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                    : "hsl(var(--border))",
                }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>{cycle.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "hsl(var(--text-muted))", marginTop: "0.15rem" }}>
                      {cycle.academicYear.name}
                    </div>
                  </div>
                  <span style={{
                    display: "inline-flex", padding: "0.2rem 0.65rem", borderRadius: "999px",
                    fontSize: "0.72rem", fontWeight: 600, background: ss.bg, color: ss.text,
                  }}>
                    {ss.label}
                  </span>
                </div>

                {/* Date range */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", fontSize: "0.8rem" }}>
                  <div>
                    <div style={{ color: "hsl(var(--text-muted))", fontSize: "0.72rem", fontWeight: 600 }}>START</div>
                    <div style={{ fontWeight: 600 }}>{startDate.toLocaleDateString()}</div>
                  </div>
                  <div style={{ color: "hsl(var(--text-muted))" }}>→</div>
                  <div>
                    <div style={{ color: "hsl(var(--text-muted))", fontSize: "0.72rem", fontWeight: 600 }}>END</div>
                    <div style={{ fontWeight: 600 }}>{endDate.toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Timeline progress */}
                {cycle.status === "OPEN" && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "hsl(var(--text-muted))", marginBottom: "0.25rem" }}>
                      <span>Timeline</span>
                      <span>{progress}% elapsed</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%`, background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }} />
                    </div>
                  </div>
                )}

                {/* Seat utilization */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "hsl(var(--text-muted))" }}>Seats ({cycle.filledSeats}/{cycle.totalSeats})</span>
                    <span style={{ fontWeight: 600, color: isFull ? "hsl(var(--danger))" : "inherit" }}>{utilization}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${Math.min(utilization, 100)}%`,
                      background: isFull ? "hsl(var(--danger))" : "hsl(var(--primary))",
                    }} />
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", paddingTop: "0.75rem", borderTop: "1px solid hsl(var(--border))" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "var(--font-display)" }}>{cycle._count.applications}</div>
                    <div style={{ fontSize: "0.7rem", color: "hsl(var(--text-muted))" }}>Applications</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "var(--font-display)" }}>{cycle.totalSeats}</div>
                    <div style={{ fontSize: "0.7rem", color: "hsl(var(--text-muted))" }}>Total Seats</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "var(--font-display)" }}>{cycle.totalSeats - cycle.filledSeats}</div>
                    <div style={{ fontSize: "0.7rem", color: "hsl(var(--text-muted))" }}>Available</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--text-muted))" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>No admission cycles yet</div>
          <div style={{ fontSize: "0.85rem" }}>Create your first admission cycle to start accepting applications.</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }} onClick={onNewCycle}>+ Create Cycle</button>
        </div>
      )}
    </div>
  );
}
