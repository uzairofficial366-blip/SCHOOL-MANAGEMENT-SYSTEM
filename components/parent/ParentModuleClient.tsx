"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDate, formatDateTime } from "@/lib/format";

type ModuleType = "attendance" | "grades" | "transport" | "announcements" | "messages";

type Child = {
  id: string;
  name: string;
  admissionNo?: string;
};

export default function ParentModuleClient({
  endpoint,
  type,
}: {
  endpoint: string;
  type: ModuleType;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedChildId, setSelectedChildId] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Unable to load data");
        if (!cancelled) setData(json);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Unable to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const children: Child[] = data?.children ?? [];
  const records = useMemo(() => {
    const rows = data?.records ?? data?.children ?? data?.announcements ?? data?.messages ?? [];
    if (selectedChildId === "all") return rows;
    return rows.filter((row: any) => row.studentId === selectedChildId || row.id === selectedChildId);
  }, [data, selectedChildId]);

  if (loading) return <StateBox text="Loading..." />;
  if (error) return <StateBox text={error} tone="danger" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {children.length > 1 && ["attendance", "grades", "transport"].includes(type) && (
        <div className="card" style={{ padding: "1rem" }}>
          <label className="form-label">Student</label>
          <select className="form-input" value={selectedChildId} onChange={(event) => setSelectedChildId(event.target.value)}>
            <option value="all">All children</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name} {child.admissionNo ? `(${child.admissionNo})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === "attendance" && <Attendance rows={records} />}
      {type === "grades" && <Grades rows={records} />}
      {type === "transport" && <Transport rows={records} />}
      {type === "announcements" && <Announcements rows={records} />}
      {type === "messages" && <Messages rows={records} />}
    </div>
  );
}

function StateBox({ text, tone }: { text: string; tone?: "danger" }) {
  return (
    <div className="card" style={{ padding: "2rem", color: tone === "danger" ? "hsl(var(--danger))" : "var(--text-muted)", textAlign: "center" }}>
      {text}
    </div>
  );
}

function Table({ columns, rows, empty }: { columns: string[]; rows: any[]; empty: string }) {
  if (!rows.length) return <StateBox text={empty} />;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  );
}

function Attendance({ rows }: { rows: any[] }) {
  return (
    <Table
      columns={["Student", "Class / Section", "Date", "Status", "Remarks"]}
      empty="No attendance records found."
      rows={rows.map((row) => (
        <tr key={row.id}>
          <td>{row.studentName}</td>
          <td>{row.className}</td>
          <td>{formatDate(row.date)}</td>
          <td><span className="badge">{String(row.status).replace("EXCUSED", "LEAVE")}</span></td>
          <td>{row.remarks || "-"}</td>
        </tr>
      ))}
    />
  );
}

function Grades({ rows }: { rows: any[] }) {
  return (
    <Table
      columns={["Student", "Exam", "Subject", "Marks", "Grade", "Remarks"]}
      empty="No grade records found."
      rows={rows.map((row) => (
        <tr key={row.id}>
          <td>{row.studentName}</td>
          <td>{row.examName}</td>
          <td>{row.subject}</td>
          <td>{row.marksObtained} / {row.totalMarks}</td>
          <td><span className="badge">{row.grade || "-"}</span></td>
          <td>{row.remarks || "-"}</td>
        </tr>
      ))}
    />
  );
}

function Transport({ rows }: { rows: any[] }) {
  const assigned = rows.filter((row) => row.vehicleNumber || row.routeName || row.pickupPoint || row.dropPoint);
  return (
    <Table
      columns={["Student", "Route", "Vehicle", "Driver", "Pickup", "Drop", "Monthly Fee"]}
      empty="Transport details are not assigned yet."
      rows={assigned.map((row) => (
        <tr key={row.id}>
          <td>{row.name}</td>
          <td>{row.routeName || "-"}</td>
          <td>{row.vehicleNumber || "-"}</td>
          <td>{row.driverName || "-"}{row.driverContact ? ` (${row.driverContact})` : ""}</td>
          <td>{row.pickupPoint || "-"}</td>
          <td>{row.dropPoint || "-"}</td>
          <td>{row.monthlyTransportFee ?? "-"}</td>
        </tr>
      ))}
    />
  );
}

function Announcements({ rows }: { rows: any[] }) {
  if (!rows.length) return <StateBox text="No announcements found." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {rows.map((row) => (
        <div className="card" key={row.id} style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.35rem" }}>
            <strong>{row.title}</strong>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{formatDate(row.date)}</span>
          </div>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>{row.message}</p>
          <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {row.createdBy} - {row.target}
          </div>
        </div>
      ))}
    </div>
  );
}

function Messages({ rows }: { rows: any[] }) {
  if (!rows.length) return <StateBox text="Messages module is not configured yet." />;
  return (
    <Table
      columns={["Sender", "Subject", "Message", "Date", "Related Student"]}
      empty="Messages module is not configured yet."
      rows={rows.map((row) => (
        <tr key={row.id}>
          <td>{row.sender}</td>
          <td>{row.subject}</td>
          <td>{row.message}</td>
          <td>{formatDateTime(row.date)}</td>
          <td>{row.relatedStudent || "-"}</td>
        </tr>
      ))}
    />
  );
}
