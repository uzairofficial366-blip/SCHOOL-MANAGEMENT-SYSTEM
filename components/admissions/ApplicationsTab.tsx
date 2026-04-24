"use client";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "hsl(220 14% 46% / 0.12)", text: "hsl(220 14% 46%)" },
  SUBMITTED: { bg: "hsl(224 71% 55% / 0.12)", text: "hsl(224 71% 55%)" },
  UNDER_REVIEW: { bg: "hsl(38 92% 50% / 0.12)", text: "hsl(38 92% 50%)" },
  APPROVED: { bg: "hsl(142 71% 45% / 0.12)", text: "hsl(142 71% 45%)" },
  REJECTED: { bg: "hsl(0 84% 60% / 0.12)", text: "hsl(0 84% 60%)" },
  WAITLISTED: { bg: "hsl(262 83% 62% / 0.12)", text: "hsl(262 83% 62%)" },
  ENROLLED: { bg: "hsl(199 89% 48% / 0.12)", text: "hsl(199 89% 48%)" },
  WITHDRAWN: { bg: "hsl(220 9% 46% / 0.12)", text: "hsl(220 9% 46%)" },
};

interface Props {
  applications: any[];
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  onSelect: (app: any) => void;
  statusCounts: Record<string, number>;
}

export default function ApplicationsTab({
  applications, filterStatus, setFilterStatus,
  searchQuery, setSearchQuery, onSelect, statusCounts,
}: Props) {
  const allStatuses = ["ALL", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "WAITLISTED", "ENROLLED", "WITHDRAWN"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Filters */}
      <div className="card" style={{ padding: "1rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: "1 1 260px", minWidth: 200 }}>
            <input
              className="form-input"
              placeholder="🔍 Search by name, application no, or parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: "0.82rem" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {allStatuses.map((s) => {
              const count = s === "ALL" ? applications.length : (statusCounts[s] || 0);
              const isActive = filterStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="btn btn-sm"
                  style={{
                    background: isActive ? "hsl(var(--primary))" : "hsl(var(--bg))",
                    color: isActive ? "white" : "hsl(var(--text-muted))",
                    border: `1px solid ${isActive ? "transparent" : "hsl(var(--border))"}`,
                    fontSize: "0.72rem",
                    padding: "0.25rem 0.6rem",
                  }}
                >
                  {s.replace("_", " ")} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Application</th>
                <th>Student</th>
                <th>Grade</th>
                <th>Parent</th>
                <th>Status</th>
                <th>Docs</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length > 0 ? applications.map((app: any) => {
                const sc = STATUS_COLORS[app.status] || STATUS_COLORS.DRAFT;
                const docTotal = app.documents?.length || 0;
                const docVerified = app.documents?.filter((d: any) => d.status === "VERIFIED").length || 0;
                return (
                  <tr key={app.id} style={{ cursor: "pointer" }} onClick={() => onSelect(app)}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600, color: "hsl(var(--primary))" }}>
                        {app.applicationNo}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: "0.7rem" }}>
                          {app.studentName.split(" ").map((n: string) => n[0]).join("").substring(0, 2)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{app.studentName}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{app.gradeAppliedFor}</td>
                    <td>
                      <div style={{ fontSize: "0.82rem" }}>{app.parentName}</div>
                      <div style={{ fontSize: "0.72rem", color: "hsl(var(--text-muted))" }}>{app.parentEmail}</div>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", padding: "0.2rem 0.65rem",
                        borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600,
                        background: sc.bg, color: sc.text,
                      }}>
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.82rem", color: docTotal > 0 && docVerified === docTotal ? "hsl(var(--success))" : "hsl(var(--text-muted))" }}>
                        {docVerified}/{docTotal}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onSelect(app); }}>
                        View →
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--text-muted))" }}>
                    {searchQuery || filterStatus !== "ALL"
                      ? "No applications match your filters."
                      : "No applications yet. Click '+ New Application' to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
