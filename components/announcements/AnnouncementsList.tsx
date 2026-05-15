"use client";

import { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/format";

export default function AnnouncementsList() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        const data = await res.json();
        if (res.ok) {
          setAnnouncements(data.announcements || []);
        } else {
          setError(data.error || "Failed to load announcements");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading announcements...</div>;
  if (error) return <div style={{ padding: "1rem", color: "red", background: "#fee", borderRadius: "8px" }}>{error}</div>;
  
  if (announcements.length === 0) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", background: "hsl(var(--bg))", borderRadius: "12px", border: "1px dashed #ccc" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📢</div>
        <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>No Announcements</h4>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>There are currently no active announcements for you.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {announcements.map((ann) => {
        // Just for display logic
        let targetLabel = ann.section
          ? `${ann.grade?.name ?? "Class"} - ${ann.section.name}`
          : ann.grade?.name ?? "Global";
        let targetColor = "var(--primary)";
        
        try {
          const roles = typeof ann.targetRoles === 'string' ? JSON.parse(ann.targetRoles) : ann.targetRoles;
          if (Array.isArray(roles) && roles.length > 0) {
            targetLabel = roles.join(", ");
            if (roles.includes("STUDENT")) targetColor = "hsl(var(--success))";
            else if (roles.includes("TEACHER")) targetColor = "hsl(var(--info))";
            else if (roles.includes("STAFF")) targetColor = "hsl(var(--warning))";
          }
        } catch (e) {}

        return (
          <div key={ann.id} className="card" style={{ borderLeft: `4px solid ${targetColor}`, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{ann.title}</h3>
              <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: `color-mix(in srgb, ${targetColor} 15%, transparent)`, color: targetColor, borderRadius: "4px", fontWeight: 600 }}>
                {targetLabel}
              </span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: "0.5rem 0", whiteSpace: "pre-wrap" }}>
              {ann.content}
            </p>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Published: {formatDateTime(ann.publishedAt || ann.createdAt)}
              {ann.createdBy?.name ? ` by ${ann.createdBy.name}` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
