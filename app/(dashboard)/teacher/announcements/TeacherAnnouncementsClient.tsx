"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/format";

type AssignedSection = {
  id: string;
  name: string;
  gradeId: string;
  gradeName: string;
  label: string;
};

type TeacherAnnouncement = {
  id: string;
  title: string;
  content: string;
  publishedAt: string | null;
  createdAt: string;
  grade?: { name: string } | null;
  section?: { name: string } | null;
};

export default function TeacherAnnouncementsClient() {
  const [assignedSections, setAssignedSections] = useState<AssignedSection[]>([]);
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    gradeId: "",
    sectionId: "",
    title: "",
    content: "",
  });

  const grades = useMemo(() => {
    const map = new Map<string, string>();
    assignedSections.forEach((section) => map.set(section.gradeId, section.gradeName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [assignedSections]);

  const visibleSections = assignedSections.filter((section) => section.gradeId === form.gradeId);

  async function loadAnnouncements() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/announcements", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load announcements");
      setAssignedSections(data.assignedSections || []);
      setAnnouncements(data.announcements || []);
    } catch (loadError: any) {
      setError(loadError.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  function updateForm(field: keyof typeof form, value: string) {
    setSuccess("");
    setError("");
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "gradeId" ? { sectionId: "" } : {}),
    }));
  }

  async function submitAnnouncement(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/teacher/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish announcement");

      setAnnouncements((current) => [data.announcement, ...current]);
      setForm({ gradeId: "", sectionId: "", title: "", content: "" });
      setSuccess("Announcement published.");
    } catch (saveError: any) {
      setError(saveError.message || "Failed to publish announcement");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading announcements...</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 420px) 1fr", gap: "1.25rem", alignItems: "start" }}>
      <form className="card" onSubmit={submitAnnouncement} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Create Announcement</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Send an announcement to students and parents in one of your assigned sections.
          </p>
        </div>

        {error && <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "#fee2e2", color: "#b91c1c", fontWeight: 600 }}>{error}</div>}
        {success && <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "#dcfce7", color: "#15803d", fontWeight: 600 }}>{success}</div>}

        {assignedSections.length === 0 ? (
          <div style={{ padding: "1rem", borderRadius: 8, border: "1px dashed var(--border)", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No assigned classes or sections found.
          </div>
        ) : (
          <>
            <div>
              <label className="form-label">Class</label>
              <select className="form-input" value={form.gradeId} onChange={(event) => updateForm("gradeId", event.target.value)} required>
                <option value="">Select class</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Section</label>
              <select className="form-input" value={form.sectionId} onChange={(event) => updateForm("sectionId", event.target.value)} required disabled={!form.gradeId}>
                <option value="">Select section</option>
                {visibleSections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="form-label">Title</label>
          <input className="form-input" value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Announcement title" required />
        </div>

        <div>
          <label className="form-label">Message</label>
          <textarea className="form-input" value={form.content} onChange={(event) => updateForm("content", event.target.value)} placeholder="Write the message for this class..." rows={6} required />
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving || assignedSections.length === 0}>
          {saving ? "Publishing..." : "Publish Announcement"}
        </button>
      </form>

      <div className="card">
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>My Announcements</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Announcements you have published for your assigned sections.
          </p>
        </div>

        {announcements.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 8 }}>
            No announcements created yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid var(--border)" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid var(--border)" }}>Class / Section</th>
                  <th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid var(--border)" }}>Published</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 700 }}>{announcement.title}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>{announcement.content}</div>
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>
                      {announcement.grade?.name ?? "Class"} - {announcement.section?.name ?? "Section"}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.82rem", verticalAlign: "top" }}>
                      {formatDateTime(announcement.publishedAt || announcement.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
