"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

export default function AnnouncementsAdminClient() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiError, setApiError] = useState("");

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      content: "",
      targetStudents: true,
      targetTeachers: true,
      targetStaff: true
    }
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (res.ok) setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const onSubmit = async (data: any) => {
    setApiError("");
    
    const targetRoles = [];
    if (data.targetStudents) targetRoles.push("STUDENT");
    if (data.targetTeachers) targetRoles.push("TEACHER");
    if (data.targetStaff) targetRoles.push("STAFF");

    if (targetRoles.length === 0) {
      setApiError("Please select at least one target audience.");
      return;
    }

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          targetRoles
        })
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create announcement");
      
      setAnnouncements([resData.announcement, ...announcements]);
      setIsModalOpen(false);
      reset();
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnouncements(announcements.filter(a => a.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: "1.25rem" }}>Announcements</h3>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Announcement</button>
      </div>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: "4rem 2rem", textAlign: "center", background: "hsl(var(--bg))", borderRadius: "12px", border: "1px dashed #ccc" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No announcements found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {announcements.map((ann) => {
            let targetLabel = "Global";
            let targetColor = "var(--primary)";
            try {
              const roles = typeof ann.targetRoles === 'string' ? JSON.parse(ann.targetRoles) : ann.targetRoles;
              if (Array.isArray(roles) && roles.length > 0) {
                targetLabel = roles.join(", ");
                if (roles.includes("STUDENT")) targetColor = "hsl(var(--success))";
                else if (roles.includes("TEACHER")) targetColor = "hsl(var(--info))";
                else if (roles.includes("STAFF")) targetColor = "hsl(var(--warning))";
              }
            } catch(e){}

            return (
              <div key={ann.id} style={{ border: "1px solid #eaeaea", borderRadius: "8px", padding: "1.5rem", position: "relative", borderLeft: `4px solid ${targetColor}` }}>
                <button 
                  onClick={() => handleDelete(ann.id)}
                  style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "hsl(var(--danger))", cursor: "pointer", fontSize: "1.2rem" }}
                >
                  &times;
                </button>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{ann.title}</h4>
                  <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", background: `color-mix(in srgb, ${targetColor} 15%, transparent)`, color: targetColor, borderRadius: "4px", fontWeight: 600 }}>
                    {targetLabel}
                  </span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", margin: "0.5rem 0 1rem 0" }}>{ann.content}</p>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Published: {new Date(ann.publishedAt || ann.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "1.5rem", borderRadius: "8px", width: "100%", maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Create Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              {apiError && <div style={{ padding: "0.5rem", background: "#fee", color: "red", borderRadius: "4px", marginBottom: "1rem" }}>{apiError}</div>}
              
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label>Title *</label>
                <input type="text" className="form-control" placeholder="Announcement Title" {...register("title", { required: true })} />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label>Content *</label>
                <textarea className="form-control" rows={5} placeholder="Write the announcement content here..." {...register("content", { required: true })} />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Target Audience *</label>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" {...register("targetStudents")} /> Students
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" {...register("targetTeachers")} /> Teachers
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" {...register("targetStaff")} /> Other Staff
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
